import { expect, it } from 'vitest';
import { peekHabitManagerOrigin, peekHabitManagerRequest, requestHabitManager, takeHabitManagerRequest } from '../../../src/app/habitIntent';

it('cờ mở màn quản lý chỉ đọc được một lần', () => {
  expect(takeHabitManagerRequest()).toBe(false);
  requestHabitManager();
  expect(takeHabitManagerRequest()).toBe('list');
  expect(takeHabitManagerRequest()).toBe(false);
});

it('peek không xoá cờ; take mới xoá', () => {
  expect(peekHabitManagerRequest()).toBe(false);
  requestHabitManager();
  expect(peekHabitManagerRequest()).toBe('list');
  expect(peekHabitManagerRequest()).toBe('list');
  expect(takeHabitManagerRequest()).toBe('list');
  expect(peekHabitManagerRequest()).toBe(false);
});

it('cờ mang chế độ thêm', () => {
  requestHabitManager('add');
  expect(peekHabitManagerRequest()).toBe('add');
  expect(takeHabitManagerRequest()).toBe('add');
  expect(takeHabitManagerRequest()).toBe(false);
});

it('cờ nhớ nơi mở và take đặt lại', () => {
  expect(peekHabitManagerOrigin()).toBe('garden');
  requestHabitManager('list', 'today');
  expect(peekHabitManagerOrigin()).toBe('today');
  takeHabitManagerRequest();
  expect(peekHabitManagerOrigin()).toBe('garden');
});
