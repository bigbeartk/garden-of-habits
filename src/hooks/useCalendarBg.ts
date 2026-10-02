import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDeps } from '../app/deps';
import { getSetting } from '../db/settings';

export function useCalendarBgUrl(): string | null {
  const deps = useDeps();
  const bg = useLiveQuery(() => getSetting(deps.db, 'calendarBg'), [deps.db]);
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!bg) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(new Blob([bg.data], { type: bg.mime }));
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [bg]);
  return url;
}
