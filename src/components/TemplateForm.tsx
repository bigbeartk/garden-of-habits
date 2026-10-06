import { useId, useState } from 'react';
import { PERIODS, type Period } from '../domain/period';
import { PeriodIcon } from './icons';
import { parseItems } from '../domain/templateService';
import type { TemplateItem } from '../domain/types';
import { useI18n } from '../i18n/I18nProvider';
import { errorText } from '../i18n/errors';

type Texts = Record<Period, string>;

function toTexts(items: TemplateItem[]): Texts {
  const texts: Texts = { morning: '', afternoon: '', evening: '' };
  for (const p of PERIODS) texts[p] = items.filter((i) => i.period === p).map((i) => i.text).join('\n');
  return texts;
}

export function TemplateForm({ initialName = '', initialItems = [], onSave, onCancel }: {
  initialName?: string;
  initialItems?: TemplateItem[];
  onSave: (name: string, items: TemplateItem[]) => Promise<void>;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const id = useId();
  const [name, setName] = useState(initialName);
  const [texts, setTexts] = useState<Texts>(() => toTexts(initialItems));
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="tpl-form card"
      onSubmit={async (e) => {
        e.preventDefault();
        const items = PERIODS.flatMap((p) => parseItems(texts[p]).map((text) => ({ text, period: p })));
        try {
          await onSave(name, items);
        } catch (err) {
          setError(errorText(err, t));
        }
      }}
    >
      <label htmlFor={`${id}-name`} className="tpl-form__label">{t.templateForm.name}</label>
      <input id={`${id}-name`} className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder={t.templateForm.namePlaceholder} />
      {PERIODS.map((p) => (
        <div key={p} className={`tpl-form__period todo__section--${p}`}>
          <label htmlFor={`${id}-${p}`} className="tpl-form__period-label">
            <PeriodIcon period={p} size={24} /> <span>{t.templateForm.periodTasks(p)}</span> <small>{t.templateForm.onePerLine}</small>
          </label>
          <textarea
            id={`${id}-${p}`}
            className="textarea tpl-form__textarea"
            placeholder={t.templateForm.itemsPlaceholder}
            value={texts[p]}
            onChange={(e) => setTexts((prev) => ({ ...prev, [p]: e.target.value }))}
          />
        </div>
      ))}
      {error && <p role="alert" className="error">{error}</p>}
      <div className="tpl-form__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>{t.common.cancelForm}</button>
        <button type="submit" className="btn btn--primary">{t.templateForm.save}</button>
      </div>
    </form>
  );
}
