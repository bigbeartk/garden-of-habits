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

function SmallRose({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-9 4 q-6 -2 -8 3 q5 3 8 -3 Z M9 4 q6 -2 8 3 q-5 3 -8 -3 Z" fill="#8FCB84" stroke={INK} strokeWidth={1.4} />
      <circle r={7} fill="#F27A93" stroke={INK} strokeWidth={1.6} />
      <path d="M-3 -1 q3 -4 6 0 q-3 4 -6 0" fill="none" stroke="#C94F6D" strokeWidth={1.4} />
    </g>
  );
}

export function RosePorcelainPot() {
  return (
    <BasicPot body="#FFFDF8" rim="#F7A8B8">
      <path d="M50 182 L150 182" stroke="#F6C945" strokeWidth={3} />
      <path d="M57 224 L143 224" stroke="#F6C945" strokeWidth={2.5} />
      {[60, 72, 84, 96, 108, 120, 132, 144].map((x) => <circle key={x} cx={x - 2} cy={177} r={2.2} fill="#FFFDF4" stroke="#D9C9B5" strokeWidth={1} />)}
      <SmallRose x={100} y={205} s={1} />
      <SmallRose x={72} y={210} s={0.7} />
      <SmallRose x={128} y={210} s={0.7} />
    </BasicPot>
  );
}

export function BlueCeramicPot() {
  return (
    <BasicPot body="#A9C8F0" rim="#8FB4E6">
      <path d="M52 186 q12 -8 24 0 t24 0 t24 0 t22 0" stroke="#FFFDFB" strokeWidth={3.5} fill="none" strokeLinecap="round" />
      <g fill="#FFFDFB">
        <circle cx={70} cy={208} r={3.2} />
        <circle cx={100} cy={214} r={3.2} />
        <circle cx={130} cy={208} r={3.2} />
      </g>
    </BasicPot>
  );
}

export function TinBucketPot() {
  return (
    <g data-part="pot">
      <path d="M38 168 q-12 2 -10 16" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <path d="M162 168 q12 2 10 16" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <path d="M38 168 q-12 2 -10 16" fill="none" stroke="#C9E6DF" strokeWidth={3} strokeLinecap="round" />
      <path d="M162 168 q12 2 10 16" fill="none" stroke="#C9E6DF" strokeWidth={3} strokeLinecap="round" />
      <BasicPot body="#A9D6CB" rim="#8CC4B7">
        <g stroke="#7FB5A8" strokeWidth={3}>
          <path d="M51 190 L149 190" />
          <path d="M55 212 L145 212" />
        </g>
        <g fill="#7FB5A8">
          <circle cx={62} cy={178} r={2.2} />
          <circle cx={138} cy={178} r={2.2} />
        </g>
      </BasicPot>
    </g>
  );
}

/** Chậu bê tông xám kiểu công nghiệp: thành thẳng, vết nứt, đốm rỗ */
export function ConcretePot() {
  return (
    <g data-part="pot">
      <path d="M48 160 L56 230 L144 230 L152 160 Z" fill="#A9A6A0" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M50 178 L150 178" stroke="#8E8A84" strokeWidth={2.5} />
      <g fill="#8E8A84">
        {([[70, 196], [124, 204], [92, 218], [136, 188], [66, 220]] as const).map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={2} />)}
      </g>
      <path d="M112 178 L106 192 L114 200 L108 214" fill="none" stroke="#5E5A55" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <rect x={42} y={152} width={116} height={12} rx={2} fill="#B9B6B0" stroke={INK} strokeWidth={2.5} />
      <ellipse cx={100} cy={157} rx={52} ry={3.5} fill="#7A5A3E" />
    </g>
  );
}
