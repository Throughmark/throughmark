import { readFile } from "fs/promises";

import { GridCalculator } from "./grid/calculator.js";
import { GridGenerator } from "./grid/generator.js";
import { ImageProcessor } from "./image/processor.js";
import type { AnalysisResponse } from "./llm/analyzer.js";
import { ImageAnalyzer } from "./llm/analyzer.js";
import { Analysis } from "./llm/analyzer.js";
import type { GridConfig } from "./types.js";

export interface AnalyzeOptions {
  imagePath: string;
  prompt?: string;
  contiguousRegions?: boolean;
}

export interface HighlightOptions {
  imagePath: string;
  analysis: AnalysisResponse;
}

export class Throughmark {
  private calculator: GridCalculator;
  private generator: GridGenerator;
  private readonly processor: ImageProcessor;
  public analyzer!: ImageAnalyzer;
  private readonly config: GridConfig;

  constructor(config: GridConfig = {}) {
    this.config = config;
    this.calculator = new GridCalculator(config);
    this.generator = new GridGenerator(this.calculator.currentConfig);
    this.processor = new ImageProcessor();

    // Create analyzer internally instead of accepting it
    this.analyzer = new ImageAnalyzer(
      {
        provider: this.config.llm?.provider || "anthropic",
        model: this.config.llm?.model,
      },
      {
        rows: this.calculator.currentConfig.rows,
        cols: this.calculator.currentConfig.cols,
      }
    );
  }

  public async getGridDimensions(imagePath: string) {
    const dimensions = await this.processor.getDimensions(imagePath);
    const gridDims = this.calculator.calculateDimensions(
      dimensions.width,
      dimensions.height
    );

    // Update generator with new grid config
    this.generator = new GridGenerator(this.calculator.currentConfig);

    if (this.analyzer) {
      this.analyzer.updateGridConfig({
        rows: this.calculator.currentConfig.rows,
        cols: this.calculator.currentConfig.cols,
      });
    } else {
      this.analyzer = new ImageAnalyzer(
        {
          provider: this.config.llm?.provider || "anthropic",
          model: this.config.llm?.model,
        },
        {
          rows: this.calculator.currentConfig.rows,
          cols: this.calculator.currentConfig.cols,
        }
      );
    }

    return {
      ...gridDims,
      gridConfig: {
        rows: this.calculator.currentConfig.rows,
        cols: this.calculator.currentConfig.cols,
      },
    };
  }

  generateHTML = async (imagePath: string): Promise<string> => {
    const gridConfig = await this.getGridDimensions(imagePath);
    return `
      <div style="position: relative; display: inline-block;">
        <img src="${imagePath}" style="display: block;" />
        ${this.generator.generateSVGGrid(gridConfig, true)}
      </div>
    `;
  };

  generateVerificationImage = async (imagePath: string): Promise<Buffer> => {
    return await this.processor.transformImage({
      image: imagePath,
      addGrid: true,
      gridConfig: {
        rows: this.calculator.currentConfig.rows,
        cols: this.calculator.currentConfig.cols,
      },
      annotations: [{ type: "highlight" }],
    });
  };

  analyze = async (options: AnalyzeOptions): Promise<Analysis> => {
    await this.getGridDimensions(options.imagePath);
    const imageBuffer = await this.generateVerificationImage(options.imagePath);
    const response = await this.analyzer.analyze(
      imageBuffer,
      options.prompt,
      options.imagePath,
      { contiguousRegions: options.contiguousRegions }
    );
    return new Analysis(
      response,
      options.imagePath,
      this.processor,
      this.calculator.currentConfig,
      this.config.annotations
    );
  };

  async generateSimpleHighlight(options: HighlightOptions): Promise<Buffer> {
    return await this.processor.transformImage({
      image: options.imagePath,
      addGrid: false,
      regions: options.analysis.regions,
      gridConfig: {
        rows: this.calculator.currentConfig.rows,
        cols: this.calculator.currentConfig.cols,
      },
    });
  }

  getGridConfig = () => ({
    rows: this.calculator.currentConfig.rows,
    cols: this.calculator.currentConfig.cols,
  });

  private readImage = async (imagePath: string): Promise<Buffer> => {
    try {
      return await readFile(imagePath);
    } catch (error) {
      throw new Error(`Failed to read image: ${error}`);
    }
  };
}

export type { GridConfig } from "./types.js";

export const defaultConfig = {
  annotations: [{ type: "highlight" }, { type: "circle" }, { type: "arrow" }],
};
