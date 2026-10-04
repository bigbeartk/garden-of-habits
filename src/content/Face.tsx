import type { FaceAnchor } from './types';

export type Mood = 'normal' | 'smile' | 'talk' | 'sleep' | 'sad';
export type FaceStyle = 'cute' | 'cool';
export const INK = '#5B4636';

/** `cool`: đeo kính râm, nhếch mép, không má hồng (ngủ/buồn thì vẫn hiện mắt như thường). */
export function Face({ mood, x, y, scale, faceStyle = 'cute' }: { mood: Mood; faceStyle?: FaceStyle } & FaceAnchor) {
  const cool = faceStyle === 'cool';
  const shades = cool && mood !== 'sleep' && mood !== 'sad';
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} data-testid="face" data-mood={mood} data-style={faceStyle}>
      {!cool && (
        <>
          <ellipse data-part="blush" cx={-14} cy={6} rx={5} ry={3} fill="#FF9FB2" opacity={0.75} />
          <ellipse data-part="blush" cx={14} cy={6} rx={5} ry={3} fill="#FF9FB2" opacity={0.75} />
        </>
      )}
      {shades ? <Shades /> : <Eyes mood={mood} />}
      {shades ? <CoolMouth mood={mood} /> : <Mouth mood={mood} />}
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
