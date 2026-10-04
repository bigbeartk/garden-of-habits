import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CloseIcon } from './icons';
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
            <div className="sheet__head">
              <h2 className="sheet__title">{title}</h2>
              <button type="button" className="sheet__close" aria-label="Đóng" onClick={onClose}>
                <CloseIcon size={26} />
              </button>
            </div>
            <div className="sheet__body">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
