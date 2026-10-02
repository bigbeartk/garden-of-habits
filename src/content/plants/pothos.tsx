import type { PlantSpecies } from '../types';
import { HeartLeaf, Seed, Sprout } from './parts';

const STEM = '#7BBF6A';

function PothosSeed() {
  return <Seed color="#8A6A4F" />;
}
function PothosSprout() {
  return <Sprout leaf="#8FD08A" stem={STEM} />;
}
function PothosBud() {
  return (
    <g>
      <path d="M100 160 Q90 124 100 100" stroke={STEM} strokeWidth={5} fill="none" strokeLinecap="round" />
      <HeartLeaf x={78} y={130} s={1.3} r={-30} />
      <HeartLeaf x={122} y={120} s={1.3} r={30} />
      <HeartLeaf x={100} y={92} s={1.8} />
    </g>
  );
}
function PothosBloom() {
  return (
    <g>
      <path d="M100 160 Q88 120 100 92" stroke={STEM} strokeWidth={5} fill="none" strokeLinecap="round" />
      <path d="M70 158 Q48 176 46 214" stroke={STEM} strokeWidth={4} fill="none" strokeLinecap="round" />
      <path d="M130 158 Q152 176 154 214" stroke={STEM} strokeWidth={4} fill="none" strokeLinecap="round" />
      <HeartLeaf x={46} y={214} s={0.9} r={10} />
      <HeartLeaf x={154} y={214} s={0.9} r={-10} />
      <HeartLeaf x={66} y={138} s={1.4} r={-40} />
      <HeartLeaf x={134} y={134} s={1.4} r={40} />
      <HeartLeaf x={76} y={108} s={1.5} r={-20} />
      <HeartLeaf x={124} y={104} s={1.5} r={20} />
      <HeartLeaf x={100} y={84} s={2.2} />
    </g>
  );
}

export const pothos: PlantSpecies = {
  id: 'pothos',
  name: 'Trầu bà',
  defaultPotId: 'mint',
  stages: {
    seed: { svg: PothosSeed },
    sprout: { svg: PothosSprout },
    bud: { svg: PothosBud },
    bloom: { svg: PothosBloom },
  },
  faceAnchor: {
    seed: { x: 100, y: 149, scale: 0.55 },
    sprout: { x: 100, y: 122, scale: 0.6 },
    bud: { x: 100, y: 90, scale: 0.5 },
    bloom: { x: 100, y: 82, scale: 0.6 },
  },
  greetings: ['Lá hình trái tim tặng bạn nè 💚', 'Mình lớn chậm mà chắc, giống bạn đó!'],
};
