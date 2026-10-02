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
  greetings?: string[];
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
  /** CSS filter áp lên lớp cây */
  plantFilter?: string;
  /** class CSS áp lên lớp cây (cho hiệu ứng động) */
  plantClassName?: string;
}
