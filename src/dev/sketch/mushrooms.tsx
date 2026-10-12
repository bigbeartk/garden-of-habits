import type { ReactNode } from 'react';
import { PlantScene } from '../../components/PlantScene';
import { INK, type Mood } from '../../content/Face';
import { Cell, Pair, Row, type Look } from './kit';

/*
 * Phác thảo 2 loài nấm mới (10/2026), lấy cảm hứng từ "nấm mặt trời" và "nấm băng" kiểu game thủ thành.
 * Lấy cảm hứng chứ KHÔNG chép nhân vật có bản quyền, không nhắc tên game trong app.
 * Dấu hiệu chung: mặt nằm trên THÂN nấm (không trên mũ), ra chồi = nấm con bé xíu, ra hoa = nấm lớn.
 * Dáng khác mọi loài đã có: mũ nấm vòm rộng trên thân mập, không lá, không hoa.
 * Nấm mặt trời: mũ cam chấm vàng + quầng tia nắng tròn phía sau. Nấm băng: mũ xanh băng, gai pha lê, nhũ băng rủ quanh vành.
 * ĐÃ VÀO APP (loài khoá): `sun-mushroom` Gốc = S1, `sunburst` = S2, `family` = S3, chậu `log` (Khúc gỗ);
 * `ice-mushroom` Gốc = I1, `snowcap` = I2, `crystal` = I3, chậu `ice-block` (Chậu băng). Hình thật ở src/content/plants/{sunMushroom,iceMushroom}.tsx.
 */

const STEM = '#FFF3DC', STEM_SHADE = '#F0D9B5', GILL = '#E8C9A0';

/** thân nấm mập: chân ở y = 160, nở nhẹ ở gốc; `hw` nửa bề ngang ở đỉnh, `top` đỉnh thân */
function Stem({ x = 100, hw, top, fill = STEM, shade = STEM_SHADE }: { x?: number; hw: number; top: number; fill?: string; shade?: string }) {
  const hb = hw * 1.18, mid = (160 + top) / 2;
  return (
    <g>
      <path d={`M${x - hb} 160 Q${x - hw - 4} ${mid} ${x - hw} ${top} L${x + hw} ${top} Q${x + hw + 4} ${mid} ${x + hb} 160 Z`} fill={fill} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <path d={`M${x + hw * 0.55} ${top + 6} Q${x + hw * 0.8} ${mid} ${x + hb * 0.7} 157`} fill="none" stroke={shade} strokeWidth={hw * 0.25} strokeLinecap="round" />
    </g>
  );
}

/** mũ vòm: vành ở y, rộng 2·rw, cao h; mặt dưới cong nhẹ lộ phiến nấm */
function capPath(x: number, y: number, rw: number, h: number) {
  return `M${x - rw} ${y} C${x - rw} ${y - h * 1.33} ${x + rw} ${y - h * 1.33} ${x + rw} ${y} Q${x} ${y + h * 0.22} ${x - rw} ${y} Z`;
}
function Cap({ x = 100, y, rw, h, fill, gill = GILL, children }: { x?: number; y: number; rw: number; h: number; fill: string; gill?: string; children?: ReactNode }) {
  return (
    <g>
      <ellipse cx={x} cy={y + h * 0.06} rx={rw * 0.86} ry={h * 0.16} fill={gill} stroke={INK} strokeWidth={1.6} />
      <path d={capPath(x, y, rw, h)} fill={fill} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
      {children}
      <ellipse cx={x - rw * 0.45} cy={y - h * 0.62} rx={rw * 0.16} ry={h * 0.1} fill="#fff" opacity={0.55} transform={`rotate(-25 ${x - rw * 0.45} ${y - h * 0.62})`} />
    </g>
  );
}
const dots = (pts: [number, number, number][], fill: string) =>
  pts.map(([cx, cy, r]) => <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx={r} ry={r * 0.82} fill={fill} stroke={INK} strokeWidth={1.2} />);

