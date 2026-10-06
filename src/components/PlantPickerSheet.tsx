import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { BottomSheet } from './BottomSheet';
import { BackButton } from './BackButton';
import { LockedStyleArt } from './LockedStyleArt';
import { PlantScene } from './PlantScene';
import { StylesIcon } from './icons';
import { useBackHandler } from '../app/back';
import { useDeps } from '../app/deps';
import { PLANTS, getSpecies } from '../content/plants/registry';
import { BASE_STYLE_NAME, getStyle } from '../content/plants/styles';
import { getSpecial } from '../content/specials/registry';
import { listUnlockedSpecials } from '../domain/specialUnlocks';
import { listUnlockedStyles, styleKey, styleProgress } from '../domain/styleUnlocks';
import { BASE_STYLE_ID } from '../domain/types';
import { useI18n } from '../i18n/I18nProvider';

interface Props {
  open: boolean;
  currentId: string;
  currentSpecialId: string | null;
  currentStyleId: string;
  onClose: () => void;
  onPick: (plantId: string, specialId: string | null, styleId: string) => void;
}

/**
 * Bảng Đổi cây: các loài thường (dáng Gốc), rồi các cây đặc biệt đã gặp (chọn lại được).
 * Nút lá ở góc ô loài mở màn dáng của loài đó (thay nội dung bảng); dáng chưa mở không lộ hình.
 */
