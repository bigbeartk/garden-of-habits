import type { ReactNode } from 'react';
import { ArtView } from '../../content/ArtView';
import { Face, INK, type FaceStyle, type Mood } from '../../content/Face';
import { getSpecies } from '../../content/plants/registry';
import { getPot } from '../../content/pots/registry';
import { Row } from './kit';
import { TOMATO_LOOKS } from './tomato';

/*
 * Phác thảo mặt chibi (10/2026): các kiểu MẮT và MIỆNG mới, so với mặt hiện tại (content/Face.tsx).
 * Toạ độ giống Face: tâm mặt ở (0,0), mắt ở x ±9, y -2; miệng ở y ~6; scale 1 rộng ~40.
 * Mỗi kiểu vẽ đủ 5 nét mặt vì app đổi mặt theo tình huống (thường, cười, nói, ngủ, buồn).
 * Hàng ĐANG DÙNG vẽ bằng chính <Face> của app (cute / cool / lady); hàng PHÁC THẢO là kiểu mới, app chưa dùng.
 * E0 / M0 là bản chép của mặt cute để ghép với kiểu mới. Bộ mặt F0–F5 (FACE_PRESETS) = cặp mắt + miệng có tính cách;
 * E5–E9, M4–M5 chỉ hiện trong các bộ đó. Việt quất đang thử F0 (E4 + M0). Chưa chốt kiểu nào vào app.
 */

export const MOODS: Mood[] = ['normal', 'smile', 'talk', 'sleep', 'sad'];
export const MOOD_VI: Record<Mood, string> = { normal: 'Thường', smile: 'Cười', talk: 'Nói', sleep: 'Ngủ', sad: 'Buồn' };
const BLUSH = '#FF9FB2', TONGUE = '#E86A7E';

/** Mắt nhắm cười ^ ^ và mắt ngủ (dùng chung cho mọi kiểu, độ dày tuỳ kiểu) */
function ClosedEyes({ mood, w = 2.4, spread = 9 }: { mood: 'smile' | 'sleep'; w?: number; spread?: number }) {
  const d = mood === 'smile' ? 'q3 -5 6 0' : 'q3 4 6 0';
  return (
    <g stroke={INK} strokeWidth={w} fill="none" strokeLinecap="round">
      <path d={`M${-spread - 3} -1 ${d}`} />
      <path d={`M${spread - 3} -1 ${d}`} />
    </g>
  );
}
/** lông mày rủ khi buồn */
function SadBrows({ y = -9 }: { y?: number }) {
  return <path d={`M-13 ${y + 1} l6 -3 M13 ${y + 1} l-6 -3`} stroke={INK} strokeWidth={1.8} strokeLinecap="round" />;
}

/** `blush`: hệ số cỡ má hồng (mặc định 1) */
export interface EyeStyle { id: string; name: string; open: (mood: Mood) => ReactNode; smile?: ReactNode; sleep?: ReactNode; blush?: number }

