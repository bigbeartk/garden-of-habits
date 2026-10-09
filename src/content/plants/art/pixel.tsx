import type { FC } from 'react';
import type { FaceStyle, Mood } from '../../Face';
import type { FaceAnchor } from '../../types';

/**
 * Bộ vẽ Pixel art cho các dáng mở khoá (dáng 2, mở ở 10 ngày).
 * Mô tả cây bằng vài khối hình (toạ độ khung 200×240 như mọi hình cây); `pixelize` đổ chúng thành lưới ô vuông
 * cạnh `PX` đơn vị (lưới chung cho mọi cây, gốc ở 0,0), tự đổ bóng mép dưới-phải, sáng mép trên-trái, rồi viền tối
 * quanh mọi ô. Vẽ bằng <rect> gộp theo hàng ngang, `shapeRendering="crispEdges"` cho sắc cạnh như game cổ.
 */
export const PX = 5;
export const PIXEL_INK = '#3B2A20';

export type PixelShape =
  | { kind: 'circle'; cx: number; cy: number; r: number }
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number; rot?: number }
  | { kind: 'rect'; x: number; y: number; w: number; h: number }
  | { kind: 'poly'; pts: [number, number][] };

/** Một lớp: hình + màu; `shade` / `light` = màu viền bóng / sáng bên trong hình (không có thì phẳng); `cut`: khoét trống (viền tự chạy vào). */
export interface PixelLayer { shape: PixelShape; color: string; shade?: string; light?: string; cut?: boolean }

