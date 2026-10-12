import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { HabitIcon } from '../../../src/components/HabitIcon';

describe('HabitIcon', () => {
  it('emoji trong bộ: vẽ ảnh capybara, ẩn với trình đọc màn hình', () => {
    const { container } = render(<HabitIcon icon="📚" />);
    const img = container.querySelector('img')!;
    expect(img.getAttribute('src')).toMatch(/habit-icons\/read\.webp$/);
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('data-icon', '📚');
    expect(container.textContent).toBe('');
  });

  it('emoji lạ: hiện chính emoji như cũ', () => {
    const { container } = render(<HabitIcon icon="🦄" />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toBe('🦄');
  });
});
