import type { ReactNode } from 'react';
import { INK } from '../Face';
import type { PlantSpecies } from '../types';
import { Seed, Sprout } from './parts';

/**
 * Cây cam: dáng cây kiểng "cây kẹo mút" — thân thẳng mảnh, một khối cầu lá xanh đậm bóng
 * với lá nhọn chĩa ra ở mép. Khác hẳn tán mây tròn nhiều cục của cây khác và dáng dù của cherry.
 */
const LEAF = '#4FA65B';
const LEAF_LIGHT = '#8FD497';
const BALL = { x: 100, y: 76, r: 38 };

function Stem() {
  return (
    <g>
      <path d="M97 160 L98 108 L102 108 L103 160 Z" fill="#9C6B45" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      {/* cành nhỏ chĩa ngang */}
      <path d="M101 132 Q112 126 116 118" fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
      <path d="M101 132 Q112 126 116 118" fill="none" stroke="#9C6B45" strokeWidth={2} strokeLinecap="round" />
      <path d="M116 118 q8 -6 12 2 q-8 4 -12 -2 Z" fill={LEAF} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
    </g>
  );
}

/** Khối cầu lá: viền nhọn lá cam quanh mép + vệt bóng sáng. */
function LeafBall() {
  const tips = Array.from({ length: 12 }, (_, i) => (i * 360) / 12);
  return (
    <g data-part="orange-ball">
      {tips.map((a) => (
        <path
          key={a}
          d={`M${BALL.x - 7} ${BALL.y - BALL.r + 6} Q${BALL.x} ${BALL.y - BALL.r - 12} ${BALL.x + 7} ${BALL.y - BALL.r + 6} Z`}
          fill={LEAF}
          stroke={INK}
          strokeWidth={2}
          strokeLinejoin="round"
          transform={`rotate(${a} ${BALL.x} ${BALL.y})`}
        />
      ))}
      <circle cx={BALL.x} cy={BALL.y} r={BALL.r} fill={LEAF} stroke={INK} strokeWidth={3} />
      <path d={`M${BALL.x - 26} ${BALL.y - 12} Q${BALL.x - 20} ${BALL.y - 30} ${BALL.x - 2} ${BALL.y - 33}`} fill="none" stroke={LEAF_LIGHT} strokeWidth={5} strokeLinecap="round" />
      {/* gân lá nhỏ rải trên khối cầu */}
      {[[74, 92, -30], [126, 92, 30], [118, 54, 20], [82, 56, -20]].map(([x, y, r]) => (
        <path key={`${x}-${y}`} d={`M${x - 5} ${y} q5 -4 10 0`} fill="none" stroke="#3E8A4A" strokeWidth={1.6} strokeLinecap="round" transform={`rotate(${r} ${x} ${y})`} />
      ))}
    </g>
  );
}

function Blossom({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx={0} cy={-3.5} rx={2.2} ry={3.4} fill="#FFFFFF" stroke={INK} strokeWidth={0.8} transform={`rotate(${a})`} />)}
      <circle r={1.8} fill="#FFD34D" />
    </g>
  );
}

function Orange({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={10.5} fill="#FFA43A" stroke={INK} strokeWidth={2} />
      <circle cx={x - 3.5} cy={y - 3.5} r={2.6} fill="#FFD9A0" />
      {[[2, 3], [5, -1], [-1, 5]].map(([dx, dy]) => <circle key={`${dx}${dy}`} cx={x + dx} cy={y + dy} r={0.8} fill="#E07F1A" />)}
      <path d={`M${x} ${y - 10} q5 -7 11 -4 q-5 6 -11 4 Z`} fill={LEAF} stroke={INK} strokeWidth={1.3} strokeLinejoin="round" />
    </g>
  );
}

function OrangeSeed() {
  return <Seed color="#F3E3B5" stripe="#E2C98A" />;
}
function OrangeSprout() {
  return <Sprout leaf={LEAF} stem="#6FAE5F" />;
}
function OrangeBud() {
  return (
    <g>
      <Stem />
      <LeafBall />
      {[[74, 66], [128, 70], [104, 46], [118, 100], [80, 102]].map(([x, y]) => <Blossom key={`${x}-${y}`} x={x} y={y} />)}
    </g>
  );
}
function OrangeBloom() {
  return (
    <g>
      <Stem />
      <LeafBall />
      {[[104, 44], [76, 60], [130, 64]].map(([x, y]) => <Blossom key={`${x}-${y}`} x={x} y={y} />)}
      <Orange x={70} y={96} />
      <Orange x={131} y={98} />
      <Orange x={112} y={112} />
      <Orange x={84} y={114} />
    </g>
  );
}

