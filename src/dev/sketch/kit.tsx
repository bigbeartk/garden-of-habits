import type { ReactNode } from 'react';
import { PlantScene } from '../../components/PlantScene';
import { ArtView } from '../../content/ArtView';
import { Face, type FaceStyle } from '../../content/Face';
import { PLANTS } from '../../content/plants/registry';
import { getPot } from '../../content/pots/registry';

/** Một hình phác thảo: phần vẽ (toạ độ 200×240, đất ở y = 160) + chỗ đặt mặt */
export interface Look {
  art: () => ReactNode;
  face?: { x: number; y: number; scale: number };
}

/** Ô vẽ một Look trong chậu, giống cách PlantScene ghép cảnh (chậu → cây → mặt) */
export function Cell({ look, potId = 'terracotta', faceStyle, label, size = 170 }: { look: Look; potId?: string; faceStyle?: FaceStyle; label?: string; size?: number }) {
  return (
    <figure style={{ margin: 0 }}>
      {label !== undefined && <figcaption style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, minHeight: 18 }}>{label}</figcaption>}
      <svg viewBox="0 0 200 240" width={size} height={size * 1.2} style={{ background: '#fff', borderRadius: 12, display: 'block' }}>
        <ArtView art={getPot(potId).art} />
        {look.art()}
        {look.face && <Face mood="smile" faceStyle={faceStyle} {...look.face} />}
      </svg>
    </figure>
  );
}

/** Một hàng có tiêu đề, các ô xếp ngang */
export function Row({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: 12 }}>
      <h2 style={{ font: '700 18px sans-serif', margin: '0 0 6px' }}>{title}</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{children}</div>
    </section>
  );
}

/** Mọi loài × (Gốc + dáng mở khoá) × (ra chồi, ra hoa), vẽ bằng PlantScene thật. `only` = danh sách id loài */
export function StylesGrid({ only }: { only?: string[] }) {
  const plants = PLANTS.filter((p) => !only || only.includes(p.id));
  return (
    <div>
      {plants.map((p) => (
        <Row key={p.id} title={`${p.name.vi} (${p.id})`}>
          {[{ id: 'base', label: 'Gốc' }, ...(p.styles ?? []).map((s) => ({ id: s.id, label: `${s.name.vi} · ${s.unlockAt} ngày` }))].map((st) => (
            <figure key={st.id} style={{ margin: 0, background: '#fff', borderRadius: 12, padding: 4 }}>
              <figcaption style={{ font: '12px sans-serif', textAlign: 'center' }}>{st.label}</figcaption>
              <div style={{ display: 'flex' }}>
                {(['bud', 'bloom'] as const).map((stage) => (
                  <div key={stage} style={{ width: 120, height: 144 }}>
                    <PlantScene plantId={p.id} potId={p.defaultPotId} stage={stage} styleId={st.id} specialId={null} mood="smile" />
                  </div>
                ))}
              </div>
            </figure>
          ))}
        </Row>
      ))}
    </div>
  );
}
