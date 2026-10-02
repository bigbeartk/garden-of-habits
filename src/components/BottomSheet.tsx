import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import './sheet.css';

export function BottomSheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="sheet__backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          >
            <div className="sheet__grip" aria-hidden="true" />
            <h2 className="sheet__title">{title}</h2>
            <div className="sheet__body">{children}</div>
            <button type="button" className="btn btn--ghost sheet__close" onClick={onClose}>Đóng</button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
