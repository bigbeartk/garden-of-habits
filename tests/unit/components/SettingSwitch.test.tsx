import { fireEvent, screen, waitFor } from '@testing-library/react';
import { makeDeps, renderWithDeps } from '../helpers';
import { SettingSwitch } from '../../../src/components/SettingSwitch';
import { getSetting, setSetting } from '../../../src/db/settings';

describe('SettingSwitch', () => {
  it('bấm lưu vào DB; setting đổi từ nơi khác (vd. khôi phục sao lưu) thì công tắc theo', async () => {
    const { deps } = makeDeps();
    renderWithDeps(<SettingSwitch settingKey="showNoteDot" label="Chấm" onError={() => {}} />, deps);
    const sw = await screen.findByRole('switch', { name: 'Chấm' });
    fireEvent.click(sw);
    await waitFor(async () => expect(await getSetting(deps.db, 'showNoteDot')).toBe(false));
    await setSetting(deps.db, 'showNoteDot', true);
    await waitFor(() => expect(sw).toHaveAttribute('aria-checked', 'true'));
  });
});