// ---------- Nấm mặt trời ----------
const SUN_CAP = '#FFA94D', SUN_CAP_DARK = '#F07F2B', SUN_DOT = '#FFE066', RAY = '#FFE58A', RAY_EDGE = '#F5C04A';

/** quầng nắng: n tia bo tròn quanh tâm, dài len, vẽ sau mũ */
function SunRays({ x, y, r, n = 12, len = 14, rot = 0 }: { x: number; y: number; r: number; n?: number; len?: number; rot?: number }) {
  return (
    <g transform={`rotate(${rot} ${x} ${y})`}>
      <circle cx={x} cy={y} r={r + len + 6} fill={RAY} opacity={0.35} />
      {Array.from({ length: n }, (_, i) => (i * 360) / n).map((a) => (
        <path key={a} d={`M${x - len * 0.42} ${y - r} Q${x} ${y - r - len * 1.5} ${x + len * 0.42} ${y - r} Z`} fill={RAY} stroke={RAY_EDGE} strokeWidth={1.6} strokeLinejoin="round" transform={`rotate(${a} ${x} ${y})`} />
      ))}
    </g>
  );
}
/** hạt nắng lấp lánh nhỏ (chữ thập bo) */
const Mote = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <path d={`M${x} ${y - 6 * s} Q${x + 1.2 * s} ${y - 1.2 * s} ${x + 6 * s} ${y} Q${x + 1.2 * s} ${y + 1.2 * s} ${x} ${y + 6 * s} Q${x - 1.2 * s} ${y + 1.2 * s} ${x - 6 * s} ${y} Q${x - 1.2 * s} ${y - 1.2 * s} ${x} ${y - 6 * s} Z`} fill="#FFF6B0" stroke={RAY_EDGE} strokeWidth={1} />
);

/** nấm con (ra chồi) dùng chung cho 3 bản nấm mặt trời */
const sunBud = (rays: boolean): Look => ({
  face: { x: 100, y: 147, scale: 0.5 },
  art: () => (
    <g>
      {rays && <SunRays x={100} y={124} r={24} n={10} len={8} />}
      <Stem hw={13} top={134} />
      <Cap y={134} rw={25} h={20} fill={SUN_CAP}>{dots([[90, 124, 3.5], [106, 120, 4], [114, 129, 2.6]], SUN_DOT)}</Cap>
    </g>
  ),
});

const S1: [Look, Look] = [
  sunBud(true),
  {
    face: { x: 100, y: 136, scale: 0.85 },
    art: () => (
      <g>
        <SunRays x={100} y={92} r={50} n={14} len={13} />
        <Stem hw={22} top={110} />
        <Cap y={110} rw={52} h={42} fill={SUN_CAP}>{dots([[78, 92, 7], [104, 80, 8.5], [126, 96, 6], [92, 104, 4], [116, 106, 3.5]], SUN_DOT)}</Cap>
      </g>
    ),
  },
];

/** S2: mũ chính là mặt trời: vành mũ lượn sóng như tia nắng, mũ thấp rộng, chấm xếp vòng */
function ScallopCap({ y, rw, h }: { y: number; rw: number; h: number }) {
  const n = 9;
  // vòm trên + các tia bo tròn chòi ra quanh nửa trên
  const bumps = Array.from({ length: n }, (_, i) => -80 + (160 / (n - 1)) * i).map((a) => {
    const rad = (a * Math.PI) / 180, cx = 100 + Math.sin(rad) * rw * 0.98, cy = y - Math.cos(rad) * h * 0.98;
    return <ellipse key={a} cx={cx} cy={cy} rx={9} ry={12} fill={SUN_DOT} stroke={INK} strokeWidth={1.8} transform={`rotate(${a} ${cx} ${cy})`} />;
  });
  return (
    <g>
      {bumps}
      <Cap y={y} rw={rw} h={h} fill={SUN_CAP_DARK}>
        <path d={capPath(100, y - 4, rw * 0.72, h * 0.66)} fill={SUN_CAP} />
        {dots([[100, y - h * 0.62, 6], [80, y - h * 0.3, 4.5], [120, y - h * 0.3, 4.5]], SUN_DOT)}
      </Cap>
    </g>
  );
}
const S2: [Look, Look] = [
  sunBud(false),
  {
    face: { x: 100, y: 138, scale: 0.8 },
    art: () => (
      <g>
        <circle cx={100} cy={96} r={74} fill={RAY} opacity={0.3} />
        <Stem hw={21} top={114} />
        <ScallopCap y={114} rw={54} h={40} />
        <Mote x={30} y={60} /><Mote x={170} y={52} s={0.8} /><Mote x={160} y={128} s={0.7} />
      </g>
    ),
  },
];