export const EYES: EyeStyle[] = [
  {
    id: 'E0', name: 'E0 · mắt chấm tròn (= mắt cute đang dùng)',
    open: () => (
      <g>
        <circle cx={-9} cy={-2} r={3} fill={INK} /><circle cx={9} cy={-2} r={3} fill={INK} />
        <circle cx={-8} cy={-3} r={1} fill="#fff" /><circle cx={10} cy={-3} r={1} fill="#fff" />
      </g>
    ),
  },
  {
    id: 'E1', name: 'E1 · Như ảnh mẫu (tròng trắng, con ngươi to)',
    open: (m) => (
      <g>
        {[-9, 9].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy={-2} rx={4.6} ry={5.4} fill="#fff" stroke={INK} strokeWidth={1.6} />
            <ellipse cx={x + 0.8} cy={m === 'sad' ? -0.5 : -1.4} rx={3.2} ry={3.9} fill={INK} />
            <circle cx={x + 2} cy={-3.4} r={1.3} fill="#fff" />
          </g>
        ))}
        {m === 'sad' && <SadBrows y={-10} />}
      </g>
    ),
  },
  {
    id: 'E2', name: 'E2 · Long lanh (bầu dục đen, 2 đốm sáng)',
    open: (m) => (
      <g>
        {[-9, 9].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy={-2} rx={3.4} ry={4.6} fill={INK} />
            <circle cx={x + 1.1} cy={-3.8} r={1.5} fill="#fff" />
            <circle cx={x - 1.2} cy={0.3} r={0.7} fill="#fff" />
          </g>
        ))}
        {m === 'sad' && <SadBrows />}
      </g>
    ),
  },
  {
    id: 'E3', name: 'E3 · Hạt đậu (bầu dục dọc, trơn)',
    open: (m) => (
      <g fill={INK}>
        <ellipse cx={-8} cy={-2} rx={2.2} ry={3.6} /><ellipse cx={8} cy={-2} rx={2.2} ry={3.6} />
        {m === 'sad' && <SadBrows />}
      </g>
    ),
  },
  {
    id: 'E4', name: 'E4 · Lấp lánh (đốm sáng hình sao)',
    open: (m) => (
      <g>
        {[-9, 9].map((x) => (
          <g key={x}>
            <circle cx={x} cy={-2} r={4.4} fill={INK} />
            <path d={`M${x + 1.3} -5.6 l0.7 1.6 1.6 0.7 -1.6 0.7 -0.7 1.6 -0.7 -1.6 -1.6 -0.7 1.6 -0.7 Z`} fill="#fff" />
            <circle cx={x - 1.6} cy={0} r={0.8} fill="#fff" />
          </g>
        ))}
        {m === 'sad' && <SadBrows />}
      </g>
    ),
    smile: (
      <g stroke={INK} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M-12 -4 l4 2.5 -4 2.5" /><path d="M12 -4 l-4 2.5 4 2.5" />
      </g>
    ),
  },
  // ---- E5–E9: mắt cho các bộ mặt F1–F5 ----
  {
    id: 'E5', name: 'E5 · Hí hửng (luôn cong ^ ^)',
    open: (m) => m === 'sad'
      ? <g><g stroke={INK} strokeWidth={2.2} fill="none" strokeLinecap="round"><path d="M-12 -1 q3 3 6 0" /><path d="M6 -1 q3 3 6 0" /></g><SadBrows /></g>
      : <g stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round"><path d="M-12 0 q3 -4 6 0" /><path d="M6 0 q3 -4 6 0" /></g>,
    smile: (
      <g>
        <g stroke={INK} strokeWidth={2.6} fill="none" strokeLinecap="round"><path d="M-12 -1 q3 -6 6 0" /><path d="M6 -1 q3 -6 6 0" /></g>
        <path d="M-17 -8 l1 2 2 1 -2 1 -1 2 -1 -2 -2 -1 2 -1 Z M17 -8 l1 2 2 1 -2 1 -1 2 -1 -2 -2 -1 2 -1 Z" fill="#FFD84D" stroke={INK} strokeWidth={0.6} />
      </g>
    ),
  },
  {
    id: 'E6', name: 'E6 · Búp bê (mắt tròn to, nhiều đốm sáng)',
    open: (m) => (
      <g>
        {[-9, 9].map((x) => (
          <g key={x}>
            <circle cx={x} cy={-1.5} r={5.2} fill={INK} />
            <circle cx={x} cy={0.8} r={3} fill="#8A6A55" opacity={0.6} />
            <circle cx={x + 1.6} cy={-3.6} r={2} fill="#fff" />
            <circle cx={x - 2} cy={0.6} r={0.9} fill="#fff" />
            {m === 'sad' && <path d={`M${x + (x < 0 ? -3 : 3)} 3 q-1.5 3 0 4.5 q1.5 -1.5 0 -4.5 Z`} fill="#9FD4FF" stroke={INK} strokeWidth={0.6} />}
          </g>
        ))}
        {m === 'sad' && <SadBrows y={-10} />}
      </g>
    ),
  },
  {
    id: 'E7', name: 'E7 · Nháy mắt (một chấm, một >)',
    open: (m) => m === 'sad'
      ? <g><circle cx={-9} cy={-2} r={2.8} fill={INK} /><circle cx={9} cy={-2} r={2.8} fill={INK} /><SadBrows /></g>
      : (
        <g>
          <circle cx={-9} cy={-2} r={3.2} fill={INK} /><circle cx={-8} cy={-3} r={1.1} fill="#fff" />
          <path d="M12 -4 l-4 2 4 2" stroke={INK} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ),
  },
  {
    id: 'E8', name: 'E8 · Ngại ngùng (chấm nhỏ nhìn xuống, má gạch ///)',
    blush: 1.35,
    open: (m) => (
      <g>
        <circle cx={-8} cy={0} r={2} fill={INK} /><circle cx={8} cy={0} r={2} fill={INK} />
        <g stroke="#E0607A" strokeWidth={1} strokeLinecap="round"><path d="M-18 7 l2 -3 M-15 7 l2 -3 M-12 7 l2 -3 M12 7 l2 -3 M15 7 l2 -3 M18 7 l2 -3" /></g>
        {m === 'sad' && <SadBrows y={-7} />}
      </g>
    ),
  },
  {
    id: 'E9', name: 'E9 · Mắt tim',
    open: (m) => m === 'sad'
      ? <g><circle cx={-9} cy={-2} r={3} fill={INK} /><circle cx={9} cy={-2} r={3} fill={INK} /><SadBrows /></g>
      : (
        <g fill="#FF5E7E" stroke={INK} strokeWidth={1.2} strokeLinejoin="round">
          {[-9, 9].map((x) => <path key={x} d={`M${x} 2.5 C${x - 6} -1.5 ${x - 4.5} -7.5 ${x} -4.5 C${x + 4.5} -7.5 ${x + 6} -1.5 ${x} 2.5 Z`} />)}
          {[-9, 9].map((x) => <circle key={`h${x}`} cx={x - 2} cy={-3.6} r={0.9} fill="#fff" stroke="none" />)}
        </g>
      ),
  },
];

