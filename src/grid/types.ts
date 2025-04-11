import type { AnnotationType } from "../llm/types.js";

export interface GridDimensions {
  width: number;
  height: number;
  cellWidth: number;
  cellHeight: number;
}

export interface GridConfig {
  rows?: number;
  cols?: number;
  visible?: boolean;
  cellLabels?: boolean;
  annotations?: Array<{
    type: AnnotationType;
  }>;
}
