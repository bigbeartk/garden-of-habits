import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDeps } from '../app/deps';
import { dayKey } from '../domain/dayKey';
import { ensureToday } from '../domain/dayService';
import { useNow } from './useNow';

export function useToday() {
  const deps = useDeps();
  const now = useNow();
  const todayKey = dayKey(now);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    ensureToday(deps).catch((e: Error) => setError(e));
  }, [deps, todayKey]);

  const day = useLiveQuery(() => deps.db.days.get(todayKey), [deps.db, todayKey]);
  return { day, todayKey, now, error };
}