/** S3: mẹ con: nấm lớn nghiêng + nấm con cạnh chân, hạt nắng bay lên */
const S3: [Look, Look] = [
  {
    face: { x: 100, y: 147, scale: 0.5 },
    art: () => (
      <g>
        <Stem hw={13} top={134} />
        <Cap y={134} rw={25} h={20} fill={SUN_CAP}>{dots([[90, 124, 3.5], [106, 120, 4]], SUN_DOT)}</Cap>
        <Mote x={128} y={112} s={0.7} /><Mote x={72} y={104} s={0.55} />
      </g>
    ),
  },
  {
    face: { x: 92, y: 134, scale: 0.78 },
    art: () => (
      <g>
        <Mote x={150} y={50} /><Mote x={40} y={70} s={0.75} /><Mote x={164} y={92} s={0.6} />
        <Stem x={92} hw={20} top={112} />
        <g transform="rotate(-8 92 112)">
          <Cap x={92} y={112} rw={48} h={44} fill={SUN_CAP}>{dots([[72, 94, 7], [96, 80, 8], [116, 98, 6]], SUN_DOT)}</Cap>
        </g>
        <Stem x={146} hw={8} top={142} />
        <Cap x={146} y={142} rw={16} h={13} fill={SUN_CAP}>{dots([[142, 135, 2.6]], SUN_DOT)}</Cap>
      </g>
    ),
  },
];

// ---------- Nấm băng ----------
const ICE_CAP = '#8ED4F5', ICE_DARK = '#4FA6DA', ICE_LIGHT = '#E6F9FF', ICE_STEM = '#F4FBFF', ICE_STEM_SHADE = '#CDE8F5', ICE_GILL = '#B9DDF0';

/** gai pha lê: hình thoi dài cắm nghiêng góc a, gốc ở (x, y) */
function Crystal({ x, y, len, w = 7, a = 0 }: { x: number; y: number; len: number; w?: number; a?: number }) {
  return (
    <g transform={`rotate(${a} ${x} ${y})`}>
      <path d={`M${x - w} ${y} L${x - w * 0.8} ${y - len * 0.7} L${x} ${y - len} L${x + w * 0.8} ${y - len * 0.7} L${x + w} ${y} Z`} fill={ICE_LIGHT} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
      <path d={`M${x} ${y - len} L${x} ${y - 2}`} stroke={ICE_CAP} strokeWidth={1.4} />
    </g>
  );
}
/** nhũ băng rủ quanh vành mũ: các tam giác bo tròn đầu */
function Icicles({ x = 100, y, rw, n = 7, len = 10 }: { x?: number; y: number; rw: number; n?: number; len?: number }) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => x - rw * 0.85 + ((rw * 1.7) / (n - 1)) * i).map((cx, i) => {
        const l = len * (i % 2 ? 0.65 : 1), dy = Math.abs(cx - x) < rw * 0.3 ? 3 : 1;
        return <path key={cx} d={`M${cx - 4} ${y + dy - 1} Q${cx} ${y + dy + l * 1.2} ${cx + 4} ${y + dy - 1} Z`} fill={ICE_LIGHT} stroke={INK} strokeWidth={1.3} strokeLinejoin="round" />;
      })}
    </g>
  );
}
/** bông tuyết 6 cánh */
const Flake = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g stroke="#7CC3E8" strokeWidth={1.6} strokeLinecap="round" transform={`translate(${x} ${y}) scale(${s})`}>
    {[0, 60, 120].map((a) => <path key={a} d="M0 -7 L0 7 M-2.5 -5 L0 -3 L2.5 -5 M-2.5 5 L0 3 L2.5 5" transform={`rotate(${a})`} fill="none" />)}
  </g>
);

