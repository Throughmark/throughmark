import fs from "fs";
import { writeFile } from "fs/promises";
import { parse } from "path";

import chalk from "chalk";

import { ImageProcessor } from "../image/processor.js";

import { AnthropicClient } from "./clients/anthropic.js";
import { OpenAIClient } from "./clients/openai.js";
import { MODEL_PRICING, OpenAIModel, AnthropicModel } from "./types.js";
import type { LLMClient, LLMConfig, AnnotationConfig } from "./types.js";

export const RESPONSE_TEMPLATE = `
{
  "regions": [
    {
      "title": "All Features",
      "description": "All identified features in the image",
      "cells": ["A1", "A2", "C2", "C3", ...],
      "details": "Description of all features"
    }
  ],
  "summary": "your analysis"
}`.trim();

export const INITIAL_ANALYSIS_PROMPT = `
You are analyzing a pair of images - the original image and the same image 
with a grid overlay. The grid uses spreadsheet-style coordinates (A1, B2, etc).

Your ONLY task is to identify which grid cells contain the requested features.

CRITICAL RULES:
1. ONLY use grid cells that are VISIBLE in the image
2. NEVER reference cells outside the visible grid
3. If a feature extends beyond the grid, ONLY include the visible portions
4. Each cell MUST be carefully verified to contain the requested feature
5. Be conservative - only include cells with clear evidence
6. Double-check that each cell coordinate exists in the visible grid
7. List cells in a logical order (left-to-right, top-to-bottom)
8. Each cell must be in the format "A1", "B2", etc. (letter then number)

IMPORTANT: You MUST respond with ONLY this exact JSON format:
{
  "cells": ["A1", "B2", "C3", "D4"]
}

DO NOT include any other fields or nested structures. ONLY a simple object
with a "cells" array.
`.trim();

export const VERIFICATION_PROMPT_TEMPLATE = (contiguousMode: boolean) => {
  const prompt = `
    The user requested: "{prompt}"

    The image has been overlaid with a grid using spreadsheet-style coordinates (A1, B2, etc). 
    The cells may have varying opacity levels: darker cells indicate higher confidence 
    that the requested feature is present in that cell (opacity increases with the number of 
    independent detections).

    These cells were identified (repeated cells indicate multiple votes):
    {cells}

    Your tasks:
    1. REMOVAL: Review each identified cell, being especially skeptical of lighter
       (lower confidence) cells. Remove any identified cells that don't clearly contain the
       requested feature. Do NOT add any new cells.
    2. GROUPING: Organize the remaining identified cells into logical regions${
      contiguousMode
        ? ` where each region is visually separated from other regions`
        : "."
    }

    CRITICAL RULES:
    - Do NOT add any new cells
    - Be very skeptical of low-confidence (lighter) cells
    - Keep high-confidence (darker) cells unless clearly incorrect
    - For each valid cell, include it the same number of times as in the input list
    ${
      contiguousMode
        ? `- Any cells that share edges or corners MUST be in the same region
    - ANY cells that share edges or corners MUST be grouped into ONE SINGLE region
    - This is a hard constraint: do NOT split connected cells into different regions
    - Even if cells appear to be different parts (like handle vs head), if they touch, they MUST be in the same region
    - Check carefully for diagonal connections between cells`
        : ""
    }

    Respond with ONLY valid JSON in exactly this format:
    {
      "regions": [
        {
          "title": "descriptive title",
          "description": "what appears in this region",
          "cells": ["A1", "A1", "A1", "B2", "B2"], // Keep vote counts by repeating cells
        }
      ],
      "removedCells": {
        "cells": ["C3", "D4"], // List of removed cell identifiers (each once)
        "explanation": "Brief explanation for why these cells were removed"
      },
      "summary": "overall analysis"
    }`.trim();
  return prompt.trim();
};

export interface Region {
  title: string;
  description: string;
  cells: string[];
  details: string;
}

export interface AnalysisResponse {
  regions: Region[];
  summary: string;
  tokens?: {
    input: number;
    output: number;
    total: number;
    cost?: number;
    modelName?: string;
  };
}

interface TruthFile {
  cells: string[];
}

interface AccuracyScore {
  foundCells: string[]; // Cells we correctly identified
  missedCells: string[]; // Cells in truth but not found
  extraCells: string[]; // Cells we found but aren't in truth
  recall: number; // (found ÷ total true)
  precision: number; // (found ÷ total predicted)
}

