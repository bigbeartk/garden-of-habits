import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDeps } from '../app/deps';
import { getSetting } from '../db/settings';
import type { CalendarTheme } from '../domain/types';

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

/**
 * Kiểu hình nền đang dùng. Bản cũ chưa lưu `calendarTheme`: có ảnh thì là 'photo', không thì 'default'.
 * Chọn 'photo' mà ảnh đã bị xoá thì quay về 'default'.
 */
export function useCalendarTheme(): CalendarTheme {
  const deps = useDeps();
  const info = useLiveQuery(
    async () => ({ theme: await getSetting(deps.db, 'calendarTheme'), hasBg: (await getSetting(deps.db, 'calendarBg')) !== undefined }),
    [deps.db],
  );
  if (!info) return 'default';
  const theme = info.theme ?? (info.hasBg ? 'photo' : 'default');
  return theme === 'photo' && !info.hasBg ? 'default' : theme;
}
