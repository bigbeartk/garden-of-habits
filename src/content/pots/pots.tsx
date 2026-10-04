import { useId } from 'react';
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

/** Bể kính tròn: bình thuỷ tinh trong suốt, nhìn thấy lớp đất, cát, sỏi màu bên trong */
export function GlassBowlPot() {
  const clip = `glass-bowl-${useId().replace(/[^\w-]/g, '')}`;
  const BOWL = 'M62 156 C34 176 38 232 100 234 C162 232 166 176 138 156 Z';
  return (
    <g data-part="pot">
      <defs>
        <clipPath id={clip}>
          <path d={BOWL} />
        </clipPath>
      </defs>
      <path d={BOWL} fill="#EAF6FF" />
      <g clipPath={`url(#${clip})`}>
        <rect x={30} y={157} width={140} height={30} fill="#8B5E3C" />
        <path d="M30 187 q18 -5 35 0 t35 0 t35 0 t35 0 V206 H30 Z" fill="#F3D9A4" />
        <path d="M30 206 q18 4 35 0 t35 0 t35 0 t35 0 V240 H30 Z" fill="#CDEFE3" />
        <g stroke={INK} strokeWidth={1.2}>
          {([[56, 216, '#FFD6DE'], [74, 224, '#E3D9FF'], [92, 214, '#FFF1C1'], [110, 226, '#FFD6DE'], [128, 216, '#D4ECFF'], [144, 222, '#E3D9FF'], [86, 230, '#D4ECFF'], [120, 232, '#FFF1C1']] as const).map(
            ([x, y, c]) => <ellipse key={`${x}-${y}`} cx={x} cy={y} rx={6} ry={4.5} fill={c} />,
          )}
        </g>
      </g>
      <path d={BOWL} fill="#BFE3FF" fillOpacity={0.12} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M52 186 C48 200 52 214 62 222" stroke="#fff" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.8} />
      <path d="M142 176 C146 182 148 188 148 194" stroke="#fff" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.7} />
      <ellipse cx={100} cy={156} rx={40} ry={5} fill="#D4ECFF" fillOpacity={0.5} stroke={INK} strokeWidth={2.5} />
      <ellipse cx={100} cy={157} rx={34} ry={3} fill="#8B5E3C" />
    </g>
  );
}

/** Chậu mèo mướp: thân tròn, tai nhô trên vành, mặt mèo nhắm mắt cười, hai chân trước */
export function CatPot() {
  const FUR = '#FFCF9E';
  const STRIPE = '#F0A65E';
  return (
    <g data-part="pot" strokeLinejoin="round">
      <g stroke={INK} strokeWidth={2.5}>
        <path d="M40 166 L38 124 L78 154 Z" fill={FUR} />
        <path d="M160 166 L162 124 L122 154 Z" fill={FUR} />
      </g>
      <path d="M46 156 L45 136 L64 152 Z M154 156 L155 136 L136 152 Z" fill="#FFB3C4" />
      <path d="M44 160 C40 208 60 234 100 234 C140 234 160 208 156 160 Z" fill={FUR} stroke={INK} strokeWidth={2.5} />
      <g stroke={STRIPE} strokeWidth={4} strokeLinecap="round" fill="none">
        <path d="M90 166 L92 176 M100 166 L100 178 M110 166 L108 176" />
        <path d="M48 186 L60 188 M152 186 L140 188 M50 202 L60 202 M150 202 L140 202" />
      </g>
      <g stroke={INK} strokeWidth={2.2} fill="none" strokeLinecap="round">
        <path d="M74 194 q6 -6 12 0" />
        <path d="M114 194 q6 -6 12 0" />
        <path d="M94 206 q3 4 6 0 q3 4 6 0" />
        <path d="M62 202 L80 204 M62 210 L80 208 M138 202 L120 204 M138 210 L120 208" strokeWidth={1.5} />
      </g>
      <path d="M97 200 L103 200 L100 203 Z" fill="#F27A93" stroke={INK} strokeWidth={1.2} />
      <ellipse cx={68} cy={200} rx={5} ry={3} fill="#FF9FB2" opacity={0.75} />
      <ellipse cx={132} cy={200} rx={5} ry={3} fill="#FF9FB2" opacity={0.75} />
      <g fill={FUR} stroke={INK} strokeWidth={2.2}>
        <ellipse cx={80} cy={230} rx={13} ry={7} />
        <ellipse cx={120} cy={230} rx={13} ry={7} />
      </g>
      <path d="M76 228 L76 233 M84 228 L84 233 M116 228 L116 233 M124 228 L124 233" stroke={INK} strokeWidth={1.4} strokeLinecap="round" />
      <ellipse cx={100} cy={160} rx={56} ry={6} fill="#FFDDB8" stroke={INK} strokeWidth={2.5} />
      <ellipse cx={100} cy={159} rx={50} ry={4} fill="#8B5E3C" />
    </g>
  );
}
