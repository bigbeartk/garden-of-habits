import { AnimatePresence, motion } from 'motion/react';

export type SpeechKind = 'greeting' | 'praise' | 'note';

/** Bong bóng thoại của cây; `kind` để test và để giới hạn số dòng khi cây nói ghi chú. */
export function SpeechBubble({ text, kind }: { text: string | null; kind?: SpeechKind }) {
  return (
    <AnimatePresence>
      {text && (
        <motion.div
          className={`bubble${kind === 'note' ? ' bubble--note' : ''}`}
          data-testid="speech-bubble"
          data-kind={kind}
          role="status"
          initial={{ opacity: 0, scale: 0.6, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', damping: 14, stiffness: 260 }}
        >
          <span className="bubble__text">{text}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
