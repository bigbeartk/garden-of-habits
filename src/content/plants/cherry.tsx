import { INK } from '../Face';
import type { PlantSpecies } from '../types';
import { Seed, Sprout } from './parts';

/**
 * Cây cherry: dáng "cây dù" rộng và thấp — thân chẻ đôi lộ cành, tán là chuỗi bông xếp thành vòm cong,
 * chùm cherry đôi treo cuống dài dưới vòm, cánh hoa rơi. Khác hẳn khối cầu của cây cam.
 */
const BARK = '#8A5A3B';
/** các bông của vòm tán, xếp theo một cung rộng */
const PUFFS: [number, number, number][] = [
  [54, 96, 17],
  [74, 78, 21],
  [100, 70, 24],
  [126, 78, 21],
  [146, 96, 17],
  [100, 92, 22],
];

function ForkTrunk() {
  return (
    <g>
      {/* hai cành chẻ ra từ thân, vẽ viền rồi phủ màu */}
      <path d="M100 128 Q82 112 64 100 M100 128 Q118 112 136 100 M100 128 L100 92" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <path d="M100 128 Q82 112 64 100 M100 128 Q118 112 136 100 M100 128 L100 92" fill="none" stroke={BARK} strokeWidth={5} strokeLinecap="round" />
      <path d="M93 160 Q96 140 96 126 L104 126 Q104 140 107 160 Z" fill={BARK} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
    </g>
  );
}

/** Vòm tán: viền dày trước rồi phủ nền để chỉ còn viền ngoài (giống cách vẽ tán tròn). */
function Umbrella({ fill, dots }: { fill: string; dots?: string }) {
  return (
    <g data-part="cherry-umbrella">
      {PUFFS.map(([x, y, r]) => <circle key={`o${x}-${y}`} cx={x} cy={y} r={r} fill={fill} stroke={INK} strokeWidth={4} />)}
      {PUFFS.map(([x, y, r]) => <circle key={`i${x}-${y}`} cx={x} cy={y} r={r} fill={fill} />)}
      {dots && [[60, 90], [80, 70], [118, 66], [142, 92], [128, 86], [72, 96]].map(([x, y]) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
          {[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={0} cy={-2.6} r={1.9} fill={dots} transform={`rotate(${a})`} />)}
          <circle r={1.2} fill="#FFF6B0" />
        </g>
      ))}
    </g>
  );
}

function CherryPair({ x, y }: { x: number; y: number }) {
  // cuống dài treo từ dưới vòm xuống
  return (
    <g>
      <path d={`M${x} ${y - 22} Q${x - 7} ${y - 8} ${x - 6} ${y} M${x} ${y - 22} Q${x + 6} ${y - 8} ${x + 6} ${y}`} stroke="#5E9E4F" strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <path d={`M${x} ${y - 22} q6 -5 11 -1 q-6 4 -11 1 Z`} fill="#7CC36E" stroke={INK} strokeWidth={1.1} />
      <circle cx={x - 6} cy={y + 4} r={6.5} fill="#E8354F" stroke={INK} strokeWidth={1.7} />
      <circle cx={x + 6} cy={y + 4} r={6.5} fill="#E8354F" stroke={INK} strokeWidth={1.7} />
      <circle cx={x - 8} cy={y + 1.5} r={1.7} fill="#fff" />
      <circle cx={x + 4} cy={y + 1.5} r={1.7} fill="#fff" />
    </g>
  );
}

/** cánh hoa rơi lả tả dưới vòm */
function Petals() {
  return (
    <g fill="#FFB3C8" stroke={INK} strokeWidth={0.8}>
      {[[48, 128, -30], [152, 132, 25], [118, 146, 60]].map(([x, y, r]) => (
        <path key={`${x}-${y}`} d={`M${x} ${y} q3 -5 6 0 q-3 4 -6 0 Z`} transform={`rotate(${r} ${x} ${y})`} />
      ))}
    </g>
  );
}

