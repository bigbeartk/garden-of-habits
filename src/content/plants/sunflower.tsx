import { INK } from '../Face';
import type { PlantSpecies } from '../types';
import { LeafyStem, Seed, Sprout } from './parts';

const LEAF = '#9AD98F';
const STEM = '#7BBF6A';

function SunflowerSeed() {
  return <Seed color="#7A6655" stripe="#F3EDE4" />;
}
function SunflowerSprout() {
  return <Sprout leaf={LEAF} stem={STEM} />;
}
function SunflowerBud() {
  return (
    <g>
      <LeafyStem top={92} leaf={LEAF} stem={STEM} />
      {[0, 72, 144, 216, 288].map((a) => (
        <path key={a} d="M100 60 q6 8 0 12 q-6 -4 0 -12 z" fill="#FFD86B" stroke={INK} strokeWidth={1.5} transform={`rotate(${a} 100 84)`} />
      ))}
      <circle cx={100} cy={84} r={20} fill="#B7E3A1" stroke={INK} strokeWidth={2} />
    </g>
  );
}
function SunflowerBloom() {
  return (
    <g>
      <LeafyStem top={100} leaf={LEAF} stem={STEM} />
      {Array.from({ length: 12 }, (_, i) => i * 30).map((a) => (
        <ellipse key={a} cx={100} cy={46} rx={9} ry={17} fill="#FFD86B" stroke={INK} strokeWidth={1.5} transform={`rotate(${a} 100 78)`} />
      ))}
      <circle cx={100} cy={78} r={24} fill="#B5835A" stroke={INK} strokeWidth={2} />
    </g>
  );
}

export const sunflower: PlantSpecies = {
  id: 'sunflower',
  name: 'Hướng dương',
  defaultPotId: 'terracotta',
  stages: {
    seed: { svg: SunflowerSeed },
    sprout: { svg: SunflowerSprout },
    bud: { svg: SunflowerBud },
    bloom: { svg: SunflowerBloom },
  },
  faceAnchor: {
    seed: { x: 100, y: 149, scale: 0.55 },
    sprout: { x: 100, y: 122, scale: 0.6 },
    bud: { x: 100, y: 86, scale: 0.55 },
    bloom: { x: 100, y: 80, scale: 0.8 },
  },
  sayings: ['Hôm nay mình hướng về phía bạn nè! 🌻', 'Nắng lên rồi, mình cùng tỏa sáng nha ☀️'],
  praises: ['Bạn sáng chói như mặt trời luôn 🌻'],
  taps: ['Bạn là mặt trời của mình đó ☀️', 'Mình quay theo bạn nè 🌻'],
};
