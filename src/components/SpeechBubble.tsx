import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useI18n } from '../i18n/I18nProvider';

export type SpeechKind = 'praise' | 'tap' | 'daily';

interface EditProps {
  /** lưu lời mới; có prop này thì bong bóng 'daily' chạm vào để sửa được */
  onEdit: (text: string) => void;
  onEditingChange: (editing: boolean) => void;
  maxLength: number;
}

/**
 * Bong bóng thoại của cây. `daily` = lời cây nói cả ngày: hiện tối đa 3 dòng, chạm để sửa ngay tại chỗ
 * (Enter/rời ô: lưu, Escape: huỷ). Các câu tạm (khen, chạm) chỉ để xem, chạm xuyên qua tới cây.
 */
export function SpeechBubble({ text, kind, edit }: { text: string | null; kind?: SpeechKind; edit?: EditProps }) {
  const { t } = useI18n();
  const [draft, setDraft] = useState<string | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  /** đang mở ô sửa; chặn lưu hai lần (Enter rồi blur khi ô bị gỡ) */
  const active = useRef(false);
  const editable = kind === 'daily' && !!edit;

  const open = () => {
    active.current = true;
    // flushSync: ô nhập được gắn và focus ngay trong cú chạm, để Safari iOS bật bàn phím
    flushSync(() => setDraft(text ?? ''));
    edit!.onEditingChange(true);
    const el = input.current;
    if (el) {
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  };
  const close = (save: boolean) => {
    if (!active.current || draft === null) return;
    active.current = false;
    if (save && draft.trim() !== (text ?? '')) edit!.onEdit(draft);
    setDraft(null);
    edit!.onEditingChange(false);
  };

  const empty = text === '';
  return (
    <AnimatePresence>
      {text !== null && (
        <motion.div
          className={`bubble${kind === 'daily' ? ' bubble--daily' : ''}${empty ? ' is-empty' : ''}${draft !== null ? ' is-editing' : ''}`}
          data-testid="speech-bubble"
          data-kind={kind}
          data-empty={empty || undefined}
          role="status"
          initial={{ opacity: 0, scale: 0.6, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', damping: 14, stiffness: 260 }}
        >
          {editable && draft !== null ? (
            <textarea
              ref={input}
              className="bubble__input"
              aria-label={t.speech.label}
              rows={3}
              maxLength={edit!.maxLength}
              value={draft}
              placeholder={t.speech.placeholder}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  close(true);
                } else if (e.key === 'Escape') {
                  close(false);
                }
              }}
              onBlur={() => close(true)}
            />
          ) : editable ? (
            <button type="button" className="bubble__edit" aria-label={t.speech.edit} onClick={open}>
              <span className="bubble__text">{empty ? t.speech.empty : text}</span>
            </button>
          ) : (
            <span className="bubble__text">{text}</span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
