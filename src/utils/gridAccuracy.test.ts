import { describe, it, expect } from "vitest";

import { boundingBoxToGridCells, calculateAccuracy } from "./gridAccuracy.js";
import type { Annotation } from "./groundTruth.js";

describe("gridAccuracy", () => {
  describe("boundingBoxToGridCells", () => {
    it("should convert bounding box to grid cells", () => {
      const box = {
        xmin: 0.2, // Maps to column B (20% into grid)
        ymin: 0.2, // Maps to row B (20% into grid)
        xmax: 0.4, // Maps to column C (40% into grid)
        ymax: 0.4, // Maps to row C (40% into grid)
      };
      const gridConfig = { rows: 6, cols: 6 };

      const cells = boundingBoxToGridCells(box, gridConfig);
      const cellArray = [...cells.cells];

      // Check we're getting cells in the right columns (B-C)
      expect(
        cellArray.every(cell => cell.startsWith("B") || cell.startsWith("C"))
      ).toBe(true);

      // Check we're getting cells in the right row range (2-4)
      expect(
        cellArray.every(cell => {
          const row = parseInt(cell.slice(1));
          return row >= 2 && row <= 4;
        })
      ).toBe(true);

      // Check we have a reasonable number of cells
      expect(cellArray.length).toBe(4); // B2,B3,C2,C3 for a 2x2 box
    });

    it("should convert vertical bounding box to vertical grid cells", () => {
      const box = {
        xmin: 0.4, // Should map to column 3
        ymin: 0.2, // Should map to row B
        xmax: 0.45, // Still column 3
        ymax: 0.7, // Should map to row F
      };
      const gridConfig = { rows: 8, cols: 6 };

      const cells = boundingBoxToGridCells(box, gridConfig);
      const cellArray = [...cells.cells];

      // For a vertical box around x=0.4, y=0.2-0.8 in an 8x6 grid
      // Should get cells in column 3 (xmin=0.35 * 6 ≈ 2)
      // From row B to F (ymin=0.2 * 8 ≈ 1.6, ymax=0.8 * 8 ≈ 6.4)
      expect(cellArray).toEqual(["B3", "C3", "D3", "E3", "F3"]);
    });

    it("should convert horizontal bounding box to horizontal grid cells", () => {
      const box = {
        xmin: 0.25, // Maps to column 2
        ymin: 0.45, // Maps to row D only
        xmax: 0.75, // Maps to column 5
        ymax: 0.49, // Stay within row D
      };
      const gridConfig = { rows: 8, cols: 6 };

      const cells = boundingBoxToGridCells(box, gridConfig);
      const cellArray = [...cells.cells];

      // For a horizontal box around y=0.4, x=0.2-0.8 in an 8x6 grid
      // Should get cells in row D (ymin=0.35 * 8 ≈ 2.8)
      // From column 2 to 5 (xmin=0.2 * 6 ≈ 1.2, xmax=0.8 * 6 ≈ 4.8)
      expect(cellArray).toEqual(["D2", "D3", "D4", "D5"]);
    });
  });

  describe("calculateAccuracy", () => {
    it("should calculate accuracy metrics", () => {
      const analysis = {
        regions: [{ cells: ["B2", "B3", "C2", "C3"] }],
      };
      const truthBoxes = [
        ["test", "source", "class", "1", "0.2", "0.3", "0.4", "0.7"],
      ] as Annotation[];
      const gridConfig = { rows: 6, cols: 6 };

      const metrics = calculateAccuracy(analysis, truthBoxes, gridConfig);

      expect(metrics.precision).toBeGreaterThan(0);
      expect(metrics.recall).toBeGreaterThan(0);
      expect(metrics.truthCells).toBeGreaterThan(0);
      expect(metrics.predictedCells).toBe(4);
    });
  });
});
