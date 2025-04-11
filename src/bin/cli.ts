/**
 * Command-line interface for analyzing single images with Throughmark.
 *
 * Usage:
 *   yarn start [image] [provider] [model] [prompt]
 *
 * Examples:
 *   yarn start                                              # Uses defaults
 *   yarn start samples/automobile/car1.jpg                  # Custom image
 *   yarn start image.jpg openai gpt-4o "Find damage"       # All options
 *
 * The prompt can be specified in multiple ways (in order of precedence):
 * 1. Image-specific file: <image>.prompt.txt
 * 2. Directory-level file: prompt.txt
 * 3. Command-line argument
 * 4. Default: "Find all threats"
 */

import { existsSync } from "fs";
import { writeFile, mkdir } from "fs/promises";
import { join, basename, dirname, parse } from "path";

import chalk from "chalk";
import sharp from "sharp";

import { Throughmark } from "../Throughmark.js";
import { GridGenerator } from "../grid/generator.js";
import type { GridConfig } from "../types.js";
import {
  calculateAccuracy,
  boundingBoxToGridCells,
} from "../utils/gridAccuracy.js";
import { getGroundTruthBoxes, type BoundingBox } from "../utils/groundTruth.js";
import { getPromptForImage } from "../utils/prompt.js";

const OUTPUT_DIR = join(process.cwd(), "output");

/**
 * Prints accuracy metrics
 */
const printAccuracyMetrics = (
  metrics: ReturnType<typeof calculateAccuracy>
) => {
  console.log(chalk.bold.blue("\n📊 Accuracy Metrics:"));
  console.log(
    chalk.blue(`Precision: ${(metrics.precision * 100).toFixed(1)}%`)
  );
  console.log(chalk.blue(`Recall: ${(metrics.recall * 100).toFixed(1)}%`));
  console.log(chalk.blue(`F1 Score: ${(metrics.f1 * 100).toFixed(1)}%`));
  console.log(chalk.blue(`IoU: ${(metrics.iou * 100).toFixed(1)}%`));
  console.log(chalk.blue(`Truth Cells: ${metrics.truthCells}`));
  console.log(chalk.blue(`Predicted Cells: ${metrics.predictedCells}`));
  console.log(chalk.blue(`Matching Cells: ${metrics.matchingCells}`));
};

/**
 * Prints token usage information
 */
const printTokenUsage = (analysis: any) => {
  if (analysis.tokens) {
    console.log(chalk.bold.magenta("\n💰 Token Usage:"));
    console.log(chalk.magenta(`Input tokens: ${analysis.tokens.input}`));
    console.log(chalk.magenta(`Output tokens: ${analysis.tokens.output}`));
    console.log(chalk.magenta(`Total tokens: ${analysis.tokens.total}`));
    console.log(
      chalk.bold.magenta(
        `Total cost: $${analysis.tokens.cost?.toFixed(4)} (${
          analysis.tokens.modelName
        } pricing)`
      )
    );
  }
};

/**
 * Draws bounding boxes on the image for visualization
 */
const drawBoundingBoxes = async (
  imagePath: string,
  boxes: BoundingBox[],
  outputPath: string,
  gridConfig: { rows: number; cols: number }
) => {
  const image = sharp(imagePath);
  const metadata = await image.metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  // Create grid generator with same config used everywhere else
  const gridGenerator = new GridGenerator({
    rows: gridConfig.rows,
    cols: gridConfig.cols,
    visible: true,
    cellLabels: true,
  });

  // Create SVG with bounding boxes and grid
  const svgString = `
    <svg width="${width}" height="${height}">
       ${gridGenerator.generateSVGGrid({ width, height, cellWidth: width / gridConfig.cols, cellHeight: height / gridConfig.rows }, false)}
       ${boxes
         .map(
           box => `
           <rect
             x="${box.xmin * width}"
             y="${box.ymin * height}"
             width="${(box.xmax - box.xmin) * width}"
             height="${(box.ymax - box.ymin) * height}"
             fill="none"
             stroke="red"
             stroke-width="2"
           />
         `
         )
         .join("")}
    </svg>
  `;

  await image
    .composite([
      {
        input: Buffer.from(svgString),
        top: 0,
        left: 0,
      },
    ])
    .toFile(outputPath);
};

const defaultConfig: GridConfig = {
  annotations: [
    {
      type: "highlight",
    },
    { type: "circle" },
    { type: "arrow" },
  ],
};