export function PlantPickerSheet({ open, currentId, currentSpecialId, currentStyleId: rawStyleId, onClose, onPick }: Props) {
  const { tr } = useI18n();
  const deps = useDeps();
  // dáng không thuộc loài hôm nay (file sao lưu, nội dung đã đổi) coi như Gốc
  const currentStyleId = getStyle(getSpecies(currentId), rawStyleId)?.id ?? BASE_STYLE_ID;
  const unlocked = useLiveQuery(() => listUnlockedSpecials(deps), [deps]) ?? [];
  // đọc cả lúc bảng đóng: mở bảng là có số dáng ngay, không nháy "1/3"
  const unlockedStyles = useLiveQuery(() => listUnlockedStyles(deps), [deps]);
  /** loài đang xem màn dáng; null = lưới loài */
  const [styleFor, setStyleFor] = useState<string | null>(null);
  useEffect(() => {
    if (!open) setStyleFor(null);
  }, [open]);
  // Back của Android ở màn dáng: về lưới loài thay vì đóng bảng
  useBackHandler(open && styleFor !== null, () => setStyleFor(null), 'sheet');

  const title = styleFor ? `Dáng của ${tr(getSpecies(styleFor).name)}` : 'Chọn cây hôm nay';
  return (
    <BottomSheet open={open} title={title} onClose={onClose}>
      {styleFor ? (
        <StyleView plantId={styleFor} currentId={currentId} currentStyleId={currentStyleId} onBack={() => setStyleFor(null)} onPick={onPick} />
      ) : (
        <>
          <div className="picker">
            {PLANTS.map((p) => {
              const selected = p.id === currentId && !currentSpecialId;
              const opened = 1 + (p.styles ?? []).filter((s) => unlockedStyles?.has(styleKey({ plantId: p.id, styleId: s.id }))).length;
              return (
                <div key={p.id} className="picker__cell">
                  <button
                    type="button"
                    className={`picker__item${selected ? ' is-selected' : ''}`}
                    aria-label={tr(p.name)}
                    aria-pressed={selected}
                    onClick={() => onPick(p.id, null, BASE_STYLE_ID)}
                  >
                    <PlantScene className="picker__scene" testId="picker-scene" plantId={p.id} potId={p.defaultPotId} stage="bloom" specialId={null} mood="smile" />
                    <span>{tr(p.name)}</span>
                  </button>
                  {!!p.styles?.length && (
                    <button type="button" className="picker__style-btn" aria-label={`Dáng cây: ${tr(p.name)} (${opened}/3)`} onClick={() => setStyleFor(p.id)}>
                      <StylesIcon size={20} />
                      <span className="picker__style-count" aria-hidden="true">{opened}/3</span>
                      {p.id === currentId && currentStyleId !== BASE_STYLE_ID && <span className="icon-btn__badge" />}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <h3 className="picker__heading">✨ Cây đặc biệt đã gặp</h3>
          {unlocked.length === 0 ? (
            <p className="sheet__hint">Mỗi ngày có 10% cơ hội gặp cây đặc biệt — gặp rồi sẽ chọn lại được ở đây.</p>
          ) : (
            <div className="picker" data-testid="picker-specials">
              {unlocked.map(({ plantId, specialId }) => {
                const species = getSpecies(plantId);
                const special = getSpecial(specialId);
                const effect = special ? tr(special.name) : '';
                const name = `${tr(species.name)} · ${effect}`;
                const selected = plantId === currentId && specialId === currentSpecialId;
                return (
                  <button
                    key={`${plantId}-${specialId}`}
                    type="button"
                    className={`picker__item picker__item--special${selected ? ' is-selected' : ''}`}
                    aria-label={name}
                    aria-pressed={selected}
                    // cùng loài thì giữ dáng hôm nay, khác loài thì về Gốc
                    onClick={() => onPick(plantId, specialId, plantId === currentId ? currentStyleId : BASE_STYLE_ID)}
                  >
                    <PlantScene className="picker__scene" testId="picker-scene" plantId={plantId} potId={species.defaultPotId} stage="bloom" specialId={specialId} mood="smile" />
                    <span>{tr(species.name)}</span>
                    <span className="picker__effect">{effect}</span>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </BottomSheet>
  );
}

/** Màn dáng của một loài: tiến độ ra hoa + 3 ô (Gốc, 2 dáng); dáng khoá chỉ hiện ô bí ẩn. */
function StyleView({ plantId, currentId, currentStyleId, onBack, onPick }: {
  plantId: string;
  currentId: string;
  currentStyleId: string;
  onBack: () => void;
  onPick: Props['onPick'];
}) {
  const { tr } = useI18n();
  const deps = useDeps();
  const species = getSpecies(plantId);
  const progress = useLiveQuery(() => styleProgress(deps, plantId), [deps, plantId]);
  const next = progress?.styles.find((s) => !s.unlocked);
  const pressed = (id: string) => plantId === currentId && currentStyleId === id;
  return (
    <>
      <div className="picker__style-head">
        <BackButton inline label="Quay lại chọn cây" onClick={onBack} />
        {progress && <p className="picker__progress">🌸 <span>Đã ra hoa {progress.bloomDays} ngày</span></p>}
      </div>
      {progress &&
        (next ? (
          <div className="picker__bar" role="progressbar" aria-label="Tiến độ mở dáng" aria-valuemin={0} aria-valuemax={next.unlockAt} aria-valuenow={Math.min(progress.bloomDays, next.unlockAt)}>
            <div className="picker__bar-fill" style={{ width: `${Math.min(100, (progress.bloomDays / next.unlockAt) * 100)}%` }} />
            <span className="picker__bar-label">{progress.bloomDays}/{next.unlockAt}</span>
          </div>
        ) : (
          <p className="picker__progress">Đã mở hết dáng!</p>
        ))}
      <div className="picker">
        <button
          type="button"
          data-testid={`style-${BASE_STYLE_ID}`}
          className={`picker__item${pressed(BASE_STYLE_ID) ? ' is-selected' : ''}`}
          aria-pressed={pressed(BASE_STYLE_ID)}
          onClick={() => onPick(plantId, null, BASE_STYLE_ID)}
        >
          <PlantScene className="picker__scene" testId="picker-scene" plantId={plantId} potId={species.defaultPotId} stage="bloom" specialId={null} styleId={BASE_STYLE_ID} mood="smile" />
          <span>{BASE_STYLE_NAME}</span>
        </button>
        {progress?.styles.map((s) =>
          s.unlocked ? (
            <button
              key={s.id}
              type="button"
              data-testid={`style-${s.id}`}
              className={`picker__item${pressed(s.id) ? ' is-selected' : ''}`}
              aria-pressed={pressed(s.id)}
              onClick={() => onPick(plantId, null, s.id)}
            >
              <PlantScene className="picker__scene" testId="picker-scene" plantId={plantId} potId={species.defaultPotId} stage="bloom" specialId={null} styleId={s.id} mood="smile" />
              <span>{tr(getStyle(species, s.id)!.name)}</span>
            </button>
          ) : (
            <button
              key={s.id}
              type="button"
              data-testid={`style-${s.id}`}
              className="picker__item is-locked"
              aria-disabled="true"
              aria-label={`Dáng bí ẩn, ra hoa ${s.unlockAt} ngày để mở`}
            >
              <LockedStyleArt />
              <span>Dáng bí ẩn</span>
              <span className="picker__effect">Ra hoa {s.unlockAt} ngày để mở</span>
            </button>
          ),
        )}
      </div>
    </>
  );
}
