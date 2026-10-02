import { Face, INK } from '../Face';

export function SleepingSeed() {
  return (
    <g data-testid="sleeping-seed">
      <ellipse cx={100} cy={138} rx={22} ry={17} fill="#C99A6B" stroke={INK} strokeWidth={2} />
      <Face mood="sleep" x={100} y={135} scale={0.6} />
      <rect x={66} y={146} width={68} height={24} rx={12} fill="#E3D9FF" stroke={INK} strokeWidth={2} />
      <path d="M72 158 h56" stroke="#CFC2F5" strokeWidth={2} strokeDasharray="4 4" />
      <ellipse cx={80} cy={150} rx={7} ry={5} fill="#C99A6B" stroke={INK} strokeWidth={2} />
      <ellipse cx={120} cy={150} rx={7} ry={5} fill="#C99A6B" stroke={INK} strokeWidth={2} />
      <g className="zzz" fill="#8B7BC8" fontFamily="'Baloo 2', sans-serif" fontWeight={700}>
        <text x={128} y={118} fontSize={14}>z</text>
        <text x={140} y={102} fontSize={18}>z</text>
        <text x={154} y={84} fontSize={22}>Z</text>
      </g>
    </g>
  );
}
