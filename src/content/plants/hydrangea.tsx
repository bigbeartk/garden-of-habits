import { INK } from '../Face';
import type { PlantSpecies } from '../types';
import { LeafyStem, Seed, Sprout } from './parts';

const LEAF = '#86C97A';
const STEM = '#6FAE62';
const FLORET_COLORS = ['#9EC5FF', '#B9A7F0', '#F7B8D2', '#A9D8F5'];

/** Một bông nhỏ 4 cánh của cụm cẩm tú cầu */
function Floret({ x, y, color, s = 1 }: { x: number; y: number; color: string; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[0, 90, 180, 270].map((a) => (
        <ellipse key={a} cx={0} cy={-4.2} rx={3.6} ry={4.4} fill={color} stroke={INK} strokeWidth={1} transform={`rotate(${a + 45})`} />
      ))}
      <circle r={1.6} fill="#FFF6C8" />
    </g>
  );
}

/** Lá cẩm tú cầu: to, mép răng cưa nhẹ */
function BigLeaf({ x, y, r, flip }: { x: number; y: number; r: number; flip?: boolean }) {
  return (
    <path
      d="M0 0 C -6 -10 -4 -24 8 -30 C 20 -24 22 -10 14 0 L 11 -3 L 9 1 L 6 -2 L 3 2 Z"
      fill={LEAF}
      stroke={INK}
      strokeWidth={1.8}
      strokeLinejoin="round"
      transform={`translate(${x} ${y}) rotate(${r}) scale(${flip ? -1 : 1} 1)`}
    />
  );
}

/** Các điểm đặt bông nhỏ trong một cụm tròn bán kính ~R quanh (cx, cy) */
function clusterPoints(cx: number, cy: number, R: number): [number, number][] {
  const pts: [number, number][] = [[cx, cy]];
  for (const [ring, n] of [[0.5, 6], [0.95, 11]] as const) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + ring;
      pts.push([cx + Math.cos(a) * R * ring, cy + Math.sin(a) * R * ring * 0.85]);
    }
  }
  return pts;
}

function HydrangeaSeed() {
  return <Seed color="#9C7A5B" />;
}
function HydrangeaSprout() {
  return <Sprout leaf={LEAF} stem={STEM} />;
}
function HydrangeaBud() {
  return (
    <g>
      <LeafyStem top={94} leaf={LEAF} stem={STEM} />
      <BigLeaf x={86} y={132} r={-50} flip />
      <BigLeaf x={114} y={128} r={50} />
      <circle cx={100} cy={82} r={19} fill="#D8EFC8" stroke={INK} strokeWidth={2} />
      {clusterPoints(100, 82, 15).map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.6} fill={i % 3 ? '#BFE3A8' : '#E6F4DA'} stroke={INK} strokeWidth={0.8} />
      ))}
    </g>
  );
}
function HydrangeaBloom() {
  return (
    <g>
      <LeafyStem top={104} leaf={LEAF} stem={STEM} />
      <BigLeaf x={84} y={138} r={-55} flip />
      <BigLeaf x={116} y={134} r={55} />
      <ellipse cx={100} cy={80} rx={36} ry={31} fill="#C8D9FF" stroke={INK} strokeWidth={2} />
      {clusterPoints(100, 80, 30).map(([x, y], i) => (
        <Floret key={i} x={x} y={y} color={FLORET_COLORS[i % FLORET_COLORS.length]} s={1.05} />
      ))}
    </g>
  );
}

export const hydrangea: PlantSpecies = {
  id: 'hydrangea',
  name: 'Cẩm tú cầu',
  defaultPotId: 'blue-ceramic',
  stages: {
    seed: { svg: HydrangeaSeed },
    sprout: { svg: HydrangeaSprout },
    bud: { svg: HydrangeaBud },
    bloom: { svg: HydrangeaBloom },
  },
  faceAnchor: {
    seed: { x: 100, y: 149, scale: 0.55 },
    sprout: { x: 100, y: 122, scale: 0.6 },
    bud: { x: 100, y: 84, scale: 0.5 },
    bloom: { x: 100, y: 84, scale: 0.75 },
  },
  greetings: ['Một chùm cẩm tú cầu xinh xắn chào bạn nè 💙', 'Mỗi bông nhỏ là một lời chúc cho bạn hôm nay!'],
  praises: ['Thêm một bông nhỏ nở trên chùm hoa của bạn 💐'],
};
