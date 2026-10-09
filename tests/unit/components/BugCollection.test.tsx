import { screen, within } from '@testing-library/react';
import { makeDeps, renderWithDeps } from '../helpers';
import { BugCollection } from '../../../src/components/BugCollection';
import { BUGS, bugFor } from '../../../src/content/bugs';

const habit = { id: 'h', name: 'Uống nước', icon: '💧', color: 'sky' as const, weekdays: [0, 1, 2, 3, 4, 5, 6], order: 0, startDate: '2026-09-01', createdAt: 0, updatedAt: 0 };

describe('BugCollection', () => {
  it('chưa có thói quen thì không hiện', async () => {
    const { deps } = makeDeps();
    renderWithDeps(<BugCollection />, deps);
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByTestId('bug-collection')).not.toBeInTheDocument();
  });

  it('đếm số lần gặp từng loài; loài chưa gặp là ô bí ẩn có ghi độ hiếm', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10)); // hôm nay 02/10, chưa tick
    await deps.db.habits.put(habit);
    const done = ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05'];
    await deps.db.habitChecks.bulkPut(done.map((date) => ({ habitId: 'h', date, at: 1 })));
    renderWithDeps(<BugCollection />, deps);
    const card = await screen.findByTestId('bug-collection');
    const expected = new Map<string, number>();
    for (const d of done) expected.set(bugFor(d).id, (expected.get(bugFor(d).id) ?? 0) + 1);
    expect(within(card).getByText(`${expected.size}/${BUGS.length}`)).toBeInTheDocument();
    for (const b of BUGS) {
      const item = within(card).getByTestId(`bug-${b.id}`);
      const n = expected.get(b.id);
      if (n) {
        expect(item).toHaveAttribute('data-met', 'true');
        expect(item).toHaveAccessibleName(new RegExp(`^${b.name.vi} · .* · đã gặp ${n} lần$`));
      } else {
        expect(item).toHaveAttribute('data-met', 'false');
        expect(item).toHaveAccessibleName(/^Côn trùng bí ẩn · /);
        expect(within(item).queryByTestId('bug-art')).not.toBeInTheDocument();
      }
    }
  });
});
