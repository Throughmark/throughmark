import { describe, it, expect } from "vitest";

import { HighlightAnnotation } from "./highlight.js";

describe("HighlightAnnotation", () => {
  const mockContext = {
    region: {
      title: "Test Region",
      description: "Test description",
      cells: ["A1", "B1", "C1"],
      details: "Test details",
    },
    cells: [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 200, y: 0 },
    ],
    cellWidth: 100,
    cellHeight: 100,
    style: {
      fill: "#ff0000",
      opacity: 0.5,
      cellWidth: 100,
      cellHeight: 100,
    },
  };

  it("should render rectangles with correct attributes", () => {
    const highlight = new HighlightAnnotation();
    const svg = highlight.render(mockContext);

    expect(svg).toContain("<rect");
    expect(svg).toContain(`fill="${mockContext.style.fill}"`);
  });

  it("should render correct number of rectangles", () => {
    const highlight = new HighlightAnnotation();
    const svg = highlight.render(mockContext);

    const rectCount = (svg.match(/<rect/g) || []).length;
    expect(rectCount).toBe(mockContext.cells.length);
  });

  it("should position rectangles correctly", () => {
    const highlight = new HighlightAnnotation();
    const svg = highlight.render({
      ...mockContext,
      cells: [{ x: 100, y: 200 }],
    });

    expect(svg).toContain('x="100"');
    expect(svg).toContain('y="200"');
    expect(svg).toContain('width="100"');
    expect(svg).toContain('height="100"');
  });
});
