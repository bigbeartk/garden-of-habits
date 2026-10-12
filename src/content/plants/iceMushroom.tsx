import { INK } from '../Face';
import type { PlantSpecies } from '../types';
import { MushroomCap, MushroomStem, capDots, capPath } from './mushroomParts';
import { Seed } from './parts';

/**
 * Nấm băng (loài khoá, mở bằng ngày đạt): mũ vòm xanh băng, chùm gai pha lê trên đỉnh, nhũ băng rủ quanh vành, mặt trên thân.
 * Lấy cảm hứng từ "nấm băng" kiểu game thủ thành, KHÔNG chép nhân vật có bản quyền, không nhắc tên game.
 * Hình chép từ src/dev/sketch/mushrooms.tsx: Gốc = I1, dáng `snowcap` = I2 (mũ dẹt phủ tuyết), `crystal` = I3 (nón pha lê).
 * Chậu mặc định: Chậu băng `ice-block`.
 */

const CAP = '#8ED4F5', DARK = '#4FA6DA', LIGHT = '#E6F9FF', STEM = '#F4FBFF', STEM_SHADE = '#CDE8F5', GILL = '#B9DDF0';

const Stem = (p: { hw: number; top: number }) => <MushroomStem {...p} fill={STEM} shade={STEM_SHADE} />;

/** gai pha lê: hình thoi dài cắm nghiêng góc a, gốc ở (x, y) */
function Crystal({ x, y, len, w = 7, a = 0 }: { x: number; y: number; len: number; w?: number; a?: number }) {
  return (
    <g transform={`rotate(${a} ${x} ${y})`}>
      <path d={`M${x - w} ${y} L${x - w * 0.8} ${y - len * 0.7} L${x} ${y - len} L${x + w * 0.8} ${y - len * 0.7} L${x + w} ${y} Z`} fill={LIGHT} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
      <path d={`M${x} ${y - len} L${x} ${y - 2}`} stroke={CAP} strokeWidth={1.4} />
    </g>
  );
}
/** nhũ băng rủ quanh vành mũ */
function Icicles({ y, rw, n = 7, len = 10 }: { y: number; rw: number; n?: number; len?: number }) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => 100 - rw * 0.85 + ((rw * 1.7) / (n - 1)) * i).map((cx, i) => {
        const l = len * (i % 2 ? 0.65 : 1), dy = Math.abs(cx - 100) < rw * 0.3 ? 3 : 1;
        return <path key={cx} d={`M${cx - 4} ${y + dy - 1} Q${cx} ${y + dy + l * 1.2} ${cx + 4} ${y + dy - 1} Z`} fill={LIGHT} stroke={INK} strokeWidth={1.3} strokeLinejoin="round" />;
      })}
    </g>
  );
}
/** bông tuyết 6 cánh */
function Flake({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g stroke="#7CC3E8" strokeWidth={1.6} strokeLinecap="round" transform={`translate(${x} ${y}) scale(${s})`}>
      {[0, 60, 120].map((a) => <path key={a} d="M0 -7 L0 7 M-2.5 -5 L0 -3 L2.5 -5 M-2.5 5 L0 3 L2.5 5" transform={`rotate(${a})`} fill="none" />)}
    </g>
  );
}

function IceSeed() {
  return <Seed color={CAP} stripe={LIGHT} />;
}
function IceSprout() {
  return (
    <g data-part="sprout">
      <Stem hw={10} top={142} />
      <MushroomCap y={142} rw={17} h={13} fill={CAP} gill={GILL} />
      <Icicles y={142} rw={17} n={4} len={4} />
    </g>
  );
}
function BudArt({ crystals }: { crystals: boolean }) {
  return (
    <g>
      <Stem hw={13} top={134} />
      {crystals && <><Crystal x={96} y={118} len={14} w={4} a={-15} /><Crystal x={106} y={117} len={11} w={3.5} a={18} /></>}
      <MushroomCap y={134} rw={25} h={20} fill={CAP} gill={GILL}>{capDots([[88, 126, 3], [110, 123, 3.5]], LIGHT)}</MushroomCap>
      <Icicles y={134} rw={25} n={5} len={6} />
    </g>
  );
}
function IceBud() {
  return <BudArt crystals />;
}
function IceBloom() {
  return (
    <g>
      <Flake x={30} y={60} /><Flake x={172} y={74} s={0.8} /><Flake x={40} y={118} s={0.6} />
      <Stem hw={22} top={112} />
      <Crystal x={86} y={78} len={30} w={8} a={-28} /><Crystal x={116} y={78} len={26} w={7} a={26} /><Crystal x={100} y={74} len={38} w={9} />
      <MushroomCap y={112} rw={52} h={42} fill={CAP} gill={GILL}>{capDots([[74, 98, 6], [124, 96, 7], [96, 104, 4]], LIGHT)}</MushroomCap>
      <Icicles y={112} rw={52} n={9} len={12} />
    </g>
  );
}

