import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useBackHandler } from './back';
import { TABS, type Tab } from './nav';
import { CloseIcon, MenuIcon } from '../components/icons';

const EASE = [0.22, 1, 0.36, 1] as const;
const HIDDEN = { clipPath: 'inset(0 0 0 100% round 999px)', opacity: 0.4 };
const SHOWN = { clipPath: 'inset(0 0 0 0% round 999px)', opacity: 1 };

/**
 * Menu nổi ở góc phải dưới: chỉ có một nút tròn; bấm vào thì dải 4 tab trượt
 * từ nút ra bên trái, bấm lần nữa hoặc chạm ra ngoài thì trượt ngược về. Chọn tab không đóng dải.
 */
export function TabBar({ current, onChange }: { current: Tab; onChange: (tab: Tab) => void }) {
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  useBackHandler(open, () => setOpen(false), 'sheet');

  // đang mở mà chạm ra ngoài menu thì thu dải tab lại (cú chạm vẫn tới chỗ được chạm)
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [open]);

  return (
    <nav className="fnav" aria-label="Điều hướng" ref={navRef}>
      <AnimatePresence>
        {open && (
          <motion.div
            id="fnav-tabs"
            className="fnav__tabs"
            initial={HIDDEN}
            animate={SHOWN}
            exit={HIDDEN}
            transition={{ duration: 0.38, ease: EASE }}
          >
            {TABS.map((t, i) => {
              const active = t.id === current;
              const delay = 0.04 * (TABS.length - 1 - i); // tab gần nút hiện trước
              return (
                <motion.button
                  key={t.id}
                  type="button"
                  className={`fnav__tab${active ? ' is-active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => onChange(t.id)}
                  initial={{ x: 28, opacity: 0 }}
                  animate={{ x: 0, opacity: 1, transition: { delay: 0.08 + delay, duration: 0.3, ease: EASE } }}
                  exit={{ x: 28, opacity: 0, transition: { duration: 0.18 } }}
                >
                  <t.Icon size={26} />
                  <span className="fnav__label">{t.label}</span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        type="button"
        className={`fnav__toggle${open ? ' is-open' : ''}`}
        aria-label={open ? 'Đóng menu' : 'Mở menu'}
        aria-expanded={open}
        aria-controls="fnav-tabs"
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.9 }}
      >
        <motion.span
          key={open ? 'close' : 'menu'}
          className="fnav__toggle-icon"
          initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ duration: 0.25, ease: EASE }}
        >
          {open ? <CloseIcon size={26} /> : <MenuIcon size={34} />}
        </motion.span>
      </motion.button>
    </nav>
  );
}
