export interface AccuracyMetrics {
  foundCells: string[];
  missedCells: string[];
  extraCells: string[];
  recall: number;
  precision: number;
}

export function calculateOverallAccuracy(
  analyses: Array<{
    truth: string[];
    found: string[];
  }>
): AccuracyMetrics {
  // Calculate correct cells per image first
  const correctPerImage = analyses.map(analysis => {
    const truthSet = new Set(analysis.truth);
    const foundSet = new Set(analysis.found);
    return {
      correct: analysis.found.filter(cell => truthSet.has(cell)),
      missed: analysis.truth.filter(cell => !foundSet.has(cell)),
      extra: analysis.found.filter(cell => !truthSet.has(cell)),
    };
  });

  // Then combine results
  const foundCells = correctPerImage.flatMap(result => result.correct);
  const missedCells = correctPerImage.flatMap(result => result.missed);
  const extraCells = correctPerImage.flatMap(result => result.extra);

  const totalTrueCells = analyses.reduce((sum, a) => sum + a.truth.length, 0);
  const totalFoundCells = analyses.reduce((sum, a) => sum + a.found.length, 0);

  return {
    foundCells,
    missedCells,
    extraCells,
    recall: totalTrueCells > 0 ? foundCells.length / totalTrueCells : 0,
    precision: totalFoundCells > 0 ? foundCells.length / totalFoundCells : 0,
  };
}

export function formatAccuracyMetrics(accuracy: {
  foundCells: string[];
  missedCells: string[];
  extraCells: string[];
  recall: number;
  precision: number;
}): string[] {
  return [
    `Found cells: ${accuracy.foundCells.join(", ")}`,
    `Missed cells: ${accuracy.missedCells.join(", ")}`,
    `Extra cells: ${accuracy.extraCells.join(", ")}`,
    `Recall: ${(accuracy.recall * 100).toFixed(
      1
    )}% (percent of actual features found)`,
    `Precision: ${(accuracy.precision * 100).toFixed(
      1
    )}% (percent of our predictions correct)`,
  ];
}
