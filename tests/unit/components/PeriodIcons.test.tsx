import { render, screen, within } from '@testing-library/react';
import { PeriodPicker } from '../../../src/components/PeriodPicker';
import { PlannedList } from '../../../src/components/PlannedList';
import { TodoList } from '../../../src/components/TodoList';
import { DayDetailSheet } from '../../../src/components/DayDetailSheet';
import { makeDay } from '../helpers';

const EMOJI = /[\u2600-\u27BF\u{1F300}-\u{1FAFF}]/u;
const ICONS = { morning: 'period-morning', afternoon: 'period-afternoon', evening: 'period-evening' } as const;

function expectCuteIcon(el: HTMLElement, period: keyof typeof ICONS) {
  expect(el.querySelector(`svg[data-icon="${ICONS[period]}"]`)).not.toBeNull();
  expect(el.textContent ?? '').not.toMatch(EMOJI);
}

describe('icon Sáng/Chiều/Tối là SVG tự vẽ, không phải emoji', () => {
  it('bảng chi tiết ngày', () => {
    render(
      <DayDetailSheet
        dateKey="2026-10-01"
        status="plant"
        record={makeDay({ date: '2026-10-01', todos: [{ id: 'a', text: 'A', done: true, doneAt: 1, order: 0, period: 'morning' }] })}
        onClose={() => {}}
      />,
    );
    const dialog = screen.getByRole('dialog');
    for (const p of ['morning', 'afternoon', 'evening'] as const) {
      expectCuteIcon(within(dialog).getByTestId(`detail-section-${p}`).querySelector('h4')!, p);
    }
  });

  it('danh sách việc hôm nay và ngày tương lai', () => {
    const { unmount } = render(<TodoList todos={[]} currentPeriod="morning" onToggle={() => {}} onEdit={() => {}} onDelete={() => {}} onReorder={() => {}} />);
    for (const p of ['morning', 'afternoon', 'evening'] as const) expectCuteIcon(screen.getByTestId(`todo-section-${p}`).querySelector('h2')!, p);
    unmount();
    render(<PlannedList items={[]} onEdit={() => {}} onDelete={() => {}} />);
    for (const p of ['morning', 'afternoon', 'evening'] as const) expectCuteIcon(screen.getByTestId(`todo-section-${p}`).querySelector('h2')!, p);
  });

  it('ô chọn buổi', () => {
    render(<PeriodPicker value="evening" onChange={() => {}} />);
    expectCuteIcon(screen.getByRole('radio', { name: /Sáng/ }), 'morning');
    expectCuteIcon(screen.getByRole('radio', { name: /Chiều/ }), 'afternoon');
    expectCuteIcon(screen.getByRole('radio', { name: /Tối/ }), 'evening');
  });
});

describe('ô đánh dấu việc trong bảng chi tiết không dùng emoji', () => {
  it('việc xong/chưa xong dùng dấu tự vẽ', () => {
    render(
      <DayDetailSheet
        dateKey="2026-10-01"
        status="plant"
        record={makeDay({ date: '2026-10-01', todos: [
          { id: 'a', text: 'Xong rồi', done: true, doneAt: 1, order: 0, period: 'morning' },
          { id: 'b', text: 'Chưa xong', done: false, doneAt: null, order: 1, period: 'morning' },
        ] })}
        onClose={() => {}}
      />,
    );
    const items = within(screen.getByTestId('detail-section-morning')).getAllByRole('listitem');
    for (const li of items) expect(li.textContent ?? '').not.toMatch(EMOJI);
    expect(items[0].querySelector('.detail__check.is-done')).not.toBeNull();
    expect(items[1].querySelector('.detail__check:not(.is-done)')).not.toBeNull();
  });
});
