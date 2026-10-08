export type HabitManagerMode = 'list' | 'add';

/**
 * Chip ở Hôm nay muốn mở màn Quản lý thói quen nằm trong tab Khu vườn (chế độ danh sách hoặc thêm mới).
 * `nav` chỉ nhận tab, nên để lại một cờ; GardenScreen `peek` trong useState initializer (an toàn với StrictMode,
 * vốn gọi initializer hai lần) rồi `take` (xoá cờ) trong effect lúc mount.
 */
let pending: false | HabitManagerMode = false;

export function requestHabitManager(mode: HabitManagerMode = 'list'): void {
  pending = mode;
}

/** Đọc cờ mà không xoá. */
export function peekHabitManagerRequest(): false | HabitManagerMode {
  return pending;
}

/** Đọc rồi xoá cờ. */
export function takeHabitManagerRequest(): false | HabitManagerMode {
  const p = pending;
  pending = false;
  return p;
}
