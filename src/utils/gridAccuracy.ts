import type { Annotation, BoundingBox } from "./groundTruth.js";

/**
 * Converts a bounding box's normalized coordinates (0-1) to grid cells
 */
export const boundingBoxToGridCells = (
  box: BoundingBox,
  gridConfig: { rows: number; cols: number },
  threshold = 0.1 // Cell must be covered by at least this percentage to be included
): { cells: Set<string>; overlaps: Map<string, number> } => {
  const cells = new Set<string>();
  const overlaps = new Map<string, number>();

  // Convert to cell coordinates with threshold
  const cellWidth = 1 / gridConfig.cols;
  const cellHeight = 1 / gridConfig.rows;

  const startCol = Math.floor(box.xmin * gridConfig.cols);
  const endCol = Math.floor(box.xmax * gridConfig.cols);
  const startRow = Math.floor(box.ymin * gridConfig.rows);
  const endRow = Math.floor(box.ymax * gridConfig.rows);

  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      // Calculate how much of this cell is covered by the box
      const cellLeft = col * cellWidth;
      const cellRight = (col + 1) * cellWidth;
      const cellTop = row * cellHeight;
      const cellBottom = (row + 1) * cellHeight;

      const overlapX =
        Math.min(box.xmax, cellRight) - Math.max(box.xmin, cellLeft);
      const overlapY =
        Math.min(box.ymax, cellBottom) - Math.max(box.ymin, cellTop);
      const overlapArea = (overlapX * overlapY) / (cellWidth * cellHeight);

      // Only include cell if overlap exceeds threshold
      if (overlapArea >= threshold) {
        const cellId = String.fromCharCode(65 + row) + (col + 1);
        cells.add(cellId);
        overlaps.set(cellId, overlapArea);
      }
    }
  }

  return { cells, overlaps };
};

/**
 * Calculates accuracy metrics by comparing analysis results with ground truth
 */
export const calculateAccuracy = (
  analysis: { regions: { cells: string[] }[] },
  truthBoxes: Annotation[],
  gridConfig: { rows: number; cols: number }
) => {
  // Convert ground truth boxes to grid cells
  const truthCells = new Set<string>();
  truthBoxes.forEach(box => {
    const { cells: boxCells } = boundingBoxToGridCells(
      {
        xmin: parseFloat(box[4]),
        ymin: parseFloat(box[5]),
        xmax: parseFloat(box[6]),
        ymax: parseFloat(box[7]),
      },
      gridConfig
    );
    boxCells.forEach(cell => truthCells.add(cell));
  });

  // Get predicted cells
  const predictedCells = new Set<string>();
  analysis.regions.forEach(region => {
    region.cells.forEach(cell => predictedCells.add(cell));
  });

  const intersection = new Set(
    [...predictedCells].filter(cell => truthCells.has(cell))
  );
  const union = new Set([...predictedCells, ...truthCells]);

  const precision = predictedCells.size
    ? intersection.size / predictedCells.size
    : 0;
  const recall = truthCells.size ? intersection.size / truthCells.size : 0;
  const f1 =
    precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  const iou = union.size ? intersection.size / union.size : 0;

  return {
    precision,
    recall,
    f1,
    iou,
    truthCells: truthCells.size,
    predictedCells: predictedCells.size,
    matchingCells: intersection.size,
  };
};
