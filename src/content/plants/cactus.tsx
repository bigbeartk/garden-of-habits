import { INK } from '../Face';
import type { PlantSpecies } from '../types';
import { SOIL_Y, Seed } from './parts';

const BODY = '#4E8C5A';
const RIB = '#3A6E46';
const SHINE = '#6FAE78';
const SPINE = '#F3E9C8';

/** Gai nhọn: gốc gai + hai gai dài chĩa ra ngoài theo góc `a` (độ, 0 = sang phải) */
function Spikes({ points }: { points: [number, number, number][] }) {
  return (
    <g stroke={SPINE} strokeWidth={1.6} strokeLinecap="round">
      {points.map(([x, y, a]) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${a})`}>
          <path d="M0 0 L10 -3.5 M0 0 L10 3.5" />
          <circle r={1.6} fill={SPINE} stroke="none" />
        </g>
      ))}
    </g>
  );
}

/** Thân cột saguaro: đỉnh tròn, các sống dọc, cao từ đất lên tới `top` */
function Trunk({ top, w = 30 }: { top: number; w?: number }) {
  const l = 100 - w / 2;
  const r = 100 + w / 2;
  return (
    <g>
      <path d={`M${l} ${SOIL_Y + 2} L${l} ${top + w / 2} A${w / 2} ${w / 2} 0 0 1 ${r} ${top + w / 2} L${r} ${SOIL_Y + 2} Z`} fill={BODY} stroke={INK} strokeWidth={2.2} />
      <g stroke={RIB} strokeWidth={2} strokeLinecap="round" fill="none">
        <path d={`M${100 - w / 5} ${top + 8} L${100 - w / 5} ${SOIL_Y}`} />
        <path d={`M${100 + w / 5} ${top + 8} L${100 + w / 5} ${SOIL_Y}`} />
      </g>
      <path d={`M${l + 4} ${top + w / 2} L${l + 4} ${SOIL_Y - 6}`} stroke={SHINE} strokeWidth={2.2} strokeLinecap="round" />
    </g>
  );
}

/**
 * Tay gập góc vuông kiểu saguaro: mọc ngang từ thân ở độ cao `y`, vươn ra `reach`, rồi dựng lên tới `top`.
 * `side` = -1 bên trái, 1 bên phải.
 */
function Arm({ side, y, reach, top, w = 18 }: { side: 1 | -1; y: number; reach: number; top: number; w?: number }) {
  const x0 = 100 + side * 10;
  const xo = 100 + side * reach; // mép ngoài của cột dựng
  const xi = xo - side * w; // mép trong
  const bottom = y + w / 2;
  const d =
    `M${x0} ${y - w / 2} L${xi} ${y - w / 2} L${xi} ${top + w / 2} ` +
    `A${w / 2} ${w / 2} 0 0 ${side > 0 ? 1 : 0} ${xo} ${top + w / 2} ` +
    `L${xo} ${y} Q${xo} ${bottom} ${xo - side * w / 2} ${bottom} L${x0} ${bottom} Z`;
  const mid = (xi + xo) / 2;
  return (
    <g>
      <path d={d} fill={BODY} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
      <path d={`M${mid} ${top + 7} L${mid} ${y}`} stroke={RIB} strokeWidth={1.8} strokeLinecap="round" />
    </g>
  );
}

/** Hoa sa mạc đỏ thẫm, cánh nhọn */
function DesertFlower({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[-60, -30, 0, 30, 60].map((a) => (
        <path key={a} d="M0 0 L-4 -8 L0 -16 L4 -8 Z" fill="#E0464E" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" transform={`rotate(${a})`} />
      ))}
      <circle r={3.5} fill="#FFC94A" stroke={INK} strokeWidth={1.3} />
    </g>
  );
}

function CactusSeed() {
  return <Seed color="#8A6E58" />;
}
function CactusSprout() {
  return (
    <g>
      <path d={`M84 ${SOIL_Y + 2} L84 132 A16 16 0 0 1 116 132 L116 ${SOIL_Y + 2} Z`} fill={BODY} stroke={INK} strokeWidth={2.2} />
      <path d={`M94 124 L94 ${SOIL_Y} M106 124 L106 ${SOIL_Y}`} stroke={RIB} strokeWidth={2} strokeLinecap="round" />
      <Spikes points={[[84, 136, 180], [116, 136, 0], [100, 116, -90], [84, 152, 180], [116, 152, 0]]} />
    </g>
  );
}
function CactusBud() {
  return (
    <g>
      <Arm side={-1} y={128} reach={34} top={100} />
      <Arm side={1} y={116} reach={34} top={88} />
      <Trunk top={70} />
      <Spikes
        points={[
          [85, 92, 180], [115, 100, 0], [85, 140, 180], [115, 146, 0], [100, 70, -90],
          [66, 106, 180], [134, 94, 0], [75, 100, -90], [125, 88, -90],
        ]}
      />
      <path d="M100 71 C94 67 95 59 100 54 C105 59 106 67 100 71 Z" fill="#E0464E" stroke={INK} strokeWidth={1.6} />
    </g>
  );
}
function CactusBloom() {
  return (
    <g>
      <Arm side={-1} y={126} reach={46} top={84} w={21} />
      <Arm side={1} y={104} reach={46} top={62} w={21} />
      <Arm side={1} y={144} reach={30} top={126} w={14} />
      <Trunk top={50} w={36} />
      <Spikes
        points={[
          [82, 80, 180], [118, 88, 0], [82, 116, 180], [118, 124, 0], [82, 146, 180], [100, 50, -90], [116, 60, -40], [84, 60, -140],
          [54, 100, 180], [146, 76, 0], [64, 84, -90], [136, 62, -90], [130, 128, 0],
        ]}
      />
      <DesertFlower x={100} y={52} s={1.15} />
      <DesertFlower x={136} y={63} s={0.75} />
    </g>
  );
}

export const cactus: PlantSpecies = {
  id: 'cactus',
  name: 'Xương rồng',
  defaultPotId: 'concrete',
  faceStyle: 'cool',
  stages: {
    seed: { svg: CactusSeed },
    sprout: { svg: CactusSprout },
    bud: { svg: CactusBud },
    bloom: { svg: CactusBloom },
  },
  faceAnchor: {
    seed: { x: 100, y: 149, scale: 0.55 },
    sprout: { x: 100, y: 140, scale: 0.6 },
    bud: { x: 100, y: 102, scale: 0.72 },
    bloom: { x: 100, y: 88, scale: 0.85 },
  },
  sayings: ['Nắng sa mạc còn chưa làm khó được mình, việc hôm nay xá gì 😎', 'Gai góc là phong cách. Làm việc thôi 🌵'],
  praises: ['Chuẩn bài. Ngầu đó 😎', 'Một việc nữa đã bị hạ gục 🌵'],
  taps: ['Đụng vô là dính gai đó nha 😎', 'Bình tĩnh, mình chỉ ngầu thôi chứ không cắn đâu 🌵', 'Kính râm này là hàng hiệu đó 😎'],
};
