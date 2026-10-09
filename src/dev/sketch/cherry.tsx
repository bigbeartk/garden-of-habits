import { INK } from '../../content/Face';
import { Cell, Row, type Look } from './kit';

/*
 * Phác thảo dáng 2 của Cherry (10/2026), thay cho Rủ cũ (mặt trên quả bóng nhỏ, cành mảnh như dây).
 * Đã chọn: C3 → dáng 2 `weeping` "Bụi" (src/content/plants/cherry.tsx). Bản Rủ cũ lưu ở cuối file.
 */

const BARK = '#8A5A3B', PINK = '#FFC9DA', PINK_DEEP = '#FFB3C8', LEAF = '#7CC36E', BUD_GREEN = '#B5E3A8';

function Bloomlet({ x, y, c = PINK, r = 3.2 }: { x: number; y: number; c?: string; r?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={0} cy={-r * 0.9} r={r * 0.75} fill={c} stroke={INK} strokeWidth={0.9} transform={`rotate(${a})`} />)}
      <circle r={r * 0.45} fill="#FFF6B0" />
    </g>
  );
}
function CherryPair({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 -22 Q-7 -8 -6 0 M0 -22 Q6 -8 6 0" stroke="#5E9E4F" strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <path d="M0 -22 q6 -5 11 -1 q-6 4 -11 1 Z" fill={LEAF} stroke={INK} strokeWidth={1.1} />
      <circle cx={-6} cy={4} r={6.5} fill="#E8354F" stroke={INK} strokeWidth={1.7} />
      <circle cx={6} cy={4} r={6.5} fill="#E8354F" stroke={INK} strokeWidth={1.7} />
      <circle cx={-8} cy={1.5} r={1.7} fill="#fff" />
      <circle cx={4} cy={1.5} r={1.7} fill="#fff" />
    </g>
  );
}
function Petals({ pts }: { pts: [number, number, number][] }) {
  return (
    <g fill={PINK_DEEP} stroke={INK} strokeWidth={0.8}>
      {pts.map(([x, y, r]) => <path key={`${x}-${y}`} d={`M${x} ${y} q3 -5 6 0 q-3 4 -6 0 Z`} transform={`rotate(${r} ${x} ${y})`} />)}
    </g>
  );
}
const qpt = (a: number[], c: number[], b: number[], t: number) => [
  (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t ** 2 * b[0],
  (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t ** 2 * b[1],
];
/** khối mây tròn: viền dày rồi phủ nền để chỉ còn viền ngoài */
function Cloud({ puffs, fill }: { puffs: [number, number, number][]; fill: string }) {
  return (
    <g>
      {puffs.map(([x, y, r]) => <circle key={`o${x}-${y}`} cx={x} cy={y} r={r} fill={fill} stroke={INK} strokeWidth={4} />)}
      {puffs.map(([x, y, r]) => <circle key={`i${x}-${y}`} cx={x} cy={y} r={r} fill={fill} />)}
    </g>
  );
}

// ---- C1 · Rủ đầy đặn: vòm hoa tròn mang mặt trên đỉnh, chuỗi bông rủ xuống từ mép vòm như liễu ----
const DOME: [number, number, number][] = [[100, 58, 26], [76, 70, 18], [124, 70, 18], [88, 50, 16], [112, 50, 16]];
const STRANDS: { a: number[]; c: number[]; b: number[] }[] = [
  { a: [62, 74], c: [44, 90], b: [42, 132] },
  { a: [72, 84], c: [60, 104], b: [58, 140] },
  { a: [138, 74], c: [156, 90], b: [158, 132] },
  { a: [128, 84], c: [140, 104], b: [142, 140] },
];
function Weeping({ flower }: { flower: boolean }) {
  return (
    <g>
      <path d="M94 160 Q97 120 97 80 L103 80 Q103 120 106 160 Z" fill={BARK} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      {STRANDS.map(({ a, c, b }) => (
        <g key={b.join()}>
          <path d={`M${a[0]} ${a[1]} Q${c[0]} ${c[1]} ${b[0]} ${b[1]}`} fill="none" stroke={flower ? '#7A4E33' : '#7BBF6A'} strokeWidth={2} strokeLinecap="round" />
          {[0.25, 0.45, 0.65, 0.85, 1].map((t) => {
            const [x, y] = qpt(a, c, b, t);
            return flower ? <Bloomlet key={t} x={x} y={y} c={t > 0.6 ? PINK_DEEP : PINK} r={3.6} /> : <ellipse key={t} cx={x} cy={y} rx={2.8} ry={4.2} fill={BUD_GREEN} stroke={INK} strokeWidth={0.9} />;
          })}
        </g>
      ))}
      <Cloud puffs={DOME} fill={flower ? PINK : BUD_GREEN} />
      {flower && [[78, 66], [122, 66], [96, 40], [112, 76], [84, 80]].map(([x, y]) => <Bloomlet key={`${x}-${y}`} x={x} y={y} c="#FF9FBC" r={3} />)}
    </g>
  );
}

// ---- C2 · Cherry đôi khổng lồ: một cặp cherry to trên hai cuống, lá ở chỗ chụm; mặt trên quả trước ----
function GiantPair({ ripe }: { ripe: boolean }) {
  const red = ripe ? '#E8354F' : '#A8D88A', rim = ripe ? '#C02640' : '#86BE6A';
  const [r, lx, rx2, cy] = ripe ? [30, 76, 132, 124] : [20, 82, 122, 132];
  return (
    <g>
      <path d={`M104 ${ripe ? 40 : 66} C96 ${ripe ? 60 : 84} 84 ${cy - r - 18} ${lx} ${cy - r + 4} M104 ${ripe ? 40 : 66} C114 ${ripe ? 64 : 88} ${rx2 + 4} ${cy - r - 14} ${rx2} ${cy - r + 4}`} fill="none" stroke="#5E9E4F" strokeWidth={4} strokeLinecap="round" />
      <path d={`M104 ${ripe ? 40 : 66} c10 -14 32 -14 40 -4 c-12 12 -30 12 -40 4 Z`} fill={LEAF} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <path d={`M106 ${ripe ? 39 : 65} c10 -6 22 -7 34 -4`} fill="none" stroke="#5E9E4F" strokeWidth={1.4} strokeLinecap="round" />
      <circle cx={rx2} cy={cy - 6} r={r * 0.92} fill={red} stroke={INK} strokeWidth={2.2} />
      <path d={`M${rx2 - r * 0.6} ${cy + r * 0.5} q${r * 0.6} ${r * 0.35} ${r * 1.2} 0`} fill="none" stroke={rim} strokeWidth={2} strokeLinecap="round" />
      <circle cx={lx} cy={cy} r={r} fill={red} stroke={INK} strokeWidth={2.4} />
      <ellipse cx={lx - r * 0.45} cy={cy - r * 0.45} rx={r * 0.2} ry={r * 0.13} fill="#fff" opacity={0.7} transform={`rotate(-30 ${lx - r * 0.45} ${cy - r * 0.45})`} />
      <ellipse cx={rx2 - r * 0.4} cy={cy - 6 - r * 0.42} rx={r * 0.16} ry={r * 0.1} fill="#fff" opacity={0.6} />
    </g>
  );
}

// ---- C3 · Bụi cherry thấp: bụi lá tròn thấp đầy quả cherry đôi và vài bông, mặt giữa bụi ----
const BUSH: [number, number, number][] = [[100, 112, 34], [68, 128, 24], [132, 128, 24], [84, 100, 20], [116, 100, 20]];
function Bush({ ripe }: { ripe: boolean }) {
  return (
    <g>
      <Cloud puffs={BUSH} fill={ripe ? '#9ED68E' : BUD_GREEN} />
      {[[62, 120], [76, 98], [124, 98], [140, 122], [102, 88]].map(([x, y]) => <Bloomlet key={`${x}-${y}`} x={x} y={y} c={ripe ? '#FFE0EA' : '#FFE9F0'} r={3.4} />)}
      {ripe && <><CherryPair x={58} y={138} s={0.9} /><CherryPair x={142} y={138} s={0.9} /><CherryPair x={80} y={152} s={0.8} /><CherryPair x={122} y={150} s={0.8} /></>}
    </g>
  );
}

const C: [string, Look, Look][] = [
  ['C1 · Rủ đầy đặn (vòm hoa mang mặt)', { face: { x: 100, y: 62, scale: 0.55 }, art: () => <Weeping flower={false} /> },
    { face: { x: 100, y: 62, scale: 0.55 }, art: () => <g><Weeping flower /><CherryPair x={42} y={146} s={0.9} /><CherryPair x={158} y={146} s={0.9} /><Petals pts={[[30, 110, -30], [170, 112, 25], [120, 150, 60]]} /></g> }],
  ['C2 · Cherry đôi khổng lồ', { face: { x: 82, y: 134, scale: 0.42 }, art: () => <GiantPair ripe={false} /> },
    { face: { x: 76, y: 128, scale: 0.62 }, art: () => <GiantPair ripe /> }],
  ['C3 · Bụi cherry thấp ✔ (dáng 2 `weeping`)', { face: { x: 100, y: 118, scale: 0.55 }, art: () => <Bush ripe={false} /> },
    { face: { x: 100, y: 118, scale: 0.6 }, art: () => <Bush ripe /> }],
];

// ---- Lưu trữ: dáng 2 Rủ cũ (thân cao thẳng, cành vồng rồi rủ như đài phun nước, chỏm tròn mang mặt) ----
const WEEP: { c: number[]; b: number[] }[] = [
  { c: [56, 30], b: [40, 128] }, { c: [144, 30], b: [160, 128] }, { c: [72, 40], b: [62, 138] },
  { c: [128, 40], b: [138, 138] }, { c: [86, 44], b: [82, 118] }, { c: [114, 44], b: [118, 118] },
];
function OldWeepingTree({ flower }: { flower: boolean }) {
  const top = [100, 56];
  return (
    <g>
      <path d="M95 160 Q98 110 98 60 L102 60 Q102 110 105 160 Z" fill={BARK} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      {WEEP.map(({ c, b }) => (
        <path key={b.join()} d={`M${top[0]} ${top[1]} Q${c[0]} ${c[1]} ${b[0]} ${b[1]}`} fill="none" stroke={flower ? '#7A4E33' : '#7BBF6A'} strokeWidth={2.2} strokeLinecap="round" />
      ))}
      {WEEP.flatMap(({ c, b }) => [0.3, 0.45, 0.6, 0.75, 0.9].map((t) => {
        const [x, y] = qpt(top, c, b, t);
        return flower
          ? <Bloomlet key={`${b.join()}-${t}`} x={x} y={y} c={t > 0.6 ? PINK_DEEP : PINK} />
          : <ellipse key={`${b.join()}-${t}`} cx={x} cy={y} rx={2.6} ry={4} fill={BUD_GREEN} stroke={INK} strokeWidth={0.9} />;
      }))}
      <circle cx={100} cy={52} r={17} fill={flower ? PINK : BUD_GREEN} stroke={INK} strokeWidth={2.4} />
    </g>
  );
}
const OLD_WEEPING: [Look, Look] = [
  { face: { x: 100, y: 53, scale: 0.42 }, art: () => <OldWeepingTree flower={false} /> },
  { face: { x: 100, y: 53, scale: 0.42 }, art: () => <g><OldWeepingTree flower /><CherryPair x={40} y={142} /><CherryPair x={160} y={142} /><Petals pts={[[48, 128, -30], [152, 132, 25], [118, 146, 60]]} /></g> },
];

export function CherrySketches() {
  return (
    <div>
      <Row title="Cherry · dáng 2 thay Rủ (ra chồi | ra hoa)">
        {C.flatMap(([name, bud, bloom]) => [
          <Cell key={`${name}-bud`} label={name} look={bud} potId="polka" />,
          <Cell key={`${name}-bloom`} label="" look={bloom} potId="polka" />,
        ])}
      </Row>
      <Row title="Cherry · lưu trữ: dáng 2 Rủ cũ">
        <Cell label="Rủ cũ (đã thay bằng Bụi)" look={OLD_WEEPING[0]} potId="polka" />
        <Cell label="" look={OLD_WEEPING[1]} potId="polka" />
      </Row>
    </div>
  );
}
