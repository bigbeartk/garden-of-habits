import type { FC } from 'react';
import type { GrowthStage } from '../domain/growth';

/**
 * Hình vẽ trong hệ toạ độ viewBox 0 0 200 240, mặt đất ở y = 160, tâm x = 100.
 * - { svg }: component trả về các phần tử SVG (không bọc <svg>).
 * - { image }: đường dẫn PNG trong public/, vd `${import.meta.env.BASE_URL}plants/sunflower/bloom.png`.
 */
export type Art = { svg: FC } | { image: string };

export interface FaceAnchor {
  x: number;
  y: number;
  scale: number;
}

export interface PlantSpecies {
  id: string;
  name: string;
  defaultPotId: string;
  stages: Record<GrowthStage, Art>;
  faceAnchor: Record<GrowthStage, FaceAnchor>;
  sayings?: string[];                                // câu cây nói mỗi ngày riêng của loài
  /** câu khen riêng khi xong một việc (gộp với câu khen chung) */
  praises?: string[];
  /** câu riêng khi bị chạm vào (gộp với câu chung trong taps.ts) */
  taps?: string[];
}

export interface PotStyle {
  id: string;
  name: string;
  art: Art;
}

export interface SpecialVariant {
  id: string;
  name: string;
  /** trọng số khi đã trúng 10% */
  weight: number;
  /** vẽ đè lên cây */
  Overlay: FC;
  /** vẽ phía sau chậu và cây */
  Underlay?: FC;
  /**
   * Bộ lọc màu cho lớp cây: component trả về một `<filter id={id}>` SVG (xem specials/filters.tsx).
   * Không dùng filter CSS: Safari bỏ qua filter CSS trên <g> trong SVG. `animate=false` khi giảm chuyển động.
   */
  PlantFilter?: FC<{ id: string; animate: boolean }>;
}
