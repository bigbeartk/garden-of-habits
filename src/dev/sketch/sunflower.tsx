import { INK } from '../../content/Face';
import { Cell, Row, type Look } from './kit';

/*
 * Phác thảo dáng 2 của Hướng dương theo tinh thần "hoa hướng dương kiểu game thủ thành" (10/2026):
 * đầu to tròn, hai vòng cánh ngắn bo tròn, lòng vàng nghệ trơn mang mặt, thân ngắn, hai lá to xoè sát đất.
 * Lấy cảm hứng chứ không chép nhân vật có bản quyền. Mặt vẫn dùng mặt chibi chung của app.
 * Đã chọn: G1 → dáng 2 (10 ngày) `giant` "Khổng lồ"; P1 → dáng 3 (20 ngày) `mini` "Mặt trời nhỏ" (src/content/plants/sunflower.tsx).
 */

const LEAF = '#8FD07F', LEAF_DARK = '#5FA64F', STEM = '#6CB85A';
const PETAL = '#FFD93B', PETAL_BACK = '#F5A623', DISC = '#F0B04A', DISC_RIM = '#D98B2B';

/** lá to bản sát đất, gốc ở (100, 158), xoè sang `side` */
function GroundLeaf({ side, r = 0, s = 1 }: { side: 1 | -1; r?: number; s?: number }) {
  return (
    <g transform={`translate(100 158) scale(${side * s} ${s}) rotate(${r})`}>
      <path d="M0 0 C10 -18 38 -22 54 -8 C40 4 16 8 0 0 Z" fill={LEAF} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <path d="M4 -2 C18 -8 34 -10 48 -8" stroke={LEAF_DARK} strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </g>
  );
}
function Stem({ top, curve = 6, w = 7 }: { top: number; curve?: number; w?: number }) {
  const mid = (158 + top) / 2;
  return <path d={`M100 158 C${100 - curve} ${mid + 8} ${100 + curve} ${mid - 8} 100 ${top}`} stroke={STEM} strokeWidth={w} fill="none" strokeLinecap="round" />;
}
/** đầu hoa: vòng cánh sau cam + vòng cánh trước vàng, lòng nghệ trơn bán kính r */
function Head({ x, y, r, n = 14, petal = 'oval', rot = 0 }: { x: number; y: number; r: number; n?: number; petal?: 'oval' | 'round'; rot?: number }) {
  const ring = (k: number, off: number, fill: string, len: number) =>
    Array.from({ length: k }, (_, i) => (i * 360) / k + off).map((a) =>
      petal === 'oval' ? (
        <ellipse key={`${fill}-${a}`} cx={x} cy={y - r - len * 0.55} rx={len * 0.55} ry={len} fill={fill} stroke={INK} strokeWidth={1.6} transform={`rotate(${a} ${x} ${y})`} />
      ) : (
        <circle key={`${fill}-${a}`} cx={x} cy={y - r - len * 0.35} r={len * 0.75} fill={fill} stroke={INK} strokeWidth={1.6} transform={`rotate(${a} ${x} ${y})`} />
      ),
    );
  return (
    <g transform={`rotate(${rot} ${x} ${y})`}>
      {ring(n, 180 / n, PETAL_BACK, r * 0.5)}
      {ring(n, 0, PETAL, r * 0.42)}
      <circle cx={x} cy={y} r={r + 1.5} fill={DISC_RIM} stroke={INK} strokeWidth={2.2} />
      <circle cx={x} cy={y + 1} r={r - 2} fill={DISC} />
      <ellipse cx={x - r * 0.4} cy={y - r * 0.45} rx={r * 0.22} ry={r * 0.14} fill="#fff" opacity={0.45} />
    </g>
  );
}
/** nụ: đài xanh tròn, chóp cánh vàng ló ra quanh mép */
function BudHead({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g>
      {Array.from({ length: 10 }, (_, i) => i * 36).map((a) => (
        <ellipse key={a} cx={x} cy={y - r - 3} rx={5} ry={7} fill={PETAL} stroke={INK} strokeWidth={1.4} transform={`rotate(${a} ${x} ${y})`} />
      ))}
      {[-40, 0, 40].map((a) => <path key={a} d={`M${x} ${y + r - 4} q-6 8 0 14 q6 -6 0 -14 Z`} fill={LEAF} stroke={INK} strokeWidth={1.3} transform={`rotate(${a} ${x} ${y})`} />)}
      <circle cx={x} cy={y} r={r} fill="#A9DD8E" stroke={INK} strokeWidth={2.2} />
    </g>
  );
}

const face = (x: number, y: number, r: number) => ({ x, y: y + 2, scale: r / 30 });

