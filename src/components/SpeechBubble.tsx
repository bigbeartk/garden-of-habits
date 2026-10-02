import { AnimatePresence, motion } from 'motion/react';

export function SpeechBubble({ text }: { text: string | null }) {
  return (
    <AnimatePresence>
      {text && (
        <motion.div
          className="bubble"
          data-testid="speech-bubble"
          role="status"
          initial={{ opacity: 0, scale: 0.6, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', damping: 14, stiffness: 260 }}
        >
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
