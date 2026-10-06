import { describe, expect, it } from 'vitest';
import { AppError, LockedDayError, type ErrorCode } from '../../../src/domain/errors';
import { errorText } from '../../../src/i18n/errors';
import { en } from '../../../src/i18n/en';
import { vi } from '../../../src/i18n/vi';
import { parseBackup } from '../../../src/db/backup';

const CODES = Object.keys(vi.errors) as ErrorCode[];
const VI_CHARS = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

describe('errorText', () => {
  it('mọi mã có câu tiếng Anh, không lọt chữ Việt', () => {
    expect(CODES.length).toBe(16);
    for (const code of CODES) {
      const s = errorText(new AppError(code, { date: '2026-10-01', id: 'x' }), en);
      expect(s.length).toBeGreaterThan(0);
      expect(s).not.toMatch(VI_CHARS);
    }
  });
  it('message của AppError là câu tiếng Việt (log và test cũ)', () => {
    expect(new LockedDayError('2026-10-01').message).toBe('Ngày 2026-10-01 đã qua, chỉ có thể sửa ghi chú.');
    expect(new LockedDayError('2026-10-01')).toBeInstanceOf(AppError);
  });
  it('lỗi lạ → message gốc', () => {
    expect(errorText(new Error('boom'), en)).toBe('boom');
  });
});

describe('parseBackup trả mã lỗi', () => {
  it.each([
    ['{', 'notJson'],
    ['{"format":"x"}', 'wrongFormat'],
    ['{"format":"chau-cay-chibi-backup","schemaVersion":999}', 'tooNew'],
    ['{"format":"chau-cay-chibi-backup","schemaVersion":1}', 'corrupt'],
  ] as const)('%s → %s', (text, code) => {
    const r = parseBackup(text);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe(code);
      expect(en.backup.errors[r.code](r.path)).not.toMatch(VI_CHARS);
    }
  });
});