export interface MouthStyle { id: string; name: string; draw: (mood: Mood) => ReactNode }
export const MOUTHS: MouthStyle[] = [
  {
    id: 'M0', name: 'M0 · miệng cute đang dùng',
    draw: (m) => {
      switch (m) {
        case 'smile': return <path d="M-5 5 q5 8 10 0 z" fill={TONGUE} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />;
        case 'talk': return <ellipse cx={0} cy={7} rx={3} ry={3.6} fill={TONGUE} stroke={INK} strokeWidth={1.6} />;
        case 'sad': return <path d="M-4 9 q4 -4 8 0" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />;
        case 'sleep': return <path d="M-2 7 q2 2 4 0" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />;
        default: return <path d="M-4 5 q4 4 8 0" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />;
      }
    },
  },
  {
    id: 'M1', name: 'M1 · Mèo ω',
    draw: (m) => {
      switch (m) {
        case 'smile': return <path d="M-6 5 q3 4 6 0 q3 4 6 0 q-6 7 -12 0 z" fill={TONGUE} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />;
        case 'talk': return <g><path d="M-6 5 q3 3 6 0 q3 3 6 0" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" /><ellipse cx={0} cy={9} rx={2.4} ry={2.2} fill={TONGUE} stroke={INK} strokeWidth={1.4} /></g>;
        case 'sad': return <path d="M-5 9 q2.5 -3 5 0 q2.5 -3 5 0" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />;
        case 'sleep': return <path d="M-3 7 q1.5 1.5 3 0 q1.5 1.5 3 0" fill="none" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />;
        default: return <path d="M-6 5 q3 3 6 0 q3 3 6 0" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />;
      }
    },
  },
  {
    id: 'M2', name: 'M2 · Cười toe (miệng D, lưỡi)',
    draw: (m) => {
      switch (m) {
        case 'smile': return <g><path d="M-7 4 h14 q-1 9 -7 9 q-6 0 -7 -9 z" fill="#7A3B3B" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" /><path d="M-4 10.5 q4 -4 8 0 q-4 3 -8 0z" fill={TONGUE} /></g>;
        case 'talk': return <g><ellipse cx={0} cy={7.5} rx={4} ry={4.4} fill="#7A3B3B" stroke={INK} strokeWidth={1.6} /><path d="M-2.6 10 q2.6 -2.4 5.2 0 q-2.6 1.6 -5.2 0z" fill={TONGUE} /></g>;
        case 'sad': return <path d="M-5 10 q5 -6 10 0 z" fill="#7A3B3B" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />;
        case 'sleep': return <ellipse cx={0} cy={7} rx={1.8} ry={1.4} fill="#7A3B3B" stroke={INK} strokeWidth={1.2} />;
        default: return <path d="M-5 5 h10 q-1 6 -5 6 q-4 0 -5 -6 z" fill="#7A3B3B" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />;
      }
    },
  },
  {
    id: 'M3', name: 'M3 · Chấm nhỏ (như ảnh mẫu)',
    draw: (m) => {
      switch (m) {
        case 'smile': return <path d="M-4 5 q4 6 8 0" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />;
        case 'talk': return <circle cx={0} cy={7} r={2.2} fill={TONGUE} stroke={INK} strokeWidth={1.4} />;
        case 'sad': return <path d="M-3 8 q3 -3 6 0" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />;
        case 'sleep': return <path d="M-1.5 7 h3" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />;
        default: return <path d="M-3 5 q3 3 6 0" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />;
      }
    },
  },
  // ---- M4–M5: miệng cho các bộ mặt F1–F5 ----
  {
    id: 'M4', name: 'M4 · Lè lưỡi',
    draw: (m) => {
      switch (m) {
        case 'smile': return <g><path d="M-6 4 q6 8 12 0 z" fill="#7A3B3B" stroke={INK} strokeWidth={1.5} strokeLinejoin="round" /><path d="M-1 7 q1 6 4 5 q2 -1 0 -6 z" fill={TONGUE} stroke={INK} strokeWidth={1.1} /></g>;
        case 'talk': return <ellipse cx={0} cy={7} rx={3} ry={3.6} fill="#7A3B3B" stroke={INK} strokeWidth={1.5} />;
        case 'sad': return <path d="M-4 9 q2 -2 4 0 q2 2 4 0" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />;
        case 'sleep': return <path d="M-2 7 h4" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />;
        default: return <g><path d="M0 6 q0 5 3 5 q3 0 2 -6 z" fill={TONGUE} stroke={INK} strokeWidth={1.1} /><path d="M-5 5 q5 3 10 0" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" /></g>;
      }
    },
  },
  {
    id: 'M5', name: 'M5 · Lượn sóng nhỏ (ngượng)',
    draw: (m) => {
      switch (m) {
        case 'smile': return <path d="M-4 6 q2 3 4 0 q2 3 4 0" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />;
        case 'talk': return <ellipse cx={0} cy={7} rx={1.8} ry={2.2} fill={TONGUE} stroke={INK} strokeWidth={1.2} />;
        case 'sad': return <path d="M-3 8 q1.5 -2 3 0 q1.5 2 3 0" fill="none" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />;
        case 'sleep': return <circle cx={0} cy={7} r={1} fill={INK} />;
        default: return <path d="M-3 7 q1.5 -2 3 0 q1.5 2 3 0" fill="none" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />;
      }
    },
  },
];

