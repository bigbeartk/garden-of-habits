import { useId, useState } from 'react';
import { PERIODS, PERIOD_LABEL, type Period } from '../domain/period';
import { parseItems } from '../domain/templateService';
import type { TemplateItem } from '../domain/types';

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
          setError((err as Error).message);
        }
      }}
    >
      <label htmlFor={`${id}-name`}>Tên mẫu</label>
      <input id={`${id}-name`} className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
      {PERIODS.map((p) => (
        <div key={p} className={`tpl-form__period tpl-form__period--${p}`}>
          <label htmlFor={`${id}-${p}`}>Việc buổi {PERIOD_LABEL[p]} (mỗi dòng một việc)</label>
          <textarea
            id={`${id}-${p}`}
            className="textarea tpl-form__textarea"
            value={texts[p]}
            onChange={(e) => setTexts((t) => ({ ...t, [p]: e.target.value }))}
          />
        </div>
      ))}
      {error && <p role="alert" className="error">{error}</p>}
      <div className="tpl-form__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Huỷ</button>
        <button type="submit" className="btn btn--primary">Lưu mẫu</button>
      </div>
    </form>
  );
}
