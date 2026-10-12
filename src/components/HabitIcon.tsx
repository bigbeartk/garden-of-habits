import { habitIconSrc } from '../content/habits';

/** Icon của một thói quen: ảnh capybara nếu emoji có trong bộ, không thì hiện emoji (dữ liệu cũ). Chỉ để trang trí. */
export function HabitIcon({ icon, className = 'habit-icon' }: { icon: string; className?: string }) {
  const src = habitIconSrc(icon);
  if (!src) return <>{icon}</>;
  return <img className={className} src={src} alt="" data-icon={icon} draggable={false} decoding="async" />;
}
