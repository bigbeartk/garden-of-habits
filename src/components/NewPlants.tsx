import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState, type ReactNode } from 'react';
import { PlantScene } from './PlantScene';
import { useDeps } from '../app/deps';
import { INK } from '../content/Face';
import { PLANTS } from '../content/plants/registry';
import { plantUnlockState, unlockPlant } from '../domain/plantUnlocks';
import { BASE_STYLE_ID } from '../domain/types';
import { useI18n } from '../i18n/I18nProvider';
import { errorText } from '../i18n/errors';

interface Props {
  currentId: string;
  currentSpecialId: string | null;
  onPick: (plantId: string, specialId: string | null, styleId: string) => void;
  /** nút dáng cây của ô loài (dùng chung với lưới chính); chỉ gọi cho loài đã mở */
  styleButton: (plantId: string) => ReactNode;
}

/**
 * Mục "Cây mới" của tab Cây: các loài khoá (mờ + ổ khoá) và tiến độ ngày đạt.
 * Mỗi 90 ngày đạt được một lượt: chạm loài khoá → xác nhận `Mở khoá: <loài>` → mở luôn (không tự đổi cây hôm nay).
 */
export function NewPlants({ currentId, currentSpecialId, onPick, styleButton }: Props) {
  const { t, tr } = useI18n();
  const deps = useDeps();
  const state = useLiveQuery(() => plantUnlockState(deps), [deps]);
  /** loài đang hỏi xác nhận mở */
  const [asking, setAsking] = useState<string | null>(null);
  /** loài đang hiện dòng "còn n ngày" (chưa có lượt) */
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!justUnlocked) return;
    const id = setTimeout(() => setJustUnlocked(null), 5000);
    return () => clearTimeout(id);
  }, [justUnlocked]);
  if (!state) return null;
  const species = PLANTS.filter((p) => p.locked);

  const unlock = async (id: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await unlockPlant(deps, id);
      setJustUnlocked(id);
      setAsking(null);
    } catch (e) {
      setError(errorText(e, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="new-plants">
      <h3 className="picker__heading">{t.picker.newPlantsHeading}</h3>
      {state.nextAt !== null ? (
        <div
          className="picker__bar"
          data-testid="plant-unlock-progress"
          role="progressbar"
          aria-label={t.picker.unlockProgress}
          aria-valuemin={0}
          aria-valuemax={state.nextAt}
          aria-valuenow={Math.min(state.goodDays, state.nextAt)}
        >
          <div className="picker__bar-fill" style={{ width: `${Math.min(100, (state.goodDays / state.nextAt) * 100)}%` }} />
          <span className="picker__bar-label">{t.picker.goodDays(state.goodDays, state.nextAt)}</span>
        </div>
      ) : (
        <p className="picker__progress">{t.picker.allPlantsUnlocked}</p>
      )}
      <p className="sheet__hint">{state.freeSlots > 0 ? t.picker.freeSlots(state.freeSlots) : t.picker.goodDayRule}</p>
      {justUnlocked && (
        <p className="new-plants__done" data-testid="plant-unlocked" role="status">
          {t.picker.unlocked(tr(species.find((p) => p.id === justUnlocked)!.name))}
        </p>
      )}
      {error && <p className="sheet__hint" role="alert">{error}</p>}
      <div className="picker" data-testid="picker-new-plants">
        {species.map((p) => {
          const open = state.unlocked.includes(p.id);
          const name = tr(p.name);
          const selected = open && p.id === currentId && !currentSpecialId;
          return (
            <div key={p.id} className="picker__cell new-plants__cell" data-testid={`new-plant-${p.id}`} data-locked={!open}>
              <div className="new-plants__row">
                <button
                  type="button"
                  className={`picker__item${selected ? ' is-selected' : ''}${open ? '' : ' is-locked'}`}
                  aria-label={open ? name : t.picker.lockedPlant(name)}
                  aria-pressed={open ? selected : undefined}
                  onClick={() => {
                    if (open) return onPick(p.id, null, BASE_STYLE_ID);
                    setError(null);
                    if (state.freeSlots > 0) setAsking(p.id);
                    else setHint(p.id);
                  }}
                >
                  <PlantScene className="picker__scene" testId="picker-scene" plantId={p.id} potId={p.defaultPotId} stage="bloom" specialId={null} mood="smile" />
                  <span>{name}</span>
                  {!open && <LockBadge />}
                </button>
                {open && styleButton(p.id)}
              </div>
              {!open && asking === p.id && state.freeSlots > 0 && (
                <span className="todo__confirm new-plants__confirm">
                  <button type="button" className="todo__confirm-yes" disabled={busy} onClick={() => unlock(p.id)}>{t.picker.unlock(name)}</button>
                  <button type="button" className="todo__confirm-no" onClick={() => setAsking(null)}>{t.common.cancel}</button>
                </span>
              )}
              {!open && hint === p.id && state.freeSlots === 0 && state.nextAt !== null && (
                <p className="sheet__hint">{t.picker.needMore(state.nextAt - state.goodDays)}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Ổ khoá nhỏ ở góc ô loài khoá (cùng nét với ổ khoá của dáng bí ẩn) */
function LockBadge() {
  return (
    <svg className="new-plants__lock" viewBox="0 0 44 58" aria-hidden="true" data-icon="lock">
      <g stroke={INK} strokeWidth={4} strokeLinejoin="round">
        <path d="M8 22 V12 a14 14 0 0 1 28 0 V22" fill="none" strokeLinecap="round" />
        <rect x={2} y={22} width={40} height={32} rx={9} fill="#FFF1C1" />
        <circle cx={22} cy={38} r={4.5} fill={INK} stroke="none" />
      </g>
    </svg>
  );
}
