import type { AnnotationContext } from "./types.js";

export class ArrowAnnotation {
  // Store positions by region ID to support multiple regions
  private positionMap: Map<
    string,
    { x: number; y: number; direction: string }
  > = new Map();

  getTextPosition(
    regionId: string
  ): { x: number; y: number; direction: string } | null {
    return this.positionMap.get(regionId) || null;
  }

  render(ctx: AnnotationContext): string {
    const { region, cells, cellWidth, cellHeight, imageWidth, imageHeight } =
      ctx;
    if (!cells.length) return this.renderEmpty();

    // Calculate region bounds and center
    const minX = Math.min(...cells.map(c => c.x));
    const maxX = Math.max(...cells.map(c => c.x)) + cellWidth;
    const minY = Math.min(...cells.map(c => c.y));
    const maxY = Math.max(...cells.map(c => c.y)) + cellHeight;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Calculate region size and scale arrow accordingly
    const regionWidth = maxX - minX;
    const regionHeight = maxY - minY;
    const regionSize = Math.sqrt(regionWidth * regionHeight);

    // Scale arrow based on region size, but with min/max limits
    const baseLength = Math.max(cellWidth, cellHeight) * 2;
    const arrowLength = Math.min(
      Math.max(baseLength, regionSize * 0.75), // Scale with region, min baseLength
      regionSize * 2 // Max 2x region size
    );
    const arrowWidth = Math.max(cellWidth, cellHeight) / 8;
    const arrowHeadLength = arrowWidth * 2;
    const arrowHeadWidth = arrowWidth * 1.5;

    // Vary the angle based on the region index to spread out arrows for multiple regions
    // Extract region index from region title or generate a pseudo-random one
    let regionIndex = 0;
    if (region.title) {
      // Try to extract a number from the title
      const match = region.title.match(/\d+/);
      if (match) {
        regionIndex = parseInt(match[0], 10);
      } else {
        // Use a hash of the title as a pseudo-random index
        regionIndex = region.title
          .split("")
          .reduce((acc, char) => acc + char.charCodeAt(0), 0);
      }
    }

    // Use the region index to vary the angle
    // Base angle is 45 degrees (PI/4), vary by +/- 30 degrees
    const angleVariation = (regionIndex % 5) * (Math.PI / 6) - Math.PI / 6; // -30 to +30 degrees
    const angle = Math.PI / 4 + angleVariation; // 45 degrees +/- variation

    // Position arrow based on the angle
    let startX = centerX - Math.cos(angle) * arrowLength;
    let startY = centerY + Math.sin(angle) * arrowLength;

    // Limit how far the arrow can go out of bounds (if imageWidth/Height are provided)
    if (imageWidth && imageHeight) {
      // Allow arrows to go out of bounds, but not too far
      const maxOutOfBounds = Math.max(cellWidth, cellHeight) * 3;

      startX = Math.max(
        -maxOutOfBounds,
        Math.min(imageWidth + maxOutOfBounds, startX)
      );
      startY = Math.max(
        -maxOutOfBounds,
        Math.min(imageHeight + maxOutOfBounds, startY)
      );
    }

    // Calculate arrow head points
    const headBaseX = centerX - arrowHeadLength * Math.cos(angle);
    const headBaseY = centerY + arrowHeadLength * Math.sin(angle);

    // Calculate perpendicular points for arrow head
    const perpX = arrowHeadWidth * Math.sin(angle);
    const perpY = arrowHeadWidth * Math.cos(angle);

    // Create arrow path
    const path = [
      // Main shaft
      `M ${startX} ${startY}`,
      `L ${centerX} ${centerY}`,

      // Arrow head as a triangle
      `M ${centerX} ${centerY}`,
      `L ${headBaseX + perpX} ${headBaseY + perpY}`,
      `L ${headBaseX - perpX} ${headBaseY - perpY}`,
      `Z`, // Close the triangle
    ].join(" ");

    // Store start position for text placement, using region ID as key
    const regionId = region.title || `region-${Date.now()}-${Math.random()}`;
    this.positionMap.set(regionId, {
      x: startX,
      y: startY,
      direction: "bottomleft", // Default direction for compatibility
    });

    return `
      <path 
        d="${path}"
        fill="#ff0000"
        stroke="#ff0000"
        stroke-width="${arrowWidth}"
        stroke-linejoin="round"
        stroke-opacity="0.8"
        fill-opacity="0.8"
      />
    `;
  }

  private renderEmpty(): string {
    return "";
  }
}
