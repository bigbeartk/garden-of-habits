import { INK } from '../Face';
import type { PlantSpecies } from '../types';
import { LeafyStem, Seed, Sprout } from './parts';

const LEAF = '#8FCB84';
const STEM = '#6FAE62';

function Thorns({ top }: { top: number }) {
  const ys = [top + 22, top + 42];
  return (
    <g fill={STEM} stroke={INK} strokeWidth={1.2} strokeLinejoin="round">
      {ys.map((y, i) => (i % 2 ? <path key={y} d={`M101 ${y} l7 -3 l-6 6 Z`} /> : <path key={y} d={`M99 ${y} l-7 -3 l6 6 Z`} />))}
    </g>
  );
}

function RoseSeed() {
  return <Seed color="#B07A5A" />;
}
function RoseSprout() {
  return <Sprout leaf={LEAF} stem={STEM} />;
}
function RoseBud() {
  return (
    <g>
      <LeafyStem top={90} leaf={LEAF} stem={STEM} />
      <Thorns top={90} />
      <path d="M100 58 C 84 68 86 92 100 94 C 114 92 116 68 100 58 Z" fill="#FF6F91" stroke={INK} strokeWidth={2} />
      <path d="M100 94 L 88 86 L 92 98 Z M100 94 L 112 86 L 108 98 Z" fill={LEAF} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
    </g>
  );
}
function RoseBloom() {
  return (
    <g>
      <LeafyStem top={100} leaf={LEAF} stem={STEM} />
      <Thorns top={100} />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <ellipse key={a} cx={100} cy={56} rx={14} ry={13} fill="#FF8FA8" stroke={INK} strokeWidth={1.6} transform={`rotate(${a} 100 78)`} />
      ))}
      <circle cx={100} cy={78} r={23} fill="#FF6F91" stroke={INK} strokeWidth={2} />
      <path d="M86 70 q14 -12 28 0" fill="none" stroke="#D94C6E" strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

export const rose: PlantSpecies = {
  id: 'rose',
  name: 'Hoa hồng',
  defaultPotId: 'rose-porcelain',
  stages: {
    seed: { svg: RoseSeed },
    sprout: { svg: RoseSprout },
    bud: { svg: RoseBud },
    bloom: { svg: RoseBloom },
  },
  faceAnchor: {
    seed: { x: 100, y: 149, scale: 0.55 },
    sprout: { x: 100, y: 122, scale: 0.6 },
    bud: { x: 100, y: 80, scale: 0.45 },
    bloom: { x: 100, y: 82, scale: 0.7 },
  },
  greetings: ['Một bông hồng nhỏ chào bạn nè 🌹', 'Hôm nay mình nở thật xinh vì bạn nha!'],
  praises: ['Tặng bạn một cánh hồng thơm 🌹'],
};