const iceBud = (crystals: boolean): Look => ({
  face: { x: 100, y: 147, scale: 0.5 },
  art: () => (
    <g>
      <Stem hw={13} top={134} fill={ICE_STEM} shade={ICE_STEM_SHADE} />
      {crystals && <><Crystal x={96} y={118} len={14} w={4} a={-15} /><Crystal x={106} y={117} len={11} w={3.5} a={18} /></>}
      <Cap y={134} rw={25} h={20} fill={ICE_CAP} gill={ICE_GILL}>{dots([[88, 126, 3], [110, 123, 3.5]], ICE_LIGHT)}</Cap>
      <Icicles y={134} rw={25} n={5} len={6} />
    </g>
  ),
});

/** I1: mũ vòm xanh băng, chùm gai pha lê trên đỉnh, nhũ băng rủ, tuyết bay */
const I1: [Look, Look] = [
  iceBud(true),
  {
    face: { x: 100, y: 138, scale: 0.85 },
    art: () => (
      <g>
        <Flake x={30} y={60} /><Flake x={172} y={74} s={0.8} /><Flake x={40} y={118} s={0.6} />
        <Stem hw={22} top={112} fill={ICE_STEM} shade={ICE_STEM_SHADE} />
        <Crystal x={86} y={78} len={30} w={8} a={-28} /><Crystal x={116} y={78} len={26} w={7} a={26} /><Crystal x={100} y={74} len={38} w={9} />
        <Cap y={112} rw={52} h={42} fill={ICE_CAP} gill={ICE_GILL}>{dots([[74, 98, 6], [124, 96, 7], [96, 104, 4]], ICE_LIGHT)}</Cap>
        <Icicles y={112} rw={52} n={9} len={12} />
      </g>
    ),
  },
];

/** I2: mũ dẹt rộng phủ đống tuyết trên đỉnh, nhũ băng dài, thân mập hơn */
const I2: [Look, Look] = [
  iceBud(false),
  {
    face: { x: 100, y: 140, scale: 0.85 },
    art: () => (
      <g>
        <Flake x={26} y={50} s={0.9} /><Flake x={176} y={46} /><Flake x={168} y={120} s={0.6} />
        <Stem hw={24} top={116} fill={ICE_STEM} shade={ICE_STEM_SHADE} />
        <Cap y={116} rw={62} h={30} fill={ICE_DARK} gill={ICE_GILL}>
          <path d={capPath(100, 112, 50, 22)} fill={ICE_CAP} />
        </Cap>
        <path d="M58 96 C56 78 78 70 88 78 C92 64 116 62 120 76 C132 70 148 82 142 96 C120 90 80 90 58 96 Z" fill="#fff" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
        <Icicles y={116} rw={62} n={11} len={16} />
      </g>
    ),
  },
];

