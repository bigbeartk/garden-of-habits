import { INK } from '../Face';
import type { PlantSpecies } from '../types';
import { SOIL_Y, Seed, Sprout } from './parts';

const LEAF = '#9FD884';
const LEAF_BACK = '#86C46E';
const STEM = '#86C46E';
const HUSK = '#B9E59C';
const COB = '#FFE07A';
const KERNEL = '#FFD04D';
const SILK = '#E8B26A';

/** Lá ngô: dải dài mọc từ thân ở (100, y), cong vồng lên rồi rủ đầu xuống. `side` -1 trái, 1 phải */
function Ribbon({ y, side, reach, lift, fill = LEAF }: { y: number; side: 1 | -1; reach: number; lift: number; fill?: string }) {
  const tipX = 100 + side * reach;
  const topY = y - lift;
  return (
    <path
      d={
        `M100 ${y} C${100 + side * reach * 0.35} ${topY - 6} ${100 + side * reach * 0.8} ${topY - 8} ${tipX} ${topY + 16} ` +
        `C${100 + side * reach * 0.75} ${topY + 4} ${100 + side * reach * 0.35} ${topY + 8} 100 ${y + 9} Z`
      }
      fill={fill}
      stroke={INK}
      strokeWidth={2}
      strokeLinejoin="round"
    />
  );
}

/** Thân ngô thẳng có đốt */
function Stalk({ top }: { top: number }) {
  return (
    <g>
      <path d={`M100 ${SOIL_Y} L100 ${top}`} stroke={STEM} strokeWidth={8} strokeLinecap="round" />
      {[SOIL_Y - 18, (SOIL_Y + top) / 2].map((y) => (
        <path key={y} d={`M96 ${y} L104 ${y}`} stroke="#6FAE58" strokeWidth={2} strokeLinecap="round" />
      ))}
    </g>
  );
}

/** Chỏm râu ngô bông xù, mấy lọn xoăn */
function Silk({ x, y, s = 1, color = SILK }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={color} strokeWidth={3} strokeLinecap="round" fill="none">
      <path d="M0 0 C-2 -6 -10 -8 -12 -14" />
      <path d="M0 0 C0 -6 -4 -12 -2 -18" />
      <path d="M0 0 C2 -6 6 -10 4 -17" />
      <path d="M0 0 C3 -4 10 -6 12 -12" />
    </g>
  );
}

/** Bắp mũm mĩm: thân tròn hình viên nhộng, hạt vàng nhạt không viền để mặt nổi rõ */
function Cob({ cx, cy, rx, ry }: { cx: number; cy: number; rx: number; ry: number }) {
  const kernels: [number, number][] = [];
  for (let row = 0; row * 7 < ry * 2 - 8; row++) {
    const y = cy - ry + 7 + row * 7;
    const off = row % 2 ? 3.5 : 0;
    for (let x = -rx + 5 + off; x <= rx - 5; x += 7) {
      if ((x / (rx - 3)) ** 2 + ((y - cy) / (ry - 3)) ** 2 < 1) kernels.push([cx + x, y]);
    }
  }
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={COB} stroke={INK} strokeWidth={2} />
      <g fill={KERNEL}>
        {kernels.map(([x, y]) => <rect key={`${x}-${y}`} x={x - 2.6} y={y - 2.6} width={5.2} height={5.2} rx={2.2} />)}
      </g>
      <ellipse cx={cx - rx * 0.45} cy={cy - ry * 0.45} rx={3} ry={6} fill="#fff" opacity={0.6} transform={`rotate(20 ${cx - rx * 0.45} ${cy - ry * 0.45})`} />
    </g>
  );
}

/** Hai lá bẹ ôm quanh đáy bắp, đầu lá nhọn vểnh ra */
function Husks({ cx, bottom, h, w }: { cx: number; bottom: number; h: number; w: number }) {
  return (
    <g fill={HUSK} stroke={INK} strokeWidth={2} strokeLinejoin="round">
      <path d={`M${cx} ${bottom} C${cx - w} ${bottom - 2} ${cx - w - 4} ${bottom - h * 0.6} ${cx - w + 2} ${bottom - h} C${cx - w * 0.4} ${bottom - h * 0.6} ${cx - 4} ${bottom - h * 0.3} ${cx} ${bottom} Z`} />
      <path d={`M${cx} ${bottom} C${cx + w} ${bottom - 2} ${cx + w + 4} ${bottom - h * 0.6} ${cx + w - 2} ${bottom - h} C${cx + w * 0.4} ${bottom - h * 0.6} ${cx + 4} ${bottom - h * 0.3} ${cx} ${bottom} Z`} />
    </g>
  );
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
      <Stalk top={90} />
      <Ribbon y={142} side={-1} reach={60} lift={30} fill={LEAF_BACK} />
      <Ribbon y={132} side={1} reach={60} lift={34} fill={LEAF_BACK} />
      <Ribbon y={120} side={-1} reach={44} lift={34} />
      <Silk x={100} y={70} s={0.8} color="#E9A6A0" />
      <ellipse cx={100} cy={96} rx={17} ry={26} fill={HUSK} stroke={INK} strokeWidth={2} />
      <path d="M92 76 C90 90 91 106 96 118 M108 76 C110 90 109 106 104 118" stroke="#8CCB70" strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Husks cx={100} bottom={126} h={22} w={15} />
    </g>
  );
}
function CornBloom() {
  return (
    <g>
      <Stalk top={90} />
      <Ribbon y={148} side={-1} reach={72} lift={34} fill={LEAF_BACK} />
      <Ribbon y={140} side={1} reach={72} lift={38} fill={LEAF_BACK} />
      <Ribbon y={124} side={1} reach={50} lift={30} />
      <Silk x={100} y={56} s={1.1} />
      <Cob cx={100} cy={92} rx={25} ry={36} />
      <Husks cx={100} bottom={136} h={34} w={24} />
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
    bud: { x: 100, y: 92, scale: 0.55 },
    bloom: { x: 100, y: 86, scale: 0.85 },
  },
  sayings: ['Bắp nè, bắp nè! Hôm nay mình làm gì đây? 🌽', 'Mỗi việc xong là một hạt ngô vàng ươm đó!'],
  praises: ['Thêm một hạt ngô vàng ươm cho bạn 🌽'],
  taps: ['Hạt ngô của mình chắc nịch nè 🌽', 'Nhột quá, rụng râu ngô bây giờ 😆'],
};
