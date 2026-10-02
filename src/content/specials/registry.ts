import type { SpecialVariant } from '../types';
import { CrystalOverlay, GlowHalo, GlowOverlay, GoldOverlay, RainbowOverlay, SparkleOverlay } from './specials';

/** Thêm hiệu ứng mới: viết overlay trong specials.tsx rồi thêm 1 dòng ở đây. */
export const SPECIALS: SpecialVariant[] = [
  { id: 'glow', name: 'Phát sáng', weight: 3, Underlay: GlowHalo, Overlay: GlowOverlay, plantFilter: 'drop-shadow(0 0 6px #FFF3A0)' },
  { id: 'sparkle', name: 'Lấp lánh', weight: 3, Overlay: SparkleOverlay },
  { id: 'rainbow', name: 'Cầu vồng', weight: 2, Overlay: RainbowOverlay, plantClassName: 'special-rainbow-plant' },
  { id: 'gold', name: 'Vàng ròng', weight: 1, Overlay: GoldOverlay, plantFilter: 'sepia(0.9) saturate(2.6) hue-rotate(-12deg) brightness(1.08)' },
  { id: 'crystal', name: 'Pha lê', weight: 1, Overlay: CrystalOverlay, plantFilter: 'saturate(0.6) hue-rotate(180deg) brightness(1.15) opacity(0.9)' },
];

export function getSpecial(id: string | null): SpecialVariant | null {
  if (id === null) return null;
  return SPECIALS.find((s) => s.id === id) ?? null;
}
