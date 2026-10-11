import { INK } from '../Face';
import type { PlantSpecies } from '../types';
import { Seed, Sprout } from './parts';

/**
 * Dâu tây (loài khoá, mở bằng ngày đạt): quả dâu hình giọt hạt vàng, hoa trắng, lá ba chét răng cưa.
 * Hình chép từ src/dev/sketch/strawberry.tsx (Gốc = S3 dâu khổng lồ làm thân, dáng `patch` = S2 bụi thấp
 * (lá to hơn bản phác thảo), dáng `twig` = S1 cành treo quả). Chậu mặc định: Giỏ đan `basket`.
 */

const STEM = '#5DAE5A', LEAF = '#4FA65B', LEAF_LIGHT = '#8FD497', LEAF_VEIN = '#9BD58C';
type Ripe = 'white' | 'blush' | 'red';
const FRUIT: Record<Ripe, { fill: string; shade: string; seed: string }> = {
  white: { fill: '#EEF3D2', shade: '#D5DFAE', seed: '#B9C77A' },
  blush: { fill: '#FFB3A8', shade: '#F28A7E', seed: '#F7E08A' },
  red: { fill: '#F0433A', shade: '#C9302A', seed: '#FFE08A' },
};

/** Đài dâu: các lá đài nhọn xanh xoè ra từ đỉnh quả + cuống ngắn. w = bề rộng quả */
function Calyx({ x, y, w }: { x: number; y: number; w: number }) {
  const n = 6;
  return (
    <g transform={`translate(${x} ${y})`}>
      {Array.from({ length: n }, (_, i) => -70 + (140 / (n - 1)) * i).map((a) => (
        <path key={a} d={`M0 0 Q${-w * 0.07} ${w * 0.16} 0 ${w * 0.3} Q${w * 0.07} ${w * 0.16} 0 0 Z`} fill={LEAF} stroke={INK} strokeWidth={Math.max(1, w * 0.035)} strokeLinejoin="round" transform={`rotate(${a + 180}) scale(1 ${Math.abs(a) > 40 ? 0.85 : 1})`} />
      ))}
      <path d={`M0 1 L0 ${-w * 0.14}`} stroke="#3E8A4A" strokeWidth={Math.max(2, w * 0.07)} strokeLinecap="round" />
    </g>
  );
}

/** Quả dâu: hình giọt / tim ngược, hạt vàng, vệt bóng, đài trên đỉnh. (x,y) = tâm, w = bề rộng */
function Berry({ x, y, w, ripe = 'red', cute = false }: { x: number; y: number; w: number; ripe?: Ripe; cute?: boolean }) {
  const c = FRUIT[ripe], h = w * 1.12, top = y - h * 0.45, bot = y + h * 0.55;
  const d = `M${x} ${top + h * 0.06} C${x - w * 0.3} ${top - h * 0.06} ${x - w * 0.56} ${top + h * 0.1} ${x - w * 0.52} ${y} C${x - w * 0.48} ${y + h * 0.3} ${x - w * 0.15} ${bot - h * 0.02} ${x} ${bot} C${x + w * 0.15} ${bot - h * 0.02} ${x + w * 0.48} ${y + h * 0.3} ${x + w * 0.52} ${y} C${x + w * 0.56} ${top + h * 0.1} ${x + w * 0.3} ${top - h * 0.06} ${x} ${top + h * 0.06} Z`;
  const seeds: [number, number][] = [[-0.3, -0.12], [0, -0.2], [0.3, -0.12], [-0.38, 0.12], [-0.12, 0.05], [0.14, 0.05], [0.38, 0.12], [-0.22, 0.3], [0.04, 0.3], [0.24, 0.3], [-0.05, 0.48]];
  return (
    <g>
      <path d={d} fill={c.fill} stroke={INK} strokeWidth={Math.max(1.5, w * 0.05)} strokeLinejoin="round" />
      <path d={`M${x + w * 0.42} ${y + h * 0.05} Q${x + w * 0.32} ${y + h * 0.36} ${x + w * 0.06} ${bot - h * 0.1}`} fill="none" stroke={c.shade} strokeWidth={w * 0.08} strokeLinecap="round" opacity={0.7} />
      {seeds.map(([dx, dy]) => (
        <ellipse key={`${dx}${dy}`} cx={x + dx * w} cy={y + dy * h} rx={w * 0.03} ry={w * 0.05} fill={c.seed} transform={`rotate(${dx * 40} ${x + dx * w} ${y + dy * h})`} />
      ))}
      <ellipse cx={x - w * 0.28} cy={y - h * 0.12} rx={w * 0.08} ry={w * 0.14} fill="#fff" opacity={0.6} transform={`rotate(25 ${x - w * 0.28} ${y - h * 0.12})`} />
      <Calyx x={x} y={top + h * 0.02} w={w} />
      {cute && (
        <g>
          <ellipse cx={x - w * 0.24} cy={y + h * 0.1} rx={w * 0.09} ry={w * 0.055} fill="#FF9FB2" opacity={0.9} />
          <ellipse cx={x + w * 0.24} cy={y + h * 0.1} rx={w * 0.09} ry={w * 0.055} fill="#FF9FB2" opacity={0.9} />
          <circle cx={x - w * 0.14} cy={y - h * 0.02} r={w * 0.05} fill={INK} />
          <circle cx={x + w * 0.14} cy={y - h * 0.02} r={w * 0.05} fill={INK} />
          <path d={`M${x - w * 0.07} ${y + h * 0.1} q${w * 0.07} ${w * 0.08} ${w * 0.14} 0`} fill="none" stroke={INK} strokeWidth={Math.max(1, w * 0.035)} strokeLinecap="round" />
        </g>
      )}
    </g>
  );
}

