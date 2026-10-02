import { INK } from '../Face';
import type { PlantSpecies } from '../types';
import { LeafyStem, Seed, Sprout } from './parts';

const LEAF = '#A8DD8C';
const STEM = '#86C46E';

function Blades() {
  return (
    <g fill={LEAF} stroke={INK} strokeWidth={2}>
      <path d="M100 150 Q60 120 40 136 Q70 132 100 156 Z" />
      <path d="M100 140 Q140 106 162 120 Q132 120 100 146 Z" />
    </g>
  );
}

function Kernels() {
  const dots: [number, number][] = [];
  for (let y = 74; y <= 122; y += 8) {
    for (const x of [-8, 0, 8]) {
      if ((x / 15) ** 2 + ((y - 98) / 29) ** 2 < 1) dots.push([100 + x, y]);
    }
  }
  return <g fill="#F7C948">{dots.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={2.6} />)}</g>;
}

function CornSeed() {
  return <Seed color="#FFD45C" />;
}
function CornSprout() {
  return <Sprout leaf={LEAF} stem={STEM} />;
}
function CornBud() {
  return (
    <g>
      <LeafyStem top={76} leaf={LEAF} stem={STEM} />
      <Blades />
      <ellipse cx={100} cy={98} rx={13} ry={22} fill="#B7E3A1" stroke={INK} strokeWidth={2} />
      <path d="M100 76 L94 62 M100 76 L100 60 M100 76 L106 62" stroke="#D9B26A" strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}
function CornBloom() {
  return (
    <g>
      <LeafyStem top={70} leaf={LEAF} stem={STEM} />
      <Blades />
      <ellipse cx={100} cy={98} rx={18} ry={32} fill="#FFE08A" stroke={INK} strokeWidth={2} />
      <Kernels />
      <path d="M82 112 Q76 82 92 70 Q88 96 96 128 Z" fill={LEAF} stroke={INK} strokeWidth={2} />
      <path d="M118 112 Q124 82 108 70 Q112 96 104 128 Z" fill={LEAF} stroke={INK} strokeWidth={2} />
      <path d="M100 66 L90 48 M100 66 L100 44 M100 66 L110 48" stroke="#D9B26A" strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );
}

export const corn: PlantSpecies = {
  id: 'corn',
  name: 'Ngô',
  defaultPotId: 'rattan',
  stages: {
    seed: { svg: CornSeed },
    sprout: { svg: CornSprout },
    bud: { svg: CornBud },
    bloom: { svg: CornBloom },
  },
  faceAnchor: {
    seed: { x: 100, y: 149, scale: 0.55 },
    sprout: { x: 100, y: 122, scale: 0.6 },
    bud: { x: 100, y: 100, scale: 0.45 },
    bloom: { x: 100, y: 100, scale: 0.6 },
  },
  greetings: ['Bắp nè, bắp nè! Hôm nay mình làm gì đây? 🌽', 'Mỗi việc xong là một hạt ngô vàng ươm đó!'],
};
