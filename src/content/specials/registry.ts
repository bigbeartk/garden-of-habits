import type { SpecialVariant } from '../types';
import { CrystalOverlay, GlowHalo, GlowOverlay, GoldOverlay, RainbowOverlay, SparkleOverlay } from './specials';
import { CrystalFilter, GlowFilter, GoldFilter, RainbowFilter } from './filters';

/** Thêm hiệu ứng mới: viết overlay trong specials.tsx rồi thêm 1 dòng ở đây. */
export const SPECIALS: SpecialVariant[] = [
  { id: 'glow', name: 'Phát sáng', weight: 3, Underlay: GlowHalo, Overlay: GlowOverlay, PlantFilter: GlowFilter },
  { id: 'sparkle', name: 'Lấp lánh', weight: 3, Overlay: SparkleOverlay },
  { id: 'rainbow', name: 'Cầu vồng', weight: 2, Overlay: RainbowOverlay, PlantFilter: RainbowFilter },
  { id: 'gold', name: 'Vàng ròng', weight: 1, Overlay: GoldOverlay, PlantFilter: GoldFilter },
  { id: 'crystal', name: 'Pha lê', weight: 1, Overlay: CrystalOverlay, PlantFilter: CrystalFilter },
];

export function getSpecial(id: string | null): SpecialVariant | null {
  if (id === null) return null;
  return SPECIALS.find((s) => s.id === id) ?? null;
}
