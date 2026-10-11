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
 * E0 / M0 là bản chép của mặt cute để ghép với kiểu mới. Chưa chọn bản nào.
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

export interface EyeStyle { id: string; name: string; open: (mood: Mood) => ReactNode; smile?: ReactNode; sleep?: ReactNode }

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
];

/** Mặt phác thảo: ghép một kiểu mắt + một kiểu miệng, cùng má hồng như Face */
export function SketchFace({ eyes, mouth, mood, x = 0, y = 0, scale = 1 }: { eyes: EyeStyle; mouth: MouthStyle; mood: Mood; x?: number; y?: number; scale?: number }) {
  const eye = mood === 'smile' ? (eyes.smile ?? <ClosedEyes mood="smile" />) : mood === 'sleep' ? (eyes.sleep ?? <ClosedEyes mood="sleep" />) : eyes.open(mood);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx={-14} cy={6} rx={5} ry={3} fill={BLUSH} opacity={0.75} />
      <ellipse cx={14} cy={6} rx={5} ry={3} fill={BLUSH} opacity={0.75} />
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
      {EYES.slice(1).map((e) => (
        <Row key={e.id} title={`${DRAFT} · ${e.name} · miệng M0 (cute)`}>
          {MOODS.map((m) => <Big key={m} eyes={e} mouth={MOUTHS[0]} mood={m} />)}
        </Row>
      ))}
      {MOUTHS.slice(1).map((mo) => (
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
        {EYES.map((e) => (
          <OnPlant key={`t-${e.id}`} label={e.id} eyes={e} mouth={MOUTHS[e.id === 'E1' ? 3 : 0]} potId="pink-cup" art={tomatoBloom.art} face={tomatoBloom.face!} />
        ))}
        {EYES.slice(1).map((e) => (
          <OnPlant key={`s-${e.id}`} label={e.id} eyes={e} mouth={MOUTHS[0]} potId={sunflower.defaultPotId} art={() => <ArtView art={sunflowerArt} />} face={sunflower.faceAnchor.bloom} />
        ))}
      </Row>
    </div>
  );
}
