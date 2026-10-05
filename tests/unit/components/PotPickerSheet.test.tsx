import { render, screen } from '@testing-library/react';
import { PotPickerSheet } from '../../../src/components/PotPickerSheet';
import { makeDay } from '../helpers';

describe('PotPickerSheet', () => {
  it('ảnh xem trước trong từng chậu vẽ đúng dáng cây hôm nay', () => {
    render(<PotPickerSheet open day={makeDay({ date: '2026-10-02', plantId: 'sunflower', finalStage: 'bloom', styleId: 'giant' })} onClose={() => {}} onPick={() => {}} />);
    for (const scene of screen.getAllByTestId('picker-scene')) expect(scene).toHaveAttribute('data-style', 'giant');
  });
});
