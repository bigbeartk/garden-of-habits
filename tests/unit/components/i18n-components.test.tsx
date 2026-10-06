import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { TabBar } from '../../../src/app/TabBar';
import { SectionAddButton } from '../../../src/components/InlineAdd';
import { DeleteWithConfirm } from '../../../src/components/DeleteWithConfirm';
import { TodoList } from '../../../src/components/TodoList';
import { makeDeps, renderWithDeps } from '../helpers';

it('menu nổi bằng English', async () => {
  renderWithDeps(<TabBar current="calendar" onChange={() => {}} />, makeDeps().deps, undefined, 'en');
  await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
  for (const name of ['Calendar', 'Today', 'Garden', 'Settings']) expect(screen.getByRole('button', { name })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument();
});

it('nút ＋ buổi bằng English', () => {
  renderWithDeps(<SectionAddButton period="morning" onClick={() => {}} />, makeDeps().deps, undefined, 'en');
  expect(screen.getByRole('button', { name: 'Add morning task' })).toBeInTheDocument();
});

it('xoá có xác nhận bằng English', async () => {
  renderWithDeps(<DeleteWithConfirm text="Read" onConfirm={() => {}} />, makeDeps().deps, undefined, 'en');
  await userEvent.click(screen.getByRole('button', { name: 'Delete: Read' }));
  expect(screen.getByRole('button', { name: 'Confirm delete: Read' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
});

it('danh sách việc bằng English', () => {
  const todo = { id: 'a', text: 'Read', done: false, doneAt: null, order: 0, period: 'morning' as const };
  renderWithDeps(
    <TodoList todos={[todo]} currentPeriod="morning" onToggle={() => {}} onEdit={() => {}} onDelete={() => {}} onMove={() => {}} onAdd={() => {}} />,
    makeDeps().deps, undefined, 'en',
  );
  expect(screen.getByRole('checkbox', { name: 'Complete: Read' })).toBeInTheDocument();
  expect(screen.getAllByText('No tasks yet').length).toBe(2);
});