/** Mặt phác thảo: ghép một kiểu mắt + một kiểu miệng, cùng má hồng như Face */
export function SketchFace({ eyes, mouth, mood, x = 0, y = 0, scale = 1 }: { eyes: EyeStyle; mouth: MouthStyle; mood: Mood; x?: number; y?: number; scale?: number }) {
  const eye = mood === 'smile' ? (eyes.smile ?? <ClosedEyes mood="smile" />) : mood === 'sleep' ? (eyes.sleep ?? <ClosedEyes mood="sleep" />) : eyes.open(mood);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx={-14} cy={6} rx={5 * (eyes.blush ?? 1)} ry={3 * (eyes.blush ?? 1)} fill={BLUSH} opacity={0.75} />
      <ellipse cx={14} cy={6} rx={5 * (eyes.blush ?? 1)} ry={3 * (eyes.blush ?? 1)} fill={BLUSH} opacity={0.75} />
      {eye}
      {mouth.draw(mood)}
    </g>
  );
}

/** Ô phóng to: mặt trên một quả tròn đỏ (nền giống quả cà chua / bông hoa) */
function Big({ eyes, mouth, mood, fill = '#EF4B3F' }: { eyes: EyeStyle; mouth: MouthStyle; mood: Mood; fill?: string }) {
  return (
    <figure style={{ margin: 0, textAlign: 'center', font: '12px sans-serif' }}>
      <svg viewBox="-28 -26 56 52" width={96} height={89} style={{ background: '#fff', borderRadius: 12, display: 'block' }}>
        <circle r={23} fill={fill} stroke={INK} strokeWidth={1.6} />
        <SketchFace eyes={eyes} mouth={mouth} mood={mood} />
      </svg>
      <figcaption>{MOOD_VI[mood]}</figcaption>
    </figure>
  );
}