function CherrySeed() {
  return <Seed color="#B9614A" stripe="#8F4535" />;
}
function CherrySprout() {
  return (
    <g>
      <Sprout leaf="#B5E3A8" stem="#7BBF6A" />
      <circle cx={100} cy={118} r={3.5} fill="#FF8FAE" stroke={INK} strokeWidth={1.2} />
    </g>
  );
}
function CherryBud() {
  return (
    <g>
      <ForkTrunk />
      <Umbrella fill="#B5E3A8" dots="#FFC4D6" />
    </g>
  );
}
function CherryBloom() {
  return (
    <g>
      <ForkTrunk />
      <Umbrella fill="#FFC9DA" dots="#FF9FBC" />
      <CherryPair x={58} y={124} />
      <CherryPair x={142} y={124} />
      <CherryPair x={122} y={128} />
      <Petals />
    </g>
  );
}

// ---- Dáng mở khoá ----

/** Một bông nhỏ 5 cánh */
function Bloomlet({ x, y, c = '#FFC9DA', r = 3.2 }: { x: number; y: number; c?: string; r?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={0} cy={-r * 0.9} r={r * 0.75} fill={c} stroke={INK} strokeWidth={0.9} transform={`rotate(${a})`} />)}
      <circle r={r * 0.45} fill="#FFF6B0" />
    </g>
  );
}
// Bụi (id vẫn là 'weeping', tên cũ Rủ, để giữ dáng đã mở trong dữ liệu cũ; bản Rủ cũ lưu ở src/dev/sketch/cherry.tsx):
// bụi lá tròn thấp điểm hoa trắng hồng, ra hoa thì chùm cherry đôi quanh chân bụi; mặt giữa bụi
const BUSH: [number, number, number][] = [[100, 112, 34], [68, 128, 24], [132, 128, 24], [84, 100, 20], [116, 100, 20]];
const BUSH_FLOWERS: [number, number][] = [[62, 120], [76, 98], [124, 98], [140, 122], [102, 88]];
function Bush({ ripe }: { ripe: boolean }) {
  const fill = ripe ? '#9ED68E' : '#B5E3A8';
  return (
    <g>
      {BUSH.map(([x, y, r]) => <circle key={`o${x}-${y}`} cx={x} cy={y} r={r} fill={fill} stroke={INK} strokeWidth={4} />)}
      {BUSH.map(([x, y, r]) => <circle key={`i${x}-${y}`} cx={x} cy={y} r={r} fill={fill} />)}
      {BUSH_FLOWERS.map(([x, y]) => <Bloomlet key={`${x}-${y}`} x={x} y={y} c={ripe ? '#FFE0EA' : '#FFE9F0'} r={3.4} />)}
    </g>
  );
}
/** cherry đôi thu nhỏ quanh tâm (x, y) */
function SmallPair({ x, y, s }: { x: number; y: number; s: number }) {
  return <g transform={`translate(${x} ${y}) scale(${s}) translate(${-x} ${-y})`}><CherryPair x={x} y={y} /></g>;
}
function CherryWeepingBud() {
  return <Bush ripe={false} />;
}
function CherryWeepingBloom() {
  return (
    <g>
      <Bush ripe />
      <SmallPair x={58} y={138} s={0.9} />
      <SmallPair x={142} y={138} s={0.9} />
      <SmallPair x={80} y={152} s={0.8} />
      <SmallPair x={122} y={150} s={0.8} />
    </g>
  );
}

