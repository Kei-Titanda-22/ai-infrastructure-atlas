export type FinancialPeriodLabelBounds = {
  left: number;
  right: number;
};

export type FinancialPeriodLabelLayout = {
  visibleIndexes: number[];
  staggerEndpoints: boolean;
};

// Bounds are measured from the rendered SVG text, after its font and anchors are applied.
export function layoutFinancialPeriodLabels(
  bounds: FinancialPeriodLabelBounds[],
  minimumGap = 4,
): FinancialPeriodLabelLayout {
  if (bounds.length === 0) return { visibleIndexes: [], staggerEndpoints: false };
  if (bounds.length === 1) return { visibleIndexes: [0], staggerEndpoints: false };

  const finalIndex = bounds.length - 1;
  if (bounds[0].right + minimumGap > bounds[finalIndex].left) {
    return { visibleIndexes: [0, finalIndex], staggerEndpoints: true };
  }
  const selected = [0];
  for (let index = 1; index < finalIndex; index += 1) {
    const previous = bounds[selected[selected.length - 1]];
    const current = bounds[index];
    if (current.left >= previous.right + minimumGap
      && current.right + minimumGap <= bounds[finalIndex].left) {
      selected.push(index);
    }
  }
  selected.push(finalIndex);
  return { visibleIndexes: selected, staggerEndpoints: false };
}
