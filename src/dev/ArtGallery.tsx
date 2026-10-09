import { BUGS } from '../content/bugs';
import { PlantScene } from '../components/PlantScene';
import { ArtView } from '../content/ArtView';
import { Face } from '../content/Face';
import { PLANTS } from '../content/plants/registry';
import { getStageArt } from '../content/plants/styles';
import { POTS, getPot } from '../content/pots/registry';
import type { PlantSpecies } from '../content/types';
import { GROWTH_STAGES, type GrowthStage } from '../domain/growth';

const CELL = { width: 88, height: 106 };

function Cell({ species, styleId, stage, label }: { species: PlantSpecies; styleId: string; stage: GrowthStage; label?: string }) {
  const look = getStageArt(species, styleId, stage);
  return (
    <figure style={{ margin: 0, textAlign: 'center', fontSize: 10 }}>
      <svg viewBox="0 0 200 240" {...CELL} style={{ background: '#fff', borderRadius: 12 }}>
        <ArtView art={getPot(species.defaultPotId).art} />
        <ArtView art={look.art} />
        <Face mood="smile" faceStyle={look.faceStyle} {...look.faceAnchor} />
      </svg>
      {label && <figcaption>{label}</figcaption>}
    </figure>
  );
}

/** Xem trước mọi cây (4 giai đoạn), mọi dáng mở khoá (bud/bloom) và mọi chậu. Ô cố định cỡ để khổ hẹp không bị bóp. */
export function ArtGallery() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(4, ${CELL.width}px)`, gap: 6, padding: 6 }}>
      {PLANTS.flatMap((p) => [
        ...GROWTH_STAGES.map((s) => <Cell key={`${p.id}-${s}`} species={p} styleId="base" stage={s} label={s === 'seed' ? p.name.vi : undefined} />),
        ...(p.styles ?? []).flatMap((st) =>
          (['bud', 'bloom'] as const).map((s) => <Cell key={`${p.id}-${st.id}-${s}`} species={p} styleId={st.id} stage={s} label={`${st.name} · ${s}`} />),
        ),
      ])}
      {POTS.map((pot) => (
        <svg key={pot.id} viewBox="0 0 200 240" {...CELL} style={{ background: '#fff', borderRadius: 12 }}>
          <ArtView art={pot.art} />
        </svg>
      ))}
    </div>
  );
}

/** Xem trước côn trùng thói quen: 5 con phóng to, rồi mỗi loài cây (Gốc + 2 dáng, ra hoa) có một con đậu đúng chỗ. */
export function BugGallery() {
  const cell = { width: 120, height: 144 };
  return (
    <div style={{ padding: 6, background: '#D4ECFF' }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {BUGS.map((b) => (
          <svg key={b.id} viewBox="-16 -16 32 32" width={72} height={72} style={{ background: '#fff', borderRadius: 12 }}>
            <b.Art animate={false} />
          </svg>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(3, ${cell.width}px)`, gap: 6, marginTop: 6 }}>
        {PLANTS.flatMap((p, i) => ['base', ...(p.styles ?? []).map((s) => s.id)].map((styleId, j) => (
          <div key={`${p.id}-${styleId}`} style={cell}>
            <PlantScene plantId={p.id} potId={p.defaultPotId} stage="bloom" styleId={styleId} specialId={null} mood="smile" bugId={BUGS[(i + j) % BUGS.length].id} />
          </div>
        )))}
      </div>
    </div>
  );
}