/** Hoa dâu: 5 cánh trắng tròn, nhuỵ vàng */
function Flower({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={0} cy={-5} r={4.2} fill="#FFFFFF" stroke={INK} strokeWidth={1} transform={`rotate(${a})`} />)}
      <circle r={3.4} fill="#FFD84D" stroke={INK} strokeWidth={0.9} />
    </g>
  );
}

/** Lá ba chét răng cưa trên cuống: gốc (x,y), xoay rot, cỡ s */
function TriLeaf({ x, y, rot, s = 1, light = false }: { x: number; y: number; rot: number; s?: number; light?: boolean }) {
  const leaflet = 'M0 0 C-8 -3 -11 -12 -8 -19 L-6 -17 L-4 -21 L-1 -19 L0 -22 L1 -19 L4 -21 L6 -17 L8 -19 C11 -12 8 -3 0 0 Z';
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M0 0 L0 -14" stroke={STEM} strokeWidth={2.4} strokeLinecap="round" />
      {[-48, 0, 48].map((a) => (
        <g key={a} transform={`translate(0 -14) rotate(${a})`}>
          <path d={leaflet} fill={light ? LEAF_LIGHT : LEAF} stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
          <path d="M0 -2 L0 -16" stroke={LEAF_VEIN} strokeWidth={1.2} strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
}

function Vine({ d, w = 3.4 }: { d: string; w?: number }) {
  return (
    <>
      <path d={d} fill="none" stroke={INK} strokeWidth={w + 3} strokeLinecap="round" />
      <path d={d} fill="none" stroke={STEM} strokeWidth={w} strokeLinecap="round" />
    </>
  );
}

// ---- S1 · Theo mẫu: cành cong vồng lên rồi rủ, quả dâu to treo dưới vòm mang mặt; quả nhỏ + hoa trắng ở nhánh phụ ----
function Twig({ stage }: { stage: 'bud' | 'bloom' }) {
  const bloom = stage === 'bloom';
  return (
    <g>
      <Vine d="M104 160 Q110 120 126 92 Q140 62 118 44 Q98 30 86 52" />
      <Vine d="M124 98 Q146 92 156 72" w={2.6} />
      <TriLeaf x={112} y={130} rot={-60} s={1} />
      <TriLeaf x={120} y={112} rot={55} s={1.05} />
      <TriLeaf x={132} y={54} rot={30} s={0.85} light />
      {bloom ? (
        <>
          <Flower x={156} y={66} s={1.1} />
          <Flower x={138} y={124} />
          <Berry x={150} y={88} w={18} ripe="red" cute />
          <Berry x={84} y={84} w={46} ripe="red" />
        </>
      ) : (
        <>
          <Flower x={156} y={68} s={1.1} />
          <Flower x={140} y={124} />
          <Flower x={86} y={56} s={1.3} />
          <Berry x={86} y={80} w={30} ripe="white" />
        </>
      )}
    </g>
  );
}

// ---- S2 · Bụi thấp: khóm lá ba chét xoè rộng, thấp; quả rủ qua miệng chậu hai bên trên dây bò, quả to mang mặt giữa khóm ----
function Rosette({ stage }: { stage: 'bud' | 'bloom' }) {
  const bloom = stage === 'bloom';
  const leaves: [number, number, number, number][] = [[100, 156, -70, 1.35], [100, 156, 70, 1.35], [100, 154, -35, 1.45], [100, 154, 35, 1.45], [100, 152, -5, 1.5], [100, 158, -95, 1.15], [100, 158, 95, 1.15]];
  return (
    <g>
      {leaves.map(([x, y, r, s], i) => <TriLeaf key={i} x={x} y={y} rot={r} s={s} light={i % 3 === 0} />)}
      <Vine d="M96 154 Q66 140 46 158" w={2.4} />
      <Vine d="M104 154 Q134 140 154 158" w={2.4} />
      {bloom ? (
        <>
          <Berry x={44} y={170} w={20} ripe="red" />
          <Berry x={156} y={170} w={20} ripe="blush" />
          <Flower x={70} y={142} />
          <Flower x={130} y={142} />
          <Berry x={100} y={118} w={40} ripe="red" />
        </>
      ) : (
        <>
          <Flower x={46} y={158} s={1.1} />
          <Flower x={154} y={158} s={1.1} />
          <Flower x={76} y={112} />
          <Flower x={124} y={112} />
          <Berry x={100} y={122} w={28} ripe="white" />
        </>
      )}
    </g>
  );
}

// ---- S3 · Dâu khổng lồ: một quả dâu to làm thân ngồi trên khóm lá, đài lá xoè như mũ, hai hoa cài hai bên ----
function Giant({ stage }: { stage: 'bud' | 'bloom' }) {
  const bloom = stage === 'bloom';
  return (
    <g>
      {[[-80, 0.95], [80, 0.95], [-115, 0.8], [115, 0.8]].map(([r, s]) => <TriLeaf key={r} x={100} y={158} rot={r} s={s} />)}
      <Berry x={100} y={bloom ? 104 : 116} w={bloom ? 76 : 52} ripe={bloom ? 'red' : 'blush'} />
      {bloom ? <><Flower x={64} y={70} s={1.3} /><Flower x={140} y={60} s={1.1} /></> : <Flower x={128} y={84} s={1.2} />}
    </g>
  );
}

function StrawberrySeed() {
  return <Seed color="#F0433A" stripe="#FFE08A" />;
}
function StrawberrySprout() {
  return <Sprout leaf={LEAF} stem={STEM} />;
}
function GiantBud() {
  return <Giant stage="bud" />;
}
function GiantBloom() {
  return <Giant stage="bloom" />;
}
function RosetteBud() {
  return <Rosette stage="bud" />;
}
function RosetteBloom() {
  return <Rosette stage="bloom" />;
}
function TwigBud() {
  return <Twig stage="bud" />;
}
function TwigBloom() {
  return <Twig stage="bloom" />;
}

export const strawberry: PlantSpecies = {
  id: 'strawberry',
  name: { vi: 'Dâu tây', en: 'Strawberry' },
  defaultPotId: 'basket',
  locked: true,
  faceStyle: 'cheeky',
  stages: {
    seed: { svg: StrawberrySeed },
    sprout: { svg: StrawberrySprout },
    bud: { svg: GiantBud },
    bloom: { svg: GiantBloom },
  },
  faceAnchor: {
    seed: { x: 100, y: 149, scale: 0.55 },
    sprout: { x: 100, y: 122, scale: 0.6 },
    bud: { x: 100, y: 120, scale: 0.7 },
    bloom: { x: 100, y: 108, scale: 0.95 },
  },
  styles: [
    {
      id: 'patch', name: { vi: 'Bụi thấp', en: 'Berry patch' }, unlockAt: 10,
      stages: { bud: { svg: RosetteBud }, bloom: { svg: RosetteBloom } },
      faceAnchor: { bud: { x: 100, y: 124, scale: 0.4 }, bloom: { x: 100, y: 122, scale: 0.55 } },
    },
    {
      id: 'twig', name: { vi: 'Cành treo quả', en: 'Hanging twig' }, unlockAt: 20,
      stages: { bud: { svg: TwigBud }, bloom: { svg: TwigBloom } },
      faceAnchor: { bud: { x: 86, y: 82, scale: 0.42 }, bloom: { x: 84, y: 88, scale: 0.62 } },
    },
  ],
  sayings: {
    vi: ['Nháy mắt một cái, làm xong việc liền! 😜', 'Dâu tây tinh nghịch chúc bạn ngày ngọt ngào!', 'Hôm nay mình đỏ mọng, bạn thì sao?'],
    en: ['One wink and the task is done! 😜', 'A cheeky strawberry wishes you a sweet day!', "I'm ripe and red today, how about you?"],
  },
  praises: {
    vi: ['Hehe, giỏi ghê ta!', 'Ngọt như dâu luôn, thêm một việc rồi!'],
    en: ['Hehe, look at you go!', 'Sweet as a berry, one more done!'],
  },
  taps: {
    vi: ['Lêu lêu, không bắt được mình đâu! 😜', 'Ê, hạt mình đếm không hết đâu nha!', 'Chọc nữa là mình lè lưỡi đó!'],
    en: ["Nyeh, can't catch me! 😜", "Hey, you'll never count all my seeds!", "Poke again and I'll stick my tongue out!"],
  },
};
