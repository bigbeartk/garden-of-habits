import type { FC } from 'react';
import { Gloss, mix, useClay } from './clay';
import { pixelArt, type PixelLayer, type PixelShape } from './pixel';
import { ellipsePath } from './shapes';
import type { PlantStyle, PotStyle, PotTint, StyleStage } from '../../types';

/**
 * Hai dáng mở khoá của mọi loài vẽ cùng một hình dáng nhưng hai chất liệu: dáng 2 Pixel (10 ngày), dáng 3 Đất sét
 * (20 ngày). Mỗi loài mô tả hình MỘT lần bằng các khối (`StyledLayer`), `styledPair` nặn ra cả hai bản.
 * Màu: `pal(màu, bóng?, sáng?)`; bản Đất sét chỉ dùng `color` (gradient tự sáng/tối).
 */
export type StyledLayer = PixelLayer & {
  /** chỉ vẽ ở một bản (chi tiết hợp riêng chất liệu đó, vd. gân lá pixel, chấm hạt đất sét) */
  only?: 'pixel' | 'clay';
  /** Đất sét: tô phẳng, không gradient/viền (đất trong chậu, đốm nhỏ) */
  flat?: boolean;
  /** Đất sét: thêm đốm bóng trắng (mặc định có ở hình tròn / bầu dục đủ to) */
  gloss?: boolean;
};

export type Pal = { color: string; shade: string; light: string };
/** Bảng màu một khối: chỉ đưa màu chính thì bóng/sáng tự trộn. */
export function pal(color: string, shade = mix(color, '#2B1D16', 0.3), light = mix(color, '#FFFFFF', 0.4)): Pal {
  return { color, shade, light };
}

export const circle = (cx: number, cy: number, r: number, p: Pal, extra: Partial<StyledLayer> = {}): StyledLayer =>
  ({ shape: { kind: 'circle', cx, cy, r }, ...p, ...extra });
export const ellipse = (cx: number, cy: number, rx: number, ry: number, rot: number, p: Pal, extra: Partial<StyledLayer> = {}): StyledLayer =>
  ({ shape: { kind: 'ellipse', cx, cy, rx, ry, rot }, ...p, ...extra });
export const rect = (x: number, y: number, w: number, h: number, p: Pal, extra: Partial<StyledLayer> = {}): StyledLayer =>
  ({ shape: { kind: 'rect', x, y, w, h }, ...p, ...extra });
export const poly = (pts: [number, number][], p: Pal, extra: Partial<StyledLayer> = {}): StyledLayer =>
  ({ shape: { kind: 'poly', pts }, ...p, ...extra });
/** Que mảnh từ (x1,y1) tới (x2,y2) dày `w` (cuống, cành) — là hình đa giác. */
export function stick(x1: number, y1: number, x2: number, y2: number, w: number, p: Pal, extra: Partial<StyledLayer> = {}): StyledLayer {
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const nx = (-(y2 - y1) / len) * (w / 2);
  const ny = ((x2 - x1) / len) * (w / 2);
  return poly([[x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]], p, extra);
}

/** Bản Pixel. */
export function pixelOf(layers: StyledLayer[]): FC {
  return pixelArt(layers.filter((l) => l.only !== 'clay'));
}

function clayShape(s: PixelShape, props: Record<string, unknown>, key: number) {
  switch (s.kind) {
    case 'circle':
      return <circle key={key} cx={s.cx} cy={s.cy} r={s.r} {...props} />;
    case 'ellipse':
      return <path key={key} d={ellipsePath(s.cx, s.cy, s.rx, s.ry, s.rot ?? 0)} {...props} />;
    case 'rect':
      return <rect key={key} x={s.x} y={s.y} width={s.w} height={s.h} rx={Math.min(s.w, s.h) / 2} {...props} />;
    case 'poly':
      return <path key={key} d={`M${s.pts.map(([x, y]) => `${x} ${y}`).join(' L')} Z`} strokeLinejoin="round" {...props} />;
  }
}

function glossFor(s: PixelShape, key: number) {
  if (s.kind === 'circle' && s.r >= 9) return <Gloss key={`g${key}`} cx={s.cx - s.r * 0.38} cy={s.cy - s.r * 0.45} rx={s.r * 0.32} ry={s.r * 0.17} />;
  if (s.kind === 'ellipse' && Math.min(s.rx, s.ry) >= 8) {
    const r = Math.min(s.rx, s.ry);
    return <Gloss key={`g${key}`} cx={s.cx - r * 0.4} cy={s.cy - r * 0.45} rx={r * 0.32} ry={r * 0.17} />;
  }
  return null;
}

