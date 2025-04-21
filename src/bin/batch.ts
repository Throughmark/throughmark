/**
 * Batch processor for analyzing multiple images with Throughmark.
 *
 * Usage:
 *   yarn batch [directory] [provider] [model] [prompt]
 *
 * Examples:
 *   yarn batch                                              # Uses samples/Toothbrush
 *   yarn batch samples/automobile                           # Custom directory
 *   yarn batch samples/misc openai gpt-4.1 "Find threats"   # All options
 *
 * Features:
 * - Processes all JPG/PNG files in directory
 * - Runs 5 images concurrently
 * - Saves results to output/
 * - Calculates accuracy metrics if ground truth available
 * - Shows token usage and cost summary
 *
 * The prompt hierarchy is the same as the CLI tool.
 */

import { spawn } from "child_process";
import { existsSync } from "fs";
import { readdir, readFile } from "fs/promises";
import { join, extname, basename, parse } from "path";

import chalk from "chalk";

import { Throughmark } from "../Throughmark.js";
import type { Region } from "../llm/analyzer.js";
import { MODEL_PRICING, OpenAIModel, AnthropicModel } from "../llm/types.js";
import { boundingBoxToGridCells } from "../utils/gridAccuracy.js";
import { getGroundTruthBoxes } from "../utils/groundTruth.js";
import { getPromptForImage } from "../utils/prompt.js";

const DEFAULT_DIR = join(process.cwd(), "samples/automobile");
const OUTPUT_DIR = join(process.cwd(), "output");
const MAX_CONCURRENT = 5;

// Track total tokens and cost
interface TokenUsage {
  input: number;
  output: number;
  total: number;
  cost: number;
  modelName: string;
}

interface AnalysisFile {
  regions: Region[];
  summary: string;
  tokens?: {
    input: number;
    output: number;
    total: number;
    modelName: string;
  };
}

const processImage = (
  imagePath: string,
  provider: string,
  model: string,
  defaultPrompt: string
): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const filename = basename(imagePath);
    process.stdout.write(chalk.green(`${filename} `));

    try {
      // Get the appropriate prompt based on hierarchy
      const prompt = await getPromptForImage(imagePath, defaultPrompt, true); // true for quiet mode

      const child = spawn("node", [
        "dist/bin/cli.js",
        imagePath,
        provider,
        model,
        prompt,
        "--quiet",
      ]);

      // Suppress child process output
      child.stdout.on("data", () => {});
      child.stderr.on("data", () => {});

      child.on("close", code => {
        if (code === 0) {
          process.stdout.write(chalk.bold.green("✓ "));
          resolve();
        } else {
          process.stdout.write("✗ ");
          reject(new Error(`Failed to process ${filename}`));
        }
      });
    } catch (error) {
      process.stdout.write("✗ ");
      reject(new Error(`Failed to get prompt for ${filename}: ${error}`));
    }
  });
};

// Process images in chunks to limit concurrency
async function processInChunks<T>(
  items: T[],
  processor: (item: T) => Promise<void>,
  maxConcurrent: number
): Promise<void> {
  const chunks = [];
  for (let i = 0; i < items.length; i += maxConcurrent) {
    const chunk = items.slice(i, i + maxConcurrent);
    chunks.push(chunk);
  }

  let completed = 0;
  const total = items.length;

  console.log(); // Add initial newline
  for (const chunk of chunks) {
    process.stdout.write("Processing: ");
    await Promise.all(
      chunk.map(async item => {
        await processor(item);
        completed++;
      })
    );
    process.stdout.write(`\nProgress: ${completed}/${total} images\n\n`);
  }
}

async function getTotalUsage(
  outputDir: string,
  files: string[]
): Promise<TokenUsage & { processedCount: number }> {
  const usage = {
    input: 0,
    output: 0,
    total: 0,
    cost: 0,
    processedCount: 0,
    modelName: "",
  };

  for (const file of files) {
    const parsedPath = parse(file);
    const jsonPath = join(outputDir, `${parsedPath.name}.json`);
    try {
      const jsonContent = await readFile(jsonPath, "utf-8");
      const analysis = JSON.parse(jsonContent) as AnalysisFile;
      if (analysis.tokens) {
        const model = analysis.tokens.modelName as OpenAIModel | AnthropicModel;
        usage.modelName = model;
        const pricing = MODEL_PRICING[model];
        if (!pricing) {
          console.warn(`No pricing found for model: ${model}`);
          continue;
        }
        usage.input += analysis.tokens.input;
        usage.output += analysis.tokens.output;
        usage.total += analysis.tokens.total;
        usage.cost +=
          (analysis.tokens.input * pricing.input) / 1_000_000 +
          (analysis.tokens.output * pricing.output) / 1_000_000;
        usage.processedCount++;
      }
    } catch {
      console.error(`Warning: Could not read tokens from ${jsonPath}`);
    }
  }

  return usage;
}