/** I3: mũ nón pha lê có mặt cắt (khối kim cương), đỉnh nhọn, hơi lạnh phả quanh chân */
function GemCap({ y, rw, h }: { y: number; rw: number; h: number }) {
  const top = y - h;
  return (
    <g strokeLinejoin="round">
      <ellipse cx={100} cy={y + 2} rx={rw * 0.86} ry={5} fill={ICE_GILL} stroke={INK} strokeWidth={1.6} />
      <path d={`M${100 - rw} ${y} L${100 - rw * 0.55} ${top + h * 0.35} L100 ${top} L${100 + rw * 0.55} ${top + h * 0.35} L${100 + rw} ${y} Q100 ${y + 8} ${100 - rw} ${y} Z`} fill={ICE_CAP} stroke={INK} strokeWidth={2.2} />
      <path d={`M${100 - rw * 0.55} ${top + h * 0.35} L${100 - rw * 0.2} ${y + 3} M100 ${top} L${100 - rw * 0.2} ${y + 3} M100 ${top} L${100 + rw * 0.35} ${y + 3} M${100 + rw * 0.55} ${top + h * 0.35} L${100 + rw * 0.35} ${y + 3}`} fill="none" stroke={ICE_DARK} strokeWidth={1.4} />
      <path d={`M${100 - rw * 0.55} ${top + h * 0.35} L100 ${top} L${100 - rw * 0.2} ${y + 3} Z`} fill={ICE_LIGHT} opacity={0.7} />
    </g>
  );
}
const Frost = ({ y }: { y: number }) => (
  <path d={`M44 ${y} q8 -10 18 -4 q6 -10 16 -2 M122 ${y - 2} q8 -10 18 -2 q8 -8 16 2`} fill="none" stroke="#BFE6F7" strokeWidth={3.5} strokeLinecap="round" />
);
const I3: [Look, Look] = [
  {
    face: { x: 100, y: 147, scale: 0.5 },
    art: () => (
      <g>
        <Stem hw={13} top={134} fill={ICE_STEM} shade={ICE_STEM_SHADE} />
        <GemCap y={134} rw={24} h={30} />
      </g>
    ),
  },
  {
    face: { x: 100, y: 138, scale: 0.85 },
    art: () => (
      <g>
        <Flake x={36} y={48} /><Flake x={166} y={60} s={0.8} />
        <Stem hw={22} top={114} fill={ICE_STEM} shade={ICE_STEM_SHADE} />
        <GemCap y={114} rw={52} h={70} />
        <Frost y={150} />
      </g>
    ),
  },
];

const SUN: [string, [Look, Look]][] = [
  ['S1 · Vòm cam chấm vàng + quầng nắng', S1],
  ['S2 · Mũ hình mặt trời (vành tia nắng)', S2],
  ['S3 · Mẹ con + hạt nắng', S3],
];
const ICE: [string, [Look, Look]][] = [
  ['I1 · Vòm băng + gai pha lê', I1],
  ['I2 · Mũ dẹt phủ tuyết, nhũ dài', I2],
  ['I3 · Nón pha lê kim cương', I3],
];
const MOODS: Mood[] = ['normal', 'smile', 'talk', 'sleep', 'sad'];

export function MushroomSketches() {
  const pairs = (list: [string, [Look, Look]][], potId: string, color: string) =>
    list.map(([name, looks]) => <Pair key={name} name={name} looks={looks} potId={potId} color={color} />);
  return (
    <div>
      <Row title="Nấm mặt trời (ra chồi = nấm con | ra hoa = nấm lớn)">{pairs(SUN, 'terracotta', '#E8792B')}</Row>
      <Row title="Nấm băng (ra chồi | ra hoa)">{pairs(ICE, 'blue-ceramic', '#3E8FC7')}</Row>
      <Row title="Đã vào app: 4 giai đoạn vẽ bằng PlantScene thật, chậu mặc định mới">
        {(['sun-mushroom', 'ice-mushroom'] as const).map((id) => (['seed', 'sprout', 'bud', 'bloom'] as const).map((stage) => (
          <figure key={`${id}-${stage}`} style={{ margin: 0, background: '#fff', borderRadius: 12, width: 150, height: 196, textAlign: 'center', font: '700 13px sans-serif' }}>
            <div style={{ width: 150, height: 180 }}><PlantScene plantId={id} potId={id === 'sun-mushroom' ? 'log' : 'ice-block'} stage={stage} specialId={null} mood="smile" /></div>
            {stage}
          </figure>
        )))}
      </Row>
      <Row title="Nét mặt trên thân nấm (S1, I1)">
        {MOODS.map((m) => <Cell key={`s-${m}`} label={m} look={S1[1]} potId="terracotta" mood={m} size={120} />)}
        {MOODS.map((m) => <Cell key={`i-${m}`} label={m} look={I1[1]} potId="blue-ceramic" mood={m} size={120} />)}
      </Row>
    </div>
  );
}
