import { INK } from '../Face';
import type { PlantSpecies } from '../types';
import { Seed, Sprout } from './parts';

const LEAF = '#8DD07F';
const VINE = '#6FAE62';

/** Lá dưa hấu: to, xẻ thuỳ tròn */
function MelonLeaf({ x, y, s = 1, r = 0 }: { x: number; y: number; s?: number; r?: number }) {
  return (
    <path
      d="M0 0 C -10 -4 -16 -14 -10 -20 C -6 -24 -2 -20 0 -16 C 2 -22 8 -24 12 -18 C 16 -12 10 -4 0 0 Z"
      fill={LEAF}
      stroke={INK}
      strokeWidth={1.8}
      transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}
    />
  );
}

function Vine({ big }: { big?: boolean }) {
  return (
    <g>
      <path d={big ? 'M100 160 Q 70 150 56 132 Q 48 120 58 112' : 'M100 160 Q 80 150 72 136'} fill="none" stroke={VINE} strokeWidth={5} strokeLinecap="round" />
      <path d={big ? 'M100 160 Q 132 150 146 130 Q 152 118 142 112' : 'M100 160 Q 120 148 128 134'} fill="none" stroke={VINE} strokeWidth={5} strokeLinecap="round" />
      <path d="M138 112 q8 -6 4 -12 q-5 -4 -8 2" fill="none" stroke={VINE} strokeWidth={2.4} strokeLinecap="round" />
    </g>
  );
}

function Melon({ cx, cy, rx, ry }: { cx: number; cy: number; rx: number; ry: number }) {
  const stripes = [-0.6, -0.2, 0.2, 0.6];
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#86CC6E" stroke={INK} strokeWidth={2} />
      {stripes.map((k) => (
        <path
          key={k}
          d={`M${cx + k * rx} ${cy - ry + 3} q ${k * 6 + 4} ${ry} 0 ${2 * ry - 6}`}
          fill="none"
          stroke="#4E9A45"
          strokeWidth={4}
          strokeLinecap="round"
        />
      ))}
      <ellipse cx={cx - rx * 0.45} cy={cy - ry * 0.5} rx={rx * 0.18} ry={ry * 0.12} fill="#fff" opacity={0.45} />
    </g>
  );
}

function WatermelonSeed() {
  return <Seed color="#7A5C4A" />;
}
function WatermelonSprout() {
  return <Sprout leaf={LEAF} stem={VINE} />;
}
function WatermelonBud() {
  return (
    <g>
      <Vine />
      <MelonLeaf x={68} y={138} s={1.6} r={-20} />
      <MelonLeaf x={132} y={136} s={1.6} r={20} />
      <g transform="translate(76 114)">
        {[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={0} cy={-5} r={3.4} fill="#FFE066" stroke={INK} strokeWidth={1} transform={`rotate(${a})`} />)}
        <circle r={2.4} fill="#F5A623" />
      </g>
      <Melon cx={100} cy={142} rx={17} ry={14} />
    </g>
  );
}
function WatermelonBloom() {
  return (
    <g>
      <Vine big />
      <MelonLeaf x={52} y={126} s={1.8} r={-30} />
      <MelonLeaf x={150} y={124} s={1.8} r={30} />
      <MelonLeaf x={84} y={104} s={1.5} r={-10} />
      <Melon cx={100} cy={126} rx={36} ry={28} />
    </g>
  );
}

export const watermelon: PlantSpecies = {
  id: 'watermelon',
  name: 'Dưa hấu',
  defaultPotId: 'tin-bucket',
  stages: {
    seed: { svg: WatermelonSeed },
    sprout: { svg: WatermelonSprout },
    bud: { svg: WatermelonBud },
    bloom: { svg: WatermelonBloom },
  },
  faceAnchor: {
    seed: { x: 100, y: 149, scale: 0.55 },
    sprout: { x: 100, y: 122, scale: 0.6 },
    bud: { x: 100, y: 144, scale: 0.45 },
    bloom: { x: 100, y: 130, scale: 0.85 },
  },
  greetings: ['Dưa hấu mát lạnh chào bạn nè 🍉', 'Ngày nóng hay lạnh mình cũng mọng nước vì bạn!'],
  praises: ['Thưởng bạn một miếng dưa hấu mát rượi 🍉'],
};
