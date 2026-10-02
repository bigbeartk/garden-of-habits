import { useId } from 'react';
import './specials.css';

function Star({ x, y, s = 1, color, delay = 0 }: { x: number; y: number; s?: number; color: string; delay?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path className="special-star" style={{ animationDelay: `${delay}s` }} d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z" fill={color} />
    </g>
  );
}

const STAR_SPOTS: [number, number, number][] = [[40, 60, 1], [160, 50, 1.2], [30, 130, 0.8], [170, 120, 0.9], [70, 30, 0.7], [140, 150, 0.7]];

export function GlowHalo() {
  const id = useId();
  return (
    <g data-testid="special-glow">
      <defs>
        <radialGradient id={id}>
          <stop offset="0%" stopColor="#FFF6B0" stopOpacity={0.95} />
          <stop offset="100%" stopColor="#FFF6B0" stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle className="special-halo" cx={100} cy={110} r={90} fill={`url(#${id})`} />
    </g>
  );
}

export function GlowOverlay() {
  return <g>{STAR_SPOTS.slice(0, 3).map(([x, y, s], i) => <Star key={i} x={x} y={y} s={s} color="#FFE066" delay={i * 0.4} />)}</g>;
}

export function SparkleOverlay() {
  return (
    <g data-testid="special-sparkle">
      {STAR_SPOTS.map(([x, y, s], i) => <Star key={i} x={x} y={y} s={s} color={i % 2 ? '#FFC4D6' : '#C9E8FF'} delay={i * 0.3} />)}
    </g>
  );
}

export function RainbowOverlay() {
  const colors = ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#D7BAFF'];
  return (
    <g data-testid="special-rainbow" fill="none" strokeLinecap="round" opacity={0.85}>
      {colors.map((c, i) => <path key={c} d={`M${20 + i * 4} 70 A ${40 - i * 4} ${40 - i * 4} 0 0 1 ${100 - i * 4} 70`} stroke={c} strokeWidth={4} />)}
    </g>
  );
}

export function GoldOverlay() {
  return (
    <g data-testid="special-gold">
      {STAR_SPOTS.map(([x, y, s], i) => <Star key={i} x={x} y={y} s={s * 0.9} color="#F5C542" delay={i * 0.25} />)}
    </g>
  );
}

export function CrystalOverlay() {
  return (
    <g data-testid="special-crystal" fill="#FFFFFF" opacity={0.85}>
      {STAR_SPOTS.slice(0, 4).map(([x, y], i) => (
        <path key={i} className="special-star" style={{ animationDelay: `${i * 0.5}s` }} d={`M${x} ${y - 7} L${x + 5} ${y} L${x} ${y + 7} L${x - 5} ${y} Z`} />
      ))}
    </g>
  );
}
