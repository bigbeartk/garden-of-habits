import { INK } from '../Face';
import type { PlantSpecies } from '../types';
import { SOIL_Y, Seed, Sprout } from './parts';

const STEM = '#6FAE62';
const LEAF = '#7CC47A';
const LEAF_BACK = '#5FAE66';

interface CupColors {
  front: string;
  back: string;
}
const PINK: CupColors = { front: '#FF9DB3', back: '#EE7393' };
const YELLOW: CupColors = { front: '#FFD979', back: '#F2B84B' };
const LILAC: CupColors = { front: '#D3B8FA', back: '#AE8DE6' };

/** Thân cong từ gốc (100, 160) lên tới đáy bông */
function Stalk({ x, y }: { x: number; y: number }) {
  const cx = 100 + (x - 100) * 0.2;
  return <path d={`M100 ${SOIL_Y} Q${cx} ${(SOIL_Y + y) / 2} ${x} ${y}`} stroke={STEM} strokeWidth={4.5} fill="none" strokeLinecap="round" />;
}

/** Lá tulip: dải dài, mũi nhọn, mọc thẳng từ gốc rồi ngả ra ngoài */
function StrapLeaf({ tipX, tipY, fill = LEAF }: { tipX: number; tipY: number; fill?: string }) {
  const dx = tipX - 100;
  const side = Math.sign(dx) || 1;
  return (
    <path
      d={
        `M${100 - 7 * side} ${SOIL_Y} C${100 - 6 * side + dx * 0.15} ${SOIL_Y - 40} ${tipX - 6 * side} ${tipY + 30} ${tipX} ${tipY} ` +
        `C${tipX - 2 * side} ${tipY + 34} ${100 + 10 * side + dx * 0.2} ${SOIL_Y - 30} ${100 + 7 * side} ${SOIL_Y} Z`
      }
      fill={fill}
      stroke={INK}
      strokeWidth={2}
      strokeLinejoin="round"
    />
  );
}

/** Bông tulip mở hình chén, tâm (0,0) nằm giữa cánh trước; đáy chén ở y = 20 */
function Cup({ x, y, s = 1, c }: { x: number; y: number; s?: number; c: CupColors }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} strokeLinejoin="round">
      <path d="M-4 18 C-17 15 -23 2 -22 -16 C-15 -12 -9 -5 -6 4 Z" fill={c.back} stroke={INK} strokeWidth={2 / s} />
      <path d="M4 18 C17 15 23 2 22 -16 C15 -12 9 -5 6 4 Z" fill={c.back} stroke={INK} strokeWidth={2 / s} />
      <path
        d="M-16 -6 C-18 10 -10 20 0 20 C10 20 18 10 16 -6 C10 -9 4 -13 0 -19 C-4 -13 -10 -9 -16 -6 Z"
        fill={c.front}
        stroke={INK}
        strokeWidth={2 / s}
      />
      <path d="M-11 -2 C-12 6 -9 12 -5 15" stroke="#fff" strokeWidth={2.4 / s} fill="none" strokeLinecap="round" opacity={0.45} />
    </g>
  );
}

/** Nụ tulip còn khép: giọt nước dựng đứng, ngọn hơi ửng màu */
function Bud({ x, y, s = 1, c }: { x: number; y: number; s?: number; c: CupColors }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} strokeLinejoin="round">
      <path d="M0 18 C-14 17 -16 2 -12 -8 C-8 -17 -3 -22 0 -25 C3 -22 8 -17 12 -8 C16 2 14 17 0 18 Z" fill="#BFE3A8" stroke={INK} strokeWidth={2 / s} />
      <path d="M-11 -6 C-7 -15 -3 -20 0 -25 C3 -20 7 -15 11 -6 C6 -9 3 -10 0 -10 C-3 -10 -6 -9 -11 -6 Z" fill={c.front} stroke={INK} strokeWidth={1.6 / s} />
    </g>
  );
}

function TulipSeed() {
  return <Seed color="#A07A5C" />;
}
function TulipSprout() {
  return <Sprout leaf={LEAF} stem={STEM} />;
}
function TulipBud() {
  return (
    <g>
      <StrapLeaf tipX={50} tipY={104} fill={LEAF_BACK} />
      <StrapLeaf tipX={150} tipY={100} fill={LEAF_BACK} />
      <Stalk x={70} y={108} />
      <Stalk x={132} y={102} />
      <Stalk x={100} y={98} />
      <Bud x={70} y={90} s={0.72} c={YELLOW} />
      <Bud x={132} y={84} s={0.72} c={LILAC} />
      <Bud x={100} y={78} s={1.15} c={PINK} />
      <StrapLeaf tipX={80} tipY={118} />
      <StrapLeaf tipX={122} tipY={114} />
    </g>
  );
}
function TulipBloom() {
  return (
    <g>
      <StrapLeaf tipX={40} tipY={100} fill={LEAF_BACK} />
      <StrapLeaf tipX={160} tipY={96} fill={LEAF_BACK} />
      <Stalk x={58} y={100} />
      <Stalk x={143} y={92} />
      <Stalk x={100} y={86} />
      <Cup x={58} y={84} s={0.85} c={YELLOW} />
      <Cup x={143} y={76} s={0.85} c={LILAC} />
      <Cup x={100} y={62} s={1.35} c={PINK} />
      <StrapLeaf tipX={74} tipY={112} />
      <StrapLeaf tipX={128} tipY={108} />
    </g>
  );
}

/** id giữ là 'hydrangea' (trước đây là Cẩm tú cầu) để ngày cũ, sao lưu và cây đặc biệt đã mở khoá vẫn khớp. */
export const tulip: PlantSpecies = {
  id: 'hydrangea',
  name: 'Tulip',
  defaultPotId: 'blue-ceramic',
  stages: {
    seed: { svg: TulipSeed },
    sprout: { svg: TulipSprout },
    bud: { svg: TulipBud },
    bloom: { svg: TulipBloom },
  },
  faceAnchor: {
    seed: { x: 100, y: 149, scale: 0.55 },
    sprout: { x: 100, y: 122, scale: 0.6 },
    bud: { x: 100, y: 85, scale: 0.48 },
    bloom: { x: 100, y: 68, scale: 0.75 },
  },
  sayings: ['Ba bông tulip xinh xắn chào bạn nè 🌷', 'Hôm nay mình nở thật tươi để cổ vũ bạn đó!'],
  praises: ['Thêm một cánh tulip hé nở vì bạn đó 🌷'],
  taps: ['Hihi, nhột cánh hoa mình quá 🌷', 'Cả bó tulip này tặng bạn nè 💐'],
};
