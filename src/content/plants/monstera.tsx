import { INK } from '../Face';
import type { PlantSpecies } from '../types';
import { SOIL_Y, Seed, Sprout } from './parts';

const STEM = '#6FAE62';
const LEAF = '#4FAE6A';
const LEAF_BACK = '#3F9A5B';
const VEIN = '#2F7A45';

/** Lá monstera hướng lên, tâm ở (0,0), cuống gắn ở (0,20): mỗi bên 2 khe xẻ */
const LEAF_D =
  'M0 20 C10 26 26 22 30 8 L13 4 L31 -4 C31 -12 28 -16 25 -18 L11 -10 L21 -24 C14 -30 6 -31 0 -30 ' +
  'C-6 -31 -14 -30 -21 -24 L-11 -10 L-25 -18 C-28 -16 -31 -12 -31 -4 L-13 4 L-30 8 C-26 22 -10 26 0 20 Z';
/** Hai lỗ cạnh gân giữa (cắt thủng nhờ fillRule evenodd) */
const HOLES_D = 'M6 -7 A2.2 3.5 0 1 1 6 0 A2.2 3.5 0 1 1 6 -7 Z M-6 -7 A2.2 3.5 0 1 1 -6 0 A2.2 3.5 0 1 1 -6 -7 Z';

/** Một lá kèm cuống mọc từ gốc (100, 160). `plain`: không lỗ, không gân (lá mang mặt). */
function Leaf({ x, y, r = 0, s = 1, fill = LEAF, plain }: { x: number; y: number; r?: number; s?: number; fill?: string; plain?: boolean }) {
  const rad = (r * Math.PI) / 180;
  const bx = x - 20 * s * Math.sin(rad);
  const by = y + 20 * s * Math.cos(rad);
  const cx = 100 + (bx - 100) * 0.35;
  const cy = by + (SOIL_Y - by) * 0.6;
  return (
    <g>
      <path d={`M100 ${SOIL_Y} Q${cx} ${cy} ${bx} ${by}`} stroke={STEM} strokeWidth={4} fill="none" strokeLinecap="round" />
      <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
        <path d={plain ? LEAF_D : LEAF_D + ' ' + HOLES_D} fillRule="evenodd" fill={fill} stroke={INK} strokeWidth={2 / s} strokeLinejoin="round" />
        {!plain && <path d="M0 18 L0 -26" stroke={VEIN} strokeWidth={1.4 / s} strokeLinecap="round" />}
      </g>
    </g>
  );
}

/** Lá non còn cuộn, nhọn như búp */
function RolledLeaf({ x, y, r = 0 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <path d={`M100 ${SOIL_Y} Q${100 + (x - 100) * 0.3} ${(SOIL_Y + y) / 2} ${x} ${y + 14}`} stroke={STEM} strokeWidth={4} fill="none" strokeLinecap="round" />
      <path
        d="M0 16 C-7 6 -6 -8 0 -18 C6 -8 7 6 0 16 Z"
        transform={`translate(${x} ${y}) rotate(${r})`}
        fill="#8FD08A"
        stroke={INK}
        strokeWidth={1.8}
      />
    </g>
  );
}

function MonsteraSeed() {
  return <Seed color="#8A6A4F" />;
}
function MonsteraSprout() {
  return <Sprout leaf="#8FD08A" stem={STEM} />;
}
function MonsteraBud() {
  return (
    <g>
      <Leaf x={64} y={118} r={-40} s={0.72} fill={LEAF_BACK} />
      <Leaf x={136} y={114} r={40} s={0.72} fill={LEAF_BACK} />
      <RolledLeaf x={124} y={78} r={18} />
      <Leaf x={100} y={94} s={0.72} plain />
    </g>
  );
}
function MonsteraBloom() {
  return (
    <g>
      <Leaf x={44} y={140} r={-80} s={0.7} fill={LEAF_BACK} />
      <Leaf x={156} y={138} r={80} s={0.7} fill={LEAF_BACK} />
      <Leaf x={58} y={100} r={-50} s={0.85} fill={LEAF_BACK} />
      <Leaf x={142} y={96} r={50} s={0.85} fill={LEAF_BACK} />
      <Leaf x={76} y={66} r={-20} s={0.8} />
      <Leaf x={124} y={62} r={20} s={0.8} />
      <Leaf x={100} y={96} s={0.95} plain />
    </g>
  );
}

