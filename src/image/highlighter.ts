import type { Region } from "../llm/analyzer.js";
import type { AnnotationType } from "../llm/types.js";

import {
  annotationRenderers,
  ArrowAnnotationRenderer,
} from "./annotations/index.js";
import type {
  Cell,
  RegionStyle,
  AnnotationStyle,
} from "./annotations/types.js";

export interface HighlightOverlayOptions {
  width: number;
  height: number;
  regions: Region[];
  gridConfig: {
    rows: number;
    cols: number;
  };
  dimensions?: {
    cellWidth: number;
    cellHeight: number;
  };
  annotations?: Array<{ type: AnnotationType }>;
}

export class ImageHighlighter {
  private imageWidth: number = 0;
  private imageHeight: number = 0;

  private generatePastelColor() {
    // Use HSL for better control over pastel shades
    const hue = Math.floor(Math.random() * 360); // Any hue
    const saturation = 70 + Math.random() * 10; // High saturation for pastels
    const lightness = 75 + Math.random() * 10; // High lightness for pastels
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  private readonly baseColors = [
    "#FFB3BA", // Light pink
    "#BAFFC9", // Light green
    "#BAE1FF", // Light blue
    "#FFFFBA", // Light yellow
    "#E8BAFF", // Light purple
    "#FFD9BA", // Light orange
    "#B3FFE5", // Light mint
    "#FFB3E6", // Light magenta
    "#B3ECFF", // Light cyan
    "#DEFFB3", // Light lime
  ];

  private getRegionColor(index: number) {
    if (index < this.baseColors.length) {
      return { fill: this.baseColors[index], opacity: 0.2 };
    }
    // For additional regions, generate random pastel colors
    return { fill: this.generatePastelColor(), opacity: 0.2 };
  }

  private getRegionStyle(
    index: number,
    cellWidth: number,
    cellHeight: number
  ): AnnotationStyle {
    const color = this.getRegionColor(index);
    return {
      ...color,
      cellWidth,
      cellHeight,
    };
  }

  private renderRegionText(
    region: Region,
    cells: Cell[],
    style: RegionStyle,
    cellWidth: number,
    cellHeight: number,
    annotations: Array<{ type: AnnotationType }> = []
  ): string {
    const arrowAnnotation = annotations?.find(a => a.type === "arrow");

    // Calculate center position
    const centerX =
      cells.reduce((sum, c) => sum + c.x, 0) / cells.length + cellWidth / 2;
    const centerY =
      cells.reduce((sum, c) => sum + c.y, 0) / cells.length + cellHeight / 2;

    // If there's an arrow, use its position, otherwise use center
    const regionId = region.title || `region-${region.cells.join("-")}`;

    let textX = centerX;
    let textY = centerY;

    // If we have an arrow annotation, try to get its position
    if (arrowAnnotation) {
      const arrowRenderer =
        annotationRenderers.arrow as ArrowAnnotationRenderer;
      const arrowPosition = arrowRenderer.getTextPosition(regionId);
      if (arrowPosition) {
        // Position text at the arrow start with a small offset
        textX = arrowPosition.x;
        textY = arrowPosition.y - 20; // Offset text above arrow start

        // Add additional offset based on region title to reduce overlap
        // Extract region index or generate a pseudo-random one
        let regionOffset = 0;
        if (region.title) {
          // Try to extract a number from the title
          const match = region.title.match(/\d+/);
          if (match) {
            regionOffset = parseInt(match[0], 10) % 3;
          } else {
            // Use a hash of the title as a pseudo-random offset
            regionOffset =
              region.title
                .split("")
                .reduce((acc, char) => acc + char.charCodeAt(0), 0) % 3;
          }
        }

        // Apply additional offset based on region
        const additionalOffset = regionOffset * 15; // 0, 15, or 30 pixels

        // Apply offset in a direction perpendicular to the arrow
        // This helps spread text out in different directions
        const dx = centerX - textX;
        const dy = centerY - textY;
        const length = Math.sqrt(dx * dx + dy * dy);

        if (length > 0) {
          // Perpendicular direction
          const perpX = -dy / length;
          const perpY = dx / length;

          textX += perpX * additionalOffset;
          textY += perpY * additionalOffset;
        }
      }
    }

    // Ensure text stays within image bounds with padding
    const padding = 20; // Padding from edge of image
    const textWidth = (region.title?.length || 1) * 14; // Estimate text width based on default font size

    // Constrain text position to stay within image bounds
    textX = Math.max(
      textWidth / 2 + padding,
      Math.min(this.imageWidth - textWidth / 2 - padding, textX)
    );
    textY = Math.max(padding + 10, Math.min(this.imageHeight - padding, textY));

    // Use consistent text style regardless of arrow presence
    // Only the position (x,y) changes based on arrow
    const textStyle = {
      fill: "#ff0000",
      fontSize: "24px",
      x: arrowAnnotation ? textX : centerX,
      y: arrowAnnotation ? textY : centerY,
      fontWeight: "bold",
      stroke: "white",
      strokeWidth: "4",
    };

    return `
      <text
        x="${textStyle.x}"
        y="${textStyle.y}"
        text-anchor="middle"
        dominant-baseline="central"
        fill="${textStyle.fill}"
        font-size="${textStyle.fontSize}"
        font-family="Arial"
        font-weight="${textStyle.fontWeight}"
        stroke="${textStyle.stroke}"
        stroke-width="${textStyle.strokeWidth}"
        paint-order="stroke"
      >${region.title}</text>
    `;
  }

  generateHighlightOverlay(options: HighlightOverlayOptions): string {
    const { width, height, regions, gridConfig, annotations = [] } = options;
    const cellWidth = options.dimensions?.cellWidth ?? width / gridConfig.cols;
    const cellHeight =
      options.dimensions?.cellHeight ?? height / gridConfig.rows;

    // Store image dimensions for use in annotations
    this.imageWidth = width;
    this.imageHeight = height;

    // Always include highlights in verification mode
    const shouldHighlight = annotations.some(a => a.type === "highlight");

    // Start SVG
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;

    // Add highlights only if enabled
    if (shouldHighlight) {
      regions.forEach((region, index) => {
        const style = this.getRegionStyle(index, cellWidth, cellHeight);
        svg += this.renderAnnotation("highlight", { region, style });
      });
    }

    // Add other annotations
    annotations.forEach(annotation => {
      if (annotation.type !== "highlight") {
        regions.forEach((region, index) => {
          const style = this.getRegionStyle(index, cellWidth, cellHeight);
          svg += this.renderAnnotation(annotation.type, { region, style });
        });
      }
    });

    // Add text after annotations
    const texts = regions
      .map(region => {
        const cells = region.cells.map(cell => {
          const [row, col] = [
            cell.charCodeAt(0) - 65,
            parseInt(cell.slice(1)) - 1,
          ];
          return {
            x: col * cellWidth,
            y: row * cellHeight,
          };
        });
        return this.renderRegionText(
          region,
          cells,
          { fill: "#000", opacity: 0.8 },
          cellWidth,
          cellHeight,
          annotations
        );
      })
      .join("");

    svg += texts;
    svg += "</svg>";
    return svg;
  }

  private renderAnnotation(
    type: AnnotationType,
    { region, style }: { region: Region; style: AnnotationStyle }
  ): string {
    const cells = region.cells.map(cell => {
      const col = parseInt(cell.slice(1)) - 1;
      const row = cell.charCodeAt(0) - 65;
      return {
        x: col * style.cellWidth,
        y: row * style.cellHeight,
      };
    });

    const ctx = {
      region,
      cells,
      cellWidth: style.cellWidth,
      cellHeight: style.cellHeight,
      style,
      imageWidth: this.imageWidth,
      imageHeight: this.imageHeight,
    };

    return cells.length ? annotationRenderers[type].render(ctx) : "";
  }
}