const run = async () => {
  try {
    // Get command line args
    const imagePath =
      process.argv[2] || "samples/Toothbrush/c8806ee2d08139ce.jpg";
    const provider = process.argv[3] || "openai";
    const model = process.argv[4] || "gpt-4o";
    const defaultPrompt = process.argv[5] || "Highlight toothbrushes";

    if (!existsSync(imagePath)) {
      console.error(`Image not found: ${imagePath}`);
      process.exit(1);
    }

    await mkdir(OUTPUT_DIR, { recursive: true });

    // Get the appropriate prompt based on hierarchy
    const prompt = await getPromptForImage(imagePath, defaultPrompt);

    // Create Throughmark instance
    const gridder = new Throughmark({
      llm: {
        provider: provider as "anthropic" | "openai",
        model: model,
      },
      annotations: defaultConfig.annotations,
    });

    // Get analysis
    console.log(chalk.bold.green("🚀 Analyzing image..."));
    const analysis = await gridder.analyze({
      imagePath,
      prompt,
      contiguousRegions: true,
    });

    // Get base filename without extension
    const parsedPath = parse(imagePath);
    const baseFilename = parsedPath.name;

    // Save verification image with grid
    //  const verificationImage = await analysis.renderVerification();
    //  await writeFile(
    //    join(OUTPUT_DIR, `${baseFilename}.verification.jpg`),
    //     verificationImage
    //  );

    // Save final annotated image
    const annotatedImage = await analysis.render();
    await writeFile(
      join(OUTPUT_DIR, `${parsedPath.name}${parsedPath.ext}`),
      annotatedImage
    );

    // Save analysis JSON
    const jsonOutputPath = join(OUTPUT_DIR, `${baseFilename}.json`);
    await writeFile(
      jsonOutputPath,
      JSON.stringify(
        {
          regions: analysis.regions,
          summary: analysis.summary,
          tokens: analysis.tokens,
        },
        null,
        2
      )
    );
    console.log(
      chalk.bold.cyan("📄 Analysis JSON saved to:"),
      chalk.yellow(jsonOutputPath)
    );

    // Always show token usage
    printTokenUsage(analysis);

    // Get ground truth boxes
    const category = basename(dirname(imagePath));
    const imageId = parsedPath.name;
    let truthBoxes: any[] = [];

    try {
      // Only try to get ground truth if we're in a category subdirectory
      if (dirname(imagePath).includes("samples/") && category !== "samples") {
        truthBoxes = await getGroundTruthBoxes(imageId, category);
      } else {
        console.log(
          chalk.yellow(
            "\nℹ️  No ground truth available - image not in a category subdirectory"
          )
        );
      }
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message.includes("No class code found")
      ) {
        // Silently continue if no ground truth found
        console.log(
          chalk.yellow("\nℹ️  No ground truth available for this image")
        );
      } else {
        // Log other errors but continue
        console.error("Error getting ground truth:", error);
      }
    }

    // Process ground truth if we have it
    if (truthBoxes.length > 0) {
      console.log(chalk.bold.blue("\n📊 Ground Truth Boxes:"));
      console.log(chalk.blue(`Category: "${category}" in image "${imageId}"`));
      truthBoxes.forEach(row => {
        console.log(
          chalk.blue(
            `Box: [xmin=${row[4]}, ymin=${row[5]}, xmax=${row[6]}, ymax=${row[7]}]`
          )
        );
      });

      // Only show ground truth cells and accuracy if we have truth data
      const config = gridder.getGridConfig();
      console.log(chalk.blue(`\nGrid size: ${config.rows}x${config.cols}`));
      console.log(chalk.blue("\nGround truth cells:"));
      truthBoxes.forEach((box: any, i: number) => {
        const { cells, overlaps } = boundingBoxToGridCells(
          {
            xmin: parseFloat(box[4]),
            ymin: parseFloat(box[5]),
            xmax: parseFloat(box[6]),
            ymax: parseFloat(box[7]),
          },
          config
        );
        console.log(
          `Box ${i + 1}: ${[...cells]
            .map(cell => `${cell} (${(overlaps.get(cell)! * 100).toFixed(1)}%)`)
            .join(", ")}`
        );
      });

      // Calculate and print accuracy metrics
      const accuracyMetrics = calculateAccuracy(analysis, truthBoxes, {
        rows: config.rows,
        cols: config.cols,
      });
      printAccuracyMetrics(accuracyMetrics);

      // Draw bounding boxes on a copy of the image
      const boxesOutputPath = join(OUTPUT_DIR, `${baseFilename}.truth.jpg`);
      await drawBoundingBoxes(
        imagePath,
        truthBoxes.map((box: any) => ({
          xmin: parseFloat(box[4]),
          xmax: parseFloat(box[6]),
          ymin: parseFloat(box[5]),
          ymax: parseFloat(box[7]),
        })),
        boxesOutputPath,
        config
      );
    }
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

run();
