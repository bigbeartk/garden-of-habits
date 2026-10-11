import { useEffect, useState, type ReactNode } from 'react';
import { ArtView } from '../../content/ArtView';
import { Face, type FaceStyle, type Mood } from '../../content/Face';
import { Seed, Sprout } from '../../content/plants/parts';
import { PLANTS, getSpecies } from '../../content/plants/registry';
import { getStageArt } from '../../content/plants/styles';
import { POTS } from '../../content/pots/registry';
import type { FaceAnchor } from '../../content/types';
import { EYES, MOODS, MOOD_VI, MOUTHS, SketchFace } from './faces';
import { TOMATO_LOOKS } from './tomato';

/*
 * Phòng thử (dev): chọn cây, dáng, giai đoạn, chậu, kiểu mặt, mắt, miệng, nét mặt rồi xem ngay.
 * Lựa chọn lưu trên URL, nên chụp lại được: npm run sketch:shot -- "playground&p=rose&f=mix&e=E1&m=M3"
 * Tham số: p (loài, hoặc sketch:tomato-T1…), st (dáng), g (giai đoạn), pot, f (cute|cool|lady|auto|mix), e, m, mood.
 * Nhãn ✅ = đang dùng trong app, ✏️ = phác thảo (chưa có trong app).
 */

type Stage = 'seed' | 'sprout' | 'bud' | 'bloom';
const STAGES: Stage[] = ['seed', 'sprout', 'bud', 'bloom'];
const STAGE_VI: Record<Stage, string> = { seed: 'Hạt', sprout: 'Mầm', bud: 'Ra chồi', bloom: 'Ra hoa' };
type FaceChoice = 'auto' | FaceStyle | 'mix';

/** Cây phác thảo (chưa có trong app): id `sketch:<tên>` */
const SKETCH_PLANTS = TOMATO_LOOKS.map(([name, bud, bloom], i) => ({ id: `sketch:tomato-T${i + 1}`, name: `Cà chua ${name}`, bud, bloom }));

interface Resolved { art: ReactNode; anchor: FaceAnchor; faceStyle?: FaceStyle; defaultPot: string }

function resolvePlant(p: string, styleId: string, stage: Stage): Resolved {
  const sk = SKETCH_PLANTS.find((s) => s.id === p);
  if (sk) {
    // cây phác thảo chỉ vẽ bud/bloom; hạt/mầm dùng phần chung
    if (stage === 'seed') return { art: <Seed color="#F3E3B5" stripe="#E2C98A" />, anchor: { x: 100, y: 149, scale: 0.55 }, defaultPot: 'pink-cup' };
    if (stage === 'sprout') return { art: <Sprout leaf="#5DAE5A" stem="#5E9E4F" />, anchor: { x: 100, y: 122, scale: 0.6 }, defaultPot: 'pink-cup' };
    const look = sk[stage];
    return { art: look.art(), anchor: look.face!, defaultPot: 'pink-cup' };
  }
  const sp = getSpecies(p);
  const r = getStageArt(sp, styleId, stage);
  return { art: <ArtView art={r.art} />, anchor: r.faceAnchor, faceStyle: r.faceStyle, defaultPot: sp.defaultPotId };
}

const KEYS = ['p', 'st', 'g', 'pot', 'f', 'e', 'm', 'mood'] as const;
type State = Record<(typeof KEYS)[number], string>;
const DEFAULTS: State = { p: 'sunflower', st: 'base', g: 'bloom', pot: 'auto', f: 'auto', e: 'E1', m: 'M0', mood: 'normal' };

function useUrlState(): [State, (k: keyof State, v: string) => void] {
  const [s, setS] = useState<State>(() => {
    const q = new URLSearchParams(location.search);
    return Object.fromEntries(KEYS.map((k) => [k, q.get(k) ?? DEFAULTS[k]])) as State;
  });
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    KEYS.forEach((k) => (s[k] === DEFAULTS[k] ? q.delete(k) : q.set(k, s[k])));
    history.replaceState(null, '', `?${q.toString().replace(/%2C/g, ',').replace(/%3A/g, ':')}`);
  }, [s]);
  return [s, (k, v) => setS((old) => ({ ...old, [k]: v, ...(k === 'p' ? { st: 'base' } : {}) }))];
}

function Pick({ label, value, onChange, options, disabled }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][]; disabled?: boolean }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 2, font: '13px sans-serif', opacity: disabled ? 0.4 : 1 }}>
      <b>{label}</b>
      <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} style={{ font: '14px sans-serif', padding: 4, minWidth: 150 }}>
        {options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    </label>
  );
}

