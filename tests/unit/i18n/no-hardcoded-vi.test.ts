import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from '@babel/parser';
import { expect, it } from 'vitest';

/** Chữ có dấu tiếng Việt (đủ để nhận ra câu Việt; chữ không dấu như "Mini" không tính). */
const VI = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
const ROOTS = ['src/app', 'src/components', 'src/screens', 'src/domain', 'src/db', 'src/hooks', 'src/platform', 'src/utils', 'src/main.tsx'];

/** File còn chữ Việt viết cứng chờ chuyển sang i18n. Đã chuyển hết: giữ rỗng. */
const NOT_YET_MIGRATED = new Set<string>(); // đã chuyển hết — không thêm lại

/** Chuỗi được phép (không bao giờ tới mắt người dùng). */
const ALLOWED = new Set<string>([
  'Đã huỷ chia sẻ', // platform: AbortError chỉ để nhận diện bằng name
  'pickUniform: danh sách rỗng', // lỗi lập trình, không tới người dùng
  'pickWeighted: danh sách rỗng',
  'Không xử lý được ảnh', // utils/image: lỗi canvas, giao diện thay bằng câu chung background.readFailed
  'Không nén được ảnh',
  'Tiếng Việt', // tên ngôn ngữ, luôn viết bằng chính nó (LanguagePicker)
]);

function files(p: string): string[] {
  if (statSync(p).isFile()) return /\.tsx?$/.test(p) ? [p] : [];
  return readdirSync(p).flatMap((f) => files(join(p, f)));
}

type Node = { type: string; value?: unknown; [k: string]: unknown };

/** Mọi chuỗi trong code (string literal, template, chữ JSX) có dấu tiếng Việt; comment không tính. */
function viStrings(file: string): string[] {
  const ast = parse(readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['typescript', 'jsx'] });
  const found: string[] = [];
  const visit = (n: unknown) => {
    if (Array.isArray(n)) return n.forEach(visit);
    if (!n || typeof n !== 'object') return;
    const node = n as Node;
    if (typeof node.type === 'string') {
      let text: string | null = null;
      if (node.type === 'StringLiteral' || node.type === 'JSXText') text = String(node.value).trim();
      else if (node.type === 'TemplateElement') text = (node.value as { cooked: string | null }).cooked;
      if (text && VI.test(text) && !ALLOWED.has(text)) found.push(text);
    }
    for (const [k, v] of Object.entries(node)) {
      if (k === 'loc' || k === 'leadingComments' || k === 'trailingComments' || k === 'innerComments' || k === 'comments') continue;
      if (v && typeof v === 'object') visit(v);
    }
  };
  visit(ast.program);
  return found;
}

const all = ROOTS.flatMap(files).map((f) => relative('.', f).split('\\').join('/'));

it('không còn chữ Việt viết cứng ngoài src/i18n và src/content', () => {
  const offenders = all
    .filter((f) => !NOT_YET_MIGRATED.has(f))
    .map((f) => [f, viStrings(f)] as const)
    .filter(([, s]) => s.length > 0);
  expect(offenders.map(([f]) => f)).toEqual([]);
});

it('danh sách chờ không chứa file đã sạch (xoá khỏi NOT_YET_MIGRATED khi chuyển xong)', () => {
  const clean = [...NOT_YET_MIGRATED].filter((f) => viStrings(f).length === 0);
  expect(clean).toEqual([]);
});
