import type { FC } from 'react';
import type { GrowthStage } from '../domain/growth';
import type { FaceStyle } from './Face';

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
  /** kiểu mặt: mặc định 'cute' (mắt tròn, má hồng); 'cool' đeo kính râm, không má hồng; 'lady' mi cong + môi son */
  faceStyle?: FaceStyle;
  sayings?: string[];                                // câu cây nói mỗi ngày riêng của loài
  /** câu khen riêng khi xong một việc (gộp với câu khen chung) */
  praises?: string[];
  /** câu riêng khi bị chạm vào (gộp với câu chung trong taps.ts) */
  taps?: string[];
  /** 2 dáng mở khoá, theo thứ tự unlockAt (10, 20) */
  styles?: PlantStyle[];
}

/** Giai đoạn mà dáng mới vẽ lại; seed/sprout dùng chung bản Gốc. */
export type StyleStage = 'bud' | 'bloom';

/** Một dáng mở khoá của loài (biến hình hẳn ở bud/bloom). */
export interface PlantStyle {
  id: string;
  name: string;
  /** số ngày loài này ra hoa cần có để mở */
  unlockAt: number;
  stages: Record<StyleStage, Art>;
  faceAnchor: Record<StyleStage, FaceAnchor>;
  /** không có = theo loài */
  faceStyle?: FaceStyle;
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
