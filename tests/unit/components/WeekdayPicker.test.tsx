import { describe, expect, it } from 'vitest';
import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { I18nProvider } from '../../../src/i18n/I18nProvider';
import { WeekdayPicker } from '../../../src/components/WeekdayPicker';

function Harness() {
  const [v, setV] = useState<number[]>([1]);
  return (
    <I18nProvider lang="vi">
      <p id="lbl">Lịch</p>
      <WeekdayPicker value={v} onChange={setV} labelledBy="lbl" />
      <output>{v.join(',')}</output>
    </I18nProvider>
  );
}

describe('WeekdayPicker', () => {
  it('7 nút T2…CN, bấm để bật/tắt', () => {
    render(<Harness />);
    const group = screen.getByRole('group', { name: 'Lịch' });
    expect(group.querySelectorAll('button')).toHaveLength(7);
    expect(screen.getByRole('button', { name: 'Thứ Hai' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Chủ Nhật' }));
    fireEvent.click(screen.getByRole('button', { name: 'Thứ Hai' }));
    expect(screen.getByRole('status').textContent).toBe('0');
  });
});