/** Ô cỡ thật: mặt đặt lên cây trong chậu như trong app */
function OnPlant({ art, potId, face, eyes, mouth, label }: { art: () => ReactNode; potId: string; face: { x: number; y: number; scale: number }; eyes: EyeStyle; mouth: MouthStyle; label: string }) {
  return (
    <figure style={{ margin: 0, textAlign: 'center', font: '12px sans-serif' }}>
      <svg viewBox="0 0 200 240" width={130} height={156} style={{ background: '#fff', borderRadius: 12, display: 'block' }}>
        <ArtView art={getPot(potId).art} />
        {art()}
        <SketchFace eyes={eyes} mouth={mouth} mood="normal" {...face} />
      </svg>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

const USED = '✅ ĐANG DÙNG', DRAFT = '✏️ PHÁC THẢO';

/** Ô phóng to vẽ bằng <Face> thật của app */
function BigReal({ faceStyle, mood, fill }: { faceStyle: FaceStyle; mood: Mood; fill: string }) {
  return (
    <figure style={{ margin: 0, textAlign: 'center', font: '12px sans-serif' }}>
      <svg viewBox="-28 -26 56 52" width={96} height={89} style={{ background: '#fff', borderRadius: 12, display: 'block', outline: '3px solid #5DAE5A' }}>
        <circle r={23} fill={fill} stroke={INK} strokeWidth={1.6} />
        <Face faceStyle={faceStyle} mood={mood} x={0} y={0} scale={1} />
      </svg>
      <figcaption>{MOOD_VI[mood]}</figcaption>
    </figure>
  );
}

/** Cây thật trong chậu mặc định, mặt bằng <Face> thật */
function RealPlant({ plantId, label }: { plantId: string; label: string }) {
  const sp = getSpecies(plantId);
  return (
    <figure style={{ margin: 0, textAlign: 'center', font: '12px sans-serif' }}>
      <svg viewBox="0 0 200 240" width={130} height={156} style={{ background: '#fff', borderRadius: 12, display: 'block', outline: '3px solid #5DAE5A' }}>
        <ArtView art={getPot(sp.defaultPotId).art} />
        <ArtView art={sp.stages.bloom} />
        <Face faceStyle={sp.faceStyle} mood="normal" {...sp.faceAnchor.bloom} />
      </svg>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

/** Bộ mặt phác thảo: một cặp mắt + miệng có tính cách riêng */
export interface FacePreset { id: string; name: string; eyes: EyeStyle; mouth: MouthStyle; fill: string }
const eyeOf = (id: string) => EYES.find((e) => e.id === id)!, mouthOf = (id: string) => MOUTHS.find((m) => m.id === id)!;
export const FACE_PRESETS: FacePreset[] = [
  { id: 'F0', name: 'F0 · Lấp lánh (E4 + M0): việt quất đang thử', eyes: eyeOf('E4'), mouth: mouthOf('M0'), fill: '#5B6FD6' },
  { id: 'F1', name: 'F1 · Hí hửng (E5 + M1): lúc nào cũng cười híp mắt, miệng mèo', eyes: eyeOf('E5'), mouth: mouthOf('M1'), fill: '#FFD84D' },
  { id: 'F2', name: 'F2 · Búp bê (E6 + M3): mắt to long lanh, buồn thì rơm rớm', eyes: eyeOf('E6'), mouth: mouthOf('M3'), fill: '#FFB3C8' },
  { id: 'F3', name: 'F3 · Tinh nghịch (E7 + M4): nháy mắt, lè lưỡi', eyes: eyeOf('E7'), mouth: mouthOf('M4'), fill: '#F7963A' },
  { id: 'F4', name: 'F4 · Ngại ngùng (E8 + M5): mắt nhỏ, má đỏ gạch ///', eyes: eyeOf('E8'), mouth: mouthOf('M5'), fill: '#CDEFE3' },
  { id: 'F5', name: 'F5 · Mắt tim (E9 + M2): say đắm, cười toe', eyes: eyeOf('E9'), mouth: mouthOf('M2'), fill: '#E3D9FF' },
];

const REAL: { style: FaceStyle; title: string; fill: string }[] = [
  { style: 'cute', title: 'cute · mặc định (mọi loài trừ xương rồng, hoa hồng) = E0 + M0', fill: '#EF4B3F' },
  { style: 'cool', title: 'cool · Xương rồng (kính râm, nhếch mép, không má hồng; ngủ/buồn thì mặt thường)', fill: '#7CC36E' },
  { style: 'lady', title: 'lady · Hoa hồng (mi cong, môi son; ngủ/buồn thì mặt thường)', fill: '#FFB3C8' },
];

export function FaceSketches() {
  const [, , tomatoBloom] = TOMATO_LOOKS[0];
  const sunflower = getSpecies('sunflower');
  const sunflowerArt = sunflower.stages.bloom;
  return (
    <div>
      <p style={{ font: '15px sans-serif', margin: '0 0 10px', maxWidth: 760 }}>
        <b>{USED}</b> (viền ô xanh) = mặt app đang dùng, vẽ bằng chính <code>Face.tsx</code>.{' '}
        <b>{DRAFT}</b> (ô không viền) = kiểu mới vẽ thử, app <b>chưa</b> dùng.
      </p>
      {REAL.map((r) => (
        <Row key={r.style} title={`${USED} · ${r.title}`}>
          {MOODS.map((m) => <BigReal key={m} faceStyle={r.style} mood={m} fill={r.fill} />)}
        </Row>
      ))}
      {FACE_PRESETS.map((f) => (
        <Row key={f.id} title={`${DRAFT} · bộ mặt ${f.name}`}>
          {MOODS.map((m) => <Big key={m} eyes={f.eyes} mouth={f.mouth} mood={m} fill={f.fill} />)}
        </Row>
      ))}
      {EYES.slice(1, 5).map((e) => (
        <Row key={e.id} title={`${DRAFT} · ${e.name} · miệng M0 (cute)`}>
          {MOODS.map((m) => <Big key={m} eyes={e} mouth={MOUTHS[0]} mood={m} />)}
        </Row>
      ))}
      {MOUTHS.slice(1, 4).map((mo) => (
        <Row key={mo.id} title={`${DRAFT} · ${mo.name} · mắt E0 (cute)`}>
          {MOODS.map((m) => <Big key={m} eyes={EYES[0]} mouth={mo} mood={m} fill="#FFD84D" />)}
        </Row>
      ))}
      <Row title={`${USED} · cỡ thật, mặt Thường: hướng dương (cute) · xương rồng (cool) · hoa hồng (lady)`}>
        <RealPlant plantId="sunflower" label="cute" />
        <RealPlant plantId="cactus" label="cool" />
        <RealPlant plantId="rose" label="lady" />
      </Row>
      <Row title={`${DRAFT} · cỡ thật, mặt Thường: các kiểu mắt trên cà chua T1 (cây cũng là phác thảo) · hướng dương`}>
        {EYES.slice(0, 5).map((e) => (
          <OnPlant key={`t-${e.id}`} label={e.id} eyes={e} mouth={MOUTHS[e.id === 'E1' ? 3 : 0]} potId="pink-cup" art={tomatoBloom.art} face={tomatoBloom.face!} />
        ))}
        {EYES.slice(1, 5).map((e) => (
          <OnPlant key={`s-${e.id}`} label={e.id} eyes={e} mouth={MOUTHS[0]} potId={sunflower.defaultPotId} art={() => <ArtView art={sunflowerArt} />} face={sunflower.faceAnchor.bloom} />
        ))}
      </Row>
      <Row title={`${DRAFT} · cỡ thật, mặt Thường: bộ mặt F0–F5 trên hướng dương`}>
        {FACE_PRESETS.map((f) => (
          <OnPlant key={`p-${f.id}`} label={f.id} eyes={f.eyes} mouth={f.mouth} potId={sunflower.defaultPotId} art={() => <ArtView art={sunflowerArt} />} face={sunflower.faceAnchor.bloom} />
        ))}
      </Row>
    </div>
  );
}
