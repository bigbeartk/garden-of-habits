import { ArtView } from '../content/ArtView';
import { Face } from '../content/Face';
import { PLANTS } from '../content/plants/registry';
import { POTS, getPot } from '../content/pots/registry';
import { GROWTH_STAGES } from '../domain/growth';

export function ArtGallery() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: 8 }}>
      {PLANTS.flatMap((p) =>
        GROWTH_STAGES.map((s) => (
          <svg key={`${p.id}-${s}`} viewBox="0 0 200 240" style={{ background: '#fff', borderRadius: 12 }}>
            <ArtView art={getPot(p.defaultPotId).art} />
            <ArtView art={p.stages[s]} />
            <Face mood="smile" {...p.faceAnchor[s]} />
          </svg>
        )),
      )}
      {POTS.map((pot) => (
        <svg key={pot.id} viewBox="0 0 200 240" style={{ background: '#fff', borderRadius: 12 }}>
          <ArtView art={pot.art} />
        </svg>
      ))}
    </div>
  );
}
