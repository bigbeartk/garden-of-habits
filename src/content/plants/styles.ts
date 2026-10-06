import type { FaceStyle } from '../Face';
import type { Art, FaceAnchor, PlantSpecies, PlantStyle } from '../types';
import type { GrowthStage } from '../../domain/growth';

/** Dáng có id này của loài; Gốc hoặc id lạ → null. */
export function getStyle(species: PlantSpecies, styleId?: string | null): PlantStyle | null {
  return species.styles?.find((s) => s.id === styleId) ?? null;
}

/** Hình + vị trí mặt + kiểu mặt cho một giai đoạn theo dáng; seed/sprout và dáng lạ dùng bản Gốc. */
export function getStageArt(
  species: PlantSpecies,
  styleId: string | null | undefined,
  stage: GrowthStage,
): { art: Art; faceAnchor: FaceAnchor; faceStyle?: FaceStyle } {
  const style = stage === 'bud' || stage === 'bloom' ? getStyle(species, styleId) : null;
  if (!style || (stage !== 'bud' && stage !== 'bloom')) {
    return { art: species.stages[stage], faceAnchor: species.faceAnchor[stage], faceStyle: species.faceStyle };
  }
  return { art: style.stages[stage], faceAnchor: style.faceAnchor[stage], faceStyle: style.faceStyle ?? species.faceStyle };
}
