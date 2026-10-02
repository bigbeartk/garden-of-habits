import { act, screen, waitFor } from '@testing-library/react';
import { useToday } from '../../../src/hooks/useToday';
import { useBackupReminder } from '../../../src/hooks/useBackupReminder';
import { setSetting } from '../../../src/db/settings';
import { makeDay, makeDeps, renderWithDeps } from '../helpers';

function Probe() {
  const { day, todayKey } = useToday();
  return <p data-testid="probe">{todayKey}|{day?.date ?? 'loading'}</p>;
}

function ReminderProbe() {
  return <p data-testid="reminder">{String(useBackupReminder())}</p>;
}

describe('useToday', () => {
  it('tạo bản ghi hôm nay khi mở', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0));
    renderWithDeps(<Probe />, deps);
    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('2026-10-02|2026-10-02'));
    expect(await deps.db.days.count()).toBe(1);
  });

  it('app mở xuyên qua 4:00 sáng: quay lại app thì sang ngày mới', async () => {
    const { deps, clock } = makeDeps(new Date(2026, 9, 2, 23, 0));
    renderWithDeps(<Probe />, deps);
    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('2026-10-02|2026-10-02'));
    clock.current = new Date(2026, 9, 3, 4, 5);
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('2026-10-03|2026-10-03'));
    expect((await deps.db.days.toArray()).map((d) => d.date)).toEqual(['2026-10-02', '2026-10-03']);
  });
});

describe('useBackupReminder', () => {
  it('nhắc khi dữ liệu cũ hơn 7 ngày mà chưa sao lưu', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 20, 10, 0));
    await deps.db.days.put(makeDay({ date: '2026-10-01', createdAt: new Date(2026, 9, 1).getTime() }));
    renderWithDeps(<ReminderProbe />, deps);
    await waitFor(() => expect(screen.getByTestId('reminder')).toHaveTextContent('true'));
    await act(() => setSetting(deps.db, 'lastBackupAt', new Date(2026, 9, 19).getTime()));
    await waitFor(() => expect(screen.getByTestId('reminder')).toHaveTextContent('false'));
  });
});
