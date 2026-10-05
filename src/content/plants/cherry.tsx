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
/** Điểm trên đường cong bậc hai (để rải bông dọc cành) */
const qpt = (a: number[], c: number[], b: number[], t: number) => [
  (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t ** 2 * b[0],
  (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t ** 2 * b[1],
];

// Rủ: thân cao thẳng, cành vồng ra rồi rủ xuống như đài phun nước
const WEEP: { c: number[]; b: number[] }[] = [
  { c: [56, 30], b: [40, 128] },
  { c: [144, 30], b: [160, 128] },
  { c: [72, 40], b: [62, 138] },
  { c: [128, 40], b: [138, 138] },
  { c: [86, 44], b: [82, 118] },
  { c: [114, 44], b: [118, 118] },
];
function WeepingTree({ flower }: { flower: boolean }) {
  const top = [100, 56];
  return (
    <g>
      <path d="M95 160 Q98 110 98 60 L102 60 Q102 110 105 160 Z" fill={BARK} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      {WEEP.map(({ c, b }) => (
        <path key={b.join()} d={`M${top[0]} ${top[1]} Q${c[0]} ${c[1]} ${b[0]} ${b[1]}`} fill="none" stroke={flower ? '#7A4E33' : '#7BBF6A'} strokeWidth={2.2} strokeLinecap="round" />
      ))}
      {WEEP.flatMap(({ c, b }) =>
        [0.3, 0.45, 0.6, 0.75, 0.9].map((t) => {
          const [x, y] = qpt(top, c, b, t);
          return flower
            ? <Bloomlet key={`${b.join()}-${t}`} x={x} y={y} c={t > 0.6 ? '#FFB3C8' : '#FFC9DA'} />
            : <ellipse key={`${b.join()}-${t}`} cx={x} cy={y} rx={2.6} ry={4} fill="#B5E3A8" stroke={INK} strokeWidth={0.9} />;
        }),
      )}
      <circle cx={100} cy={52} r={17} fill={flower ? '#FFC9DA' : '#B5E3A8'} stroke={INK} strokeWidth={2.4} />
    </g>
  );
}
function CherryWeepingBud() {
  return <WeepingTree flower={false} />;
}
function CherryWeepingBloom() {
  return (
    <g>
      <WeepingTree flower />
      <CherryPair x={40} y={142} />
      <CherryPair x={160} y={142} />
      <Petals />
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
  name: 'Cherry',
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
  sayings: ['Hôm nay mình hồng hào lắm nè 🍒', 'Một quả cherry cho mỗi việc hoàn thành!'],
  praises: ['Thưởng bạn một quả cherry nè 🍒'],
  taps: ['Một cặp cherry tặng bạn 🍒', 'Bạn ngọt như cherry vậy đó 🍒'],
  styles: [
    {
      id: 'weeping',
      name: 'Rủ',
      unlockAt: 10,
      stages: { bud: { svg: CherryWeepingBud }, bloom: { svg: CherryWeepingBloom } },
      faceAnchor: { bud: { x: 100, y: 53, scale: 0.42 }, bloom: { x: 100, y: 53, scale: 0.42 } },
    },
    {
      id: 'lantern',
      name: 'Cần câu',
      unlockAt: 20,
      stages: { bud: { svg: CherryLanternBud }, bloom: { svg: CherryLanternBloom } },
      faceAnchor: { bud: { x: 150, y: 109, scale: 0.32 }, bloom: { x: 150, y: 120, scale: 0.46 } },
    },
  ],
};
