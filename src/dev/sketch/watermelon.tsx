import { INK } from '../../content/Face';
import { Cell, Row, type Look } from './kit';

/*
 * Phác thảo dáng 3 của Dưa hấu theo tinh thần "cây dưa máy bắn đá" của game thủ thành (10/2026):
 * thân lá tròn như bắp cải mang mặt nằm sát đất, cần dây cong vươn lên, cuối cần là chén lá ôm quả dưa.
 * Lấy cảm hứng chứ không chép nhân vật có bản quyền.
 * Kết quả: chủ repo bỏ, chưa dùng bản nào (dáng 3 vẫn là Giàn leo).
 */

const LEAF = '#8DD07F', LEAF_DARK = '#6FB866', VINE = '#6FAE62', BULB = '#B5E39C';

function MelonLeaf({ x, y, s = 1, r = 0 }: { x: number; y: number; s?: number; r?: number }) {
  return (
    <path
      d="M0 0 C -10 -4 -16 -14 -10 -20 C -6 -24 -2 -20 0 -16 C 2 -22 8 -24 12 -18 C 16 -12 10 -4 0 0 Z"
      fill={LEAF} stroke={INK} strokeWidth={1.8} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}
    />
  );
}
function Melon({ cx, cy, rx, ry }: { cx: number; cy: number; rx: number; ry: number }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#86CC6E" stroke={INK} strokeWidth={2} />
      {[-0.6, -0.2, 0.2, 0.6].map((k) => (
        <path key={k} d={`M${cx + k * rx} ${cy - ry + 3} q ${k * 6 + 4} ${ry} 0 ${2 * ry - 6}`} fill="none" stroke="#4E9A45" strokeWidth={Math.max(2, rx / 5)} strokeLinecap="round" />
      ))}
      <ellipse cx={cx - rx * 0.45} cy={cy - ry * 0.5} rx={rx * 0.18} ry={ry * 0.12} fill="#fff" opacity={0.45} />
    </g>
  );
}
/** thân lá tròn sát đất mang mặt, tâm (100, cy), bán kính ngang r */
function Bulb({ cy, r }: { cy: number; r: number }) {
  const ry = r * 0.8;
  return (
    <g>
      {/* vòng lá xoè sau thân như bắp cải (không đặt hai bên dưới: trông như chân ếch) */}
      {[-58, -28, 28, 58].map((a) => <MelonLeaf key={a} x={100} y={cy + 4} s={r / 15} r={a} />)}
      <ellipse cx={100} cy={cy} rx={r} ry={ry} fill={BULB} stroke={INK} strokeWidth={2.2} />
      {/* lớp lá ôm thân như bắp cải */}
      <path d={`M${100 - r} ${cy + 2} C${100 - r * 0.7} ${cy + ry * 0.9} ${100 - r * 0.2} ${cy + ry} ${100} ${cy + ry}`} fill="none" stroke={LEAF_DARK} strokeWidth={2} strokeLinecap="round" />
      <path d={`M${100 + r} ${cy + 2} C${100 + r * 0.7} ${cy + ry * 0.9} ${100 + r * 0.2} ${cy + ry} ${100} ${cy + ry}`} fill="none" stroke={LEAF_DARK} strokeWidth={2} strokeLinecap="round" />
      <ellipse cx={100 - r * 0.45} cy={cy - ry * 0.5} rx={r * 0.18} ry={ry * 0.12} fill="#fff" opacity={0.5} />
    </g>
  );
}
/** chén lá ở đầu cần, miệng chén ở y */
function Cup({ x, y, w, r = 0 }: { x: number; y: number; w: number; r?: number }) {
  return (
    <g transform={`rotate(${r} ${x} ${y})`} stroke={INK} strokeLinejoin="round">
      <path d={`M${x - w} ${y} Q${x} ${y + w * 1.1} ${x + w} ${y} Q${x} ${y + w * 0.35} ${x - w} ${y} Z`} fill={LEAF} strokeWidth={2} />
      <path d={`M${x - w} ${y} q-5 -6 -2 -11 q5 3 6 9 Z M${x + w} ${y} q5 -6 2 -11 q-5 3 -6 9 Z`} fill={LEAF} strokeWidth={1.6} />
    </g>
  );
}
const arm = (d: string, w = 7) => <path d={d} fill="none" stroke={VINE} strokeWidth={w} strokeLinecap="round" />;

const W: [string, Look, Look][] = [
  ['M1 · Cần cong qua đầu, dưa trong chén', {
    face: { x: 100, y: 142, scale: 0.5 },
    art: () => <g>{arm('M110 128 C122 104 112 82 86 76', 5)}<Bulb cy={140} r={24} /><Melon cx={80} cy={70} rx={8} ry={7} /><Cup x={80} y={74} w={11} r={-10} /></g>,
  }, {
    face: { x: 100, y: 138, scale: 0.62 },
    art: () => <g>{arm('M112 120 C130 88 112 52 70 50')}<Bulb cy={134} r={30} /><Melon cx={62} cy={40} rx={20} ry={16} /><Cup x={62} y={48} w={22} r={-14} /></g>,
  }],
  ['M2 · Cần dựng thẳng, dưa trên đỉnh', {
    face: { x: 100, y: 142, scale: 0.5 },
    art: () => <g>{arm('M104 124 C108 108 98 96 100 82', 5)}<Bulb cy={140} r={24} /><Melon cx={100} cy={74} rx={8} ry={7} /><Cup x={100} y={78} w={11} /></g>,
  }, {
    face: { x: 100, y: 138, scale: 0.62 },
    art: () => <g>{arm('M104 116 C112 94 94 76 100 56')}<MelonLeaf x={104} y={96} s={1.1} r={60} /><MelonLeaf x={98} y={82} s={1} r={-60} /><Bulb cy={134} r={30} /><Melon cx={100} cy={40} rx={20} ry={16} /><Cup x={100} y={50} w={22} /></g>,
  }],
  ['M3 · Vừa bắn: dưa bay, chén trống', {
    face: { x: 100, y: 142, scale: 0.5 },
    art: () => <g>{arm('M110 128 C122 104 112 82 86 76', 5)}<Bulb cy={140} r={24} /><Melon cx={80} cy={70} rx={8} ry={7} /><Cup x={80} y={74} w={11} r={-10} /></g>,
  }, {
    face: { x: 100, y: 138, scale: 0.62 },
    art: () => (
      <g>
        {arm('M112 120 C134 96 128 70 104 62')}
        <Bulb cy={134} r={30} />
        <Cup x={100} y={62} w={20} r={-30} />
        <path d="M84 44 C96 26 120 20 140 26" fill="none" stroke={INK} strokeWidth={2} strokeDasharray="4 5" strokeLinecap="round" opacity={0.6} />
        <Melon cx={156} cy={34} rx={18} ry={14} />
      </g>
    ),
  }],
];

export function WatermelonSketches() {
  return (
    <Row title="Dưa hấu · dáng 3 kiểu máy bắn đá (ra chồi | ra hoa)">
      {W.flatMap(([name, bud, bloom]) => [
        <Cell key={`${name}-bud`} label={name} look={bud} potId="tin-bucket" />,
        <Cell key={`${name}-bloom`} label="" look={bloom} potId="tin-bucket" />,
      ])}
    </Row>
  );
}
