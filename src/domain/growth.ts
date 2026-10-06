export const GROWTH_STAGES = ['seed', 'sprout', 'bud', 'bloom'] as const;
export type GrowthStage = (typeof GROWTH_STAGES)[number];

/** bud: tỉ lệ tối thiểu để ra chồi; bloom: tỉ lệ để ra hoa. Nảy mầm khi xong ≥ 1 việc. */
export const GROWTH_THRESHOLDS = { bud: 0.5, bloom: 1 } as const;

export function stageFor(done: number, total: number): GrowthStage {
  if (total <= 0 || done <= 0) return 'seed';
  const ratio = done / total;
  if (ratio >= GROWTH_THRESHOLDS.bloom) return 'bloom';
  if (ratio >= GROWTH_THRESHOLDS.bud) return 'bud';
  return 'sprout';
}

export function stageOfTodos(todos: readonly { done: boolean }[]): GrowthStage {
  return stageFor(todos.filter((t) => t.done).length, todos.length);
}

export function stageIndex(stage: GrowthStage): number {
  return GROWTH_STAGES.indexOf(stage);
}
