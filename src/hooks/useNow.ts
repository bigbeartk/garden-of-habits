import { useEffect, useState } from 'react';
import { useDeps } from '../app/deps';

export function useNow(intervalMs = 30_000): Date {
  const deps = useDeps();
  const [now, setNow] = useState(() => deps.now());
  useEffect(() => {
    const tick = () => setNow(deps.now());
    const id = setInterval(tick, intervalMs);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('focus', tick);
    };
  }, [deps, intervalMs]);
  return now;
}
