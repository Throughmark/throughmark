import { describe, it, expect } from "vitest";

import { GridCalculator } from "./calculator";

describe("GridCalculator", () => {
  describe("auto calculation", () => {
    it("should calculate reasonable grid dimensions", () => {
      const calculator = new GridCalculator();
      const dimensions = calculator.calculateDimensions(1024, 683);

      // Grid should be reasonable
      expect(calculator.currentConfig.cols).toBeGreaterThan(0);
      expect(calculator.currentConfig.rows).toBeGreaterThan(0);
      expect(calculator.currentConfig.cols).toBeLessThanOrEqual(26);
      expect(calculator.currentConfig.rows).toBeLessThanOrEqual(26);

      // Cells should have positive dimensions
      expect(dimensions.cellWidth).toBeGreaterThan(0);
      expect(dimensions.cellHeight).toBeGreaterThan(0);
    });

    it("should respect size constraints", () => {
      const calculator = new GridCalculator();

      // Small image should still have cells
      const smallDims = calculator.calculateDimensions(100, 100);
      expect(calculator.currentConfig.cols).toBeGreaterThan(0);
      expect(calculator.currentConfig.rows).toBeGreaterThan(0);

      // Large image should not exceed max
      const largeDims = calculator.calculateDimensions(2000, 2000);
      expect(calculator.currentConfig.cols).toBeLessThanOrEqual(26);
      expect(calculator.currentConfig.rows).toBeLessThanOrEqual(26);
    });
  });

  describe("manual configuration", () => {
    it("should use provided grid dimensions", () => {
      const calculator = new GridCalculator({ rows: 7, cols: 8 });
      const dimensions = calculator.calculateDimensions(1024, 683);

      expect(calculator.currentConfig.cols).toBe(8);
      expect(calculator.currentConfig.rows).toBe(7);
      expect(dimensions.cellWidth).toBeGreaterThan(0);
      expect(dimensions.cellHeight).toBeGreaterThan(0);
    });
  });

  it("should handle custom cell size", () => {
    const calculator = new GridCalculator({ minCellSize: 300 });
    const dimensions = calculator.calculateDimensions(1000, 1000);

    // Grid should be valid
    expect(calculator.currentConfig.cols).toBeGreaterThan(0);
    expect(calculator.currentConfig.rows).toBeGreaterThan(0);
    expect(calculator.currentConfig.cols).toBeLessThanOrEqual(26);
    expect(calculator.currentConfig.rows).toBeLessThanOrEqual(26);
  });
});
