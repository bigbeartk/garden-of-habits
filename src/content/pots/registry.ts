import type { PotStyle } from '../types';
import { BlueCeramicPot, MintPot, PinkCupPot, PolkaPot, RattanPot, RosePorcelainPot, TerracottaPot, TinBucketPot, WoodPot, ConcretePot, GlassBowlPot, CatPot } from './pots';

/** Thêm chậu mới: tạo component trong pots.tsx (hoặc dùng { image }) rồi thêm 1 dòng ở đây. */
export const POTS: PotStyle[] = [
  { id: 'terracotta', name: { vi: 'Đất nung', en: 'Terracotta' }, art: { svg: TerracottaPot }, tint: { body: '#F2A88A', rim: '#E38E6E' } },
  { id: 'polka', name: { vi: 'Sứ chấm bi', en: 'Polka dot' }, art: { svg: PolkaPot }, tint: { body: '#FFFDF8', rim: '#FFE3EA', accent: '#FFB8C8', motif: 'dots' } },
  { id: 'mint', name: { vi: 'Gốm mint', en: 'Mint ceramic' }, art: { svg: MintPot }, tint: { body: '#BDE8D6', rim: '#A6DCC6' } },
  { id: 'rattan', name: { vi: 'Giỏ mây', en: 'Rattan basket' }, art: { svg: RattanPot }, tint: { body: '#EBCB9B', rim: '#DDB57E', accent: '#C9A06A', motif: 'band' } },
  { id: 'wood', name: { vi: 'Hộp gỗ', en: 'Wooden box' }, art: { svg: WoodPot }, tint: { body: '#DDB48A', rim: '#CFA172', accent: '#B98A5E', motif: 'band' } },
  { id: 'pink-cup', name: { vi: 'Cốc hồng', en: 'Pink cup' }, art: { svg: PinkCupPot }, tint: { body: '#FFC9D6', rim: '#FFB3C4', accent: '#FF8FA8', motif: 'heart' } },
  { id: 'rose-porcelain', name: { vi: 'Sứ hoa hồng', en: 'Rose porcelain' }, art: { svg: RosePorcelainPot }, tint: { body: '#FFFDF8', rim: '#F7A8B8', accent: '#F27A93', motif: 'dots' } },
  { id: 'tin-bucket', name: { vi: 'Xô thiếc', en: 'Tin bucket' }, art: { svg: TinBucketPot }, tint: { body: '#A9D6CB', rim: '#8CC4B7', accent: '#7FB5A8', motif: 'band' } },
  { id: 'blue-ceramic', name: { vi: 'Gốm xanh lam', en: 'Blue ceramic' }, art: { svg: BlueCeramicPot }, tint: { body: '#A9C8F0', rim: '#8FB4E6', accent: '#FFFDFB', motif: 'band' } },
  { id: 'concrete', name: { vi: 'Bê tông', en: 'Concrete' }, art: { svg: ConcretePot }, tint: { body: '#A9A6A0', rim: '#B9B6B0' } },
  { id: 'glass-bowl', name: { vi: 'Bể kính', en: 'Glass bowl' }, art: { svg: GlassBowlPot }, tint: { body: '#D4ECFF', rim: '#EAF6FF', accent: '#F3D9A4', motif: 'band' } },
  { id: 'cat', name: { vi: 'Chậu mèo', en: 'Cat pot' }, art: { svg: CatPot }, tint: { body: '#FFCF9E', rim: '#FFDDB8', accent: '#FF8FA8', motif: 'cat' } },
];

export const DEFAULT_POT_ID = 'terracotta';

export function getPot(id: string): PotStyle {
  return POTS.find((p) => p.id === id) ?? POTS.find((p) => p.id === DEFAULT_POT_ID)!;
}
