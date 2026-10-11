import type { FaceAnchor } from './types';

export type Mood = 'normal' | 'smile' | 'talk' | 'sleep' | 'sad';
export type FaceStyle = 'cute' | 'cool' | 'lady' | 'doll' | 'sparkle' | 'happy' | 'cheeky';
/** Kiểu mặt có mắt / miệng riêng (vẽ ở `ExtraEyes` / `ExtraMouth`); má hồng như cute. */
type ExtraStyle = 'doll' | 'sparkle' | 'happy' | 'cheeky';
const EXTRA_STYLES: readonly FaceStyle[] = ['doll', 'sparkle', 'happy', 'cheeky'];
export const INK = '#5B4636';

/**
 * `cool`: đeo kính râm, nhếch mép, không má hồng (ngủ/buồn thì vẫn hiện mắt như thường).
 * `lady`: hàng mi cong vút + môi son, vẫn má hồng (ngủ/buồn thì như thường).
 * `doll` (cà chua): mắt tròn to nhiều đốm sáng, buồn thì rơm rớm; `sparkle` (việt quất): đốm sáng hình sao, cười `> <`;
 * `happy` (cúc hoạ mi): mắt luôn cong ^ ^, cười có sao vàng; `cheeky` (dâu tây): nháy một mắt, lè lưỡi.
 * Bốn kiểu này chốt từ sổ phác thảo `src/dev/sketch/faces.tsx` (E6+M3, E4+M0, E5+M3, E7+M4).
 */
export function Face({ mood, x, y, scale, faceStyle = 'cute' }: { mood: Mood; faceStyle?: FaceStyle } & FaceAnchor) {
  const cool = faceStyle === 'cool';
  const shades = cool && mood !== 'sleep' && mood !== 'sad';
  const lady = faceStyle === 'lady' && mood !== 'sleep' && mood !== 'sad';
  const extra = EXTRA_STYLES.includes(faceStyle) ? (faceStyle as ExtraStyle) : null;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} data-testid="face" data-mood={mood} data-style={faceStyle}>
      {!cool && (
        <>
          <ellipse data-part="blush" cx={-14} cy={6} rx={5} ry={3} fill="#FF9FB2" opacity={0.75} />
          <ellipse data-part="blush" cx={14} cy={6} rx={5} ry={3} fill="#FF9FB2" opacity={0.75} />
        </>
      )}
      <g data-part="eyes">{shades ? <Shades /> : extra ? <ExtraEyes style={extra} mood={mood} /> : <Eyes mood={mood} />}</g>
      {lady && <Lashes smile={mood === 'smile'} />}
      {shades ? <CoolMouth mood={mood} /> : lady ? <LadyMouth mood={mood} /> : extra ? <ExtraMouth style={extra} mood={mood} /> : <Mouth mood={mood} />}
    </g>
  );
}

function Shades() {
  return (
    <g data-part="shades" strokeLinejoin="round">
      <path d="M-20 -6 L20 -6" stroke="#2B2420" strokeWidth={2.4} strokeLinecap="round" />
      <path d="M-17 -6 L-2 -6 L-3 0 Q-5 4 -10 4 Q-16 4 -17 -1 Z" fill="#2B2420" stroke="#2B2420" strokeWidth={1.6} />
      <path d="M17 -6 L2 -6 L3 0 Q5 4 10 4 Q16 4 17 -1 Z" fill="#2B2420" stroke="#2B2420" strokeWidth={1.6} />
      <path d="M-14 -4 L-10 -4 M6 -4 L10 -4" stroke="#fff" strokeWidth={1.4} strokeLinecap="round" opacity={0.8} />
    </g>
  );
}

/** Ba sợi mi cong vút ở đuôi mỗi mắt (mắt nhắm cười thì mi bám theo vòng cung) */
function Lashes({ smile }: { smile: boolean }) {
  const y = smile ? -2 : -4;
  return (
    <g data-part="lashes" stroke={INK} strokeWidth={1.6} strokeLinecap="round" fill="none">
      <path d={`M-12 ${y} q-3 -1 -4 -4 M-11 ${y - 2} q-2 -2 -2 -5 M12 ${y} q3 -1 4 -4 M11 ${y - 2} q2 -2 2 -5`} />
    </g>
  );
}

