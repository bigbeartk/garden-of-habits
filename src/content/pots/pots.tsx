import { INK } from '../Face';
import { BasicPot } from './BasicPot';

export function TerracottaPot() {
  return (
    <BasicPot body="#F2A88A" rim="#E38E6E">
      <path d="M52 194 L148 194" stroke="#E38E6E" strokeWidth={5} strokeLinecap="round" />
    </BasicPot>
  );
}

export function PolkaPot() {
  const dots: [number, number][] = [[70, 186], [100, 200], [130, 186], [80, 216], [120, 216]];
  return (
    <BasicPot body="#FFFDF8" rim="#FFE3EA">
      {dots.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={6} fill="#FFB8C8" />)}
    </BasicPot>
  );
}

export function MintPot() {
  return (
    <BasicPot body="#BDE8D6" rim="#A6DCC6">
      <path d="M54 200 q12 -10 24 0 t24 0 t24 0 t22 0" stroke="#fff" strokeWidth={4} fill="none" strokeLinecap="round" />
    </BasicPot>
  );
}

export function RattanPot() {
  return (
    <BasicPot body="#EBCB9B" rim="#DDB57E">
      <g stroke="#C99E66" strokeWidth={2.5}>
        {[182, 196, 210, 224].map((y) => <path key={y} d={`M52 ${y} L148 ${y}`} />)}
        {[64, 80, 96, 112, 128, 144].map((x) => <path key={x} d={`M${x} 172 L${x - 4} 228`} />)}
      </g>
    </BasicPot>
  );
}

export function WoodPot() {
  return (
    <g data-part="pot">
      <rect x={44} y={164} width={112} height={66} rx={8} fill="#DDB48A" stroke={INK} strokeWidth={2.5} />
      <g stroke="#C29467" strokeWidth={2.5}>
        <path d="M44 186 L156 186" />
        <path d="M44 208 L156 208" />
      </g>
      <rect x={38} y={152} width={124} height={16} rx={6} fill="#CFA172" stroke={INK} strokeWidth={2.5} />
      <ellipse cx={100} cy={157} rx={56} ry={4} fill="#8B5E3C" />
    </g>
  );
}

export function PinkCupPot() {
  return (
    <g data-part="pot">
      <path d="M152 178 q26 4 22 24 q-4 18 -26 14" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <path d="M152 178 q26 4 22 24 q-4 18 -26 14" fill="none" stroke="#FFB3C4" strokeWidth={5} strokeLinecap="round" />
      <BasicPot body="#FFC9D6" rim="#FFB3C4">
        <path d="M100 210 C88 198 92 188 100 196 C108 188 112 198 100 210 Z" fill="#FF8FA8" />
      </BasicPot>
    </g>
  );
}
