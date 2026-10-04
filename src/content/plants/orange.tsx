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

export const orange: PlantSpecies = {
  id: 'orange',
  name: 'Cây cam',
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
  greetings: ['Vitamin C cho ngày mới nè! 🍊', 'Làm xong việc là có cam ngọt ăn đó!'],
  praises: ['Ngọt như cam luôn đó 🍊'],
  taps: ['Thơm mùi cam không? 🍊', 'Mình mọng nước vitamin C nè 🍊'],
};