/** Môi son: chúm chím khi thường, cười tươi tô son khi vui, chữ O khi nói */
function LadyMouth({ mood }: { mood: Mood }) {
  switch (mood) {
    case 'smile':
      return <path d="M-5 5 q5 7 10 0 q-5 2 -10 0 z" fill="#E0475F" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />;
    case 'talk':
      return <ellipse cx={0} cy={7} rx={2.6} ry={3.2} fill="#E0475F" stroke={INK} strokeWidth={1.4} />;
    default:
      return <path d="M-3.5 6 q1.75 -2 3.5 -0.5 q1.75 -1.5 3.5 0.5 q-1.75 3 -3.5 3 q-1.75 0 -3.5 -3 z" fill="#E0475F" stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />;
  }
}

/** Miệng kiểu ngầu: nhếch một bên; khi cười thì cười nhếch lộ răng, khi nói thì hé miệng lệch */
function CoolMouth({ mood }: { mood: Mood }) {
  switch (mood) {
    case 'smile':
      return <path d="M-6 7 Q2 12 8 5 L-6 7 Z" fill="#fff" stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />;
    case 'talk':
      return <ellipse cx={2} cy={8} rx={3.4} ry={2.6} fill="#7A3B3B" stroke={INK} strokeWidth={1.6} />;
    default:
      return <path d="M-5 9 Q2 10 7 6" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />;
  }
}

function Eyes({ mood }: { mood: Mood }) {
  if (mood === 'smile') {
    return (
      <g stroke={INK} strokeWidth={2.4} fill="none" strokeLinecap="round">
        <path d="M-12 -1 q3 -5 6 0" />
        <path d="M6 -1 q3 -5 6 0" />
      </g>
    );
  }
  if (mood === 'sleep') {
    return (
      <g stroke={INK} strokeWidth={2.4} fill="none" strokeLinecap="round">
        <path d="M-12 -2 q3 4 6 0" />
        <path d="M6 -2 q3 4 6 0" />
      </g>
    );
  }
  return (
    <g>
      <circle cx={-9} cy={-2} r={3} fill={INK} />
      <circle cx={9} cy={-2} r={3} fill={INK} />
      <circle cx={-8} cy={-3} r={1} fill="#fff" />
      <circle cx={10} cy={-3} r={1} fill="#fff" />
    </g>
  );
}

function Mouth({ mood }: { mood: Mood }) {
  switch (mood) {
    case 'smile':
      return <path d="M-5 5 q5 8 10 0 z" fill="#E86A7E" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />;
    case 'talk':
      return <ellipse cx={0} cy={7} rx={3} ry={3.6} fill="#E86A7E" stroke={INK} strokeWidth={1.6} />;
    case 'sad':
      return <path d="M-4 9 q4 -4 8 0" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />;
    case 'sleep':
      return <path d="M-2 7 q2 2 4 0" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />;
    default:
      return <path d="M-4 5 q4 4 8 0" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />;
  }
}

const TONGUE = '#E86A7E';

/** Mắt nhắm: cười ^ ^ hoặc ngủ (cung úp) */
function ClosedEyes({ mood, w = 2.4 }: { mood: 'smile' | 'sleep'; w?: number }) {
  const d = mood === 'smile' ? 'q3 -5 6 0' : 'q3 4 6 0';
  return (
    <g stroke={INK} strokeWidth={w} fill="none" strokeLinecap="round">
      <path d={`M-12 -1 ${d}`} />
      <path d={`M6 -1 ${d}`} />
    </g>
  );
}

/** Lông mày rủ khi buồn */
function SadBrows({ y = -9 }: { y?: number }) {
  return <path d={`M-13 ${y + 1} l6 -3 M13 ${y + 1} l-6 -3`} stroke={INK} strokeWidth={1.8} strokeLinecap="round" />;
}