interface GridDimensions {
  rows: number;
  cols: number;
}

export class ImageAnalyzer {
  private client: LLMClient;
  private processor: ImageProcessor;
  private totalTokens = {
    input: 0,
    output: 0,
  };
  private numPasses: number;

  constructor(
    config: LLMConfig = { provider: "anthropic" },
    private gridConfig: GridDimensions
  ) {
    this.client = this.createClient(config);
    this.processor = new ImageProcessor();
    this.numPasses = config.numPasses || 4;
  }

  private createClient(config: LLMConfig): LLMClient {
    if (config.client) {
      return config.client;
    }

    // Log the input config for debugging purposes
    console.log("Creating LLM client with config:", config);

    // Provide a default model if one is not specified so that during batch mode
    // (or when no model is passed) we never call the client with an undefined model.
    const defaultModel =
      config.provider === "openai" ? "gpt-4o" : "claude-3-5-sonnet-latest";
    const model = config.model || defaultModel;

    console.log("Selected model:", model);
    switch (config.provider) {
      case "anthropic":
        return new AnthropicClient(config.apiKey, model);
      case "openai":
        return new OpenAIClient(config.apiKey, model);
      default:
        throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }
  }

  private calculateCost(tokens: { input: number; output: number }): number {
    if (this.client instanceof OpenAIClient) {
      const model = this.client.getModel() as OpenAIModel;
      const pricing = MODEL_PRICING[model];
      if (!pricing) {
        console.warn("No pricing found for model:", model);
        return 0;
      }

      const inputCost = (tokens.input * pricing.input) / 1_000_000;
      const outputCost = (tokens.output * pricing.output) / 1_000_000;
      return inputCost + outputCost;
    }

    if (this.client instanceof AnthropicClient) {
      const model = this.client.getModel() as AnthropicModel;
      const pricing = MODEL_PRICING[model];
      if (!pricing) return 0;

      const inputCost = (tokens.input * pricing.input) / 1_000_000;
      const outputCost = (tokens.output * pricing.output) / 1_000_000;
      return inputCost + outputCost;
    }

    return 0;
  }

  async analyze(
    imageBuffer: Buffer,
    prompt?: string,
    imagePath?: string,
    options: { contiguousRegions?: boolean } = {}
  ): Promise<AnalysisResponse> {
    // Reset token counts for new analysis
    this.totalTokens = { input: 0, output: 0 };

    // First generate grid overlay image for verification
    console.log(chalk.bold.green("\n🖼️  Generating grid overlay image..."));
    const gridImage = await this.processor.transformImage({
      image: imageBuffer,
      addGrid: true,
      gridConfig: {
        rows: this.gridConfig.rows,
        cols: this.gridConfig.cols,
      },
    });

    // First pass - just get the cells
    console.log(chalk.bold.green("\n🔍 First pass: Identifying cells..."));
    const initialCells = await this.performInitialAnalysis(gridImage, prompt);

    // Generate highlighted image for verification
    const highlightedImage = await this.processor.transformImage({
      image: imageBuffer,
      addGrid: true,
      regions: [
        {
          title: "",
          description: "Initial pass",
          details: "Pending verification",
          cells: initialCells,
        },
      ],
      gridConfig: this.gridConfig,
      annotations: [{ type: "highlight" }],
    });

    // Save verification image if filename provided
    if (imagePath && process.env.NODE_ENV !== "test") {
      const parsedPath = parse(imagePath);
      const verificationPath = `output/${parsedPath.name}.verification${parsedPath.ext}`;
      await writeFile(verificationPath, highlightedImage);
      console.log(
        chalk.bold.cyan(`🎨 Highlighted image saved to: ${verificationPath}`)
      );
    }

    // Check the option is being used
    console.log("Contiguous regions mode:", options.contiguousRegions);

    const verificationPrompt = VERIFICATION_PROMPT_TEMPLATE(
      options.contiguousRegions ?? false
    )
      .replace("{prompt}", prompt || "")
      .replace("{cells}", JSON.stringify(initialCells));

    const verifiedAnalysis = await this.performAnalysis(
      highlightedImage, // Changed from imageBuffer to highlightedImage
      verificationPrompt
    );

    // Calculate second pass tokens
    const secondPassTokens = {
      input: this.totalTokens.input,
      output: this.totalTokens.output,
    };

    console.log(
      "Second pass tokens - Input:",
      secondPassTokens.input,
      "Output:",
      secondPassTokens.output
    );

    // Log initial cells
    console.log(
      chalk.bold.cyan("\nInitial cells:"),
      chalk.yellow(initialCells.join(", "))
    );

    // After verification
    console.log(chalk.bold.cyan("\nVerified regions:"));
    verifiedAnalysis.regions.forEach(region => {
      console.log(chalk.cyan(`- ${region.title}: ${region.cells.join(", ")}`));
    });

    // Compare total cells
    const initialSet = new Set(initialCells);
    const verifiedSet = new Set(verifiedAnalysis.regions.flatMap(r => r.cells));

    if (initialSet.size !== verifiedSet.size) {
      console.log(
        chalk.bold.red("\nCell count changed:"),
        chalk.red(initialSet.size),
        chalk.red("→"),
        chalk.red(verifiedSet.size)
      );
    }

    const addedCells = [...verifiedSet].filter(cell => !initialSet.has(cell));
    const removedCells = [...initialSet].filter(cell => !verifiedSet.has(cell));

    if (addedCells.length > 0) {
      console.log(
        chalk.bold.green("Added cells:"),
        chalk.green(addedCells.join(", "))
      );
    }
    if (removedCells.length > 0) {
      console.log(
        chalk.bold.red("Removed cells:"),
        chalk.red(removedCells.join(", "))
      );
    }

    // Calculate total cost
    const totalCost = this.calculateCost(this.totalTokens);
    const modelName =
      this.client instanceof OpenAIClient
        ? this.client.getModel()
        : this.client instanceof AnthropicClient
          ? this.client.getModel()
          : "unknown";

    return {
      ...verifiedAnalysis,
      tokens: {
        input: this.totalTokens.input,
        output: this.totalTokens.output,
        total: this.totalTokens.input + this.totalTokens.output,
        cost: totalCost,
        modelName,
      },
    };
  }