// ---- Dáng mở khoá ----

const BARK = '#9C6B45';

/** Một tầng tán tỉa: khối bầu dục có mép lá nhọn ở viền dưới */
function Tier({ y, rx, ry }: { y: number; rx: number; ry: number }) {
  const n = Math.round(rx / 9);
  return (
    <g>
      {Array.from({ length: n }, (_, i) => 100 - rx + 8 + (i * (rx * 2 - 16)) / (n - 1)).map((x) => (
        <path key={x} d={`M${x - 6} ${y + ry * 0.7} Q${x} ${y + ry + 9} ${x + 6} ${y + ry * 0.7} Z`} fill={LEAF} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
      ))}
      <ellipse cx={100} cy={y} rx={rx} ry={ry} fill={LEAF} stroke={INK} strokeWidth={2.4} />
      <path d={`M${100 - rx * 0.6} ${y - ry * 0.3} Q${100 - rx * 0.3} ${y - ry * 0.8} ${100} ${y - ry * 0.85}`} fill="none" stroke={LEAF_LIGHT} strokeWidth={3.5} strokeLinecap="round" />
    </g>
  );
}
function Kumquat({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <ellipse cx={x} cy={y} rx={5} ry={5.6} fill="#FF9F2E" stroke={INK} strokeWidth={1.5} />
      <circle cx={x - 1.6} cy={y - 2} r={1.3} fill="#FFD9A0" />
    </g>
  );
}
/** Bao lì xì đỏ treo trên cành */
function RedEnvelope({ x, y, r = 0 }: { x: number; y: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <path d="M0 -8 L0 0" stroke="#D9A400" strokeWidth={1.2} />
      <rect x={-5.5} y={0} width={11} height={15} rx={1.5} fill="#E5484D" stroke={INK} strokeWidth={1.4} />
      <circle cx={0} cy={6.5} r={2.6} fill="#FFD34D" />
    </g>
  );
}
const KUMQUAT_TIERS = [
  { y: 128, rx: 48, ry: 17 },
  { y: 98, rx: 38, ry: 16 },
  { y: 70, rx: 27, ry: 14 },
  { y: 48, rx: 15, ry: 10 },
];
function KumquatTree({ children }: { children?: ReactNode }) {
  return (
    <g>
      <path d="M97 160 L98 140 L102 140 L103 160 Z" fill={BARK} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      {KUMQUAT_TIERS.map((t) => <Tier key={t.y} {...t} />)}
      {children}
    </g>
  );
}
function OrangeKumquatBud() {
  return (
    <KumquatTree>
      {[[70, 126], [126, 130], [84, 100], [118, 96], [96, 66], [104, 48]].map(([x, y]) => <Blossom key={`${x}-${y}`} x={x} y={y} />)}
    </KumquatTree>
  );
}
function OrangeKumquatBloom() {
  return (
    <KumquatTree>
      {[[60, 130], [74, 136], [130, 128], [142, 132], [116, 138], [70, 104], [128, 104], [118, 92], [80, 76], [118, 74], [96, 52], [106, 46]].map(([x, y]) => (
        <Kumquat key={`${x}-${y}`} x={x} y={y} />
      ))}
      <RedEnvelope x={56} y={140} r={-8} />
      <RedEnvelope x={146} y={112} r={8} />
      <RedEnvelope x={66} y={84} r={-6} />
    </KumquatTree>
  );
}

