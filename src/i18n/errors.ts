import { AppError } from '../domain/errors';
import type { Messages } from './vi';

/** Câu báo lỗi cho người dùng theo ngôn ngữ đang dùng. */
export function errorText(e: unknown, t: Messages): string {
  if (e instanceof AppError) return t.errors[e.code](e.params);
  return e instanceof Error ? e.message : String(e);
}
