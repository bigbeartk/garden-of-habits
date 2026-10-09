import { useId, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { ArtView } from '../content/ArtView';
import { BUG_SCALE, BugAura, bugSpot, getBug, star } from '../content/bugs';
import { Face, type Mood } from '../content/Face';
import { ClayFace } from '../content/plants/art/clay';
import { PixelFace } from '../content/plants/art/pixel';
import { StyledPot } from '../content/plants/art/styled';
import { SleepingSeed } from '../content/common/SleepingSeed';
import { WiltedPlant } from '../content/common/WiltedPlant';
import { getSpecies } from '../content/plants/registry';
import { getStageArt, getStyle } from '../content/plants/styles';
import { getPot } from '../content/pots/registry';
import { getSpecial } from '../content/specials/registry';
import type { GrowthStage } from '../domain/growth';
import { BASE_STYLE_ID } from '../domain/types';
import { useI18n } from '../i18n/I18nProvider';
import './scene.css';

export type SceneMode = 'plant' | 'sleeping' | 'wilted';

export interface PlantSceneProps {
  plantId: string;
  potId: string;
  stage: GrowthStage;
  specialId: string | null;
  /** dáng cây (chỉ đổi hình ở bud/bloom); không có / lạ = Gốc */
  styleId?: string | null;
  mood: Mood;
  mode?: SceneMode;
  /** đổi số này để cây nhún nhảy một lần */
  bounceKey?: number;
  className?: string;
  title?: string;
  testId?: string;
  /** côn trùng ghé cây (ngày làm đủ thói quen); chỉ vẽ khi cây đang thức */
  bugId?: string | null;
  /** côn trùng bay vào từ góc trời (màn Hôm nay, lúc vừa làm đủ) */
  bugEntrance?: boolean;
  children?: ReactNode;
}

export function PlantScene({
  plantId, potId, stage, specialId, styleId, mood, mode = 'plant', bounceKey = 0, className, title, testId, bugId, bugEntrance = false, children,
}: PlantSceneProps) {
  const { tr } = useI18n();
  const species = getSpecies(plantId);
  const look = getStageArt(species, styleId, stage);
  const pot = getPot(potId);
  const special = mode === 'plant' ? getSpecial(specialId) : null;
  const Underlay = special?.Underlay;
  const PlantFilter = special?.PlantFilter;
  // id bộ lọc riêng cho từng cảnh (Khu vườn vẽ nhiều cây cùng hiệu ứng trên một trang)
  const filterId = `plant-filter-${useId().replace(/[^\w-]/g, '')}`;
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  const Overlay = special?.Overlay;
  const bug = mode === 'plant' ? getBug(bugId) : null;
  const spot = bugSpot(look.faceAnchor);
  return (
    <svg
      viewBox="0 0 200 240"
      className={`plant-scene ${className ?? ''}`}
      role="img"
      aria-label={title ?? tr(species.name)}
      data-testid={testId ?? 'plant-scene'}
      data-plant={species.id}
      data-pot={pot.id}
      data-stage={stage}
      data-mode={mode}
      data-mood={mood}
      data-special={special?.id ?? ''}
      data-style={getStyle(species, styleId)?.id ?? BASE_STYLE_ID}
      data-render={mode === 'plant' ? look.render : undefined}
    >
      {PlantFilter && <defs><PlantFilter id={filterId} animate={!reducedMotion} /></defs>}
      {Underlay && <Underlay />}
      {mode === 'plant' && look.render ? <StyledPot render={look.render} pot={pot} /> : <ArtView art={pot.art} />}
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
          <ArtView art={look.art} />
          {look.render === 'pixel' ? <PixelFace mood={mood} faceStyle={look.faceStyle} {...look.faceAnchor} />
            : look.render === 'clay' ? <ClayFace mood={mood} faceStyle={look.faceStyle} {...look.faceAnchor} />
            : <Face mood={mood} faceStyle={look.faceStyle} {...look.faceAnchor} />}
        </motion.g>
        </g>
      )}
      {Overlay && <Overlay />}
      {bug && (
        // vị trí đặt ở <g> ngoài, chuyển động (bay vào, lượn) ở <g> trong để transform không đè nhau
        <g data-testid="habit-bug" data-bug={bug.id} transform={`translate(${spot.x} ${spot.y}) scale(${BUG_SCALE})`}>
          <motion.g
            initial={bugEntrance && !reducedMotion ? { x: 60, y: -50, opacity: 0, scale: 0.6 } : false}
            animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            <g>
              <BugAura rarity={bug.rarity} animate={!reducedMotion} />
              <bug.Art animate={!reducedMotion} />
              {!reducedMotion && <animateTransform attributeName="transform" type="translate" values="0 0;1.5 -3;0 0" dur="2.4s" repeatCount="indefinite" />}
            </g>
          </motion.g>
          {/* con rất hiếm bay vào để lại vệt kim tuyến dọc đường bay, mờ dần */}
          {bugEntrance && bug.rarity === 'epic' && !reducedMotion && (
            <g data-testid="bug-trail" aria-hidden="true">
              {[0.85, 0.65, 0.45, 0.25].map((f, i) => (
                <motion.path
                  key={f}
                  d={star(60 * f, -50 * f, 2.4)}
                  fill="#FFD84A" stroke="#C99A1E" strokeWidth={0.4}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.1, delay: 0.15 + i * 0.22, ease: 'easeOut' }}
                />
              ))}
            </g>
          )}
        </g>
      )}
      {children}
    </svg>
  );
}
