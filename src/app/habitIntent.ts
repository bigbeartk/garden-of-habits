export type HabitManagerMode = 'list' | 'add';

/**
 * Chip ở Hôm nay muốn mở màn Quản lý thói quen nằm trong tab Khu vườn (chế độ danh sách hoặc thêm mới).
 * `nav` chỉ nhận tab, nên để lại một cờ; GardenScreen `peek` trong useState initializer (an toàn với StrictMode,
 * vốn gọi initializer hai lần) rồi `take` (xoá cờ) trong effect lúc mount.
 */
let pending: false | HabitManagerMode = false;
/** Màn quản lý được mở từ đâu: Back quay về đó. */
export type HabitManagerOrigin = 'garden' | 'today';
let origin: HabitManagerOrigin = 'garden';

export function requestHabitManager(mode: HabitManagerMode = 'list', from: HabitManagerOrigin = 'garden'): void {
  pending = mode;
  origin = from;
}

/** Đọc cờ mà không xoá. */
export function peekHabitManagerRequest(): false | HabitManagerMode {
  return pending;
}

/** Nơi đã yêu cầu (đọc kèm peek; take đặt lại về Khu vườn). */
export function peekHabitManagerOrigin(): HabitManagerOrigin {
  return origin;
}

/** Đọc rồi xoá cờ. */
export function takeHabitManagerRequest(): false | HabitManagerMode {
  const p = pending;
  pending = false;
  origin = 'garden';
  return p;
}