// dáng `snowcap`: mũ dẹt rộng phủ đống tuyết, nhũ băng dài, thân mập
function SnowcapBud() {
  return <BudArt crystals={false} />;
}
function SnowcapBloom() {
  return (
    <g>
      <Flake x={26} y={50} s={0.9} /><Flake x={176} y={46} /><Flake x={168} y={120} s={0.6} />
      <Stem hw={24} top={116} />
      <MushroomCap y={116} rw={62} h={30} fill={DARK} gill={GILL}>
        <path d={capPath(100, 112, 50, 22)} fill={CAP} />
      </MushroomCap>
      <path d="M58 96 C56 78 78 70 88 78 C92 64 116 62 120 76 C132 70 148 82 142 96 C120 90 80 90 58 96 Z" fill="#fff" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <Icicles y={116} rw={62} n={11} len={16} />
    </g>
  );
}

// dáng `crystal`: mũ nón pha lê nhiều mặt cắt, hơi lạnh phả quanh chân
function GemCap({ y, rw, h }: { y: number; rw: number; h: number }) {
  const top = y - h;
  return (
    <g strokeLinejoin="round">
      <ellipse cx={100} cy={y + 2} rx={rw * 0.86} ry={5} fill={GILL} stroke={INK} strokeWidth={1.6} />
      <path d={`M${100 - rw} ${y} L${100 - rw * 0.55} ${top + h * 0.35} L100 ${top} L${100 + rw * 0.55} ${top + h * 0.35} L${100 + rw} ${y} Q100 ${y + 8} ${100 - rw} ${y} Z`} fill={CAP} stroke={INK} strokeWidth={2.2} />
      <path d={`M${100 - rw * 0.55} ${top + h * 0.35} L${100 - rw * 0.2} ${y + 3} M100 ${top} L${100 - rw * 0.2} ${y + 3} M100 ${top} L${100 + rw * 0.35} ${y + 3} M${100 + rw * 0.55} ${top + h * 0.35} L${100 + rw * 0.35} ${y + 3}`} fill="none" stroke={DARK} strokeWidth={1.4} />
      <path d={`M${100 - rw * 0.55} ${top + h * 0.35} L100 ${top} L${100 - rw * 0.2} ${y + 3} Z`} fill={LIGHT} opacity={0.7} />
    </g>
  );
}
function CrystalBud() {
  return (
    <g>
      <Stem hw={13} top={134} />
      <GemCap y={134} rw={24} h={30} />
    </g>
  );
}
function CrystalBloom() {
  return (
    <g>
      <Flake x={36} y={48} /><Flake x={166} y={60} s={0.8} />
      <Stem hw={22} top={114} />
      <GemCap y={114} rw={52} h={70} />
      <path d="M44 150 q8 -10 18 -4 q6 -10 16 -2 M122 148 q8 -10 18 -2 q8 -8 16 2" fill="none" stroke="#BFE6F7" strokeWidth={3.5} strokeLinecap="round" />
    </g>
  );
}

export const iceMushroom: PlantSpecies = {
  id: 'ice-mushroom',
  name: { vi: 'Nấm băng', en: 'Ice mushroom' },
  defaultPotId: 'ice-block',
  locked: true,
  stages: {
    seed: { svg: IceSeed },
    sprout: { svg: IceSprout },
    bud: { svg: IceBud },
    bloom: { svg: IceBloom },
  },
  faceAnchor: {
    seed: { x: 100, y: 149, scale: 0.55 },
    sprout: { x: 100, y: 152, scale: 0.36 },
    bud: { x: 100, y: 147, scale: 0.5 },
    bloom: { x: 100, y: 138, scale: 0.85 },
  },
  styles: [
    {
      id: 'snowcap', name: { vi: 'Mũ tuyết', en: 'Snowcap' }, unlockAt: 10,
      stages: { bud: { svg: SnowcapBud }, bloom: { svg: SnowcapBloom } },
      faceAnchor: { bud: { x: 100, y: 147, scale: 0.5 }, bloom: { x: 100, y: 140, scale: 0.85 } },
    },
    {
      id: 'crystal', name: { vi: 'Pha lê', en: 'Crystal' }, unlockAt: 20,
      stages: { bud: { svg: CrystalBud }, bloom: { svg: CrystalBloom } },
      faceAnchor: { bud: { x: 100, y: 147, scale: 0.5 }, bloom: { x: 100, y: 138, scale: 0.85 } },
    },
  ],
  sayings: {
    vi: ['Bình tĩnh, mát mẻ, làm từng việc một nhé! ❄️', 'Việc khó cỡ nào mình cũng đóng băng giúp bạn!', 'Hôm nay nóng quá thì ghé mình hóng mát nha!'],
    en: ['Stay cool and take it one task at a time! ❄️', 'Any tough task, I\'ll freeze it right in place for you!', 'Too hot today? Come chill with me!'],
  },
  praises: {
    vi: ['Ngầu như băng luôn, xong rồi!', 'Mát lạnh, gọn gàng, quá đỉnh!'],
    en: ['Ice cold, done and dusted!', 'Cool, crisp and complete!'],
  },
  taps: {
    vi: ['Brrr, tay bạn ấm quá, mình tan mất!', 'Cẩn thận, gai pha lê của mình lạnh lắm đó!', 'Chạm nữa là mình thả bông tuyết lên đầu bạn!'],
    en: ['Brrr, your warm hands will melt me!', 'Careful, my crystals are super chilly!', 'Poke again and I\'ll drop a snowflake on you!'],
  },
};
