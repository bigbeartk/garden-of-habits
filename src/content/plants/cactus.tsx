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

// ---- Dáng mở khoá ----

const PAD = '#78B865';
const PAD_SHADE = '#5E9E50';

/** Lá dẹt hình bầu dục (xương rồng tai thỏ), nghiêng `r` độ quanh gốc (x, y + ry) */
function Paddle({ x, y, rx, ry, r = 0, dots = [] }: { x: number; y: number; rx: number; ry: number; r?: number; dots?: [number, number][] }) {
  return (
    <g transform={`rotate(${r} ${x} ${y + ry})`}>
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={PAD} stroke={INK} strokeWidth={2.2} />
      <path d={`M${x - rx * 0.55} ${y - ry * 0.5} Q${x - rx * 0.75} ${y} ${x - rx * 0.5} ${y + ry * 0.55}`} stroke="#9AD088" strokeWidth={2.2} fill="none" strokeLinecap="round" />
      {dots.map(([dx, dy]) => (
        <g key={`${dx}-${dy}`} stroke={SPINE} strokeWidth={1.4} strokeLinecap="round">
          <path d={`M${x + dx} ${y + dy} l-3 -4 M${x + dx} ${y + dy} l3 -4`} />
          <circle cx={x + dx} cy={y + dy} r={1.8} fill="#FFF6D8" stroke={PAD_SHADE} strokeWidth={0.8} />
        </g>
      ))}
    </g>
  );
}
/** Hoa nhỏ tròn trên chóp tai */
function PadFlower({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g>
      {[0, 72, 144, 216, 288].map((a) => (
        <circle key={a} cx={x} cy={y - 5} r={4} fill={color} stroke={INK} strokeWidth={1.3} transform={`rotate(${a} ${x} ${y})`} />
      ))}
      <circle cx={x} cy={y} r={2.8} fill="#FFE07A" stroke={INK} strokeWidth={1.2} />
    </g>
  );
}
function CactusBunnyBud() {
  return (
    <g>
      <Paddle x={84} y={96} rx={9} ry={15} r={-16} dots={[[0, -4]]} />
      <Paddle x={116} y={96} rx={9} ry={15} r={16} dots={[[0, -4]]} />
      <Paddle x={100} y={128} rx={24} ry={30} dots={[[-14, -14], [14, -14], [-17, 10], [17, 10]]} />
    </g>
  );
}
function CactusBunnyBloom() {
  return (
    <g>
      <Paddle x={78} y={66} rx={14} ry={30} r={-18} dots={[[0, -14], [-4, 6], [4, 16]]} />
      <Paddle x={122} y={66} rx={14} ry={30} r={18} dots={[[0, -14], [4, 6], [-4, 16]]} />
      <Paddle x={146} y={126} rx={11} ry={16} r={40} dots={[[0, -4]]} />
      <Paddle x={100} y={118} rx={30} ry={38} dots={[[-18, -20], [18, -20], [-22, 4], [22, 4], [-14, 24], [14, 24]]} />
      <PadFlower x={67} y={37} color="#FF9FB2" />
      <PadFlower x={133} y={37} color="#FFB86B" />
    </g>
  );
}

const BARREL = '#5C9E5A';
/** Khối cầu thấp có sống dọc cong, gai vàng dọc sống */
function Barrel({ cy, r }: { cy: number; r: number }) {
  const ribs = [-0.72, -0.36, 0, 0.36, 0.72];
  return (
    <g>
      <ellipse cx={100} cy={cy} rx={r * 1.08} ry={r} fill={BARREL} stroke={INK} strokeWidth={2.2} />
      <g stroke="#467F45" strokeWidth={2} fill="none" strokeLinecap="round">
        {ribs.map((k) => (
          <path key={k} d={`M${100 + k * r * 0.35} ${cy - r + 3} Q${100 + k * r * 1.25} ${cy} ${100 + k * r * 0.45} ${cy + r - 3}`} />
        ))}
      </g>
      <g stroke="#F7C948" strokeWidth={1.6} strokeLinecap="round">
        {/* gai chỉ ở các sống ngoài, chừa giữa thân cho mặt */}
        {ribs.filter((k) => Math.abs(k) > 0.5).flatMap((k) =>
          [-0.6, 0, 0.6].map((t) => {
            const x = 100 + k * r * (1.05 - Math.abs(t) * 0.5);
            const y = cy + t * r;
            return <path key={`${k}-${t}`} d={`M${x} ${y} l-5 -4 M${x} ${y} l5 -4 M${x} ${y} l0 -6`} />;
          }),
        )}
      </g>
      <ellipse cx={100 - r * 0.6} cy={cy - r * 0.35} rx={3} ry={8} fill="#86C27E" opacity={0.8} />
    </g>
  );
}
function CactusBarrelBud() {
  return (
    <g>
      <Barrel cy={134} r={26} />
      {[-12, 0, 12].map((dx) => (
        <ellipse key={dx} cx={100 + dx} cy={113 - (dx === 0 ? 2 : 0)} rx={4} ry={6} fill="#FFB86B" stroke={INK} strokeWidth={1.3} />
      ))}
    </g>
  );
}
function CactusBarrelBloom() {
  return (
    <g>
      <Barrel cy={124} r={36} />
      {[-26, -13, 0, 13, 26].map((dx, i) => (
        <g key={dx} transform={`translate(${100 + dx} ${90 - (2 - Math.abs(i - 2)) * 3})`}>
          {[-50, -25, 0, 25, 50].map((a) => (
            <path key={a} d="M0 0 C-4 -5 -3 -12 0 -14 C3 -12 4 -5 0 0 Z" fill={i % 2 ? '#FF9A5C' : '#FFD45C'} stroke={INK} strokeWidth={1.2} transform={`rotate(${a})`} />
          ))}
          <circle r={2.6} fill="#E0464E" stroke={INK} strokeWidth={1} />
        </g>
      ))}
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
  styles: [
    {
      id: 'bunny',
      name: 'Tai thỏ',
      unlockAt: 10,
      stages: { bud: { svg: CactusBunnyBud }, bloom: { svg: CactusBunnyBloom } },
      faceAnchor: { bud: { x: 100, y: 128, scale: 0.7 }, bloom: { x: 100, y: 118, scale: 0.85 } },
    },
    {
      id: 'barrel',
      name: 'Cầu vàng',
      unlockAt: 20,
      stages: { bud: { svg: CactusBarrelBud }, bloom: { svg: CactusBarrelBloom } },
      faceAnchor: { bud: { x: 100, y: 138, scale: 0.65 }, bloom: { x: 100, y: 128, scale: 0.95 } },
    },
  ],
};
