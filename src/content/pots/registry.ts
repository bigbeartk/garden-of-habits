import type { PotStyle } from '../types';
import { BlueCeramicPot, MintPot, PinkCupPot, PolkaPot, RattanPot, RosePorcelainPot, TerracottaPot, TinBucketPot, WoodPot } from './pots';

/** Thêm chậu mới: tạo component trong pots.tsx (hoặc dùng { image }) rồi thêm 1 dòng ở đây. */
export const POTS: PotStyle[] = [
  { id: 'terracotta', name: 'Đất nung', art: { svg: TerracottaPot } },
  { id: 'polka', name: 'Sứ chấm bi', art: { svg: PolkaPot } },
  { id: 'mint', name: 'Gốm mint', art: { svg: MintPot } },
  { id: 'rattan', name: 'Giỏ mây', art: { svg: RattanPot } },
  { id: 'wood', name: 'Hộp gỗ', art: { svg: WoodPot } },
  { id: 'pink-cup', name: 'Cốc hồng', art: { svg: PinkCupPot } },
  { id: 'rose-porcelain', name: 'Sứ hoa hồng', art: { svg: RosePorcelainPot } },
  { id: 'tin-bucket', name: 'Xô thiếc', art: { svg: TinBucketPot } },
  { id: 'blue-ceramic', name: 'Gốm xanh lam', art: { svg: BlueCeramicPot } },
];

export const DEFAULT_POT_ID = 'terracotta';

export function getPot(id: string): PotStyle {
  return POTS.find((p) => p.id === id) ?? POTS.find((p) => p.id === DEFAULT_POT_ID)!;
}
