import { describe, it, expect } from "vitest";

import { CircleAnnotation } from "./circle.js";

describe("CircleAnnotation", () => {
  const mockContext = {
    cells: [
      { x: 10, y: 10 },
      { x: 100, y: 10 },
      { x: 100, y: 100 },
    ],
    cellWidth: 50,
    cellHeight: 50,
    style: {
      fill: "#fff",
      opacity: 0.5,
      cellWidth: 50,
      cellHeight: 50,
    },
    region: { title: "Test", cells: [], description: "", details: "" },
  };

  it("should render a shape around the cells", () => {
    const circle = new CircleAnnotation();
    const svg = circle.render(mockContext);

    // Just verify we get valid SVG markup
    expect(svg).toContain("<path");
    expect(svg).toContain("stroke");
  });

  it("should handle empty cells", () => {
    const circle = new CircleAnnotation();
    const svg = circle.render({
      ...mockContext,
      cells: [],
    });

    expect(svg).toBeTruthy();
  });
});
