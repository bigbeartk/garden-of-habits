import { Face, INK } from '../Face';

export function WiltedPlant() {
  return (
    <g data-testid="wilted-plant">
      <path d="M100 160 Q100 118 122 110" stroke="#A89660" strokeWidth={6} fill="none" strokeLinecap="round" />
      <path d="M100 142 Q78 136 72 156 Q90 156 100 142 Z" fill="#C9C08A" stroke={INK} strokeWidth={2} />
      <circle cx={124} cy={122} r={15} fill="#D8CF96" stroke={INK} strokeWidth={2} />
      <Face mood="sad" x={124} y={124} scale={0.5} />
    </g>
  );
}
