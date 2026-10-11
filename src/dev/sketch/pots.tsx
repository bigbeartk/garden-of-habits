import type { ReactElement } from 'react';
import { INK } from '../../content/Face';
import { Cell, Row, type Look } from './kit';
import { STRAWBERRY_LOOKS } from './strawberry';

/*
 * Phác thảo chậu mới cho Dâu tây (10/2026): Giỏ đan. Phải khác hẳn `rattan` (Giỏ mây hình thang kẻ ô).
 * Toạ độ chậu: vành y 152–170, thân y 166–232, tâm x = 100. ĐÃ CHỌN: P1 Giỏ quai → `basket` (src/content/pots/pots.tsx `BasketPot`).
 */

const WICKER = '#E3B77A', WICKER_DARK = '#C08A4E', WICKER_LIGHT = '#F2D3A0';

/** P1 · Giỏ quai: thân bầu tròn đáy, đan chéo, quai cong vòng phía sau cây */
export function HandleBasket() {
  const body = 'M44 166 L156 166 Q158 214 128 230 L72 230 Q42 214 44 166 Z';
  return (
    <g data-part="pot">
      <path d="M48 162 Q48 70 100 66 Q152 70 152 162" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <path d="M48 162 Q48 70 100 66 Q152 70 152 162" fill="none" stroke={WICKER} strokeWidth={5} strokeLinecap="round" />
      <path d="M50 140 Q50 76 100 72" fill="none" stroke={WICKER_LIGHT} strokeWidth={1.6} strokeLinecap="round" />
      <clipPath id="p1-clip"><path d={body} /></clipPath>
      <path d={body} fill={WICKER} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <g clipPath="url(#p1-clip)" stroke={WICKER_DARK} strokeWidth={2.2}>
        {[-60, -40, -20, 0, 20, 40, 60, 80, 100, 120].map((d) => <path key={`a${d}`} d={`M${40 + d} 166 l60 70`} />)}
        {[-60, -40, -20, 0, 20, 40, 60, 80, 100, 120].map((d) => <path key={`b${d}`} d={`M${160 - d} 166 l-60 70`} />)}
      </g>
      <rect x={38} y={152} width={124} height={16} rx={8} fill={WICKER_DARK} stroke={INK} strokeWidth={2.5} />
      <path d="M44 160 h112" stroke={WICKER_LIGHT} strokeWidth={2} strokeDasharray="6 4" />
      <ellipse cx={100} cy={156} rx={56} ry={4} fill="#8B5E3C" />
    </g>
  );
}

/** P2 · Giỏ tre trống: thân thẳng bo đáy, đan ngang hai màu, nơ đỏ phía trước */
export function BowBasket() {
  return (
    <g data-part="pot">
      <path d="M46 166 L154 166 L152 220 Q152 232 140 232 L60 232 Q48 232 48 220 Z" fill={WICKER_LIGHT} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      {[176, 192, 208].map((y) => <rect key={y} x={48} y={y} width={104} height={8} fill={WICKER} />)}
      {[60, 76, 92, 108, 124, 140].map((x) => <path key={x} d={`M${x} 168 L${x} 230`} stroke={WICKER_DARK} strokeWidth={1.4} opacity={0.6} />)}
      <path d="M46 166 L154 166 L152 220 Q152 232 140 232 L60 232 Q48 232 48 220 Z" fill="none" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <rect x={40} y={152} width={120} height={16} rx={8} fill={WICKER} stroke={INK} strokeWidth={2.5} />
      <ellipse cx={100} cy={157} rx={54} ry={4} fill="#8B5E3C" />
      <g transform="translate(100 190)" stroke={INK} strokeWidth={1.8} strokeLinejoin="round">
        <path d="M0 0 L-18 -10 Q-22 0 -18 10 Z" fill="#E8485A" />
        <path d="M0 0 L18 -10 Q22 0 18 10 Z" fill="#E8485A" />
        <path d="M-3 2 L-10 20 L-5 18 L-2 22 Z M3 2 L10 20 L5 18 L2 22 Z" fill="#D13246" />
        <circle r={4.5} fill="#F26A7A" />
      </g>
    </g>
  );
}

/** P3 · Giỏ picnic: thân chữ nhật đan ô, khăn ca-rô đỏ trắng phủ mép, viền răng cưa */
export function PicnicBasket() {
  const cloth = 'M36 150 L164 150 L160 182 l-8 -6 -8 6 -8 -6 -8 6 -8 -6 -8 6 -8 -6 -8 6 -8 -6 -8 6 -8 -6 -8 6 -8 -6 -8 6 -8 -6 Z';
  return (
    <g data-part="pot">
      <rect x={44} y={166} width={112} height={66} rx={10} fill={WICKER} stroke={INK} strokeWidth={2.5} />
      <g stroke={WICKER_DARK} strokeWidth={2.2}>
        {[194, 212].map((y) => <path key={y} d={`M46 ${y} L154 ${y}`} />)}
        {[62, 82, 102, 122, 142].map((x, i) => <path key={x} d={`M${x} ${i % 2 ? 184 : 202} L${x} ${i % 2 ? 230 : 230}`} />)}
      </g>
      <clipPath id="p3-clip"><path d={cloth} /></clipPath>
      <path d={cloth} fill="#FFFFFF" />
      <g clipPath="url(#p3-clip)" fill="#F05A62" opacity={0.85}>
        {[36, 56, 76, 96, 116, 136, 156].map((x) => <rect key={`v${x}`} x={x} y={146} width={10} height={40} />)}
        {[150, 170].map((y) => <rect key={`h${y}`} x={30} y={y} width={140} height={10} opacity={0.7} />)}
      </g>
      <path d={cloth} fill="none" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
      <ellipse cx={100} cy={154} rx={56} ry={4} fill="#8B5E3C" />
    </g>
  );
}

const POT_ART: [string, () => ReactElement][] = [['P1 · Giỏ quai', HandleBasket], ['P2 · Giỏ tre có nơ', BowBasket], ['P3 · Giỏ picnic ca-rô', PicnicBasket]];

/** Ô vẽ chậu phác thảo + cây (không đi qua POTS) */
function PotCell({ label, Pot, look }: { label: string; Pot: () => ReactElement; look: Look }) {
  return (
    <figure style={{ margin: 0 }}>
      <figcaption style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, minHeight: 18 }}>{label}</figcaption>
      <svg viewBox="0 0 200 240" width={170} height={204} style={{ background: '#fff', borderRadius: 12, display: 'block' }}>
        <Pot />
        {look.art()}
        {look.face && look.drawFace?.(look.face, 'normal')}
      </svg>
    </figure>
  );
}

export function PotSketches() {
  const [, , giant] = STRAWBERRY_LOOKS[2];
  const [, , twig] = STRAWBERRY_LOOKS[0];
  return (
    <div>
      <Row title="Giỏ đan cho Dâu tây · với dáng Gốc (S3 Dâu khổng lồ)">
        {POT_ART.map(([label, Pot]) => <PotCell key={label} label={label} Pot={Pot} look={giant} />)}
        <Cell label="✅ Giỏ mây (rattan) đang có" look={giant} potId="rattan" mood="normal" />
      </Row>
      <Row title="Với dáng 3 (S1 Cành treo quả)">
        {POT_ART.map(([label, Pot]) => <PotCell key={label} label={label} Pot={Pot} look={twig} />)}
      </Row>
    </div>
  );
}
