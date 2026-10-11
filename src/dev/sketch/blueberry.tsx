import { INK, type Mood } from '../../content/Face';
import { EYES, MOUTHS, SketchFace } from './faces';
import { Cell, Row, type Look } from './kit';

/*
 * Phác thảo loài mới: Việt quất (10/2026), theo ảnh mẫu chủ repo gửi (chùm quả tím mang mặt,
 * cặp quả đôi trên thân chẻ, cây nhánh treo quả). Dấu hiệu riêng: quả tròn có "vương miện" sao 5 cánh,
 * hoa chuông trắng khi ra chồi, quả non xanh / hồng chuyển dần sang tím.
 * Dáng khác các loài đã có: chùm nho quả lổn nhổn (không phải khối cầu lá trơn của cam), thân chẻ đôi thấp,
 * cây nhánh xương (không phải tán dù của cherry). ĐÃ VÀO APP (src/content/plants/blueberry.tsx): Gốc = B2, `branchy` = B3, `cluster` = B1; chậu cat; mặt sparkle.
 * Mặt: chủ repo chọn mắt E4 (lấp lánh) + miệng M0 (cute) từ trang `faces`; đưa vào app thì cần thêm kiểu mặt này vào Face.tsx.
 */

const BARK = '#7A5238', LEAF = '#5DAE5A', LEAF_DARK = '#3E8A4A', LEAF_VEIN = '#9BD58C';
type Ripe = 'green' | 'pink' | 'blue';
const BERRY: Record<Ripe, { fill: string; shade: string; crown: string }> = {
  green: { fill: '#C9E6A6', shade: '#A6CF82', crown: '#7FAE5C' },
  pink: { fill: '#E9A8C8', shade: '#CF84AA', crown: '#A85C86' },
  blue: { fill: '#5B6FD6', shade: '#4152B0', crown: '#2E3A80' },
};

/** Vương miện sao 5 cánh ở đầu quả */
function Crown({ x, y, r, c }: { x: number; y: number; r: number; c: string }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2, rr = i % 2 ? r * 0.42 : r;
    return `${(x + Math.cos(a) * rr).toFixed(1)} ${(y + Math.sin(a) * rr).toFixed(1)}`;
  });
  return <path d={`M${pts.join(' L')} Z`} fill={c} stroke={INK} strokeWidth={Math.max(0.8, r * 0.18)} strokeLinejoin="round" />;
}

/** Quả việt quất: tròn, lớp phấn sáng nhạt ở nửa trên, vương miện; `crown` = vị trí vương miện ('top' cho quả mang mặt) */
function Berry({ x, y, r, ripe = 'blue', crown = 'side', cute = false }: { x: number; y: number; r: number; ripe?: Ripe; crown?: 'top' | 'side' | 'none'; cute?: boolean }) {
  const c = BERRY[ripe];
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={c.fill} stroke={INK} strokeWidth={Math.max(1.5, r * 0.08)} />
      <path d={`M${x - r * 0.7} ${y + r * 0.45} Q${x} ${y + r * 0.95} ${x + r * 0.7} ${y + r * 0.45}`} fill="none" stroke={c.shade} strokeWidth={r * 0.14} strokeLinecap="round" opacity={0.75} />
      <ellipse cx={x - r * 0.42} cy={y - r * 0.42} rx={r * 0.24} ry={r * 0.14} fill="#fff" opacity={0.65} transform={`rotate(-35 ${x - r * 0.42} ${y - r * 0.42})`} />
      {crown === 'top' && <Crown x={x} y={y - r * 0.98} r={r * 0.3} c={c.crown} />}
      {crown === 'side' && <Crown x={x + r * 0.35} y={y - r * 0.2} r={r * 0.28} c={c.crown} />}
      {cute && (
        <g>
          <ellipse cx={x - r * 0.5} cy={y + r * 0.25} rx={r * 0.2} ry={r * 0.12} fill="#FF9FB2" opacity={0.85} />
          <ellipse cx={x + r * 0.5} cy={y + r * 0.25} rx={r * 0.2} ry={r * 0.12} fill="#FF9FB2" opacity={0.85} />
          <circle cx={x - r * 0.3} cy={y} r={r * 0.11} fill={INK} />
          <circle cx={x + r * 0.3} cy={y} r={r * 0.11} fill={INK} />
          <path d={`M${x - r * 0.15} ${y + r * 0.22} q${r * 0.15} ${r * 0.2} ${r * 0.3} 0`} fill="none" stroke={INK} strokeWidth={Math.max(1, r * 0.08)} strokeLinecap="round" />
        </g>
      )}
    </g>
  );
}

