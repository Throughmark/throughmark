import { describe, it, expect } from "vitest";

import { GridGenerator } from "./generator";
import type { GridDimensions } from "./types";

describe("GridGenerator", () => {
  const dimensions: GridDimensions = {
    width: 100,
    height: 100,
    cellWidth: 20,
    cellHeight: 20,
  };

  it("should generate grid with lines and labels by default", () => {
    const generator = new GridGenerator({
      rows: 5,
      cols: 5,
      visible: true,
      cellLabels: true,
    });

    const svg = generator.generateSVGGrid(dimensions, false);

    expect(svg).toContain("<line"); // Has grid lines
    expect(svg).toContain("<text"); // Has labels
    expect(svg).toContain("A1"); // Has correct label format
  });

  it("should hide grid lines when visible is false", () => {
    const generator = new GridGenerator({
      rows: 5,
      cols: 5,
      visible: false,
      cellLabels: true,
    });

    const svg = generator.generateSVGGrid(dimensions, false);

    expect(svg).not.toContain("<line");
    expect(svg).toContain("<text"); // Labels should still be visible
  });

  it("should hide labels when cellLabels is false", () => {
    const generator = new GridGenerator({
      rows: 5,
      cols: 5,
      visible: true,
      cellLabels: false,
    });

    const svg = generator.generateSVGGrid(dimensions, false);

    expect(svg).toContain("<line"); // Grid lines should be visible
    expect(svg).not.toContain("<text");
  });

  it("should include HTML-specific styles when isHTML is true", () => {
    const generator = new GridGenerator({
      rows: 5,
      cols: 5,
      visible: true,
      cellLabels: true,
    });

    const svg = generator.generateSVGGrid(dimensions, true);

    expect(svg).toContain('style="position: absolute;');
  });
});
