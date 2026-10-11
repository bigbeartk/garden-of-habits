import { PlantScene } from '../../components/PlantScene';
import { INK, type Mood } from '../../content/Face';
import { EYES, MOUTHS, SketchFace } from './faces';
import { Cell, Row, type Look } from './kit';

/*
 * Phác thảo loài mới: Cúc hoạ mi (10/2026), theo ảnh mẫu chủ repo gửi (bông cúc trắng cánh dài,
 * nhuỵ vàng mang mặt; bó cúc nhiều bông).
 * LƯU Ý DÁNG: ảnh mẫu chính (một bông to trên thân cao) TRÙNG dáng Hướng dương ("thân cao, một bông tròn
 * ở đỉnh"), trái quy tắc mỗi loài khác silhouette. D1 vẽ theo mẫu để so; D2 (bó ba bông) và D3 (cây đèn nến)
 * là dáng chưa loài nào dùng. Chưa chọn bản nào, chưa đưa vào app.
 * Mặt: chủ repo chọn mắt E5 (hí hửng ^ ^) + miệng M3 (nhỏ) từ trang `faces`; đưa vào app thì cần thêm kiểu mặt này vào Face.tsx.
 */

const STEM = '#6FAE5F', LEAF = '#5E9E4F', LEAF_VEIN = '#9BD58C';
const PETAL = '#FFFDF7', PETAL_SHADE = '#E9E4D8', CENTER = '#F2B84B', CENTER_DOT = '#D99A2B';

