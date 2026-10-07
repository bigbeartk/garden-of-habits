import { useEffect, useId, useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { BottomSheet } from './BottomSheet';
import { PlantPicker } from './PlantPicker';
import { PotPicker } from './PotPicker';
import { PotIcon, SproutIcon } from './icons';
import { useBackHandler } from '../app/back';
import { useDeps } from '../app/deps';
import { getSpecies } from '../content/plants/registry';
import { listUnlockedStyles } from '../domain/styleUnlocks';
import { BASE_STYLE_ID, type DayRecord } from '../domain/types';
import { useI18n } from '../i18n/I18nProvider';

type Tab = 'plant' | 'pot';

interface Props {
  open: boolean;
  day: DayRecord;
  onClose: () => void;
  onPickPlant: (plantId: string, specialId: string | null, styleId: string) => void;
  onPickPot: (potId: string) => void;
}

/**
 * Bảng Đổi cây & chậu: hai tab Cây → Chậu (icon + chữ). Mỗi lần mở về tab Cây;
 * ngày tiết kiệm năng lượng không đổi cây được nên mở thẳng tab Chậu, tab Cây khoá.
 * Màn dáng của một loài thay nội dung tab Cây và ẩn hàng tab.
 */
export function PlantPotSheet({ open, day, onClose, onPickPlant, onPickPot }: Props) {
  const { t, tr } = useI18n();
  const deps = useDeps();
  const id = useId();
  const firstTab: Tab = day.isRestDay ? 'pot' : 'plant';
  const [tab, setTab] = useState<Tab>(firstTab);
  /** loài đang xem màn dáng; null = lưới loài */
  const [styleFor, setStyleFor] = useState<string | null>(null);
  useEffect(() => {
    if (open) setTab(firstTab);
    else setStyleFor(null);
  }, [open, firstTab]);
  // Back của Android ở màn dáng: về lưới loài thay vì đóng bảng
  useBackHandler(open && styleFor !== null, () => setStyleFor(null), 'sheet');
  // đọc cả lúc bảng đóng: mở bảng là có số dáng ngay, không nháy "1/3"
  const unlockedStyles = useLiveQuery(() => listUnlockedStyles(deps), [deps]);

  const showStyles = tab === 'plant' && styleFor !== null;
  const title = showStyles && styleFor ? t.picker.stylesOf(tr(getSpecies(styleFor).name)) : t.picker.title;
  const tabs: { key: Tab; label: string; icon: ReactNode; disabled: boolean }[] = [
    { key: 'plant', label: t.picker.tabPlant, icon: <SproutIcon size={24} />, disabled: day.isRestDay },
    { key: 'pot', label: t.picker.tabPot, icon: <PotIcon size={24} />, disabled: false },
  ];
  return (
    <BottomSheet open={open} title={title} onClose={onClose}>
      {!showStyles && (
        <div className="seg-tabs" role="tablist" aria-label={t.picker.title}>
          {tabs.map((x) => (
            <button
              key={x.key}
              type="button"
              role="tab"
              id={`${id}-tab-${x.key}`}
              aria-controls={`${id}-panel`}
              aria-selected={tab === x.key}
              className={`seg-tabs__tab${tab === x.key ? ' is-active' : ''}`}
              disabled={x.disabled}
              onClick={() => setTab(x.key)}
            >
              {x.icon}
              <span>{x.label}</span>
            </button>
          ))}
        </div>
      )}
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${tab}`}>
        {tab === 'plant' ? (
          <PlantPicker
            currentId={day.plantId}
            currentSpecialId={day.specialId}
            currentStyleId={day.styleId ?? BASE_STYLE_ID}
            styleFor={styleFor}
            onStyleFor={setStyleFor}
            unlockedStyles={unlockedStyles}
            onPick={onPickPlant}
          />
        ) : (
          <PotPicker day={day} onPick={onPickPot} />
        )}
      </div>
    </BottomSheet>
  );
}
