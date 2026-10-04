import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDeps } from '../app/deps';
import { getSetting } from '../db/settings';
import type { CalendarTheme } from '../domain/types';

/** Ảnh nền người dùng dưới dạng blob URL, kèm loại tệp (ảnh, GIF hay video). */
export function useCalendarBg(): { url: string; mime: string } | null {
  const deps = useDeps();
  const bg = useLiveQuery(() => getSetting(deps.db, 'calendarBg'), [deps.db]);
  const [value, setValue] = useState<{ url: string; mime: string } | null>(null);
  useEffect(() => {
    if (!bg) {
      setValue(null);
      return;
    }
    const url = URL.createObjectURL(new Blob([bg.data], { type: bg.mime }));
    setValue({ url, mime: bg.mime });
    return () => URL.revokeObjectURL(url);
  }, [bg]);
  return value;
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
