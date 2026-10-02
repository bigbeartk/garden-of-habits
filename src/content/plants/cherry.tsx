import { INK } from '../Face';
import type { PlantSpecies } from '../types';
import { Canopy, Seed, Sprout, Trunk } from './parts';

function CherryPair({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M${x} ${y - 14} Q${x - 6} ${y - 6} ${x - 6} ${y} M${x} ${y - 14} Q${x + 6} ${y - 6} ${x + 6} ${y}`} stroke="#7BBF6A" strokeWidth={1.8} fill="none" />
      <circle cx={x - 6} cy={y + 3} r={6} fill="#FF6F91" stroke={INK} strokeWidth={1.6} />
      <circle cx={x + 6} cy={y + 3} r={6} fill="#FF6F91" stroke={INK} strokeWidth={1.6} />
      <circle cx={x - 8} cy={y + 1} r={1.6} fill="#fff" />
      <circle cx={x + 4} cy={y + 1} r={1.6} fill="#fff" />
    </g>
  );
}

function CherrySeed() {
  return <Seed color="#D9B08C" />;
}
function CherrySprout() {
  return <Sprout leaf="#A3D99A" stem="#7BBF6A" />;
}
function CherryBud() {
  return (
    <g>
      <Trunk />
      <Canopy fill="#A3D99A" />
      {[[68, 86], [132, 90], [96, 62], [118, 116], [80, 112]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={4} fill="#FFC4D6" stroke={INK} strokeWidth={1} />)}
    </g>
  );
}
function CherryBloom() {
  return (
    <g>
      <Trunk />
      <Canopy fill="#FFC4D6" />
      {[[70, 78], [130, 80], [104, 60], [84, 104]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={3} fill="#FFFFFF" />
      ))}
      <CherryPair x={66} y={110} />
      <CherryPair x={136} y={112} />
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
    bud: { x: 100, y: 94, scale: 0.75 },
    bloom: { x: 100, y: 94, scale: 0.75 },
  },
  greetings: ['Hôm nay mình hồng hào lắm nè 🍒', 'Một quả cherry cho mỗi việc hoàn thành!'],
  praises: ['Thưởng bạn một quả cherry nè 🍒'],
};
