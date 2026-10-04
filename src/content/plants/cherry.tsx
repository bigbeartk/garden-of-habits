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
  greetings: ['Hôm nay mình hồng hào lắm nè 🍒', 'Một quả cherry cho mỗi việc hoàn thành!'],
  praises: ['Thưởng bạn một quả cherry nè 🍒'],
  taps: ['Một cặp cherry tặng bạn 🍒', 'Bạn ngọt như cherry vậy đó 🍒'],
};
