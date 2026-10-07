import type { CalendarTheme, MenuIconChoice, MenuIconKind } from './types';

export const MENU_ICON_CHOICES: MenuIconChoice[] = ['auto', 'flower', 'cat', 'dog', 'grass', 'rain', 'gamer'];

/** Icon thật của nút menu: chọn riêng thì dùng nó; chưa chọn / 'auto' thì theo hình nền (mặc định, ảnh riêng → bông hoa). */
export function resolveMenuIcon(choice: MenuIconChoice | undefined, theme: CalendarTheme): MenuIconKind {
  if (choice && choice !== 'auto') return choice;
  return theme === 'default' || theme === 'photo' ? 'flower' : theme;
}
