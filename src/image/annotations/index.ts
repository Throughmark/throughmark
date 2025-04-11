import type { AnnotationType } from "../../llm/types.js";

import { ArrowAnnotation } from "./arrow.js";
import { CircleAnnotation } from "./circle.js";
import { HighlightAnnotation } from "./highlight.js";
import type { AnnotationContext } from "./types.js";

export * from "./types.js";
export * from "./highlight.js";
export * from "./circle.js";
export * from "./arrow.js";

// Define interfaces for the annotation renderers
export interface BaseAnnotationRenderer {
  render(ctx: AnnotationContext): string;
}

export interface ArrowAnnotationRenderer extends BaseAnnotationRenderer {
  getTextPosition(
    regionId: string
  ): { x: number; y: number; direction: string } | null;
}

// Create a type that combines all possible renderer types
export type AnnotationRenderer =
  | BaseAnnotationRenderer
  | ArrowAnnotationRenderer;

// Define the annotation renderers with proper typing
export const annotationRenderers: Record<AnnotationType, AnnotationRenderer> = {
  highlight: new HighlightAnnotation(),
  circle: new CircleAnnotation(),
  arrow: new ArrowAnnotation(),
};
