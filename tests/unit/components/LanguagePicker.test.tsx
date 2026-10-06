import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { handleBack } from '../../../src/app/back';
import { LanguagePicker } from '../../../src/components/LanguagePicker';
import { getSetting } from '../../../src/db/settings';
import { makeDeps, renderWithDeps } from '../helpers';

const toggle = () => screen.getByRole('button', { name: /^Ngôn ngữ · Language/ });

describe('LanguagePicker (dropdown tự vẽ)', () => {
  it('đóng: nút ghi ngôn ngữ đang dùng, chưa có danh sách', () => {
    renderWithDeps(<LanguagePicker />, makeDeps().deps);
    expect(toggle()).toHaveTextContent('Tiếng Việt');
    expect(toggle()).toHaveAttribute('aria-haspopup', 'listbox');
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('mở ra danh sách, chọn English thì đổi ngay, tự đóng và lưu lại', async () => {
    const { deps } = makeDeps();
    const user = userEvent.setup();
    renderWithDeps(<LanguagePicker />, deps);
    await user.click(toggle());
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
    const list = screen.getByRole('listbox', { name: 'Ngôn ngữ · Language' });
    const options = within(list).getAllByRole('option');
    expect(options.map((o) => o.textContent)).toEqual(['Tiếng Việt', 'English']);
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    await user.click(within(list).getByRole('option', { name: 'English' }));
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(toggle()).toHaveTextContent('English');
    await waitFor(async () => expect(await getSetting(deps.db, 'language')).toBe('en'));
  });

  it('chạm ra ngoài thì đóng, không đổi ngôn ngữ', async () => {
    const user = userEvent.setup();
    renderWithDeps(<div><p>ngoài</p><LanguagePicker /></div>, makeDeps().deps);
    await user.click(toggle());
    fireEvent.pointerDown(screen.getByText('ngoài'));
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(toggle()).toHaveTextContent('Tiếng Việt');
  });

  it('Escape đóng và trả focus về nút', async () => {
    const user = userEvent.setup();
    renderWithDeps(<LanguagePicker />, makeDeps().deps);
    await user.click(toggle());
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(toggle()).toHaveFocus();
  });

  it('nút Back của Android đóng danh sách trước', async () => {
    const user = userEvent.setup();
    renderWithDeps(<LanguagePicker />, makeDeps().deps);
    await user.click(toggle());
    expect(handleBack()).toBe(true);
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
  });

  it('bàn phím: mũi tên xuống rồi Enter chọn English', async () => {
    const user = userEvent.setup();
    renderWithDeps(<LanguagePicker />, makeDeps().deps);
    toggle().focus();
    await user.keyboard('{Enter}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(toggle()).toHaveTextContent('English');
  });
});