function inside(s: PixelShape, x: number, y: number): boolean {
  switch (s.kind) {
    case 'circle':
      return (x - s.cx) ** 2 + (y - s.cy) ** 2 <= s.r ** 2;
    case 'ellipse': {
      const a = ((s.rot ?? 0) * Math.PI) / 180;
      const dx = x - s.cx;
      const dy = y - s.cy;
      const u = dx * Math.cos(a) + dy * Math.sin(a);
      const v = -dx * Math.sin(a) + dy * Math.cos(a);
      return (u / s.rx) ** 2 + (v / s.ry) ** 2 <= 1;
    }
    case 'rect':
      return x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h;
    case 'poly': {
      let hit = false;
      for (let i = 0, j = s.pts.length - 1; i < s.pts.length; j = i++) {
        const [xi, yi] = s.pts[i];
        const [xj, yj] = s.pts[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
      }
      return hit;
    }
  }
}

export interface PixelRun { x: number; y: number; w: number; color: string }

/** Đổ các lớp thành lưới ô (lớp sau đè lớp trước) trong vùng [x0, x1) × [y0, y1), rồi viền `outline`. */
export function pixelize(layers: PixelLayer[], area: { x0: number; y0: number; x1: number; y1: number }, outline = PIXEL_INK): PixelRun[] {
  const c0 = Math.floor(area.x0 / PX);
  const r0 = Math.floor(area.y0 / PX);
  const cols = Math.ceil(area.x1 / PX) - c0;
  const rows = Math.ceil(area.y1 / PX) - r0;
  const grid: (string | null)[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: (string | null)[] = [];
    for (let c = 0; c < cols; c++) {
      const x = (c0 + c + 0.5) * PX;
      const y = (r0 + r + 0.5) * PX;
      let color: string | null = null;
      for (const l of layers) {
        if (!inside(l.shape, x, y)) continue;
        if (l.cut) { color = null; continue; }
        color = l.color;
        // bóng: ô sát mép dưới-phải của hình; sáng: ô sát mép trên-trái
        if (l.shade && (!inside(l.shape, x + PX, y + PX) || !inside(l.shape, x, y + PX * 1.5))) color = l.shade;
        else if (l.light && (!inside(l.shape, x - PX, y - PX) || !inside(l.shape, x - PX * 1.5, y))) color = l.light;
      }
      row.push(color);
    }
    grid.push(row);
  }
  // viền: ô trống kề (4 hướng) một ô có màu
  const filled = (r: number, c: number) => r >= 0 && r < rows && c >= 0 && c < cols && grid[r][c] !== null;
  const out = grid.map((row, r) => row.map((v, c) => v ?? (filled(r - 1, c) || filled(r + 1, c) || filled(r, c - 1) || filled(r, c + 1) ? outline : null)));
  const runs: PixelRun[] = [];
  out.forEach((row, r) => {
    let c = 0;
    while (c < cols) {
      const color = row[c];
      if (!color) { c++; continue; }
      let w = 1;
      while (c + w < cols && row[c + w] === color) w++;
      runs.push({ x: (c0 + c) * PX, y: (r0 + r) * PX, w: w * PX, color });
      c += w;
    }
  });
  return runs;
}

/** Vẽ kết quả `pixelize` (tính một lần lúc nạp module). */
export function pixelArt(layers: PixelLayer[], area = { x0: 0, y0: 0, x1: 200, y1: 165 }): FC {
  const runs = pixelize(layers, area);
  const Art: FC = () => (
    <g shapeRendering="crispEdges" data-render="pixel">
      {runs.map((r, i) => <rect key={i} x={r.x} y={r.y} width={r.w} height={PX} fill={r.color} />)}
    </g>
  );
  return Art;
}

/**
 * Mặt pixel: ô vuông cùng cỡ lưới cây (không co theo `scale`), canh vào lưới. Mỗi kiểu là bản đồ 7 cột × 5 hàng:
 * E mắt, M miệng, P má hồng, R son/lưỡi, S kính râm, W đốm sáng.
 */
const FACES: Record<string, string[]> = {
  normal: ['.E...E.', '.E...E.', 'P.....P', '..M.M..', '...M...'],
  smile: ['.E...E.', 'E.E.E.E', 'P.....P', '.M...M.', '..MMM..'],
  talk: ['.E...E.', '.E...E.', 'P.MMM.P', '..MRM..', '..MMM..'],
  sleep: ['.......', 'EE...EE', 'P.....P', '...M...', '.......'],
  sad: ['.E...E.', '.E...E.', 'P.....P', '...M...', '..M.M..'],
  cool: ['SSSSSSS', '.SW.SW.', '.SS.SS.', '....M..', '..MM...'],
  coolSmile: ['SSSSSSS', '.SW.SW.', '.SS.SS.', '.M...M.', '..MMMW.'],
  lady: ['E.....E', '.E...E.', 'P.....P', '..RRR..', '...R...'],
  ladySmile: ['E.E.E.E', '.E...E.', 'P.....P', '.R...R.', '..RRR..'],
};
const FACE_COLORS: Record<string, string> = { E: '#2B1D16', M: '#2B1D16', P: '#FF8FA8', R: '#E0475F', S: '#1E1E1E', W: '#FFFFFF' };

function faceKey(mood: Mood, style: FaceStyle): string {
  const awake = mood !== 'sleep' && mood !== 'sad';
  if (style === 'cool' && awake) return mood === 'smile' ? 'coolSmile' : 'cool';
  if (style === 'lady' && awake && mood !== 'talk') return mood === 'smile' ? 'ladySmile' : 'lady';
  return mood;
}

export function PixelFace({ mood, x, y, faceStyle = 'cute' }: { mood: Mood; faceStyle?: FaceStyle } & FaceAnchor) {
  const map = FACES[faceKey(mood, faceStyle)];
  // canh tâm mặt vào lưới: cột giữa (thứ 4) nằm đúng ô chứa (x, y)
  const left = Math.floor(x / PX) * PX - 3 * PX;
  const top = Math.floor(y / PX) * PX - 2 * PX;
  const cells: { x: number; y: number; c: string }[] = [];
  map.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === '.' || (ch === 'P' && faceStyle === 'cool')) return;
    cells.push({ x: left + c * PX, y: top + r * PX, c: FACE_COLORS[ch] });
  }));
  return (
    <g shapeRendering="crispEdges" data-testid="face" data-mood={mood} data-style={faceStyle} data-render="pixel">
      {cells.map((p) => <rect key={`${p.x},${p.y}`} x={p.x} y={p.y} width={PX} height={PX} fill={p.c} />)}
    </g>
  );
}
