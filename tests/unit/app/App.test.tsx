import { screen } from '@testing-library/react';
import { App } from '../../../src/app/App';
import { CATALOG } from '../../../src/content/catalog';
import { markGreeted, ensureToday } from '../../../src/domain/dayService';
import { makeDeps, renderWithDeps } from '../helpers';

describe('App', () => {
  it('lần đầu mở trong ngày thì tự chuyển sang tab Hôm nay để cây chào', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    renderWithDeps(<App />, deps);
    expect(await screen.findByTestId('speech-bubble')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hôm nay' })).toHaveAttribute('aria-current', 'page');
  });

  it('đã chào rồi thì mở màn Lịch', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    const day = await ensureToday(deps);
    await markGreeted(deps, day.date);
    renderWithDeps(<App />, deps);
    expect(await screen.findByRole('button', { name: 'Lịch' })).toHaveAttribute('aria-current', 'page');
  });
});
