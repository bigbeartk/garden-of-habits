import { expect, it } from 'vitest';
import { peekHabitManagerRequest, requestHabitManager, takeHabitManagerRequest } from '../../../src/app/habitIntent';

it('cờ mở màn quản lý chỉ đọc được một lần', () => {
  expect(takeHabitManagerRequest()).toBe(false);
  requestHabitManager();
  expect(takeHabitManagerRequest()).toBe(true);
  expect(takeHabitManagerRequest()).toBe(false);
});

it('peek không xoá cờ; take mới xoá', () => {
  expect(peekHabitManagerRequest()).toBe(false);
  requestHabitManager();
  expect(peekHabitManagerRequest()).toBe(true);
  expect(peekHabitManagerRequest()).toBe(true);
  expect(takeHabitManagerRequest()).toBe(true);
  expect(peekHabitManagerRequest()).toBe(false);
});