// ---- Dáng mở khoá ----

/** Lá monstera có cuống mọc từ điểm (ox, oy) bất kỳ (cột rêu, dây rủ), cong qua điểm uốn (qx, qy) */
function LeafFrom({ ox, oy, qx, qy, x, y, r = 0, s = 1, fill = LEAF, plain }: {
  ox: number; oy: number; qx: number; qy: number; x: number; y: number; r?: number; s?: number; fill?: string; plain?: boolean;
}) {
  const rad = (r * Math.PI) / 180;
  const bx = x - 20 * s * Math.sin(rad);
  const by = y + 20 * s * Math.cos(rad);
  return (
    <g>
      <path d={`M${ox} ${oy} Q${qx} ${qy} ${bx} ${by}`} stroke={STEM} strokeWidth={3.5} fill="none" strokeLinecap="round" />
      <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
        <path d={plain ? LEAF_D : LEAF_D + ' ' + HOLES_D} fillRule="evenodd" fill={fill} stroke={INK} strokeWidth={2 / s} strokeLinejoin="round" />
        {!plain && <path d="M0 18 L0 -26" stroke={VEIN} strokeWidth={1.4 / s} strokeLinecap="round" />}
      </g>
    </g>
  );
}

/** Cột rêu: cột nâu bọc rêu, đỉnh bo tròn, từ đất lên tới `top` */
function MossPole({ top }: { top: number }) {
  return (
    <g>
      <rect x={93} y={top} width={14} height={SOIL_Y + 2 - top} rx={7} fill="#B08A5E" stroke={INK} strokeWidth={2} />
      {Array.from({ length: Math.floor((SOIL_Y - top) / 14) }, (_, i) => top + 10 + i * 14).map((y) => (
        <path key={y} d={`M95 ${y} q5 -4 10 0`} stroke="#8DB86A" strokeWidth={3} fill="none" strokeLinecap="round" />
      ))}
    </g>
  );
}
function MonsteraPoleBud() {
  return (
    <g>
      <MossPole top={66} />
      <LeafFrom ox={98} oy={146} qx={84} qy={140} x={72} y={124} r={-55} s={0.55} fill={LEAF_BACK} />
      <LeafFrom ox={102} oy={118} qx={116} qy={112} x={128} y={98} r={55} s={0.55} fill={LEAF_BACK} />
      <LeafFrom ox={100} oy={80} qx={100} qy={74} x={100} y={66} s={0.6} plain />
    </g>
  );
}
function MonsteraPoleBloom() {
  return (
    <g>
      <MossPole top={30} />
      <LeafFrom ox={98} oy={150} qx={82} qy={146} x={68} y={132} r={-62} s={0.62} fill={LEAF_BACK} />
      <LeafFrom ox={102} oy={128} qx={118} qy={122} x={132} y={108} r={62} s={0.66} fill={LEAF_BACK} />
      <LeafFrom ox={98} oy={104} qx={82} qy={98} x={68} y={82} r={-55} s={0.7} />
      <LeafFrom ox={102} oy={78} qx={118} qy={72} x={132} y={58} r={55} s={0.66} />
      <LeafFrom ox={100} oy={46} qx={100} qy={40} x={100} y={36} s={0.72} plain />
    </g>
  );
}

