export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickUniform<T>(items: readonly T[], rng: Rng): T {
  if (items.length === 0) throw new Error('pickUniform: danh sách rỗng');
  return items[Math.floor(rng() * items.length)];
}

export function pickWeighted<T extends { weight: number }>(items: readonly T[], rng: Rng): T {
  if (items.length === 0) throw new Error('pickWeighted: danh sách rỗng');
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let r = rng() * total;
  for (const item of items) {
    r -= item.weight;
    if (r < 0) return item;
  }
  return items[items.length - 1];
}

export const SPECIAL_CHANCE = 0.1;

export function rollSpecial(specials: readonly { id: string; weight: number }[], rng: Rng): string | null {
  if (specials.length === 0) return null;
  return rng() < SPECIAL_CHANCE ? pickWeighted(specials, rng).id : null;
}