// Update the metrics formatting to match the expected interface
const formatMetricsForDisplay = (metrics: {
  precision: number;
  recall: number;
  f1: number;
  iou: number;
  truthCells: number;
  predictedCells: number;
  matchingCells: number;
}) => {
  const foundCells = metrics.matchingCells;
  const missedCells = metrics.truthCells - metrics.matchingCells;
  const extraCells = metrics.predictedCells - metrics.matchingCells;

  return [
    `Precision: ${(metrics.precision * 100).toFixed(1)}%`,
    `Recall: ${(metrics.recall * 100).toFixed(1)}%`,
    `F1 Score: ${(metrics.f1 * 100).toFixed(1)}%`,
    `IoU: ${(metrics.iou * 100).toFixed(1)}%`,
    `Found Cells: ${foundCells}`,
    `Missed Cells: ${missedCells}`,
    `Extra Cells: ${extraCells}`,
  ];
};

const run = async () => {
  try {
    const targetDir = process.argv[2] || DEFAULT_DIR;
    const provider = process.argv[3] || "anthropic";
    const model = process.argv[4] || "gpt-4.1";
    const defaultPrompt = process.argv[5] || "Highlight toothbrushes";

    const files = await readdir(targetDir);
    const imageFiles = files.filter(file =>
      [".jpg", ".png"].includes(extname(file).toLowerCase())
    );

    console.log(`Found ${imageFiles.length} images in ${targetDir}`);
    console.log(`Processing ${MAX_CONCURRENT} images at a time...\n`);

    const imagePaths = imageFiles.map(file => join(targetDir, file));
    await processInChunks(
      imagePaths,
      path => processImage(path, provider, model, defaultPrompt),
      MAX_CONCURRENT
    );

    // Wait a moment for files to be written
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Calculate total usage after all processing is complete
    const usage = await getTotalUsage(OUTPUT_DIR, imageFiles);

    console.log("\nBatch processing complete!");
    console.log(chalk.bold.magenta("\n💰 Total Token Usage:"));
    console.log(chalk.magenta(`Input tokens: ${usage.input.toLocaleString()}`));
    console.log(
      chalk.magenta(`Output tokens: ${usage.output.toLocaleString()}`)
    );
    console.log(chalk.magenta(`Total tokens: ${usage.total.toLocaleString()}`));
    console.log(
      chalk.bold.magenta(
        `Total cost: $${usage.cost.toFixed(4)} (${usage.modelName} pricing)`
      )
    );

    if (usage.processedCount > 0) {
      console.log(chalk.bold.blue("\n📊 Averages per image:"));
      console.log(
        chalk.blue(
          `Input tokens: ${Math.round(
            usage.input / usage.processedCount
          ).toLocaleString()}`
        )
      );
      console.log(
        chalk.blue(
          `Output tokens: ${Math.round(
            usage.output / usage.processedCount
          ).toLocaleString()}`
        )
      );
      console.log(
        chalk.blue(
          `Total tokens: ${Math.round(
            usage.total / usage.processedCount
          ).toLocaleString()}`
        )
      );
      console.log(
        chalk.bold.blue(
          `Cost: $${(usage.cost / usage.processedCount).toFixed(4)}`
        )
      );
    }

    let overallTruthSet = new Set<string>();
    let overallPredSet = new Set<string>();
    let filesWithAccuracy = 0;

    for (const file of imageFiles) {
      const parsedPath = parse(file);
      const jsonPath = join(OUTPUT_DIR, `${parsedPath.name}.json`);

      // Skip if analysis file doesn't exist (we no longer require a .truth.json file)
      if (!existsSync(jsonPath)) {
        continue;
      }

      try {
        const jsonAnalysis = JSON.parse(
          await readFile(jsonPath, "utf-8")
        ) as AnalysisFile;

        // Derive imageId and category
        const imageId = parsedPath.name;
        const category = basename(targetDir);
        const imagePath = join(targetDir, file);

        // Create new Throughmark instance for this image
        const imageGridder = new Throughmark({
          llm: {
            provider: provider as "anthropic" | "openai",
            model: model,
          },
        });

        // Get grid dimensions without doing full analysis
        await imageGridder.getGridDimensions(imagePath);
        const config = imageGridder.getGridConfig();

        // Add debug logging for ground truth lookup
        console.log(
          chalk.yellow(
            `\nLooking up ground truth for ${imageId} in category ${category}`
          )
        );
        const truthBoxes = await getGroundTruthBoxes(imageId, category);
        console.log(
          chalk.yellow(`Found ${truthBoxes.length} ground truth boxes`)
        );

        if (truthBoxes.length === 0) {
          console.log(
            chalk.yellow(`\nℹ️  No ground truth available for ${file}`)
          );
          continue; // Skip metrics for this file if no ground truth
        }

        const fileTruthSet = new Set<string>();
        truthBoxes.forEach(box => {
          // Add debug logging for bounding box values
          console.log(
            chalk.yellow(
              `Bounding box: xmin=${box[4]}, ymin=${box[5]}, xmax=${box[6]}, ymax=${box[7]}`
            )
          );

          const boxCells = boundingBoxToGridCells(
            {
              xmin: parseFloat(box[4]),
              ymin: parseFloat(box[5]),
              xmax: parseFloat(box[6]),
              ymax: parseFloat(box[7]),
            },
            { rows: config.rows, cols: config.cols }
          );

          // Add debug logging for grid config
          console.log(
            chalk.yellow(
              `Grid config: rows=${config.rows}, cols=${config.cols}`
            )
          );

          boxCells.cells.forEach((cell: string) => fileTruthSet.add(cell));
        });
        console.log(
          chalk.yellow(`Truth cells: ${Array.from(fileTruthSet).join(", ")}`)
        );

        // Add debug logging for predicted cells
        const filePredSet = new Set(jsonAnalysis.regions.flatMap(r => r.cells));
        console.log(
          chalk.yellow(`Predicted cells: ${Array.from(filePredSet).join(", ")}`)
        );

        // Calculate and display metrics for this file
        const intersection = new Set(
          [...filePredSet].filter(cell => fileTruthSet.has(cell))
        );
        const union = new Set([...fileTruthSet, ...filePredSet]);
        const precision = filePredSet.size
          ? intersection.size / filePredSet.size
          : 0;
        const recall = fileTruthSet.size
          ? intersection.size / fileTruthSet.size
          : 0;
        const f1 =
          precision + recall
            ? (2 * precision * recall) / (precision + recall)
            : 0;
        const iou = union.size ? intersection.size / union.size : 0;

        console.log(chalk.bold.blue(`\n📊 Metrics for ${chalk.yellow(file)}:`));
        formatMetricsForDisplay({
          precision,
          recall,
          f1,
          iou,
          truthCells: fileTruthSet.size,
          predictedCells: filePredSet.size,
          matchingCells: intersection.size,
        }).forEach(line => console.log(chalk.blue(line)));

        // Aggregate truth grid cells from truth boxes
        overallTruthSet = new Set([...overallTruthSet, ...fileTruthSet]);

        // Aggregate predicted grid cells from analysis results
        overallPredSet = new Set([...overallPredSet, ...filePredSet]);

        filesWithAccuracy++;
      } catch (error: unknown) {
        if (error instanceof Error) {
          if (error.message.includes("No class code found")) {
            // Ground truth not available - this is okay
            console.log(
              chalk.yellow(`\nℹ️  No ground truth available for ${file}`)
            );
          } else {
            // Log other errors but continue processing
            console.error(`Error processing ${file}:`, error);
          }
        }
        continue;
      }
    }

    if (filesWithAccuracy > 0) {
      const intersection = new Set(
        [...overallPredSet].filter(cell => overallTruthSet.has(cell))
      );
      const union = new Set([...overallTruthSet, ...overallPredSet]);
      const precision = overallPredSet.size
        ? intersection.size / overallPredSet.size
        : 0;
      const recall = overallTruthSet.size
        ? intersection.size / overallTruthSet.size
        : 0;
      const f1 =
        precision + recall
          ? (2 * precision * recall) / (precision + recall)
          : 0;
      const iou = union.size ? intersection.size / union.size : 0;

      // Update the overall metrics display
      console.log(chalk.bold.green("\n🎯 Overall Accuracy Metrics:"));
      formatMetricsForDisplay({
        precision,
        recall,
        f1,
        iou,
        truthCells: overallTruthSet.size,
        predictedCells: overallPredSet.size,
        matchingCells: intersection.size,
      }).forEach(line => console.log(chalk.green(line)));
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

run();
