import { motion } from 'motion/react';
import { INK } from '../content/Face';

/** Bình tưới nghiêng + giọt nước; render lại mỗi khi playKey tăng. */
export function WateringCan({ playKey }: { playKey: number }) {
  if (playKey === 0) return null;
  return (
    <g key={playKey} data-testid="watering-can">
      <motion.g
        initial={{ opacity: 0, x: 60, rotate: 0 }}
        animate={{ opacity: [0, 1, 1, 1, 0], x: [60, 20, 20, 20, 40], rotate: [0, 0, -28, -28, 0] }}
        transition={{ duration: 1.8, times: [0, 0.2, 0.35, 0.8, 1] }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      >
        <g transform="translate(110 40)">
          <path d="M8 10 q14 -14 28 0" fill="none" stroke={INK} strokeWidth={3} />
          <path d="M44 16 q14 4 0 22" fill="none" stroke={INK} strokeWidth={3} />
          <path d="M0 18 L-22 6 L-24 10 L-4 28 Z" fill="#BDE3FF" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
          <rect x={0} y={10} width={44} height={32} rx={10} fill="#BDE3FF" stroke={INK} strokeWidth={2} />
          <circle cx={22} cy={26} r={5} fill="#FFFFFF" opacity={0.7} />
        </g>
      </motion.g>
      {[0, 1, 2, 3].map((i) => (
        <motion.circle
          key={i}
          cx={88 + i * 4}
          cy={62}
          r={3}
          fill="#7CC8FF"
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 1, 1, 0], y: [0, 30, 60, 80] }}
          transition={{ delay: 0.7 + i * 0.12, duration: 0.7, repeat: 1 }}
        />
      ))}
    </g>
  );
}