/** Tán mây dẹt kiểu bonsai: bầu dục dẹt có mép trên lượn sóng */
function Pad({ x, y, rx, ry }: { x: number; y: number; rx: number; ry: number }) {
  const bumps = [-0.6, -0.2, 0.2, 0.6];
  return (
    <g>
      {bumps.map((k) => <circle key={k} cx={x + k * rx} cy={y - ry * 0.55} r={ry * 0.75} fill={LEAF} stroke={INK} strokeWidth={2} />)}
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={LEAF} stroke={INK} strokeWidth={2.2} />
      {bumps.map((k) => <circle key={`f${k}`} cx={x + k * rx} cy={y - ry * 0.5} r={ry * 0.62} fill={LEAF} />)}
      <path d={`M${x - rx * 0.6} ${y - ry * 0.6} q${rx * 0.3} -${ry * 0.5} ${rx * 0.6} -${ry * 0.3}`} fill="none" stroke={LEAF_LIGHT} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
}
/** Thân bonsai xoắn nghiêng, có hai cành chìa ra đỡ tán */
function BonsaiTrunk({ top }: { top: number }) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={`M92 160 C80 140 128 128 112 108 C100 92 82 86 96 ${top}`} stroke={INK} strokeWidth={13} />
      <path d={`M92 160 C80 140 128 128 112 108 C100 92 82 86 96 ${top}`} stroke={BARK} strokeWidth={9} />
      <path d="M112 112 Q130 100 138 84" stroke={INK} strokeWidth={8} />
      <path d="M112 112 Q130 100 138 84" stroke={BARK} strokeWidth={4.5} />
      <path d="M98 94 Q78 96 66 104" stroke={INK} strokeWidth={8} />
      <path d="M98 94 Q78 96 66 104" stroke={BARK} strokeWidth={4.5} />
      <path d="M96 146 q6 -6 12 -8 M104 102 q-4 -6 -4 -12" stroke="#7A5233" strokeWidth={1.6} />
    </g>
  );
}
function OrangeBonsaiBud() {
  return (
    <g>
      <BonsaiTrunk top={70} />
      <Pad x={138} y={84} rx={22} ry={9} />
      <Pad x={64} y={104} rx={20} ry={8} />
      <Pad x={96} y={64} rx={22} ry={10} />
      <Blossom x={130} y={78} />
      <Blossom x={60} y={98} />
    </g>
  );
}
function OrangeBonsaiBloom() {
  return (
    <g>
      <BonsaiTrunk top={60} />
      <Pad x={140} y={80} rx={32} ry={12} />
      <Pad x={60} y={102} rx={28} ry={11} />
      <Pad x={96} y={54} rx={30} ry={13} />
      <Orange x={150} y={98} />
      <Orange x={52} y={120} />
      <Orange x={74} y={118} />
    </g>
  );
}

export const orange: PlantSpecies = {
  id: 'orange',
  name: { vi: 'Cây cam', en: 'Orange tree' },
  defaultPotId: 'wood',
  stages: {
    seed: { svg: OrangeSeed },
    sprout: { svg: OrangeSprout },
    bud: { svg: OrangeBud },
    bloom: { svg: OrangeBloom },
  },
  faceAnchor: {
    seed: { x: 100, y: 149, scale: 0.55 },
    sprout: { x: 100, y: 122, scale: 0.6 },
    bud: { x: 100, y: 78, scale: 0.72 },
    bloom: { x: 100, y: 78, scale: 0.72 },
  },
  sayings: {
    vi: ['Vitamin C cho ngày mới nè! 🍊', 'Làm xong việc là có cam ngọt ăn đó!'],
    en: ['Vitamin C for a fresh new day! 🍊', 'Finish your tasks and get a sweet orange!'],
  },
  praises: {
    vi: ['Ngọt như cam luôn đó 🍊'],
    en: ['Sweet as an orange 🍊'],
  },
  taps: {
    vi: ['Thơm mùi cam không? 🍊', 'Mình mọng nước vitamin C nè 🍊'],
    en: ['Smell that orange zest? 🍊', 'I\'m bursting with vitamin C 🍊'],
  },
  styles: [
    {
      id: 'kumquat',
      name: { vi: 'Quất Tết', en: 'Lunar New Year kumquat' },
      unlockAt: 10,
      stages: { bud: { svg: OrangeKumquatBud }, bloom: { svg: OrangeKumquatBloom } },
      faceAnchor: { bud: { x: 100, y: 100, scale: 0.6 }, bloom: { x: 100, y: 100, scale: 0.6 } },
    },
    {
      id: 'bonsai',
      name: { vi: 'Bonsai', en: 'Bonsai' },
      unlockAt: 20,
      stages: { bud: { svg: OrangeBonsaiBud }, bloom: { svg: OrangeBonsaiBloom } },
      faceAnchor: { bud: { x: 96, y: 64, scale: 0.42 }, bloom: { x: 96, y: 55, scale: 0.55 } },
    },
  ],
};
