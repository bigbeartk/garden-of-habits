import { useId, useState } from 'react';
import { parseItems } from '../domain/templateService';

export function TemplateForm({ initialName = '', initialItems = [], onSave, onCancel }: {
  initialName?: string; initialItems?: string[]; onSave: (name: string, items: string[]) => Promise<void>; onCancel: () => void;
}) {
  const id = useId();
  const [name, setName] = useState(initialName);
  const [itemsText, setItemsText] = useState(initialItems.join('\n'));
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="tpl-form card"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await onSave(name, parseItems(itemsText));
        } catch (err) {
          setError((err as Error).message);
        }
      }}
    >
      <label htmlFor={`${id}-name`}>Tên mẫu</label>
      <input id={`${id}-name`} className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
      <label htmlFor={`${id}-items`}>Các việc (mỗi dòng một việc)</label>
      <textarea id={`${id}-items`} className="textarea" value={itemsText} onChange={(e) => setItemsText(e.target.value)} />
      {error && <p role="alert" className="error">{error}</p>}
      <div className="tpl-form__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Huỷ</button>
        <button type="submit" className="btn btn--primary">Lưu mẫu</button>
      </div>
    </form>
  );
}