const V: [string, Look, Look][] = [
  ['P1 · Đầu thẳng, cánh bầu dục ✔ (`mini`, dáng 3 · 20 ngày)',
    { face: face(100, 92, 20), art: () => <g><GroundLeaf side={-1} r={-6} s={0.85} /><GroundLeaf side={1} r={-6} s={0.85} /><Stem top={100} /><BudHead x={100} y={92} r={20} /></g> },
    { face: face(100, 80, 28), art: () => <g><GroundLeaf side={-1} r={-8} /><GroundLeaf side={1} r={-8} /><Stem top={96} w={8} /><Head x={100} y={80} r={28} /></g> }],
  ['P2 · Đầu nghiêng, thân cong chữ S',
    { face: face(104, 92, 20), art: () => <g><GroundLeaf side={-1} r={-4} s={0.85} /><GroundLeaf side={1} r={-10} s={0.85} /><Stem top={100} curve={12} /><BudHead x={104} y={92} r={20} /></g> },
    { face: { ...face(106, 82, 28) }, art: () => <g><GroundLeaf side={-1} r={-4} /><GroundLeaf side={1} r={-12} /><Stem top={98} curve={14} w={8} /><Head x={106} y={82} r={28} rot={-10} /></g> }],
  ['P3 · Mũm mĩm, cánh tròn vỏ sò',
    { face: face(100, 96, 22), art: () => <g><GroundLeaf side={-1} r={-2} s={0.9} /><GroundLeaf side={1} r={-2} s={0.9} /><Stem top={110} w={9} curve={3} /><BudHead x={100} y={96} r={22} /></g> },
    { face: face(100, 86, 30), art: () => <g><GroundLeaf side={-1} r={-4} s={1.05} /><GroundLeaf side={1} r={-4} s={1.05} /><Stem top={104} w={10} curve={3} /><Head x={100} y={86} r={30} n={12} petal="round" /></g> }],
];

// ---- Dáng 3: thay cho Khổng lồ ----

const CLASSIC = '#FFD86B', CORE = '#B5835A', CLEAF = '#9AD98F', CSTEM = '#7BBF6A';
/** bông kiểu Gốc: n cánh bầu dục quanh nhị nâu bán kính r */
function Bloom({ x, y, r, n = 14, rot = 0 }: { x: number; y: number; r: number; n?: number; rot?: number }) {
  return (
    <g transform={`rotate(${rot} ${x} ${y})`}>
      {Array.from({ length: n }, (_, i) => (i * 360) / n).map((a) => (
        <ellipse key={a} cx={x} cy={y - r * 1.55} rx={r * 0.32} ry={r * 0.62} fill={CLASSIC} stroke={INK} strokeWidth={1.5} transform={`rotate(${a} ${x} ${y})`} />
      ))}
      <circle cx={x} cy={y} r={r} fill={CORE} stroke={INK} strokeWidth={2} />
      <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.18} fill="#fff" opacity={0.35} />
    </g>
  );
}
function GreenBud({ x, y, r, rot = 0 }: { x: number; y: number; r: number; rot?: number }) {
  return (
    <g transform={`rotate(${rot} ${x} ${y})`}>
      {[-50, -25, 0, 25, 50].map((a) => (
        <path key={a} d={`M${x} ${y - r - 4} q${r * 0.35} ${r * 0.5} 0 ${r * 0.8} q${-r * 0.35} ${-r * 0.3} 0 ${-r * 0.8} z`} fill={CLASSIC} stroke={INK} strokeWidth={1.4} transform={`rotate(${a} ${x} ${y})`} />
      ))}
      <circle cx={x} cy={y} r={r} fill="#B7E3A1" stroke={INK} strokeWidth={2} />
    </g>
  );
}
function CLeaf({ x, y, r, s = 1 }: { x: number; y: number; r: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path d="M0 0 Q14 -16 34 -10 Q22 8 0 0 Z" fill={CLEAF} stroke={INK} strokeWidth={2} />
      <path d="M3 -1 Q16 -6 28 -9" stroke={CSTEM} strokeWidth={1.5} fill="none" strokeLinecap="round" />
    </g>
  );
}
const stroke = (d: string, w: number) => <path d={d} stroke={CSTEM} strokeWidth={w} fill="none" strokeLinecap="round" />;

// G1 · Khổng lồ gọn: thân cao vồng nhẹ (không cuộn tròn), bông to gật đầu bên phải, lá to so le
const G1_STEM = 'M96 160 C88 112 90 58 116 42 C132 34 142 42 142 54';
const G1: [Look, Look] = [
  { face: { x: 142, y: 70, scale: 0.55 }, art: () => <g>{stroke(G1_STEM, 8)}<CLeaf x={93} y={138} r={195} s={1.1} /><CLeaf x={91} y={112} r={-25} s={1} /><CLeaf x={93} y={82} r={205} s={0.8} /><GreenBud x={142} y={70} r={18} rot={160} /></g> },
  { face: { x: 142, y: 82, scale: 0.85 }, art: () => <g>{stroke(G1_STEM, 8)}<CLeaf x={93} y={138} r={195} s={1.1} /><CLeaf x={91} y={112} r={-25} s={1} /><CLeaf x={93} y={82} r={205} s={0.8} /><Bloom x={142} y={82} r={25} n={16} rot={20} /></g> },
];

