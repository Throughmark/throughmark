import { describe, it, expect } from "vitest";

import { formatAccuracyMetrics, calculateOverallAccuracy } from "./metrics.js";

describe("formatAccuracyMetrics", () => {
  it("should format metrics correctly", () => {
    const accuracy = {
      foundCells: ["A1", "B2"],
      missedCells: ["C3"],
      extraCells: ["D4"],
      recall: 0.667,
      precision: 0.5,
    };

    const formatted = formatAccuracyMetrics(accuracy);

    expect(formatted).toEqual([
      "Found cells: A1, B2",
      "Missed cells: C3",
      "Extra cells: D4",
      "Recall: 66.7% (percent of actual features found)",
      "Precision: 50.0% (percent of our predictions correct)",
    ]);
  });

  it("should handle empty arrays", () => {
    const accuracy = {
      foundCells: [],
      missedCells: [],
      extraCells: [],
      recall: 0,
      precision: 0,
    };

    const formatted = formatAccuracyMetrics(accuracy);

    expect(formatted).toEqual([
      "Found cells: ",
      "Missed cells: ",
      "Extra cells: ",
      "Recall: 0.0% (percent of actual features found)",
      "Precision: 0.0% (percent of our predictions correct)",
    ]);
  });
});

describe("calculateOverallAccuracy", () => {
  it("should calculate overall accuracy across multiple analyses", () => {
    const analyses = [
      {
        truth: ["A1", "B1", "C1"],
        found: ["A1", "B1", "D1"],
      },
      {
        truth: ["D4", "E4"],
        found: ["D4", "F4"],
      },
    ];

    const overall = calculateOverallAccuracy(analyses);

    // Test cell sets
    expect(overall.foundCells).toEqual(
      expect.arrayContaining(["A1", "B1", "D4"])
    );
    expect(overall.missedCells).toEqual(expect.arrayContaining(["C1", "E4"]));
    expect(overall.extraCells).toEqual(expect.arrayContaining(["D1", "F4"]));

    // Test metrics are reasonable
    expect(overall.recall).toBeGreaterThan(0);
    expect(overall.recall).toBeLessThanOrEqual(1);
    expect(overall.precision).toBeGreaterThan(0);
    expect(overall.precision).toBeLessThanOrEqual(1);

    // Test relationship between found cells and metrics
    expect(overall.recall).toBe(
      overall.foundCells.length / analyses.flatMap(a => a.truth).length
    );
    expect(overall.precision).toBe(
      overall.foundCells.length / analyses.flatMap(a => a.found).length
    );
  });

  it("should handle no matches across analyses", () => {
    const analyses = [
      {
        truth: ["A1", "B1"],
        found: ["C1", "D1"],
      },
      {
        truth: ["E4", "F4"],
        found: ["G4", "H4"],
      },
    ];

    const overall = calculateOverallAccuracy(analyses);

    expect(overall.foundCells).toEqual([]);
    expect(overall.missedCells).toEqual(["A1", "B1", "E4", "F4"]);
    expect(overall.extraCells).toEqual(["C1", "D1", "G4", "H4"]);
    expect(overall.recall).toBe(0);
    expect(overall.precision).toBe(0);
  });

  it("should calculate accuracy per-image", () => {
    const analyses = [
      {
        truth: ["A1", "B1"],
        found: ["A1", "C1"], // 1 correct, 1 missed, 1 extra
      },
      {
        truth: ["A1", "B1"], // Different image with same cells
        found: ["C1", "D1"], // 0 correct, 2 missed, 2 extra
      },
    ];

    const overall = calculateOverallAccuracy(analyses);

    // Should only count matches within same image
    expect(overall.foundCells).toEqual(["A1"]); // Only the match from first image
    expect(overall.missedCells).toEqual(["B1", "A1", "B1"]); // All missed cells
    expect(overall.extraCells).toEqual(["C1", "C1", "D1"]); // All extra predictions

    // Total true cells: 4 (2+2), Found correct: 1
    expect(overall.recall).toBe(1 / 4);
    // Total predictions: 4 (2+2), Correct: 1
    expect(overall.precision).toBe(1 / 4);
  });
});