/** Bông cúc nhìn thẳng: cánh trắng dài bo tròn quanh nhuỵ vàng. r = bán kính nhuỵ */
function Daisy({ x, y, r, n = 14, tilt = 0 }: { x: number; y: number; r: number; n?: number; tilt?: number }) {
  const len = r * 2.1, w = r * 0.55;
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt})`}>
      {Array.from({ length: n }, (_, i) => (360 / n) * i + (i % 2 ? 6 : 0)).map((a, i) => (
        <ellipse key={a} cx={0} cy={-(r * 0.75 + len / 2)} rx={w} ry={len / 2} fill={i % 2 ? PETAL_SHADE : PETAL} stroke={INK} strokeWidth={Math.max(1, r * 0.09)} transform={`rotate(${a})`} />
      ))}
      <circle r={r} fill={CENTER} stroke={INK} strokeWidth={Math.max(1.2, r * 0.1)} />
      {r < 14 && [[-0.35, -0.3], [0.3, -0.2], [0, 0.35], [-0.3, 0.3], [0.35, 0.3]].map(([dx, dy]) => (
        <circle key={`${dx}${dy}`} cx={dx * r} cy={dy * r} r={r * 0.09} fill={CENTER_DOT} />
      ))}
    </g>
  );
}

/** Nụ cúc: đài xanh tròn ôm, mép cánh trắng hé ở đỉnh. r = bán kính nụ */
function DaisyBud({ x, y, r, open = 0.5 }: { x: number; y: number; r: number; open?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {[-50, -25, 0, 25, 50].map((a) => (
        <ellipse key={a} cx={0} cy={-r * (0.9 + open * 0.5)} rx={r * 0.32} ry={r * (0.5 + open * 0.4)} fill={PETAL} stroke={INK} strokeWidth={Math.max(1, r * 0.08)} transform={`rotate(${a})`} />
      ))}
      <circle r={r} fill="#8FCB72" stroke={INK} strokeWidth={Math.max(1.2, r * 0.09)} />
      <path d={`M${-r * 0.8} ${-r * 0.2} q${r * 0.4} ${-r * 0.5} ${r * 0.8} 0 q${r * 0.4} ${-r * 0.5} ${r * 0.8} 0`} fill="none" stroke="#5E9E4F" strokeWidth={Math.max(1, r * 0.08)} strokeLinecap="round" />
    </g>
  );
}

/** Lá cúc mẫu: lá bầu dục dài, gân giữa. Gốc ở (x,y), xoay rot */
function Leaf({ x, y, rot, s = 1 }: { x: number; y: number; rot: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M0 0 C-10 -8 -9 -26 0 -32 C9 -26 10 -8 0 0 Z" fill={LEAF} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M0 -4 Q-1 -16 0 -27" fill="none" stroke={LEAF_VEIN} strokeWidth={1.4} strokeLinecap="round" />
    </g>
  );
}
function Stem({ d, w = 4.5 }: { d: string; w?: number }) {
  return (
    <>
      <path d={d} fill="none" stroke={INK} strokeWidth={w + 3} strokeLinecap="round" />
      <path d={d} fill="none" stroke={STEM} strokeWidth={w} strokeLinecap="round" />
    </>
  );
}

// ---- D1 · Theo mẫu: một bông to trên thân, hai lá chĩa lên (TRÙNG dáng Hướng dương, chỉ để so) ----
function Single({ stage }: { stage: 'bud' | 'bloom' }) {
  const bloom = stage === 'bloom';
  return (
    <g>
      <Stem d={`M100 160 Q97 ${bloom ? 120 : 130} 100 ${bloom ? 72 : 92}`} w={5} />
      <Leaf x={99} y={132} rot={-58} s={1.05} />
      <Leaf x={100} y={124} rot={58} s={1.05} />
      {bloom ? <Daisy x={100} y={66} r={17} n={14} /> : <DaisyBud x={100} y={88} r={15} open={0.3} />}
    </g>
  );
}

// ---- D2 · Bó cúc (ảnh mẫu 3): ba thân mảnh xoè từ gốc, một bông to giữa mang mặt, hai bông nhỏ lệch hai bên, nụ ----
function Bouquet({ stage }: { stage: 'bud' | 'bloom' }) {
  const bloom = stage === 'bloom';
  return (
    <g>
      <Stem d="M100 160 Q98 120 102 88" w={4} />
      <Stem d="M100 158 Q82 130 62 110" w={3.4} />
      <Stem d="M101 158 Q122 136 140 122" w={3.4} />
      <Stem d="M100 150 Q118 120 126 82" w={2.6} />
      <Leaf x={100} y={150} rot={-75} s={0.85} />
      <Leaf x={101} y={146} rot={72} s={0.85} />
      <Leaf x={80} y={132} rot={-30} s={0.65} />
      <Leaf x={120} y={138} rot={35} s={0.65} />
      {bloom ? (
        <>
          <Daisy x={62} y={106} r={9} n={12} tilt={-15} />
          <Daisy x={140} y={118} r={8} n={12} tilt={20} />
          <DaisyBud x={126} y={78} r={6} open={0.7} />
          <Daisy x={102} y={78} r={14} n={14} />
        </>
      ) : (
        <>
          <DaisyBud x={62} y={106} r={8} open={0.3} />
          <DaisyBud x={140} y={118} r={7} open={0.2} />
          <DaisyBud x={126} y={80} r={5} open={0} />
          <DaisyBud x={102} y={86} r={13} open={0.5} />
        </>
      )}
    </g>
  );
}

// ---- D3 · Cây đèn nến: một thân giữa, các nhánh ngang đối xứng uốn lên như chân nến, mỗi đầu một bông nhỏ; bông to mang mặt trên đỉnh ----
function Candelabra({ stage }: { stage: 'bud' | 'bloom' }) {
  const bloom = stage === 'bloom';
  const arms: [number, number, number][] = [[46, 126, 138], [154, 126, 138], [64, 100, 112], [136, 100, 112]];
  return (
    <g>
      <Stem d="M100 160 L100 58" w={4.5} />
      {arms.map(([x, top, base]) => (
        <Stem key={`${x}-${top}`} w={3.2} d={`M100 ${base + 10} Q${x} ${base + 10} ${x} ${top}`} />
      ))}
      {[[100, 150, -80], [100, 150, 80], [100, 116, -60], [100, 116, 60]].map(([x, y, r]) => <Leaf key={`${y}-${r}`} x={x} y={y} rot={r} s={0.6} />)}
      {arms.map(([x, top], i) => bloom
        ? <Daisy key={i} x={x} y={top - 4} r={i < 2 ? 7 : 8} n={12} />
        : <DaisyBud key={i} x={x} y={top - 2} r={i < 2 ? 6 : 7} open={0.2} />)}
      {bloom ? <Daisy x={100} y={52} r={13} n={14} /> : <DaisyBud x={100} y={58} r={12} open={0.4} />}
    </g>
  );
}

const E5 = EYES.find((e) => e.id === 'E5')!, M3 = MOUTHS.find((m) => m.id === 'M3')!;
/** Mặt cúc: mắt E5 + miệng M3 */
const daisyFace = { faceName: 'E5 + M3', drawFace: (f: { x: number; y: number; scale: number }, mood: Mood) => <SketchFace eyes={E5} mouth={M3} mood={mood} {...f} /> };

const RAW_LOOKS: [string, Look, Look][] = [
  ['D1 · Theo mẫu (trùng dáng Hướng dương)', { face: { x: 100, y: 89, scale: 0.6 }, art: () => <Single stage="bud" /> },
    { face: { x: 100, y: 67, scale: 0.72 }, art: () => <Single stage="bloom" /> }],
  ['D2 · Bó cúc', { face: { x: 102, y: 87, scale: 0.55 }, art: () => <Bouquet stage="bud" /> },
    { face: { x: 102, y: 79, scale: 0.6 }, art: () => <Bouquet stage="bloom" /> }],
  ['D3 · Cây đèn nến', { face: { x: 100, y: 59, scale: 0.5 }, art: () => <Candelabra stage="bud" /> },
    { face: { x: 100, y: 53, scale: 0.55 }, art: () => <Candelabra stage="bloom" /> }],
];

export const DAISY_LOOKS: [string, Look, Look][] = RAW_LOOKS.map(([n, bud, bloom]) => [n, { ...bud, ...daisyFace }, { ...bloom, ...daisyFace }]);

export function DaisySketches() {
  return (
    <div>
      <Row title="Cúc hoạ mi · 3 bản (ra chồi | ra hoa), Bể kính · mặt E5 + M3, nét Thường">
        {DAISY_LOOKS.flatMap(([name, bud, bloom]) => [
          <Cell key={`${name}-bud`} label={name} look={bud} potId="glass-bowl" mood="normal" />,
          <Cell key={`${name}-bloom`} label="" look={bloom} potId="glass-bowl" mood="normal" />,
        ])}
      </Row>
      <Row title="So dáng: D1 cạnh Hướng dương thật (ra hoa), gần như cùng silhouette">
        <Cell label="D1 · Cúc theo mẫu" look={DAISY_LOOKS[0][2]} potId="terracotta" mood="normal" />
        <figure style={{ margin: 0 }}>
          <figcaption style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, minHeight: 18 }}>✅ Hướng dương</figcaption>
          <div style={{ width: 170, height: 204, background: '#fff', borderRadius: 12 }}>
            <PlantScene plantId="sunflower" potId="terracotta" stage="bloom" styleId="base" specialId={null} mood="normal" />
          </div>
        </figure>
      </Row>
      <Row title="D2 trong các chậu còn trống (cà chua, việt quất cũng đang chờ ba chậu này)">
        {['glass-bowl', 'pink-cup', 'cat'].map((p) => <Cell key={p} label={p} look={DAISY_LOOKS[1][2]} potId={p} mood="normal" />)}
      </Row>
    </div>
  );
}
