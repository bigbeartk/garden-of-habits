/**
 * Chip ＋ ở Hôm nay muốn mở màn Quản lý thói quen nằm trong tab Khu vườn. `nav` chỉ nhận tab,
 * nên để lại một cờ; GardenScreen `peek` trong useState initializer (an toàn với StrictMode,
 * vốn gọi initializer hai lần) rồi `take` (xoá cờ) trong effect lúc mount.
 */
let pending = false;

export function requestHabitManager(): void {
  pending = true;
}

/** Đọc cờ mà không xoá. */
export function peekHabitManagerRequest(): boolean {
  return pending;
}

/** Đọc rồi xoá cờ. */
export function takeHabitManagerRequest(): boolean {
  const p = pending;
  pending = false;
  return p;
}
