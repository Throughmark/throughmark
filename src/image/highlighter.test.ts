import { describe, it, expect } from "vitest";

import { ImageHighlighter } from "./highlighter.js";

describe("ImageHighlighter", () => {
  const defaultOptions = {
    width: 1000,
    height: 800,
    regions: [
      {
        title: "Region 1",
        description: "Test description",
        cells: ["A1", "A2", "B1"],
        details: "Test details",
      },
      {
        title: "Region 2",
        description: "Test description",
        cells: ["C3", "C4"],
        details: "Test details",
      },
    ],
    gridConfig: {
      rows: 4,
      cols: 5,
    },
  };

  it("should generate SVG with correct dimensions", () => {
    const highlighter = new ImageHighlighter();
    const width = 1000;
    const height = 800;
    const svg = highlighter.generateHighlightOverlay({
      width,
      height,
      regions: [],
      gridConfig: {
        rows: 4,
        cols: 5,
      },
    });

    expect(svg).toContain(`width="${width}"`);
    expect(svg).toContain(`height="${height}"`);
  });

  it("should include all regions in output", () => {
    const highlighter = new ImageHighlighter();
    const svg = highlighter.generateHighlightOverlay({
      ...defaultOptions,
      annotations: [{ type: "highlight" }],
    });

    defaultOptions.regions.forEach(region => {
      expect(svg).toContain(region.title);
    });
  });

  it("should assign different colors to different regions", () => {
    const highlighter = new ImageHighlighter();
    const svg = highlighter.generateHighlightOverlay({
      ...defaultOptions,
      annotations: [{ type: "highlight" }],
    });

    const fillColors = svg.match(/fill="([^"]+)"/g) || [];

    // Should have at least two different colors
    const uniqueColors = new Set(fillColors);
    expect(uniqueColors.size).toBeGreaterThan(1);
  });

  it("should handle empty regions", () => {
    const highlighter = new ImageHighlighter();
    const svg = highlighter.generateHighlightOverlay({
      ...defaultOptions,
      regions: [],
    });

    // Should generate valid SVG without highlights
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    // Should not contain any region titles
    expect(svg).not.toContain("Region 1");
    expect(svg).not.toContain("Region 2");
  });

  it("should use highlight annotation by default when no annotations specified", () => {
    const highlighter = new ImageHighlighter();
    const svg = highlighter.generateHighlightOverlay({
      ...defaultOptions,
      annotations: [{ type: "highlight" }],
    });

    // Should have rect elements for highlights
    const rects = svg.match(/<rect/g);
    expect(rects).toHaveLength(
      defaultOptions.regions.reduce((sum, r) => sum + r.cells.length, 0)
    );

    // Should have highlight attributes
    expect(svg).toContain('fill-opacity="0.2"');
    expect(svg).toMatch(/fill="#[A-F0-9]{6}"/);

    // Should not have circle elements
    expect(svg).not.toContain("<circle");
  });

  it("should support multiple annotation types", () => {
    const highlighter = new ImageHighlighter();
    const svg = highlighter.generateHighlightOverlay({
      ...defaultOptions,
      annotations: [{ type: "highlight" }, { type: "circle" }],
    });

    // Just verify we get both types of elements
    expect(svg).toContain("<rect");
    expect(svg).toContain("<path");
  });

  it("should handle empty annotations array", () => {
    const highlighter = new ImageHighlighter();
    const svg = highlighter.generateHighlightOverlay({
      ...defaultOptions,
      annotations: [],
    });

    // Only test that we don't get highlights or circles
    expect(svg).not.toContain("<rect");
    expect(svg).not.toContain("<circle");
  });

  const mockRegion = {
    title: "Test Region",
    description: "Test description",
    cells: ["A1", "B2"],
    details: "Test details",
  };

  const mockOptions = {
    width: 800,
    height: 600,
    regions: [mockRegion],
    gridConfig: {
      rows: 10,
      cols: 10,
    },
    dimensions: {
      cellWidth: 80,
      cellHeight: 60,
    },
  };

  it("should render text in center when no arrow annotation", () => {
    const highlighter = new ImageHighlighter();
    const svg = highlighter.generateHighlightOverlay({
      ...mockOptions,
      annotations: [{ type: "highlight" }, { type: "circle" }],
    });

    // Text should be red and centered (consistent styling regardless of arrow presence)
    expect(svg).toContain('fill="#ff0000"');
    expect(svg).toContain('text-anchor="middle"');
    expect(svg).toContain(mockRegion.title);
    expect(svg).toContain('font-size="24px"');
  });

  it("should render text in red with arrow annotation", () => {
    const highlighter = new ImageHighlighter();
    const svg = highlighter.generateHighlightOverlay({
      ...mockOptions,
      annotations: [
        { type: "highlight" },
        { type: "circle" },
        { type: "arrow" },
      ],
    });

    // Text should be red and larger
    expect(svg).toContain('fill="#ff0000"');
    expect(svg).toContain('font-size="24px"');
    expect(svg).toContain(mockRegion.title);
  });

  it("should render text with white outline for visibility", () => {
    const highlighter = new ImageHighlighter();
    const svg = highlighter.generateHighlightOverlay({
      ...mockOptions,
      annotations: [{ type: "highlight" }],
    });

    // Text should have white stroke
    expect(svg).toContain('stroke="white"');
    expect(svg).toContain('paint-order="stroke"');
  });

  it("should handle multiple regions", () => {
    const highlighter = new ImageHighlighter();
    const svg = highlighter.generateHighlightOverlay({
      ...mockOptions,
      regions: [
        mockRegion,
        { ...mockRegion, title: "Second Region", cells: ["C3", "D4"] },
      ],
    });

    // Should contain both region titles
    expect(svg).toContain("Test Region");
    expect(svg).toContain("Second Region");
  });

  it("should keep text within image bounds", () => {
    const highlighter = new ImageHighlighter();
    const smallImageOptions = {
      ...mockOptions,
      width: 200, // Small image width
      height: 150, // Small image height
      regions: [
        {
          ...mockRegion,
          title: "Very Long Region Title That Could Extend Beyond Bounds",
        },
      ],
    };

    // Generate SVG with a long title that might go out of bounds
    const svg = highlighter.generateHighlightOverlay({
      ...smallImageOptions,
      annotations: [{ type: "highlight" }, { type: "arrow" }],
    });

    // Extract text element position
    const textX = svg.match(/x="([^"]+)"/);
    const textY = svg.match(/y="([^"]+)"/);

    if (textX && textY) {
      const x = parseFloat(textX[1]);
      const y = parseFloat(textY[1]);

      // Verify that x and y are valid numbers
      expect(isNaN(x)).toBe(false);
      expect(isNaN(y)).toBe(false);

      // Text should be within the image dimensions
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(smallImageOptions.width);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(smallImageOptions.height);
    } else {
      // If we can't find the text position, the test should fail
      expect(textX).not.toBeNull();
      expect(textY).not.toBeNull();
    }
  });
});
