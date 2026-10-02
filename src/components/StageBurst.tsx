import { motion } from 'motion/react';

export function StageBurst({ playKey }: { playKey: number }) {
  if (playKey === 0) return null;
  return (
    <g key={playKey} data-testid="stage-burst">
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <motion.text
            key={i}
            x={100}
            y={100}
            fontSize={14}
            textAnchor="middle"
            initial={{ opacity: 1, x: 0, y: 0, scale: 0.6 }}
            animate={{ opacity: 0, x: Math.cos(a) * 70, y: Math.sin(a) * 70, scale: 1.3 }}
            transition={{ duration: 1.1, ease: 'easeOut', delay: 0.9 }}
          >
            {i % 2 ? '🍃' : '🌸'}
          </motion.text>
        );
      })}
    </g>
  );
}
