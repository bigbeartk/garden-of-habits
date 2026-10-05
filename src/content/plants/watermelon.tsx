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

// ---- Dáng mở khoá ----

/** Dưa khối vuông bo góc, sọc dọc */
function SquareMelon({ cx, cy, w, h }: { cx: number; cy: number; w: number; h: number }) {
  const x = cx - w / 2;
  const y = cy - h / 2;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={w * 0.16} fill="#86CC6E" stroke={INK} strokeWidth={2.2} />
      {[0.2, 0.4, 0.6, 0.8].map((k) => (
        <path key={k} d={`M${x + k * w} ${y + 3} q${(k - 0.5) * 6} ${h / 2 - 3} 0 ${h - 6}`} fill="none" stroke="#4E9A45" strokeWidth={4} strokeLinecap="round" />
      ))}
      <path d={`M${x + w * 0.12} ${y + h * 0.18} L${x + w * 0.32} ${y + h * 0.12}`} stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.6} />
      <path d={`M${cx} ${y} q2 -6 -2 -10 M${cx} ${y - 4} q6 -4 10 0`} fill="none" stroke={VINE} strokeWidth={2.4} strokeLinecap="round" />
    </g>
  );
}
function WatermelonSquareBud() {
  return (
    <g>
      <Vine />
      <MelonLeaf x={64} y={140} s={1.6} r={-24} />
      <MelonLeaf x={136} y={140} s={1.6} r={24} />
      <SquareMelon cx={100} cy={140} w={36} h={32} />
    </g>
  );
}
function WatermelonSquareBloom() {
  return (
    <g>
      <Vine />
      <MelonLeaf x={50} y={146} s={1.8} r={-40} />
      <MelonLeaf x={150} y={146} s={1.8} r={40} />
      <SquareMelon cx={100} cy={124} w={70} h={64} />
    </g>
  );
}

/** Dưa tí hon trong túi lưới, treo bằng dây từ điểm (x, top) */
function NetMelon({ x, y, r, top, net = true }: { x: number; y: number; r: number; top: number; net?: boolean }) {
  return (
    <g>
      <path d={`M${x} ${top} L${x} ${y - r}`} stroke="#C9A36B" strokeWidth={1.6} />
      <Melon cx={x} cy={y} rx={r} ry={r * 0.92} />
      {net && <g stroke="#E8D9B0" strokeWidth={1.2} fill="none">
        <path d={`M${x - r * 0.9} ${y - r * 0.3} Q${x} ${y + r * 0.3} ${x + r * 0.9} ${y - r * 0.3}`} />
        <path d={`M${x - r * 0.8} ${y + r * 0.4} Q${x} ${y + r * 0.9} ${x + r * 0.8} ${y + r * 0.4}`} />
        <path d={`M${x} ${y - r} L${x - r * 0.6} ${y + r * 0.8} M${x} ${y - r} L${x + r * 0.6} ${y + r * 0.8}`} />
      </g>}
    </g>
  );
}
/** Giàn thang gỗ dựng đứng, dây leo zigzag có lá */
function Trellis({ top }: { top: number }) {
  const rungs = Array.from({ length: Math.floor((150 - top) / 26) + 1 }, (_, i) => 150 - i * 26).filter((y) => y > top + 6);
  return (
    <g>
      <g stroke={INK} strokeWidth={6} strokeLinecap="round">
        <path d={`M56 162 L56 ${top} M144 162 L144 ${top}`} />
        {rungs.map((y) => <path key={y} d={`M56 ${y} L144 ${y}`} />)}
      </g>
      <g stroke="#C9A36B" strokeWidth={3} strokeLinecap="round">
        <path d={`M56 162 L56 ${top} M144 162 L144 ${top}`} />
        {rungs.map((y) => <path key={y} d={`M56 ${y} L144 ${y}`} />)}
      </g>
      <path d={`M100 160 C84 150 120 138 108 124 C96 110 76 108 86 92 C94 80 124 76 116 ${Math.max(top + 10, 60)}`} fill="none" stroke={VINE} strokeWidth={4} strokeLinecap="round" />
    </g>
  );
}
function WatermelonTrellisBud() {
  return (
    <g>
      <Trellis top={70} />
      <MelonLeaf x={108} y={126} s={1.2} r={30} />
      <MelonLeaf x={86} y={96} s={1.2} r={-30} />
      <g transform="translate(116 78)">
        {[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={0} cy={-5} r={3.4} fill="#FFE066" stroke={INK} strokeWidth={1} transform={`rotate(${a})`} />)}
        <circle r={2.4} fill="#F5A623" />
      </g>
      <NetMelon x={82} y={134} r={9} top={124} />
    </g>
  );
}
function WatermelonTrellisBloom() {
  return (
    <g>
      <Trellis top={30} />
      <MelonLeaf x={110} y={134} s={1.3} r={30} />
      <MelonLeaf x={80} y={104} s={1.3} r={-30} />
      <MelonLeaf x={134} y={84} s={1.2} r={40} />
      <NetMelon x={74} y={138} r={11} top={124} />
      <NetMelon x={126} y={114} r={11} top={98} />
      <NetMelon x={72} y={84} r={10} top={72} />
      <NetMelon x={100} y={52} r={20} top={30} net={false} />
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
  sayings: ['Dưa hấu mát lạnh chào bạn nè 🍉', 'Ngày nóng hay lạnh mình cũng mọng nước vì bạn!'],
  praises: ['Thưởng bạn một miếng dưa hấu mát rượi 🍉'],
  taps: ['Gõ thử nghe… chín rồi đó! 🍉', 'Mát lạnh như dưa hấu mùa hè 🍉'],
  styles: [
    {
      id: 'square',
      name: 'Vuông',
      unlockAt: 10,
      stages: { bud: { svg: WatermelonSquareBud }, bloom: { svg: WatermelonSquareBloom } },
      faceAnchor: { bud: { x: 100, y: 142, scale: 0.45 }, bloom: { x: 100, y: 128, scale: 0.85 } },
    },
    {
      id: 'trellis',
      name: 'Giàn leo',
      unlockAt: 20,
      stages: { bud: { svg: WatermelonTrellisBud }, bloom: { svg: WatermelonTrellisBloom } },
      faceAnchor: { bud: { x: 82, y: 135, scale: 0.26 }, bloom: { x: 100, y: 54, scale: 0.58 } },
    },
  ],
};