/** Bản Đất sét: cùng các khối, tô gradient hình cầu + viền mảnh sẫm + bóng đổ mềm chung cho cả cây. */
export function clayOf(layers: StyledLayer[]): FC {
  const used = layers.filter((l) => l.only !== 'pixel');
  const colors = [...new Set(used.filter((l) => !l.flat).map((l) => l.color))];
  const Art: FC = () => {
    const c = useClay(colors);
    return (
      <g data-render="clay">
        {c.defs}
        <g filter={c.shadow}>
          {used.map((l, i) => (
            <g key={i}>
              {clayShape(l.shape, l.flat ? { fill: l.color } : { fill: c.fill(l.color), stroke: c.edge(l.color), strokeWidth: 0.9 }, i)}
              {!l.flat && l.gloss !== false && glossFor(l.shape, i)}
            </g>
          ))}
        </g>
      </g>
    );
  };
  return Art;
}

/** Hình dáng bud/bloom của một loài → hai dáng mở khoá (giữ id cũ để không mất dữ liệu đã mở). */
export function styledPair(
  ids: [string, string],
  geo: Record<StyleStage, StyledLayer[]>,
  faceAnchor: PlantStyle['faceAnchor'],
): PlantStyle[] {
  return [
    {
      id: ids[0], name: { vi: 'Pixel', en: 'Pixel' }, unlockAt: 10, render: 'pixel',
      stages: { bud: { svg: pixelOf(geo.bud) }, bloom: { svg: pixelOf(geo.bloom) } }, faceAnchor,
    },
    {
      id: ids[1], name: { vi: 'Đất sét', en: 'Clay' }, unlockAt: 20, render: 'clay',
      stages: { bud: { svg: clayOf(geo.bud) }, bloom: { svg: clayOf(geo.bloom) } }, faceAnchor,
    },
  ];
}

/* ---------- Chậu cùng phong cách, lấy màu chậu đã chọn ---------- */

const SOIL = '#6B4A33';

function potLayers(t: PotTint): StyledLayer[] {
  const body: [number, number][] = [[62, 166], [138, 166], [130, 230], [70, 230]];
  const out: StyledLayer[] = [];
  // hoạ tiết nhỏ tô phẳng: chấm 2–3 ô mà còn đổ bóng / sáng thì méo như mảnh vụn
  const acc = t.accent ? pal(t.accent, t.accent, t.accent) : null;
  if (t.motif === 'cat') {
    out.push(poly([[52, 166], [50, 132], [78, 156]], pal(t.body)), poly([[148, 166], [150, 132], [122, 156]], pal(t.body)));
  }
  out.push(poly(body, pal(t.body)));
  if (acc && t.motif === 'dots') {
    for (const [x, y] of [[82, 186], [106, 198], [122, 182], [88, 214], [114, 218]]) out.push(circle(x, y, 6.5, acc, { gloss: false }));
  }
  if (acc && t.motif === 'band') out.push(rect(66, 186, 68, 8, acc, { gloss: false }));
  if (acc && t.motif === 'heart') {
    out.push(circle(95, 194, 6, acc, { gloss: false }), circle(105, 194, 6, acc, { gloss: false }), poly([[89.5, 197], [110.5, 197], [100, 208]], acc));
  }
  if (acc && t.motif === 'cat') {
    out.push(circle(84, 196, 3, pal('#2B1D16'), { flat: true }), circle(116, 196, 3, pal('#2B1D16'), { flat: true }), circle(100, 205, 2.5, acc, { flat: true }));
  }
  out.push(rect(54, 152, 92, 16, pal(t.rim)));
  out.push(rect(60, 152, 80, 5, pal(SOIL), { only: 'pixel' }));
  out.push(ellipse(100, 155, 40, 3.6, 0, pal(SOIL), { only: 'clay', flat: true }));
  return out;
}

const pixelPots = new Map<string, FC>();
const clayPots = new Map<string, FC>();

/** Chậu Pixel / Đất sét theo màu chậu `pot` (tính một lần mỗi chậu). */
export function StyledPot({ render, pot }: { render: 'pixel' | 'clay'; pot: PotStyle }) {
  const cache = render === 'pixel' ? pixelPots : clayPots;
  let Art = cache.get(pot.id);
  if (!Art) {
    const layers = potLayers(pot.tint);
    Art = render === 'pixel'
      ? pixelArt(layers.filter((l) => l.only !== 'clay'), { x0: 0, y0: 125, x1: 200, y1: 240 })
      : clayOf(layers);
    cache.set(pot.id, Art);
  }
  return (
    <g data-testid="styled-pot" data-render={render} data-pot={pot.id}>
      <Art />
    </g>
  );
}
