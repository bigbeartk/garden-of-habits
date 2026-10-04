import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { BottomSheet } from '../../../src/components/BottomSheet';

describe('BottomSheet', () => {
  it('nút đóng là dấu X ở hàng tiêu đề (góc phải trên), không còn chữ "Đóng" ở đáy', async () => {
    const onClose = vi.fn();
    render(<BottomSheet open title="Ghi chú hôm nay" onClose={onClose}><p>nội dung</p></BottomSheet>);
    const dialog = screen.getByRole('dialog', { name: 'Ghi chú hôm nay' });
    const close = screen.getByRole('button', { name: 'Đóng' });
    expect(close).toHaveTextContent('');
    expect(close.querySelector('[data-icon="close"]')).not.toBeNull();
    // nằm trong hàng tiêu đề, cùng với tiêu đề, trước phần nội dung
    const head = close.closest('.sheet__head');
    expect(head).not.toBeNull();
    expect(head).toContainElement(screen.getByRole('heading', { name: 'Ghi chú hôm nay' }));
    expect(dialog.querySelector('.sheet__body')!.compareDocumentPosition(close) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    await userEvent.setup().click(close);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
