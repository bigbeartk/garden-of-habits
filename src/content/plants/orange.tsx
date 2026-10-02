import { INK } from '../Face';
import type { PlantSpecies } from '../types';
import { Canopy, Seed, Sprout, Trunk } from './parts';

const GREEN = '#93D18A';

function Blossom({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={0} cy={-4} r={3} fill="#FFFFFF" transform={`rotate(${a})`} />)}
      <circle r={2} fill="#FFE066" />
    </g>
  );
}

function Orange({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={9} fill="#FFB25B" stroke={INK} strokeWidth={1.8} />
      <path d={`M${x} ${y - 9} q4 -5 9 -3 q-4 5 -9 3`} fill={GREEN} stroke={INK} strokeWidth={1.2} />
    </g>
  );
}

function OrangeSeed() {
  return <Seed color="#E9D7A8" />;
}
function OrangeSprout() {
  return <Sprout leaf={GREEN} stem="#7BBF6A" />;
}
function OrangeBud() {
  return (
    <g>
      <Trunk />
      <Canopy fill={GREEN} />
      {[[70, 84], [130, 88], [92, 64], [120, 112]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={3.5} fill="#FFFFFF" stroke={INK} strokeWidth={1} />)}
    </g>
  );
}
function OrangeBloom() {
  return (
    <g>
      <Trunk />
      <Canopy fill={GREEN} />
      {[[70, 80], [134, 84], [112, 62], [82, 116]].map(([x, y]) => <Blossom key={`${x}-${y}`} x={x} y={y} />)}
      <Orange x={64} y={104} />
      <Orange x={136} y={108} />
      <Orange x={118} y={124} />
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
    bud: { x: 100, y: 94, scale: 0.75 },
    bloom: { x: 100, y: 94, scale: 0.75 },
  },
  greetings: ['Vitamin C cho ngày mới nè! 🍊', 'Làm xong việc là có cam ngọt ăn đó!'],
  praises: ['Ngọt như cam luôn đó 🍊'],
};
