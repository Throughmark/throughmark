import { describe, it, expect } from "vitest";

import { ArrowAnnotation } from "./arrow.js";

describe("ArrowAnnotation", () => {
  const mockContext = {
    cells: [
      { x: 100, y: 100 },
      { x: 150, y: 150 },
    ],
    cellWidth: 50,
    cellHeight: 50,
    style: {
      fill: "#ff0000",
      opacity: 0.8,
      cellWidth: 50,
      cellHeight: 50,
    },
    region: { title: "Test", cells: [], description: "", details: "" },
    imageWidth: 800,
    imageHeight: 600,
  };

  it("should render an arrow pointing to the region", () => {
    const arrow = new ArrowAnnotation();
    const svg = arrow.render(mockContext);

    // Verify SVG structure
    expect(svg).toContain("<path");
    expect(svg).toContain('stroke="#ff0000"');
    expect(svg).toContain("M"); // Has move command
    expect(svg).toContain("L"); // Has line command
    expect(svg).toContain("Z"); // Closes path for arrow head
  });

  it("should handle empty cells", () => {
    const arrow = new ArrowAnnotation();
    const svg = arrow.render({
      ...mockContext,
      cells: [],
    });

    expect(svg).toBe(""); // Should return empty string for no cells
  });

  it("should calculate correct center point", () => {
    const arrow = new ArrowAnnotation();
    const svg = arrow.render({
      ...mockContext,
      cells: [{ x: 100, y: 100 }], // Single cell for predictable center
    });

    // Center should be at cell center (100 + 25, 100 + 25)
    const centerX = 125;
    const centerY = 125;

    expect(svg).toContain(`${centerX} ${centerY}`);
  });

  it("should store position by region ID", () => {
    const arrow = new ArrowAnnotation();
    arrow.render({
      ...mockContext,
      region: { title: "Region1", cells: [], description: "", details: "" },
    });

    // Get position for the region
    const position = arrow.getTextPosition("Region1");

    // Should return a position object
    expect(position).not.toBeNull();
    expect(position).toHaveProperty("x");
    expect(position).toHaveProperty("y");
    expect(position).toHaveProperty("direction");
  });

  it("should vary arrow angle based on region title", () => {
    const arrow = new ArrowAnnotation();

    // Render arrows for different regions
    arrow.render({
      ...mockContext,
      region: { title: "Region1", cells: [], description: "", details: "" },
    });

    arrow.render({
      ...mockContext,
      region: { title: "Region2", cells: [], description: "", details: "" },
    });

    // Get positions for both regions
    const position1 = arrow.getTextPosition("Region1");
    const position2 = arrow.getTextPosition("Region2");

    // Positions should be different due to angle variation
    expect(position1?.x).not.toEqual(position2?.x);
    expect(position1?.y).not.toEqual(position2?.y);
  });

  it("should limit arrow extension beyond image bounds", () => {
    const arrow = new ArrowAnnotation();

    // Create a context with cells at the edge of the image
    const edgeContext = {
      ...mockContext,
      cells: [{ x: 0, y: 0 }], // Cell at top-left corner
      imageWidth: 200,
      imageHeight: 200,
    };

    arrow.render(edgeContext);
    const position = arrow.getTextPosition(edgeContext.region.title);

    // The arrow should not extend too far beyond the image bounds
    // Max out-of-bounds is 3 * cellWidth/Height
    const maxOutOfBounds = 3 * edgeContext.cellWidth;

    expect(position?.x).toBeGreaterThanOrEqual(-maxOutOfBounds);
    expect(position?.y).toBeGreaterThanOrEqual(-maxOutOfBounds);
    expect(position?.x).toBeLessThanOrEqual(
      edgeContext.imageWidth + maxOutOfBounds
    );
    expect(position?.y).toBeLessThanOrEqual(
      edgeContext.imageHeight + maxOutOfBounds
    );
  });
});