/** Dây rủ: từ gốc vắt qua miệng chậu ở (rimX, 152) rồi thả xuống tới (endX, endY) */
function Vine({ rimX, endX, endY }: { rimX: number; endX: number; endY: number }) {
  return <path d={`M100 ${SOIL_Y - 2} Q${(100 + rimX) / 2} ${SOIL_Y - 22} ${rimX} 152 Q${endX} ${152 + 8} ${endX} ${endY}`} stroke={STEM} strokeWidth={3.5} fill="none" strokeLinecap="round" />;
}
/** Lá treo trên dây (không cuống riêng), đầu lá chúc xuống */
function HangLeaf({ x, y, r, s, fill = LEAF }: { x: number; y: number; r: number; s: number; fill?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path d={LEAF_D + ' ' + HOLES_D} fillRule="evenodd" fill={fill} stroke={INK} strokeWidth={2 / s} strokeLinejoin="round" />
      <path d="M0 18 L0 -26" stroke={VEIN} strokeWidth={1.4 / s} strokeLinecap="round" />
    </g>
  );
}
function MonsteraTrailingBud() {
  return (
    <g>
      <Vine rimX={56} endX={44} endY={186} />
      <Vine rimX={144} endX={156} endY={186} />
      <HangLeaf x={46} y={180} r={165} s={0.55} fill={LEAF_BACK} />
      <HangLeaf x={154} y={180} r={-165} s={0.55} fill={LEAF_BACK} />
      <LeafFrom ox={100} oy={SOIL_Y} qx={100} qy={146} x={100} y={118} s={0.62} plain />
    </g>
  );
}
function MonsteraTrailingBloom() {
  return (
    <g>
      <Vine rimX={52} endX={30} endY={220} />
      <Vine rimX={148} endX={170} endY={220} />
      <Vine rimX={68} endX={60} endY={200} />
      <Vine rimX={132} endX={140} endY={200} />
      <HangLeaf x={40} y={168} r={115} s={0.55} fill={LEAF_BACK} />
      <HangLeaf x={160} y={168} r={-115} s={0.55} fill={LEAF_BACK} />
      <HangLeaf x={60} y={196} r={175} s={0.55} fill={LEAF_BACK} />
      <HangLeaf x={140} y={196} r={-175} s={0.55} fill={LEAF_BACK} />
      <HangLeaf x={30} y={212} r={170} s={0.66} />
      <HangLeaf x={170} y={212} r={-170} s={0.66} />
      <LeafFrom ox={100} oy={SOIL_Y} qx={84} qy={148} x={70} y={132} r={-40} s={0.62} fill={LEAF_BACK} />
      <LeafFrom ox={100} oy={SOIL_Y} qx={116} qy={148} x={130} y={132} r={40} s={0.62} fill={LEAF_BACK} />
      <LeafFrom ox={100} oy={SOIL_Y} qx={100} qy={142} x={100} y={108} s={0.8} plain />
    </g>
  );
}

/** id giữ là 'pothos' (trước đây là Trầu bà) để ngày cũ, sao lưu và cây đặc biệt đã mở khoá vẫn khớp. */
export const monstera: PlantSpecies = {
  id: 'pothos',
  name: { vi: 'Monstera', en: 'Monstera' },
  defaultPotId: 'mint',
  stages: {
    seed: { svg: MonsteraSeed },
    sprout: { svg: MonsteraSprout },
    bud: { svg: MonsteraBud },
    bloom: { svg: MonsteraBloom },
  },
  faceAnchor: {
    seed: { x: 100, y: 149, scale: 0.55 },
    sprout: { x: 100, y: 122, scale: 0.6 },
    bud: { x: 100, y: 90, scale: 0.45 },
    bloom: { x: 100, y: 90, scale: 0.6 },
  },
  sayings: {
    vi: ['Lá xẻ thuỳ của mình vẫy chào bạn nè 🌿', 'Mỗi chiếc lá mới của mình là một bất ngờ đó!'],
    en: ['My split leaves are waving hi to you 🌿', 'Every new leaf of mine is a little surprise!'],
  },
  praises: {
    vi: ['Thêm một chiếc lá xẻ mới mọc ra vì bạn đó 🌿'],
    en: ['A brand-new split leaf just grew for you 🌿'],
  },
  taps: {
    vi: ['Lá mình có lỗ là để đón nắng đó ☀️', 'Mình xoè lá ra ôm bạn nè 💚'],
    en: ['The holes in my leaves let the sunshine in ☀️', 'I\'m spreading my leaves to hug you 💚'],
  },
  styles: [
    {
      id: 'pole',
      name: { vi: 'Leo cột', en: 'Moss pole' },
      unlockAt: 10,
      stages: { bud: { svg: MonsteraPoleBud }, bloom: { svg: MonsteraPoleBloom } },
      faceAnchor: { bud: { x: 100, y: 62, scale: 0.36 }, bloom: { x: 100, y: 32, scale: 0.45 } },
    },
    {
      id: 'trailing',
      name: { vi: 'Rủ', en: 'Trailing' },
      unlockAt: 20,
      stages: { bud: { svg: MonsteraTrailingBud }, bloom: { svg: MonsteraTrailingBloom } },
      faceAnchor: { bud: { x: 100, y: 114, scale: 0.38 }, bloom: { x: 100, y: 104, scale: 0.5 } },
    },
  ],
};
