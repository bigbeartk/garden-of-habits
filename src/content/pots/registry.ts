import type { PotStyle } from '../types';
import { BlueCeramicPot, MintPot, PinkCupPot, PolkaPot, RattanPot, RosePorcelainPot, TerracottaPot, TinBucketPot, WoodPot, ConcretePot, GlassBowlPot, CatPot } from './pots';

/** Thêm chậu mới: tạo component trong pots.tsx (hoặc dùng { image }) rồi thêm 1 dòng ở đây. */
export const POTS: PotStyle[] = [
  { id: 'terracotta', name: { vi: 'Đất nung', en: 'Terracotta' }, art: { svg: TerracottaPot } },
  { id: 'polka', name: { vi: 'Sứ chấm bi', en: 'Polka dot' }, art: { svg: PolkaPot } },
  { id: 'mint', name: { vi: 'Gốm mint', en: 'Mint ceramic' }, art: { svg: MintPot } },
  { id: 'rattan', name: { vi: 'Giỏ mây', en: 'Rattan basket' }, art: { svg: RattanPot } },
  { id: 'wood', name: { vi: 'Hộp gỗ', en: 'Wooden box' }, art: { svg: WoodPot } },
  { id: 'pink-cup', name: { vi: 'Cốc hồng', en: 'Pink cup' }, art: { svg: PinkCupPot } },
  { id: 'rose-porcelain', name: { vi: 'Sứ hoa hồng', en: 'Rose porcelain' }, art: { svg: RosePorcelainPot } },
  { id: 'tin-bucket', name: { vi: 'Xô thiếc', en: 'Tin bucket' }, art: { svg: TinBucketPot } },
  { id: 'blue-ceramic', name: { vi: 'Gốm xanh lam', en: 'Blue ceramic' }, art: { svg: BlueCeramicPot } },
  { id: 'concrete', name: { vi: 'Bê tông', en: 'Concrete' }, art: { svg: ConcretePot } },
  { id: 'glass-bowl', name: { vi: 'Bể kính', en: 'Glass bowl' }, art: { svg: GlassBowlPot } },
  { id: 'cat', name: { vi: 'Chậu mèo', en: 'Cat pot' }, art: { svg: CatPot } },
];

export const DEFAULT_POT_ID = 'terracotta';

export function getPot(id: string): PotStyle {
  return POTS.find((p) => p.id === id) ?? POTS.find((p) => p.id === DEFAULT_POT_ID)!;
}