// G2 · Nhiều đầu: một thân thẳng, bông to trên đỉnh + 4 bông nhỏ mọc nhánh hai bên, dáng cột hoa
const G2_BRANCH = 'M100 160 L100 52 M100 136 C88 132 76 126 66 116 M100 122 C112 116 124 110 134 98 M100 100 C90 96 80 88 72 78 M100 90 C110 84 120 76 128 66';
const G2_SIDE: [number, number, number][] = [[64, 112, 9], [136, 94, 9], [70, 74, 8], [130, 62, 8]];
const G2: [Look, Look] = [
  { face: { x: 100, y: 48, scale: 0.45 }, art: () => <g>{stroke(G2_BRANCH, 5)}<CLeaf x={99} y={150} r={190} /><CLeaf x={101} y={146} r={-12} />{G2_SIDE.map(([x, y]) => <GreenBud key={`${x}-${y}`} x={x} y={y} r={6} />)}<GreenBud x={100} y={48} r={14} /></g> },
  { face: { x: 100, y: 46, scale: 0.6 }, art: () => <g>{stroke(G2_BRANCH, 5)}<CLeaf x={99} y={150} r={190} /><CLeaf x={101} y={146} r={-12} />{G2_SIDE.map(([x, y, r]) => <Bloom key={`${x}-${y}`} x={x} y={y} r={r} n={10} />)}<Bloom x={100} y={46} r={18} n={14} /></g> },
];

// G3 · Trong gió: thân ngả mạnh sang trái, lá bay theo gió, vài cánh hoa tung bay
const G3_STEM = 'M104 160 C108 130 98 100 78 82 C68 74 60 72 54 72';
const FLY: [number, number, number][] = [[22, 46, -40], [30, 104, 30], [14, 78, -10], [168, 40, 60]];
const G3: [Look, Look] = [
  { face: { x: 56, y: 72, scale: 0.55 }, art: () => <g>{stroke(G3_STEM, 7)}<CLeaf x={105} y={140} r={200} s={1.05} /><CLeaf x={100} y={112} r={190} s={0.95} /><CLeaf x={104} y={128} r={-30} s={0.7} /><GreenBud x={56} y={72} r={18} rot={-30} /></g> },
  { face: { x: 56, y: 72, scale: 0.75 }, art: () => (
    <g>
      {stroke(G3_STEM, 7)}
      <CLeaf x={105} y={140} r={200} s={1.05} /><CLeaf x={100} y={112} r={190} s={0.95} /><CLeaf x={104} y={128} r={-30} s={0.7} />
      {FLY.map(([x, y, r]) => <ellipse key={`${x}-${y}`} cx={x} cy={y} rx={4.5} ry={8} fill={CLASSIC} stroke={INK} strokeWidth={1.3} transform={`rotate(${r} ${x} ${y})`} />)}
      <path d="M150 64 q14 -6 26 0 M140 84 q16 -6 30 0 M156 104 q10 -4 20 0" fill="none" stroke="#BFE3F5" strokeWidth={3} strokeLinecap="round" />
      <Bloom x={56} y={72} r={22} n={13} rot={-25} />
    </g>
  ) },
];

const G: [string, [Look, Look]][] = [['G1 · Khổng lồ gọn lại ✔ (`giant`, dáng 2 · 10 ngày)', G1], ['G2 · Nhiều đầu (cột hoa)', G2], ['G3 · Trong gió', G3]];

export function SunflowerSketches() {
  return (
    <div>
      <Row title="Hướng dương · dáng 2 kiểu game thủ thành (ra chồi | ra hoa)">
        {V.flatMap(([name, bud, bloom]) => [
          <Cell key={`${name}-bud`} label={name} look={bud} potId="terracotta" />,
          <Cell key={`${name}-bloom`} label="" look={bloom} potId="terracotta" />,
        ])}
      </Row>
      <Row title="Hướng dương · dáng 3 thay Khổng lồ (ra chồi | ra hoa)">
        {G.flatMap(([name, [bud, bloom]]) => [
          <Cell key={`${name}-bud`} label={name} look={bud} potId="terracotta" />,
          <Cell key={`${name}-bloom`} label="" look={bloom} potId="terracotta" />,
        ])}
      </Row>
    </div>
  );
}
