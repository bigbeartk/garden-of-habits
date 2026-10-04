import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { CloseIcon } from './icons';
import './sheet.css';

/**
 * Bảng trượt từ dưới lên. `tall`: phủ gần hết màn hình, tiêu đề + nút X đứng yên, nội dung cuộn bên trong.
 * Gắn thẳng vào `<body>` (portal) để CSS của màn chứa nó không đổi được `position: fixed`
 * (màn Lịch đặt `position: relative` cho mọi con trực tiếp để nằm trên nền động).
 */
export function BottomSheet({ open, title, onClose, children, tall }: { open: boolean; title: string; onClose: () => void; children: ReactNode; tall?: boolean }) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="sheet__backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className={`sheet${tall ? ' sheet--tall' : ''}`}
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
    </AnimatePresence>,
    document.body,
  );
}
