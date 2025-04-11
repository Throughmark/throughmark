import type { GridConfig, GridDimensions } from "./types.js";

export class GridGenerator {
  constructor(
    private config: Required<
      Pick<GridConfig, "rows" | "cols" | "visible" | "cellLabels">
    >
  ) {}

  private generateGridLine = (
    start: { x: number; y: number },
    end: { x: number; y: number },
    opacity = 0.3
  ): string => {
    return `<line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" 
      stroke="black" stroke-width="2" opacity="${opacity}"/>`;
  };

  // Calculate font size based on cell dimensions
  private calculateFontSize = (
    cellWidth: number,
    cellHeight: number
  ): number => {
    // Use 22% of the smallest cell dimension
    const smallestDimension = Math.min(cellWidth, cellHeight);
    const baseFontSize = smallestDimension * 0.22;

    // Enforce min and max constraints for readability
    return Math.min(Math.max(baseFontSize, 5), 20);
  };

  private generateCellLabel = (
    x: number,
    y: number,
    cellWidth: number,
    cellHeight: number,
    label: string,
    { isHTML = false }: { isHTML?: boolean } = {}
  ): string => {
    const fill = isHTML ? "rgba(0,0,0,0.8)" : "black";

    // Calculate font size based on cell dimensions
    const fontSize = this.calculateFontSize(cellWidth, cellHeight);

    // Scale stroke width proportionally to font size
    const strokeWidth = Math.max(1, fontSize / 6);

    return `<text 
      x="${x + cellWidth / 2}" 
      y="${y + cellHeight / 2}" 
      text-anchor="middle"
      dominant-baseline="central"
      fill="${fill}" 
      font-size="${fontSize}px"
      font-weight="bold"
      stroke="gold" 
      stroke-width="${strokeWidth}"
      stroke-linejoin="round"
      paint-order="stroke"
      opacity="0.9"
      >${label}</text>`;
  };

  private generateGridLines(dimensions: GridDimensions): string {
    const { width, height, cellWidth, cellHeight } = dimensions;

    // Vertical lines
    const verticalLines = Array(this.config.cols + 1)
      .fill(0)
      .map((_, i) => {
        const x = i * cellWidth;
        return this.generateGridLine({ x, y: 0 }, { x, y: height });
      })
      .join("");

    // Horizontal lines
    const horizontalLines = Array(this.config.rows + 1)
      .fill(0)
      .map((_, i) => {
        const y = i * cellHeight;
        return this.generateGridLine({ x: 0, y }, { x: width, y });
      })
      .join("");

    return verticalLines + horizontalLines;
  }

  private generateLabels(dimensions: GridDimensions, isHTML = false): string {
    const { cellWidth, cellHeight } = dimensions;
    return Array(this.config.rows)
      .fill(0)
      .map((_, row) =>
        Array(this.config.cols)
          .fill(0)
          .map((_, col) => {
            const x = col * cellWidth;
            const y = row * cellHeight;
            const label = `${String.fromCharCode(65 + row)}${col + 1}`;
            return this.generateCellLabel(x, y, cellWidth, cellHeight, label, {
              isHTML,
            });
          })
          .join("")
      )
      .join("");
  }

  generateSVGGrid(dimensions: GridDimensions, isHTML: boolean): string {
    const { width, height } = dimensions;

    return `
      <svg width="${width}" height="${height}"${
        isHTML ? ' style="position: absolute; top: 0; left: 0;"' : ""
      }>
        <rect width="100%" height="100%" fill="none"/>
        ${this.config.visible ? this.generateGridLines(dimensions) : ""}
        ${this.config.cellLabels ? this.generateLabels(dimensions, isHTML) : ""}
      </svg>`.trim();
  }
}