/** Mắt của 4 kiểu mặt mới, đủ 5 nét mặt */
function ExtraEyes({ style, mood }: { style: ExtraStyle; mood: Mood }) {
  if (mood === 'sleep') return <ClosedEyes mood="sleep" />;
  switch (style) {
    case 'doll':
      if (mood === 'smile') return <ClosedEyes mood="smile" />;
      return (
        <g>
          {[-9, 9].map((x) => (
            <g key={x}>
              <circle cx={x} cy={-1.5} r={5.2} fill={INK} />
              <circle cx={x} cy={0.8} r={3} fill="#8A6A55" opacity={0.6} />
              <circle cx={x + 1.6} cy={-3.6} r={2} fill="#fff" />
              <circle cx={x - 2} cy={0.6} r={0.9} fill="#fff" />
              {mood === 'sad' && <path d={`M${x + (x < 0 ? -3 : 3)} 3 q-1.5 3 0 4.5 q1.5 -1.5 0 -4.5 Z`} fill="#9FD4FF" stroke={INK} strokeWidth={0.6} />}
            </g>
          ))}
          {mood === 'sad' && <SadBrows y={-10} />}
        </g>
      );
    case 'sparkle':
      if (mood === 'smile') {
        return (
          <g stroke={INK} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M-12 -4 l4 2.5 -4 2.5" /><path d="M12 -4 l-4 2.5 4 2.5" />
          </g>
        );
      }
      return (
        <g>
          {[-9, 9].map((x) => (
            <g key={x}>
              <circle cx={x} cy={-2} r={4.4} fill={INK} />
              <path d={`M${x + 1.3} -5.6 l0.7 1.6 1.6 0.7 -1.6 0.7 -0.7 1.6 -0.7 -1.6 -1.6 -0.7 1.6 -0.7 Z`} fill="#fff" />
              <circle cx={x - 1.6} cy={0} r={0.8} fill="#fff" />
            </g>
          ))}
          {mood === 'sad' && <SadBrows />}
        </g>
      );
    case 'happy':
      if (mood === 'smile') {
        return (
          <g>
            <g stroke={INK} strokeWidth={2.6} fill="none" strokeLinecap="round"><path d="M-12 -1 q3 -6 6 0" /><path d="M6 -1 q3 -6 6 0" /></g>
            <path d="M-17 -8 l1 2 2 1 -2 1 -1 2 -1 -2 -2 -1 2 -1 Z M17 -8 l1 2 2 1 -2 1 -1 2 -1 -2 -2 -1 2 -1 Z" fill="#FFD84D" stroke={INK} strokeWidth={0.6} />
          </g>
        );
      }
      if (mood === 'sad') {
        return (
          <g>
            <g stroke={INK} strokeWidth={2.2} fill="none" strokeLinecap="round"><path d="M-12 -1 q3 3 6 0" /><path d="M6 -1 q3 3 6 0" /></g>
            <SadBrows />
          </g>
        );
      }
      return <g stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round"><path d="M-12 0 q3 -4 6 0" /><path d="M6 0 q3 -4 6 0" /></g>;
    case 'cheeky':
      if (mood === 'smile') return <ClosedEyes mood="smile" />;
      if (mood === 'sad') return <g><circle cx={-9} cy={-2} r={2.8} fill={INK} /><circle cx={9} cy={-2} r={2.8} fill={INK} /><SadBrows /></g>;
      return (
        <g>
          <circle cx={-9} cy={-2} r={3.2} fill={INK} /><circle cx={-8} cy={-3} r={1.1} fill="#fff" />
          <path d="M12 -4 l-4 2 4 2" stroke={INK} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
  }
}

/** Miệng của 4 kiểu mặt mới: doll / happy miệng nhỏ, cheeky lè lưỡi, sparkle như cute */
function ExtraMouth({ style, mood }: { style: ExtraStyle; mood: Mood }) {
  if (style === 'sparkle') return <Mouth mood={mood} />;
  if (style === 'cheeky') {
    switch (mood) {
      case 'smile': return <g><path d="M-6 4 q6 8 12 0 z" fill="#7A3B3B" stroke={INK} strokeWidth={1.5} strokeLinejoin="round" /><path d="M-1 7 q1 6 4 5 q2 -1 0 -6 z" fill={TONGUE} stroke={INK} strokeWidth={1.1} /></g>;
      case 'talk': return <ellipse cx={0} cy={7} rx={3} ry={3.6} fill="#7A3B3B" stroke={INK} strokeWidth={1.5} />;
      case 'sad': return <path d="M-4 9 q2 -2 4 0 q2 2 4 0" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />;
      case 'sleep': return <path d="M-2 7 h4" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />;
      default: return <g><path d="M0 6 q0 5 3 5 q3 0 2 -6 z" fill={TONGUE} stroke={INK} strokeWidth={1.1} /><path d="M-5 5 q5 3 10 0" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" /></g>;
    }
  }
  switch (mood) {
    case 'smile': return <path d="M-4 5 q4 6 8 0" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />;
    case 'talk': return <circle cx={0} cy={7} r={2.2} fill={TONGUE} stroke={INK} strokeWidth={1.4} />;
    case 'sad': return <path d="M-3 8 q3 -3 6 0" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />;
    case 'sleep': return <path d="M-1.5 7 h3" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />;
    default: return <path d="M-3 5 q3 3 6 0" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />;
  }
}
