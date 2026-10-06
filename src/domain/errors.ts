import { vi } from '../i18n/vi';

export type ErrorParams = { date?: string; id?: string };
export type ErrorCode = keyof typeof vi.errors;

/** Lỗi nghiệp vụ có mã để giao diện dịch (`errorText`); message là câu tiếng Việt (log, test cũ). */
export class AppError extends Error {
  constructor(readonly code: ErrorCode, readonly params: ErrorParams = {}) {
    super(vi.errors[code](params));
    this.name = 'AppError';
  }
}

/** Sửa ngày đã qua (đã khoá). */
export class LockedDayError extends AppError {
  constructor(date: string) {
    super('dayLocked', { date });
    this.name = 'LockedDayError';
  }
}
