import { useEffect, useState } from 'react';
import { useDeps } from '../app/deps';
import { onAppResume } from '../platform';

export function useNow(intervalMs = 30_000): Date {
  const deps = useDeps();
  const [now, setNow] = useState(() => deps.now());
  useEffect(() => {
    const tick = () => setNow(deps.now());
    const id = setInterval(tick, intervalMs);
    const off = onAppResume(tick);
    return () => {
      clearInterval(id);
      off();
    };
  }, [deps, intervalMs]);
  return now;
}
