import { INK } from '../../content/Face';
import { Cell, Pair, Row, type Look } from './kit';

/*
 * Phác thảo loài mới: Cà chua (10/2026), theo ảnh mẫu chủ repo gửi (quả to mang mặt giữa cây,
 * thân cong móc qua đỉnh quả, lá kép răng cưa, quả nhỏ treo bên dưới).
 * Dáng khác các loài đã có: cụm quả tròn mang mặt giữa một bụi lá kép xoè, thân móc câu.
 * ĐÃ VÀO APP (src/content/plants/tomato.tsx): Gốc = T1, dáng `arch` = T2, `staked` = T3; chậu pink-cup; mặt doll.
 */

const STEM = '#5E9E4F', STEM_DARK = '#4A8540', LEAF = '#5DAE5A', LEAF_VEIN = '#9BD58C';
const RED = '#EF4B3F', RED_SHADE = '#C9352C', GREEN_FRUIT = '#A8D88A', GREEN_SHADE = '#86BE6A';
const ORANGE_FRUIT = '#F7963A', ORANGE_SHADE = '#D9772A', FLOWER = '#FFD84D';

type Ripe = 'green' | 'orange' | 'red';
const FRUIT: Record<Ripe, [string, string]> = { green: [GREEN_FRUIT, GREEN_SHADE], orange: [ORANGE_FRUIT, ORANGE_SHADE], red: [RED, RED_SHADE] };

