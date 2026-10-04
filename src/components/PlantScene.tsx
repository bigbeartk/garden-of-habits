import { useId, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { ArtView } from '../content/ArtView';
import { Face, type Mood } from '../content/Face';
import { SleepingSeed } from '../content/common/SleepingSeed';
import { WiltedPlant } from '../content/common/WiltedPlant';
import { getSpecies } from '../content/plants/registry';
import { getPot } from '../content/pots/registry';
import { getSpecial } from '../content/specials/registry';
import type { GrowthStage } from '../domain/growth';
import './scene.css';

export type SceneMode = 'plant' | 'sleeping' | 'wilted';

export interface PlantSceneProps {
  plantId: string;
  potId: string;
  stage: GrowthStage;
  specialId: string | null;
  mood: Mood;
  mode?: SceneMode;
  /** đổi số này để cây nhún nhảy một lần */
  bounceKey?: number;
  className?: string;
  title?: string;
  testId?: string;
  children?: ReactNode;
}

export function PlantScene({
  plantId, potId, stage, specialId, mood, mode = 'plant', bounceKey = 0, className, title, testId, children,
}: PlantSceneProps) {
  const species = getSpecies(plantId);
  const pot = getPot(potId);
  const special = mode === 'plant' ? getSpecial(specialId) : null;
  const Underlay = special?.Underlay;
  const PlantFilter = special?.PlantFilter;
  // id bộ lọc riêng cho từng cảnh (Khu vườn vẽ nhiều cây cùng hiệu ứng trên một trang)
  const filterId = `plant-filter-${useId().replace(/[^\w-]/g, '')}`;
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  const Overlay = special?.Overlay;
  return (
    <svg
      viewBox="0 0 200 240"
      className={`plant-scene ${className ?? ''}`}
      role="img"
      aria-label={title ?? species.name}
      data-testid={testId ?? 'plant-scene'}
      data-plant={species.id}
      data-pot={pot.id}
      data-stage={stage}
      data-mode={mode}
      data-mood={mood}
      data-special={special?.id ?? ''}
    >
      {PlantFilter && <defs><PlantFilter id={filterId} animate={!reducedMotion} /></defs>}
      {Underlay && <Underlay />}
      <ArtView art={pot.art} />
      {mode === 'sleeping' && <SleepingSeed />}
      {mode === 'wilted' && <WiltedPlant />}
      {mode === 'plant' && (
        <g data-part="plant-layer" filter={PlantFilter ? `url(#${filterId})` : undefined}>
        <motion.g
          key={bounceKey}
          style={{ transformBox: 'view-box', transformOrigin: '100px 160px' }}
          initial={false}
          animate={bounceKey > 0 ? { scale: [1, 1.1, 0.95, 1.04, 1], y: [0, -8, 0, -3, 0] } : undefined}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        >
          <ArtView art={species.stages[stage]} />
          <Face mood={mood} {...species.faceAnchor[stage]} />
        </motion.g>
        </g>
      )}
      {Overlay && <Overlay />}
      {children}
    </svg>
  );
}