  private compareAnalyses(
    initial: AnalysisResponse,
    verified: AnalysisResponse
  ): string[] {
    const changes: string[] = [];

    // Track all cells for comparison
    const initialCells = new Set(initial.regions.flatMap(r => r.cells));
    const verifiedCells = new Set(verified.regions.flatMap(r => r.cells));

    // Find removed cells
    const removedCells = [...initialCells].filter(
      cell => !verifiedCells.has(cell)
    );
    if (removedCells.length > 0) {
      changes.push(`Removed cells: ${removedCells.join(", ")}`);
    }

    // Find added cells
    const addedCells = [...verifiedCells].filter(
      cell => !initialCells.has(cell)
    );
    if (addedCells.length > 0) {
      changes.push(`Added cells: ${addedCells.join(", ")}`);
    }

    // Compare region counts
    if (initial.regions.length !== verified.regions.length) {
      changes.push(
        `Region count changed: ${initial.regions.length} → ${verified.regions.length}`
      );
    }

    return changes;
  }

  private async performInitialAnalysis(
    imageBuffer: Buffer,
    prompt?: string
  ): Promise<string[]> {
    const temperatures =
      this.client instanceof AnthropicClient
        ? Array(this.numPasses)
            .fill(0)
            .map((_, i) => 0.2 + (i * 0.6) / (this.numPasses - 1)) // Anthropic: 0.2 to 0.8
        : Array(this.numPasses)
            .fill(0)
            .map((_, i) => 0.4 + (i * 0.6) / (this.numPasses - 1)); // OpenAI: 0.4 to 1.0

    console.log("Performing", temperatures.length, "parallel analyses...");

    const results = await Promise.all(
      temperatures.map(async (temp, index) => {
        // Add bias to first and last prompts
        let adjustedPrompt = prompt;
        if (index === 0) {
          adjustedPrompt = `${prompt || ""} Be liberal in your assessment - include any cell that appears to contain the requested feature, even if you're not completely certain.`;
        } else if (index === this.numPasses - 1) {
          adjustedPrompt = `${prompt || ""} Be extremely conservative in your assessment - only include cells where you are certain the requested feature is present.`;
        }

        const response = await this.client.analyzePair(
          imageBuffer,
          imageBuffer,
          adjustedPrompt,
          temp
        );
        if (!response || typeof response.text !== "string") {
          console.error(
            `Invalid response received at temperature ${temp}:`,
            response
          );
          return [];
        }
        if (response.usage) {
          this.totalTokens.input += response.usage.input_tokens || 0;
          this.totalTokens.output += response.usage.output_tokens || 0;
        }
        console.log(`Temperature ${temp} response:`, response.text);
        try {
          const parsed = JSON.parse(response.text);
          return parsed.cells || [];
        } catch (error) {
          console.error(`Failed to parse response (temp ${temp}):`, error);
          return [];
        }
      })
    );

    // Instead of consensus, collect all cells with their counts
    const cellCounts = new Map<string, number>();
    results.flat().forEach(cell => {
      cellCounts.set(cell, (cellCounts.get(cell) || 0) + 1);
    });

    // Return all cells with their count, but only if they appear 2+ times
    const allCells = [...cellCounts.entries()]
      .filter(([_, count]) => count >= 2) // Only keep cells with 2+ votes
      .flatMap(([cell, count]) => Array(count).fill(cell))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    console.log("All cells with repetitions:", allCells);
    return allCells;
  }