/** Cảnh: chậu → cây → mặt (cùng thứ tự PlantScene) */
interface Look { face: FaceChoice; eyes: (typeof EYES)[number]; mouth: (typeof MOUTHS)[number] }
function Scene({ r, potId, look, mood, size }: { r: Resolved; potId: string; look: Look; mood: Mood; size: number }) {
  const { face, eyes, mouth } = look;
  const pot = POTS.find((x) => x.id === potId) ?? POTS[0];
  return (
    <svg viewBox="0 0 200 240" width={size} height={size * 1.2} style={{ background: '#fff', borderRadius: 14, display: 'block' }}>
      <ArtView art={pot.art} />
      {r.art}
      {face === 'mix'
        ? <SketchFace eyes={eyes} mouth={mouth} mood={mood} {...r.anchor} />
        : <Face mood={mood} faceStyle={face === 'auto' ? r.faceStyle : face} {...r.anchor} />}
    </svg>
  );
}

export function Playground() {
  const [s, set] = useUrlState();
  const stage = (STAGES.includes(s.g as Stage) ? s.g : 'bloom') as Stage;
  const mood = (MOODS.includes(s.mood as Mood) ? s.mood : 'normal') as Mood;
  const face = s.f as FaceChoice;
  const sketchPlant = s.p.startsWith('sketch:');
  const species = sketchPlant ? null : getSpecies(s.p);
  const r = resolvePlant(s.p, s.st, stage);
  const potId = s.pot === 'auto' ? r.defaultPot : s.pot;
  const eyes = EYES.find((e) => e.id === s.e) ?? EYES[0];
  const mouth = MOUTHS.find((m) => m.id === s.m) ?? MOUTHS[0];

  const look: Look = { face, eyes, mouth };
  const scene = (md: Mood, size: number) => <Scene r={r} potId={potId} look={look} mood={md} size={size} />;

  const autoLabel = sketchPlant ? 'cute' : (species?.faceStyle ?? 'cute');
  const usedTag = face === 'mix' || sketchPlant ? '✏️ PHÁC THẢO' : '✅ ĐANG DÙNG';

  return (
    <div style={{ font: '14px sans-serif', color: '#5B4636' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12, alignItems: 'flex-end' }}>
        <Pick label="Cây" value={s.p} onChange={(v) => set('p', v)} options={[
          ...PLANTS.map((p): [string, string] => [p.id, `✅ ${p.name.vi} (${p.id})`]),
          ...SKETCH_PLANTS.map((p): [string, string] => [p.id, `✏️ ${p.name}`]),
        ]} />
        <Pick label="Dáng" value={s.st} onChange={(v) => set('st', v)} disabled={!species?.styles || stage === 'seed' || stage === 'sprout'} options={[
          ['base', 'Gốc'],
          ...(species?.styles ?? []).map((st): [string, string] => [st.id, `${st.name.vi} (${st.unlockAt} ngày)`]),
        ]} />
        <Pick label="Giai đoạn" value={stage} onChange={(v) => set('g', v)} options={STAGES.map((g) => [g, STAGE_VI[g]])} />
        <Pick label="Chậu" value={s.pot} onChange={(v) => set('pot', v)} options={[['auto', `Mặc định (${r.defaultPot})`], ...POTS.map((p): [string, string] => [p.id, `${p.name.vi} (${p.id})`])]} />
        <Pick label="Kiểu mặt" value={s.f} onChange={(v) => set('f', v)} options={[
          ['auto', `✅ Theo loài (${autoLabel})`], ['cute', '✅ cute'], ['cool', '✅ cool (xương rồng)'], ['lady', '✅ lady (hoa hồng)'], ['mix', '✏️ Tự ghép mắt + miệng'],
        ]} />
        <Pick label="Mắt" value={s.e} onChange={(v) => set('e', v)} disabled={face !== 'mix'} options={EYES.map((e) => [e.id, `${e.id === 'E0' ? '✅' : '✏️'} ${e.name}`])} />
        <Pick label="Miệng" value={s.m} onChange={(v) => set('m', v)} disabled={face !== 'mix'} options={MOUTHS.map((m) => [m.id, `${m.id === 'M0' ? '✅' : '✏️'} ${m.name}`])} />
        <Pick label="Nét mặt" value={mood} onChange={(v) => set('mood', v)} options={MOODS.map((m) => [m, MOOD_VI[m]])} />
      </div>
      <p style={{ margin: '0 0 8px' }}>
        <b>{usedTag}</b>{sketchPlant && ' · cây phác thảo (hạt/mầm dùng hình chung)'}
        {' · '}mặt tại x {r.anchor.x}, y {r.anchor.y}, scale {r.anchor.scale}
      </p>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {scene(mood, 300)}
        <div>
          <b>Mọi nét mặt</b>
          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            {MOODS.map((m) => (
              <figure key={m} style={{ margin: 0, textAlign: 'center' }}>
                {scene(m, 110)}
                <figcaption>{MOOD_VI[m]}</figcaption>
              </figure>
            ))}
          </div>
          <b style={{ display: 'block', marginTop: 10 }}>Cỡ ô lịch, 4 giai đoạn</b>
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            {STAGES.map((g) => {
              const rg = resolvePlant(s.p, s.st, g);
              return (
                <figure key={g} style={{ margin: 0, textAlign: 'center' }}>
                  <Scene r={rg} potId={potId} look={look} mood={mood} size={60} />
                  <figcaption style={{ fontSize: 11 }}>{STAGE_VI[g]}</figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
