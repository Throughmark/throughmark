import type { AnnotationContext } from "./types.js";

export class HighlightAnnotation {
  render(ctx: AnnotationContext): string {
    const { cells, cellWidth, cellHeight, style } = ctx;

    return cells
      .map(
        cell => `
        <rect 
          x="${cell.x}" 
          y="${cell.y}" 
          width="${cellWidth}" 
          height="${cellHeight}"
          fill="${style.fill}" 
          fill-opacity="${style.opacity}"
        />
      `
      )
      .join("");
  }
}
