import { INK } from '../Face';
import type { PlantSpecies } from '../types';
import { MushroomCap, MushroomStem, capDots, capPath } from './mushroomParts';
import { Seed } from './parts';

/**
 * Nấm mặt trời (loài khoá, mở bằng ngày đạt): mũ vòm cam chấm vàng, quầng tia nắng tròn phía sau, mặt trên thân.
 * Lấy cảm hứng từ "nấm mặt trời" kiểu game thủ thành, KHÔNG chép nhân vật có bản quyền, không nhắc tên game.
 * Hình chép từ src/dev/sketch/mushrooms.tsx: Gốc = S1, dáng `sunburst` = S2 (mũ hình mặt trời), `family` = S3 (mẹ con).
 * Ra chồi = nấm con bé xíu, ra hoa = nấm lớn. Chậu mặc định: Khúc gỗ `log`.
 */

const STEM = '#FFF3DC', STEM_SHADE = '#F0D9B5', GILL = '#E8C9A0';
const CAP = '#FFA94D', CAP_DARK = '#F07F2B', DOT = '#FFE066', RAY = '#FFE58A', RAY_EDGE = '#F5C04A';

const Stem = (p: { x?: number; hw: number; top: number }) => <MushroomStem {...p} fill={STEM} shade={STEM_SHADE} />;