// Cần câu: thân mảnh chéo lên như cần câu, đầu cần thả dây treo một chùm cherry to
const BUNCH: [number, number, number][] = [
  [134, 100, 9], [166, 100, 9], [130, 124, 9], [170, 124, 9], [140, 140, 9], [160, 140, 9], [150, 118, 17],
];
function Rod() {
  return (
    <g fill="none" strokeLinecap="round">
      <path d="M86 160 Q84 92 150 40" stroke={INK} strokeWidth={8} />
      <path d="M86 160 Q84 92 150 40" stroke={BARK} strokeWidth={4.5} />
      {[[90, 120, -40], [100, 84, 30], [122, 60, -20]].map(([x, y, r]) => (
        <path key={`${x}-${y}`} d={`M${x} ${y} q9 -7 16 -2 q-8 7 -16 2 Z`} fill="#7CC36E" stroke={INK} strokeWidth={1.3} transform={`rotate(${r} ${x} ${y})`} />
      ))}
      <Bloomlet x={150} y={40} c="#FFB3C8" r={4} />
    </g>
  );
}
function CherryLanternBud() {
  return (
    <g>
      <Rod />
      <path d="M150 42 L150 92" stroke="#5E9E4F" strokeWidth={1.8} />
      {([[138, 100, 8], [162, 100, 8], [150, 108, 12]] as const).map(([x, y, r]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#B5E3A8" stroke={INK} strokeWidth={1.6} />)}
    </g>
  );
}
function CherryLanternBloom() {
  return (
    <g>
      <Rod />
      <path d="M150 42 L150 90 M150 90 L134 100 M150 90 L166 100 M150 90 L130 124 M150 90 L170 124" stroke="#5E9E4F" strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <path d="M150 90 q7 -6 13 -2 q-7 5 -13 2 Z" fill="#7CC36E" stroke={INK} strokeWidth={1.2} />
      {BUNCH.map(([x, y, r]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r={r} fill="#E8354F" stroke={INK} strokeWidth={1.8} />
          <circle cx={x - r * 0.35} cy={y - r * 0.4} r={r * 0.25} fill="#fff" />
        </g>
      ))}
      <Petals />
    </g>
  );
}

export const cherry: PlantSpecies = {
  id: 'cherry',
  name: { vi: 'Cherry', en: 'Cherry' },
  defaultPotId: 'polka',
  stages: {
    seed: { svg: CherrySeed },
    sprout: { svg: CherrySprout },
    bud: { svg: CherryBud },
    bloom: { svg: CherryBloom },
  },
  faceAnchor: {
    seed: { x: 100, y: 149, scale: 0.55 },
    sprout: { x: 100, y: 122, scale: 0.6 },
    bud: { x: 100, y: 84, scale: 0.62 },
    bloom: { x: 100, y: 84, scale: 0.62 },
  },
  sayings: {
    vi: ['Hôm nay mình hồng hào lắm nè 🍒', 'Một quả cherry cho mỗi việc hoàn thành!'],
    en: ['I\'m feeling extra rosy today 🍒', 'One cherry for every task you finish!'],
  },
  praises: {
    vi: ['Thưởng bạn một quả cherry nè 🍒'],
    en: ['Here, have a cherry 🍒'],
  },
  taps: {
    vi: ['Một cặp cherry tặng bạn 🍒', 'Bạn ngọt như cherry vậy đó 🍒'],
    en: ['A pair of cherries, just for you 🍒', 'You\'re as sweet as a cherry 🍒'],
  },
  styles: [
    {
      id: 'weeping',
      name: { vi: 'Bụi', en: 'Bush' },
      unlockAt: 10,
      stages: { bud: { svg: CherryWeepingBud }, bloom: { svg: CherryWeepingBloom } },
      faceAnchor: { bud: { x: 100, y: 118, scale: 0.55 }, bloom: { x: 100, y: 118, scale: 0.6 } },
    },
    {
      id: 'lantern',
      name: { vi: 'Cần câu', en: 'Fishing rod' },
      unlockAt: 20,
      stages: { bud: { svg: CherryLanternBud }, bloom: { svg: CherryLanternBloom } },
      faceAnchor: { bud: { x: 150, y: 109, scale: 0.32 }, bloom: { x: 150, y: 120, scale: 0.46 } },
    },
  ],
};