/** Lá bầu dục nhọn, gân giữa; gốc ở (x,y), mọc theo trục -y xoay `rot` */
function Leaf({ x, y, rot, s = 1, light = false }: { x: number; y: number; rot: number; s?: number; light?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M0 0 C-9 -6 -8 -20 0 -26 C8 -20 9 -6 0 0 Z" fill={light ? '#8FD08A' : LEAF} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M0 -3 L0 -21" stroke={LEAF_VEIN} strokeWidth={1.4} strokeLinecap="round" />
    </g>
  );
}

/** Hoa chuông trắng úp xuống (đặc trưng việt quất), treo ở (x,y) */
function Bell({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 -6 L0 -1" stroke={LEAF_DARK} strokeWidth={1.4} strokeLinecap="round" />
      <path d="M-4.5 0 Q-5 7 -3.5 9 L-2 7.5 L0 9.5 L2 7.5 L3.5 9 Q5 7 4.5 0 Q0 -3 -4.5 0 Z" fill="#FFF8F0" stroke={INK} strokeWidth={1} strokeLinejoin="round" />
      <path d="M-4.6 1 Q0 -1.5 4.6 1" fill="none" stroke="#F4B6C8" strokeWidth={1.4} />
    </g>
  );
}

function Trunk({ d, w = 7 }: { d: string; w?: number }) {
  return (
    <>
      <path d={d} fill="none" stroke={INK} strokeWidth={w + 3.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={BARK} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

// ---- B1 · Chùm quả (ảnh mẫu 1): thân ngắn, một chùm quả lổn nhổn có lá chĩa ra quanh mép, quả to mang mặt giữa ----
const CLUSTER: [number, number, number][] = [
  [72, 88, 13], [128, 86, 13], [86, 66, 12], [116, 64, 12], [100, 52, 11], [66, 112, 11], [134, 110, 11], [82, 124, 10], [118, 124, 10],
];
function Cluster({ stage }: { stage: 'bud' | 'bloom' }) {
  const bloom = stage === 'bloom';
  return (
    <g>
      <Trunk d="M100 160 Q97 142 100 124 M100 140 Q90 132 84 126 M101 136 Q112 130 118 124" w={6} />
      {[[60, 70, -60], [52, 104, -95], [140, 70, 60], [148, 104, 95], [100, 44, 0], [76, 50, -30], [124, 48, 30], [62, 132, -130], [138, 132, 130]].map(([x, y, r]) => (
        <Leaf key={`${x}-${y}`} x={x + (x < 100 ? 8 : x > 100 ? -8 : 0)} y={y + 4} rot={r} s={1.05} />
      ))}
      {CLUSTER.map(([x, y, r], i) => (
        <Berry key={i} x={x} y={y} r={bloom ? r : r * 0.8} ripe={bloom ? 'blue' : i % 3 === 0 ? 'pink' : 'green'} crown={bloom && i < 2 ? 'side' : bloom ? 'side' : 'none'} />
      ))}
      {!bloom && <><Bell x={60} y={124} /><Bell x={142} y={122} /><Bell x={100} y={128} s={1.1} /></>}
      <Berry x={100} y={bloom ? 94 : 96} r={bloom ? 25 : 19} ripe={bloom ? 'blue' : 'green'} crown="none" />
    </g>
  );
}

// ---- B2 · Cặp đôi (ảnh mẫu 2): thân chẻ đôi thấp, hai quả to trên hai nhánh (một mang mặt app, một mặt mini), lá đôi trên đỉnh ----
function Twin({ stage }: { stage: 'bud' | 'bloom' }) {
  const bloom = stage === 'bloom';
  const ripe: Ripe = bloom ? 'blue' : 'green';
  return (
    <g>
      <Trunk d="M100 160 Q100 140 100 128 Q92 112 80 98 M100 128 Q112 108 126 84" w={5} />
      <Leaf x={78} y={74} rot={-35} s={1.2} />
      <Leaf x={80} y={74} rot={20} s={0.95} light />
      <Leaf x={128} y={58} rot={35} s={1.2} />
      <Leaf x={126} y={58} rot={-20} s={0.95} light />
      <Leaf x={100} y={134} rot={-70} s={0.8} />
      <Leaf x={101} y={130} rot={70} s={0.8} />
      <Berry x={128} y={80} r={bloom ? 19 : 14} ripe={bloom ? 'blue' : 'pink'} crown="top" cute={bloom} />
      <Berry x={80} y={100} r={bloom ? 26 : 19} ripe={ripe} crown="top" />
      {bloom
        ? <><Berry x={84} y={152} r={8} crown="side" /><Berry x={100} y={154} r={8.5} crown="side" /><Berry x={116} y={152} r={8} crown="side" /></>
        : <><Bell x={110} y={122} /><Bell x={92} y={118} s={0.9} /></>}
    </g>
  );
}

// ---- B3 · Cây nhánh (ảnh mẫu 3–4): thân nâu chẻ nhiều nhánh xoè hình chữ V, quả treo dọc nhánh, quả to mang mặt ở chạc giữa ----
const BRANCHES = 'M100 160 Q99 132 100 112 M100 132 Q80 118 62 92 M100 124 Q122 108 140 84 M100 112 Q92 84 82 56 M100 112 Q110 82 120 52 M72 106 Q58 100 46 102 M128 100 Q144 96 154 100';
function Branchy({ stage }: { stage: 'bud' | 'bloom' }) {
  const bloom = stage === 'bloom';
  const leaves: [number, number, number][] = [[62, 92, -40], [140, 84, 40], [82, 56, -15], [120, 52, 15], [46, 102, -80], [154, 100, 80], [90, 74, -60], [112, 72, 60], [70, 76, 30], [132, 70, -30]];
  const berries: [number, number, number][] = [[62, 106, 9], [52, 112, 8], [142, 98, 9], [150, 110, 8], [80, 70, 8], [122, 66, 8], [88, 50, 7], [114, 46, 7], [70, 88, 7], [132, 82, 7]];
  return (
    <g>
      <Trunk d={BRANCHES} w={4.5} />
      {leaves.map(([x, y, r]) => <Leaf key={`${x}-${y}`} x={x} y={y} rot={r} s={0.85} light={(x + y) % 3 === 0} />)}
      {berries.map(([x, y, r], i) => bloom
        ? <Berry key={i} x={x} y={y} r={r} ripe={i % 4 === 3 ? 'pink' : 'blue'} crown="side" />
        : i % 2 ? <Bell key={i} x={x} y={y - 4} /> : <Berry key={i} x={x} y={y} r={r * 0.75} ripe="green" crown="none" />)}
      <Berry x={100} y={bloom ? 104 : 106} r={bloom ? 22 : 16} ripe={bloom ? 'blue' : 'green'} crown="top" />
    </g>
  );
}

const E4 = EYES.find((e) => e.id === 'E4')!, M0 = MOUTHS.find((m) => m.id === 'M0')!;
/** Mặt việt quất: mắt E4 + miệng M0 */
const bbFace = { faceName: 'E4 + M0', drawFace: (f: { x: number; y: number; scale: number }, mood: Mood) => <SketchFace eyes={E4} mouth={M0} mood={mood} {...f} /> };

const RAW_LOOKS: [string, Look, Look][] = [
  ['B1 · Chùm quả', { face: { x: 100, y: 98, scale: 0.5 }, art: () => <Cluster stage="bud" /> },
    { face: { x: 100, y: 96, scale: 0.62 }, art: () => <Cluster stage="bloom" /> }],
  ['B2 · Cặp đôi', { face: { x: 80, y: 102, scale: 0.5 }, art: () => <Twin stage="bud" /> },
    { face: { x: 80, y: 102, scale: 0.65 }, art: () => <Twin stage="bloom" /> }],
  ['B3 · Cây nhánh', { face: { x: 100, y: 108, scale: 0.42 }, art: () => <Branchy stage="bud" /> },
    { face: { x: 100, y: 106, scale: 0.55 }, art: () => <Branchy stage="bloom" /> }],
];

export const BLUEBERRY_LOOKS: [string, Look, Look][] = RAW_LOOKS.map(([n, bud, bloom]) => [n, { ...bud, ...bbFace }, { ...bloom, ...bbFace }]);

export function BlueberrySketches() {
  return (
    <div>
      <Row title="Việt quất · 3 bản (ra chồi | ra hoa), Chậu mèo · mặt E4 + M0, nét Thường">
        {BLUEBERRY_LOOKS.flatMap(([name, bud, bloom]) => [
          <Cell key={`${name}-bud`} label={name} look={bud} potId="cat" mood="normal" />,
          <Cell key={`${name}-bloom`} label="" look={bloom} potId="cat" mood="normal" />,
        ])}
      </Row>
      <Row title="B1 trong các chậu còn trống (cà chua cũng đang chờ một trong ba chậu này)">
        {['cat', 'pink-cup', 'glass-bowl'].map((p) => <Cell key={p} label={p} look={BLUEBERRY_LOOKS[0][2]} potId={p} mood="normal" />)}
      </Row>
    </div>
  );
}
