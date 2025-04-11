import type { LLMConfig, AnnotationConfig } from "./llm/types.js";

export interface GridConfig {
  rows?: number;
  cols?: number;
  visible?: boolean;
  cellLabels?: boolean;
  llm?: LLMConfig;
  minCellSize?: number;
  maxCellSize?: number;
  maxCells?: number;
  annotations?: AnnotationConfig[];
}

export interface GridDimensions {
  width: number;
  height: number;
  cellWidth: number;
  cellHeight: number;
}