/** quầng nắng: n tia bo tròn quanh tâm, vẽ sau mũ */
function SunRays({ x, y, r, n = 12, len = 14 }: { x: number; y: number; r: number; n?: number; len?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r + len + 6} fill={RAY} opacity={0.35} />
      {Array.from({ length: n }, (_, i) => (i * 360) / n).map((a) => (
        <path key={a} d={`M${x - len * 0.42} ${y - r} Q${x} ${y - r - len * 1.5} ${x + len * 0.42} ${y - r} Z`} fill={RAY} stroke={RAY_EDGE} strokeWidth={1.6} strokeLinejoin="round" transform={`rotate(${a} ${x} ${y})`} />
      ))}
    </g>
  );
}
/** hạt nắng lấp lánh (chữ thập bo) */
function Mote({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <path d={`M${x} ${y - 6 * s} Q${x + 1.2 * s} ${y - 1.2 * s} ${x + 6 * s} ${y} Q${x + 1.2 * s} ${y + 1.2 * s} ${x} ${y + 6 * s} Q${x - 1.2 * s} ${y + 1.2 * s} ${x - 6 * s} ${y} Q${x - 1.2 * s} ${y - 1.2 * s} ${x} ${y - 6 * s} Z`} fill="#FFF6B0" stroke={RAY_EDGE} strokeWidth={1} />;
}

function SunSeed() {
  return <Seed color={CAP} stripe={DOT} />;
}
/** nấm cúc áo vừa nhú, mũ trơn */
function SunSprout() {
  return (
    <g data-part="sprout">
      <Stem hw={10} top={142} />
      <MushroomCap y={142} rw={17} h={13} fill={CAP} gill={GILL} />
    </g>
  );
}
/** nấm con: `rays` = quầng nắng nhỏ phía sau, `motes` = hạt nắng quanh */
function BudArt({ rays = false, motes = false }: { rays?: boolean; motes?: boolean }) {
  return (
    <g>
      {rays && <SunRays x={100} y={124} r={24} n={10} len={8} />}
      <Stem hw={13} top={134} />
      <MushroomCap y={134} rw={25} h={20} fill={CAP} gill={GILL}>{capDots([[90, 124, 3.5], [106, 120, 4], [114, 129, 2.6]], DOT)}</MushroomCap>
      {motes && <><Mote x={128} y={112} s={0.7} /><Mote x={72} y={104} s={0.55} /></>}
    </g>
  );
}
function SunBud() {
  return <BudArt rays />;
}
function SunBloom() {
  return (
    <g>
      <SunRays x={100} y={92} r={50} n={14} len={13} />
      <Stem hw={22} top={110} />
      <MushroomCap y={110} rw={52} h={42} fill={CAP} gill={GILL}>{capDots([[78, 92, 7], [104, 80, 8.5], [126, 96, 6], [92, 104, 4], [116, 106, 3.5]], DOT)}</MushroomCap>
    </g>
  );
}

// dáng `sunburst`: mũ chính là mặt trời, vành mũ là các tia nắng tròn
function SunburstBud() {
  return <BudArt />;
}
function SunburstBloom() {
  const y = 114, rw = 54, h = 40, n = 9;
  return (
    <g>
      <circle cx={100} cy={96} r={74} fill={RAY} opacity={0.3} />
      <Stem hw={21} top={y} />
      {Array.from({ length: n }, (_, i) => -80 + (160 / (n - 1)) * i).map((a) => {
        const rad = (a * Math.PI) / 180, cx = 100 + Math.sin(rad) * rw * 0.98, cy = y - Math.cos(rad) * h * 0.98;
        return <ellipse key={a} cx={cx} cy={cy} rx={9} ry={12} fill={DOT} stroke={INK} strokeWidth={1.8} transform={`rotate(${a} ${cx} ${cy})`} />;
      })}
      <MushroomCap y={y} rw={rw} h={h} fill={CAP_DARK} gill={GILL}>
        <path d={capPath(100, y - 4, rw * 0.72, h * 0.66)} fill={CAP} />
        {capDots([[100, y - h * 0.62, 6], [80, y - h * 0.3, 4.5], [120, y - h * 0.3, 4.5]], DOT)}
      </MushroomCap>
      <Mote x={30} y={60} /><Mote x={170} y={52} s={0.8} /><Mote x={160} y={128} s={0.7} />
    </g>
  );
}

// dáng `family`: nấm mẹ nghiêng + nấm con cạnh chân, hạt nắng bay lên
function FamilyBud() {
  return <BudArt motes />;
}
function FamilyBloom() {
  return (
    <g>
      <Mote x={150} y={50} /><Mote x={40} y={70} s={0.75} /><Mote x={164} y={92} s={0.6} />
      <Stem x={92} hw={20} top={112} />
      <g transform="rotate(-8 92 112)">
        <MushroomCap x={92} y={112} rw={48} h={44} fill={CAP} gill={GILL}>{capDots([[72, 94, 7], [96, 80, 8], [116, 98, 6]], DOT)}</MushroomCap>
      </g>
      <Stem x={146} hw={8} top={142} />
      <MushroomCap x={146} y={142} rw={16} h={13} fill={CAP} gill={GILL}>{capDots([[142, 135, 2.6]], DOT)}</MushroomCap>
    </g>
  );
}

export const sunMushroom: PlantSpecies = {
  id: 'sun-mushroom',
  name: { vi: 'Nấm mặt trời', en: 'Sun mushroom' },
  defaultPotId: 'log',
  locked: true,
  stages: {
    seed: { svg: SunSeed },
    sprout: { svg: SunSprout },
    bud: { svg: SunBud },
    bloom: { svg: SunBloom },
  },
  faceAnchor: {
    seed: { x: 100, y: 149, scale: 0.55 },
    sprout: { x: 100, y: 152, scale: 0.36 },
    bud: { x: 100, y: 147, scale: 0.5 },
    bloom: { x: 100, y: 136, scale: 0.85 },
  },
  styles: [
    {
      id: 'sunburst', name: { vi: 'Mặt trời', en: 'Sunburst' }, unlockAt: 10,
      stages: { bud: { svg: SunburstBud }, bloom: { svg: SunburstBloom } },
      faceAnchor: { bud: { x: 100, y: 147, scale: 0.5 }, bloom: { x: 100, y: 138, scale: 0.8 } },
    },
    {
      id: 'family', name: { vi: 'Mẹ con', en: 'Mama & baby' }, unlockAt: 20,
      stages: { bud: { svg: FamilyBud }, bloom: { svg: FamilyBloom } },
      faceAnchor: { bud: { x: 100, y: 147, scale: 0.5 }, bloom: { x: 92, y: 134, scale: 0.78 } },
    },
  ],
  sayings: {
    vi: ['Mình gom nắng cả đêm, giờ chia cho bạn nè! ☀️', 'Nấm nhỏ thôi nhưng sưởi ấm cả ngày của bạn!', 'Hôm nay trời có âm u cũng không sao, có mình rồi!'],
    en: ['I saved up sunshine all night, here\'s some for you! ☀️', 'Small mushroom, big warm day for you!', 'Cloudy outside? No worries, I\'ve got the sunshine!'],
  },
  praises: {
    vi: ['Ấm áp quá, thêm một việc xong rồi!', 'Bạn toả nắng ghê luôn!'],
    en: ['So warm, another one done!', 'You\'re absolutely glowing!'],
  },
  taps: {
    vi: ['Ui, nhột! Nắng rơi ra hết bây giờ!', 'Chạm mình là được thêm chút nắng đó nha!', 'Mình đang lớn đó, đừng ấn mũ xuống!'],
    en: ['Eep, ticklish! You\'ll spill my sunshine!', 'One tap, one little ray of sun!', 'I\'m growing here, don\'t squish my cap!'],
  },
};
