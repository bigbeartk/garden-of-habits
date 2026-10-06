import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DepsProvider } from '../../../src/app/deps';
import { I18nProvider, useI18n } from '../../../src/i18n/I18nProvider';
import { getSetting } from '../../../src/db/settings';
import { makeDay, makeDeps } from '../helpers';

function Probe() {
  const { lang, t, setLang } = useI18n();
  return <button type="button" onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}>{t.nav.tabs.today}</button>;
}

describe('I18nProvider', () => {
  it('không bọc Provider → tiếng Việt', () => {
    render(<Probe />);
    expect(screen.getByRole('button')).toHaveTextContent('Hôm nay');
  });

  it('lang cố định → không đọc DB; setLang đổi ngay, ghi setting và html lang', async () => {
    const { deps } = makeDeps();
    render(<DepsProvider value={deps}><I18nProvider lang="vi"><Probe /></I18nProvider></DepsProvider>);
    act(() => screen.getByRole('button').click());
    expect(screen.getByRole('button')).toHaveTextContent('Today');
    expect(document.documentElement.lang).toBe('en');
    await waitFor(async () => expect(await getSetting(deps.db, 'language')).toBe('en'));
  });

  it('không cố định → dùng resolveLang (DB có setting en)', async () => {
    const { deps } = makeDeps();
    await deps.db.settings.put({ key: 'language', value: 'en' });
    render(<DepsProvider value={deps}><I18nProvider><Probe /></I18nProvider></DepsProvider>);
    await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent('Today'));
  });

  it('không cố định, máy mới → giải xong thì ghi setting', async () => {
    const { deps } = makeDeps();
    render(<DepsProvider value={deps}><I18nProvider><Probe /></I18nProvider></DepsProvider>);
    await waitFor(async () => expect(await getSetting(deps.db, 'language')).toBeDefined());
  });
});

describe('I18nProvider: người dùng cũ, máy tiếng Anh, chưa có gợi ý', () => {
  it('chưa giải xong ngôn ngữ thì chưa render (không nháy tiếng Anh, không chọn lời cây sai tiếng), rồi ra tiếng Việt', async () => {
    localStorage.clear();
    const { deps } = makeDeps(new Date(2026, 9, 6, 10, 0));
    await deps.db.days.put(makeDay({ date: '2026-10-01' }));
    Object.defineProperty(navigator, 'languages', { value: ['en-US'], configurable: true });
    render(<DepsProvider value={deps}><I18nProvider><Probe /></I18nProvider></DepsProvider>);
    expect(screen.queryByRole('button')).toBeNull();
    await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent('Hôm nay'));
  });
});
