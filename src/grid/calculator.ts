import type { GridConfig } from "../types.js";

import type { GridDimensions } from "./types.js";

interface InternalGridConfig extends GridConfig {
  minCellSize: number;
  maxCells: number;
  rows: number;
  cols: number;
  visible: boolean;
  cellLabels: boolean;
}

export class GridCalculator {
  private config: InternalGridConfig;

  constructor(config: GridConfig = {}) {
    // Base size for a reference 1000px image
    const baseSize = 150;

    this.config = {
      minCellSize: config.minCellSize ?? baseSize,
      maxCells: config.maxCells ?? 26,
      rows: config.rows ?? 0,
      cols: config.cols ?? 0,
      visible: config.visible ?? true,
      cellLabels: config.cellLabels ?? true,
    };
  }

  calculateDimensions(width: number, height: number): GridDimensions {
    if (this.config.rows && this.config.cols) {
      const cellWidth = width / this.config.cols;
      const cellHeight = height / this.config.rows;
      return { width, height, cellWidth, cellHeight };
    }

    // For smaller images, decrease the cell size proportionally
    const scaleFactor = Math.min(width, height) / 1000; // Reference size of 1000px
    const adjustedCellSize = this.config.minCellSize * Math.min(scaleFactor, 1);

    // Calculate dimensions - smaller images get more cells because adjustedCellSize is smaller
    const cellWidth =
      width /
      Math.min(Math.floor(width / adjustedCellSize), this.config.maxCells);
    const cellHeight =
      height /
      Math.min(Math.floor(height / adjustedCellSize), this.config.maxCells);

    // Update config with calculated values
    this.config.cols = Math.max(Math.floor(width / cellWidth), 1);
    this.config.rows = Math.max(Math.floor(height / cellHeight), 1);

    return { width, height, cellWidth, cellHeight };
  }

  get currentConfig(): InternalGridConfig {
    return this.config;
  }
}
