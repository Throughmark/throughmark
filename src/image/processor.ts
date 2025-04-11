import sharp from "sharp";

import { GridGenerator } from "../grid/generator.js";
import type { Region } from "../llm/analyzer.js";
import type { AnnotationConfig } from "../llm/types.js";

import { ImageHighlighter } from "./highlighter.js";

export interface ImageTransformOptions {
  image: string | Buffer;
  addGrid?: boolean;
  regions?: Region[];
  gridConfig: {
    rows: number;
    cols: number;
  };
  annotations?: AnnotationConfig[];
}

export class ImageProcessor {
  private readonly highlighter: ImageHighlighter;
  private readonly pngOptions = {
    compressionLevel: 9,
    adaptiveFiltering: true,
    palette: true,
  };

  constructor() {
    this.highlighter = new ImageHighlighter();
  }

  async getDimensions(
    imagePath: string
  ): Promise<{ width: number; height: number }> {
    const metadata = await sharp(imagePath).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  }

  async svgToBuffer(svg: string): Promise<Buffer> {
    return Buffer.from(
      `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
      <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">${svg}`
    );
  }

  async transformImage(options: ImageTransformOptions): Promise<Buffer> {
    const image =
      typeof options.image === "string"
        ? sharp(options.image)
        : sharp(options.image);

    // 1. Calculate dimensions once
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error("Could not get image dimensions");
    }

    const dimensions = {
      width: metadata.width,
      height: metadata.height,
      cellWidth: Math.floor(metadata.width / options.gridConfig.cols),
      cellHeight: Math.floor(metadata.height / options.gridConfig.rows),
    };

    const composites = [];

    // 2. Add grid if requested AND we're not already working with a grid image
    if (options.addGrid && !Buffer.isBuffer(options.image)) {
      const gridGenerator = new GridGenerator({
        rows: options.gridConfig.rows,
        cols: options.gridConfig.cols,
        visible: true,
        cellLabels: true,
      });
      const gridSvg = gridGenerator.generateSVGGrid(
        {
          width: dimensions.width,
          height: dimensions.height,
          cellWidth: dimensions.cellWidth,
          cellHeight: dimensions.cellHeight,
        },
        options.addGrid
      );
      const gridBuffer = await this.svgToBuffer(gridSvg);
      composites.push({
        input: await sharp(gridBuffer)
          .resize(dimensions.width, dimensions.height, { fit: "fill" })
          .toBuffer(),
        blend: "over",
      });
    }

    // 3. Add highlights if regions provided
    if (options.regions?.length) {
      const overlay = this.highlighter.generateHighlightOverlay({
        width: dimensions.width,
        height: dimensions.height,
        regions: options.regions,
        gridConfig: options.gridConfig,
        dimensions,
        annotations: options.annotations,
      });
      const highlightBuffer = await this.svgToBuffer(overlay);
      composites.push({
        input: await sharp(highlightBuffer)
          .resize(dimensions.width, dimensions.height, { fit: "fill" })
          .toBuffer(),
        blend: "over",
      });
    }

    // 4. Apply all transformations
    return await image
      .composite(
        composites.map(c => ({
          input: c.input,
          blend: "over" as const,
        }))
      )
      .png(this.pngOptions)
      .toBuffer();
  }
}
