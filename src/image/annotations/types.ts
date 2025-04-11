import type { Region } from "../../llm/analyzer.js";

export interface Cell {
  x: number;
  y: number;
}

export interface RegionStyle {
  fill: string;
  opacity: number;
}

export interface AnnotationStyle extends RegionStyle {
  cellWidth: number;
  cellHeight: number;
}

export interface AnnotationContext {
  region: Region;
  cells: Cell[];
  cellWidth: number;
  cellHeight: number;
  style: AnnotationStyle;
  imageWidth: number;
  imageHeight: number;
}