/** Lá chét răng cưa, gốc ở (0,0), mọc theo trục -y, dài `len` */
function leafletPath(len: number) {
  const n = 3, pts: string[] = [];
  const w = (t: number) => Math.sin(Math.PI * Math.min(1, t * 1.1)) * len * 0.46;
  for (let i = 0; i <= n * 2; i++) {
    const t = i / (n * 2);
    pts.push(`${(-w(t) * (i % 2 ? 0.8 : 1)).toFixed(1)} ${(-t * len).toFixed(1)}`);
  }
  for (let i = n * 2; i >= 0; i--) {
    const t = i / (n * 2);
    pts.push(`${(w(t) * (i % 2 ? 0.8 : 1)).toFixed(1)} ${(-t * len).toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
}
function Leaflet({ x, y, rot, len }: { x: number; y: number; rot: number; len: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={leafletPath(len)} fill={LEAF} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
      <path d={`M0 -2 L0 ${-len * 0.8}`} stroke={LEAF_VEIN} strokeWidth={1.4} strokeLinecap="round" />
    </g>
  );
}
/** Lá kép cà chua: cuống + lá chét ngọn + 2 cặp lá chét hai bên. Gốc ở (x,y), xoay `rot` độ */
function TomatoLeaf({ x, y, rot, s = 1 }: { x: number; y: number; rot: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M0 0 Q2 -14 0 -28" fill="none" stroke={STEM} strokeWidth={2.6} strokeLinecap="round" />
      <Leaflet x={0} y={-8} rot={-62} len={15} />
      <Leaflet x={0} y={-8} rot={62} len={15} />
      <Leaflet x={0} y={-18} rot={-48} len={18} />
      <Leaflet x={1} y={-18} rot={48} len={18} />
      <Leaflet x={0} y={-27} rot={0} len={22} />
    </g>
  );
}

/** Đài quả: ngôi sao 5 lá đài xanh xoăn + cuống ngắn */
function Calyx({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[-80, -35, 0, 35, 80].map((a) => (
        <path key={a} d="M0 0 Q-3 6 0 13 Q3 6 0 0 Z" transform={`rotate(${a + 180}) scale(1 ${Math.abs(a) > 60 ? 0.8 : 1})`} fill={STEM} stroke={INK} strokeWidth={1.3} strokeLinejoin="round" />
      ))}
      <path d="M0 1 L0 -7" stroke={STEM_DARK} strokeWidth={3.2} strokeLinecap="round" />
    </g>
  );
}

/** Quả cà chua: tròn hơi dẹt, hai rãnh múi mờ trên đỉnh, vệt bóng; `cute` = mặt mini (quả phụ) */
function Tomato({ x, y, r, ripe = 'red', cute = false }: { x: number; y: number; r: number; ripe?: Ripe; cute?: boolean }) {
  const [fill, shade] = FRUIT[ripe];
  return (
    <g>
      <ellipse cx={x} cy={y} rx={r * 1.08} ry={r * 0.95} fill={fill} stroke={INK} strokeWidth={Math.max(1.6, r * 0.075)} />
      <path d={`M${x - r * 0.75} ${y + r * 0.45} Q${x} ${y + r * 0.95} ${x + r * 0.75} ${y + r * 0.45}`} fill="none" stroke={shade} strokeWidth={r * 0.12} strokeLinecap="round" opacity={0.7} />
      <path d={`M${x - r * 0.35} ${y - r * 0.85} q${-r * 0.05} ${r * 0.25} ${-r * 0.1} ${r * 0.4} M${x + r * 0.35} ${y - r * 0.85} q${r * 0.05} ${r * 0.25} ${r * 0.1} ${r * 0.4}`} fill="none" stroke={shade} strokeWidth={Math.max(1, r * 0.06)} strokeLinecap="round" opacity={0.6} />
      <ellipse cx={x - r * 0.5} cy={y - r * 0.42} rx={r * 0.2} ry={r * 0.12} fill="#fff" opacity={0.75} transform={`rotate(-35 ${x - r * 0.5} ${y - r * 0.42})`} />
      {ripe === 'red' && r >= 20 && [[0.45, 0.1], [0.55, 0.35], [0.3, 0.5], [0.65, -0.1]].map(([dx, dy]) => (
        <circle key={`${dx}${dy}`} cx={x + r * dx} cy={y + r * dy} r={r * 0.035} fill="#FFD0C8" />
      ))}
      <Calyx x={x} y={y - r * 0.9} s={r / 22} />
      {cute && (
        <g>
          <ellipse cx={x - r * 0.5} cy={y + r * 0.2} rx={r * 0.2} ry={r * 0.12} fill="#FF9FB2" opacity={0.8} />
          <ellipse cx={x + r * 0.5} cy={y + r * 0.2} rx={r * 0.2} ry={r * 0.12} fill="#FF9FB2" opacity={0.8} />
          <circle cx={x - r * 0.3} cy={y - r * 0.05} r={r * 0.1} fill={INK} />
          <circle cx={x + r * 0.3} cy={y - r * 0.05} r={r * 0.1} fill={INK} />
          <path d={`M${x - r * 0.15} ${y + r * 0.18} q${r * 0.15} ${r * 0.18} ${r * 0.3} 0`} fill="none" stroke={INK} strokeWidth={Math.max(1, r * 0.08)} strokeLinecap="round" />
        </g>
      )}
    </g>
  );
}

/** Hoa cà chua: 5 cánh nhọn vàng hơi rủ */
function Flower({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[0, 72, 144, 216, 288].map((a) => <path key={a} d="M0 0 Q-2.6 -4 0 -8 Q2.6 -4 0 0 Z" fill={FLOWER} stroke={INK} strokeWidth={0.9} transform={`rotate(${a})`} />)}
      <circle r={1.8} fill="#F2A33A" stroke={INK} strokeWidth={0.6} />
    </g>
  );
}
/** cuống treo quả / hoa từ cành */
function Hang({ d }: { d: string }) {
  return <path d={d} fill="none" stroke={STEM} strokeWidth={2.4} strokeLinecap="round" />;
}

// ---- T1 · Theo mẫu: thân móc câu qua đỉnh quả to mang mặt, lá kép xoè, quả nhỏ treo dưới ----
function Hook({ stage }: { stage: 'bud' | 'bloom' }) {
  const bloom = stage === 'bloom';
  return (
    <g>
      {/* thân chính: mọc lên sau quả, móc qua đỉnh rồi rủ xuống đài quả */}
      <path d="M100 160 Q98 136 112 116 Q126 92 122 60 Q118 40 104 42 Q94 44 96 56" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
      <path d="M100 160 Q98 136 112 116 Q126 92 122 60 Q118 40 104 42 Q94 44 96 56" fill="none" stroke={STEM} strokeWidth={4.5} strokeLinecap="round" />
      {/* cành bên mang lá */}
      <Hang d="M106 128 Q80 122 66 104" />
      <Hang d="M114 112 Q136 106 146 88" />
      <Hang d="M122 70 Q140 56 146 40" />
      <Hang d="M118 50 Q96 30 72 40" />
      <TomatoLeaf x={66} y={104} rot={-58} s={1.05} />
      <TomatoLeaf x={146} y={88} rot={62} s={1.05} />
      <TomatoLeaf x={146} y={40} rot={40} s={0.9} />
      <TomatoLeaf x={72} y={40} rot={-50} s={0.9} />
      <TomatoLeaf x={104} y={42} rot={8} s={0.75} />
      {/* quả phụ treo dưới */}
      <Hang d="M104 132 Q80 132 74 128" />
      <Hang d="M108 124 Q132 124 136 120" />
      {bloom ? (
        <>
          <Tomato x={74} y={136} r={11} cute />
          <Tomato x={138} y={128} r={11} cute />
        </>
      ) : (
        <>
          <Flower x={74} y={130} s={1.1} />
          <Flower x={136} y={122} s={1.1} />
          <Flower x={60} y={86} />
          <Flower x={150} y={66} />
        </>
      )}
      {/* quả chính mang mặt */}
      <Tomato x={96} y={bloom ? 88 : 92} r={bloom ? 30 : 22} ripe={bloom ? 'red' : 'green'} />
    </g>
  );
}

// ---- T2 · Cành cong ôm quả (ảnh mẫu thứ 2): một cành cong vòng từ gốc trái sang phải, quả to treo dưới vòm ----
function Arch({ stage }: { stage: 'bud' | 'bloom' }) {
  const bloom = stage === 'bloom';
  const d = 'M104 160 Q102 134 84 112 Q58 80 78 52 Q100 26 132 40 Q156 52 152 84';
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={8.5} strokeLinecap="round" />
      <path d={d} fill="none" stroke={STEM} strokeWidth={5} strokeLinecap="round" />
      <TomatoLeaf x={84} y={112} rot={-100} s={1} />
      <TomatoLeaf x={70} y={70} rot={-60} s={0.95} />
      <TomatoLeaf x={100} y={40} rot={-10} s={0.9} />
      <TomatoLeaf x={140} y={44} rot={40} s={0.9} />
      <TomatoLeaf x={152} y={84} rot={150} s={0.95} />
      {bloom ? (
        <>
          <Flower x={60} y={48} />
          <Flower x={120} y={26} />
          <Flower x={160} y={64} />
        </>
      ) : (
        <>
          <Flower x={60} y={48} />
          <Flower x={120} y={26} />
          <Flower x={160} y={64} />
          <Flower x={150} y={108} s={1.1} />
        </>
      )}
      <Hang d="M114 36 Q112 50 112 62" />
      <Tomato x={112} y={bloom ? 94 : 86} r={bloom ? 30 : 22} ripe={bloom ? 'red' : 'green'} />
    </g>
  );
}

// ---- T3 · Cọc tre (ảnh mẫu thứ 3): thân thẳng buộc vào cọc, lá kép hai bên, quả mọc so le, quả to mang mặt trên đỉnh ----
function Staked({ stage }: { stage: 'bud' | 'bloom' }) {
  const bloom = stage === 'bloom';
  return (
    <g>
      <path d="M90 160 L90 26" stroke={INK} strokeWidth={7} strokeLinecap="round" />
      <path d="M90 160 L90 26" stroke="#E8D29A" strokeWidth={4} strokeLinecap="round" />
      {[60, 96, 132].map((y) => <path key={y} d={`M87 ${y} L87 ${y + 4} M93 ${y} L93 ${y + 4}`} stroke="#C9AE6E" strokeWidth={1.2} />)}
      <path d="M102 160 Q106 110 100 60" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
      <path d="M102 160 Q106 110 100 60" fill="none" stroke={STEM} strokeWidth={4.5} strokeLinecap="round" />
      {[[94, 128], [92, 92]].map(([x, y]) => <ellipse key={y} cx={x + 3} cy={y} rx={7} ry={2.6} fill="#F2C76B" stroke={INK} strokeWidth={1.2} />)}
      <TomatoLeaf x={104} y={140} rot={-75} s={0.95} />
      <TomatoLeaf x={105} y={118} rot={70} s={1} />
      <TomatoLeaf x={103} y={96} rot={-65} s={0.95} />
      <TomatoLeaf x={102} y={74} rot={58} s={0.9} />
      {bloom ? (
        <>
          <Hang d="M104 126 Q122 128 130 134" />
          <Tomato x={132} y={142} r={12} ripe="orange" cute />
          <Hang d="M103 106 Q86 110 72 116" />
          <Tomato x={68} y={124} r={12} cute />
        </>
      ) : (
        <>
          <Hang d="M104 126 Q122 128 130 132" />
          <Flower x={132} y={134} s={1.1} />
          <Hang d="M103 106 Q86 110 72 114" />
          <Flower x={70} y={116} s={1.1} />
        </>
      )}
      <Tomato x={100} y={bloom ? 50 : 52} r={bloom ? 28 : 21} ripe={bloom ? 'red' : 'green'} />
    </g>
  );
}

export const TOMATO_LOOKS: [string, Look, Look][] = [
  ['T1 · Theo mẫu (thân móc câu)', { face: { x: 96, y: 94, scale: 0.55 }, art: () => <Hook stage="bud" /> },
    { face: { x: 96, y: 92, scale: 0.75 }, art: () => <Hook stage="bloom" /> }],
  ['T2 · Cành cong ôm quả', { face: { x: 112, y: 88, scale: 0.55 }, art: () => <Arch stage="bud" /> },
    { face: { x: 112, y: 98, scale: 0.75 }, art: () => <Arch stage="bloom" /> }],
  ['T3 · Cọc tre', { face: { x: 100, y: 54, scale: 0.52 }, art: () => <Staked stage="bud" /> },
    { face: { x: 100, y: 54, scale: 0.7 }, art: () => <Staked stage="bloom" /> }],
];

export function TomatoSketches() {
  return (
    <div>
      <Row title="Cà chua · 3 bản (ra chồi | ra hoa), chậu Cốc hồng">
        {TOMATO_LOOKS.map(([name, bud, bloom]) => <Pair key={name} name={name} looks={[bud, bloom]} potId="pink-cup" />)}
      </Row>
      <Row title="T1 trong các chậu còn trống (mỗi loài cần chậu mặc định riêng)">
        {['pink-cup', 'cat', 'glass-bowl'].map((p) => <Cell key={p} label={p} look={TOMATO_LOOKS[0][2]} potId={p} />)}
      </Row>
    </div>
  );
}
