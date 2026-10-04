import { INK } from '../Face';
import type { PlantSpecies } from '../types';
import { Seed } from './parts';

const BODY = '#9ED9A0';
const SPINE = '#5B8F5E';

function Spines({ points }: { points: [number, number][] }) {
  return (
    <g stroke={SPINE} strokeWidth={1.6} strokeLinecap="round">
      {points.map(([x, y]) => <path key={`${x}-${y}`} d={`M${x - 3} ${y} l6 0 M${x} ${y - 3} l0 6`} />)}
    </g>
  );
}

function Column() {
  return (
    <g>
      <path d="M78 130 Q58 128 60 104 Q62 94 70 96 Q72 112 80 116 Z" fill={BODY} stroke={INK} strokeWidth={2} />
      <path d="M122 120 Q142 118 140 94 Q138 84 130 86 Q128 102 120 106 Z" fill={BODY} stroke={INK} strokeWidth={2} />
      <rect x={76} y={78} width={48} height={86} rx={24} fill={BODY} stroke={INK} strokeWidth={2} />
      <Spines points={[[84, 96], [116, 100], [86, 140], [114, 146], [100, 156]]} />
    </g>
  );
}

function CactusSeed() {
  return <Seed color="#4F4038" />;
}
function CactusSprout() {
  return (
    <g>
      <circle cx={100} cy={140} r={20} fill={BODY} stroke={INK} strokeWidth={2} />
      <Spines points={[[86, 132], [114, 132], [100, 124]]} />
    </g>
  );
}
function CactusBud() {
  return (
    <g>
      <Column />
      <circle cx={100} cy={76} r={7} fill="#FFB8CF" stroke={INK} strokeWidth={2} />
    </g>
  );
}
function CactusBloom() {
  return (
    <g>
      <Column />
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={100} cy={62} rx={7} ry={11} fill="#FF9FC0" stroke={INK} strokeWidth={1.5} transform={`rotate(${a} 100 72)`} />
      ))}
      <circle cx={100} cy={72} r={6} fill="#FFE066" stroke={INK} strokeWidth={1.5} />
    </g>
  );
}

export const cactus: PlantSpecies = {
  id: 'cactus',
  name: 'Xương rồng',
  defaultPotId: 'pink-cup',
  stages: {
    seed: { svg: CactusSeed },
    sprout: { svg: CactusSprout },
    bud: { svg: CactusBud },
    bloom: { svg: CactusBloom },
  },
  faceAnchor: {
    seed: { x: 100, y: 149, scale: 0.55 },
    sprout: { x: 100, y: 143, scale: 0.55 },
    bud: { x: 100, y: 118, scale: 0.75 },
    bloom: { x: 100, y: 118, scale: 0.75 },
  },
  sayings: ['Mình ít uống nước thôi, nhưng thích bạn làm việc lắm 🌵', 'Gai góc bên ngoài, mềm mại bên trong nha!'],
  praises: ['Kiên trì như xương rồng, giỏi lắm! 🌵'],
  taps: ['Cẩn thận gai nha! 🌵', 'Ngoài gai nhưng trong mềm lắm á 💚'],
};