  private async performAnalysis(
    imageBuffer: Buffer,
    prompt?: string
  ): Promise<AnalysisResponse> {
    const response = await this.client.analyze(imageBuffer, prompt);

    // Handle different response types
    if (typeof response === "string") {
      try {
        return JSON.parse(response) as AnalysisResponse;
      } catch (error) {
        throw new Error(`Failed to parse analysis response: ${error}`);
      }
    } else {
      // Add second pass tokens into the cumulative counter
      if (response.usage) {
        this.totalTokens.input += response.usage.input_tokens || 0;
        this.totalTokens.output += response.usage.output_tokens || 0;
      }
      try {
        return JSON.parse(response.text || "") as AnalysisResponse;
      } catch (error) {
        throw new Error(`Failed to parse analysis response: ${error}`);
      }
    }
  }

  calculateAccuracy(
    analysis: AnalysisResponse,
    truthFile: string
  ): AccuracyScore {
    const truth = JSON.parse(fs.readFileSync(truthFile, "utf8")) as TruthFile;

    // Get all unique cells from ground truth
    const truthCells = new Set(truth.cells);
    const foundCells = new Set(analysis.regions.flatMap(r => r.cells));

    // Calculate intersection and differences
    const correctCells = [...truthCells].filter(cell => foundCells.has(cell));
    const missedCells = [...truthCells].filter(cell => !foundCells.has(cell));
    const extraCells = [...foundCells].filter(cell => !truthCells.has(cell));

    // Calculate metrics
    const precision = foundCells.size
      ? correctCells.length / foundCells.size
      : 0;
    const recall = truthCells.size ? correctCells.length / truthCells.size : 1; // If no truth cells, recall is perfect

    return {
      foundCells: correctCells,
      missedCells,
      extraCells,
      recall,
      precision,
    };
  }

  public async getCells(
    imageBuffer: Buffer,
    gridImage: Buffer,
    prompt?: string
  ): Promise<string[]> {
    return this.performInitialAnalysis(imageBuffer, prompt);
  }

  updateGridConfig(config: { rows: number; cols: number }) {
    this.gridConfig = config;
  }
}

export class Analysis {
  constructor(
    private response: AnalysisResponse,
    private imagePath: string,
    private processor: ImageProcessor,
    private gridConfig: { rows: number; cols: number },
    private annotations?: AnnotationConfig[]
  ) {}

  async renderVerification(): Promise<Buffer> {
    return await this.processor.transformImage({
      image: this.imagePath,
      addGrid: true,
      regions: this.response.regions,
      gridConfig: this.gridConfig,
      annotations: [{ type: "highlight" }],
    });
  }

  async render(): Promise<Buffer> {
    return await this.processor.transformImage({
      image: this.imagePath,
      addGrid: false,
      regions: this.response.regions,
      gridConfig: this.gridConfig,
      annotations:
        this.annotations === undefined
          ? [{ type: "highlight" }, { type: "circle" }]
          : this.annotations,
    });
  }

  // Expose the underlying response data
  get regions() {
    return this.response.regions;
  }
  get summary() {
    return this.response.summary;
  }
  get tokens() {
    return this.response.tokens;
  }
}
