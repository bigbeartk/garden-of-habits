import type { FaceAnchor } from './types';

export type Mood = 'normal' | 'smile' | 'talk' | 'sleep' | 'sad';
export const INK = '#5B4636';

export function Face({ mood, x, y, scale }: { mood: Mood } & FaceAnchor) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} data-testid="face" data-mood={mood}>
      <ellipse cx={-14} cy={6} rx={5} ry={3} fill="#FF9FB2" opacity={0.75} />
      <ellipse cx={14} cy={6} rx={5} ry={3} fill="#FF9FB2" opacity={0.75} />
      <Eyes mood={mood} />
      <Mouth mood={mood} />
    </g>
  );
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
