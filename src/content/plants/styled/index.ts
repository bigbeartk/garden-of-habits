import { circle, ellipse, pal, poly, rect, stick, styledPair, type StyledLayer } from '../art/styled';
import type { PlantStyle } from '../../types';

/**
 * Hình dáng 2 dáng mở khoá của từng loài (dáng 2 Pixel, dáng 3 Đất sét — cùng hình, khác chất liệu).
 * Toạ độ khung 200×240, mặt đất y = 160; lưới pixel 5 đơn vị, nên chỗ mang mặt cần rộng ≥ 35 đơn vị
 * (mặt pixel 7 × 5 ô). Id dáng giữ như cũ để người đã mở khoá không mất.
 */
const G = pal('#5DBB4C', '#3E8E3A', '#9BE07F');
const TRUNK = pal('#8B5A2B', '#5E3A1A', '#B5824F');
const DOT = (x: number, y: number, r: number, c: string): StyledLayer => circle(x, y, r, pal(c), { only: 'clay', flat: true });

/* Hướng dương: một bông tròn cánh vàng trên thân cao */
const SF_Y = pal('#FFD23F', '#E8960F', '#FFF1A6');
const SF_B = pal('#B5763C', '#7A4A22', '#D49A5E');
const sfLeaves = [ellipse(76, 130, 20, 8, -25, G), ellipse(124, 116, 20, 8, 25, G)];
const sfPetals = Array.from({ length: 12 }, (_, i) => {
  const a = (i * 30 * Math.PI) / 180;
  return ellipse(100 + 27 * Math.cos(a), 66 + 27 * Math.sin(a), 15, 8, i * 30, SF_Y);
});
const sunflower = styledPair(['mini', 'giant'], {
  bud: [
    rect(95, 100, 10, 62, G), ...sfLeaves,
    ellipse(100, 62, 7, 12, 0, SF_Y), ellipse(85, 67, 6, 11, -30, SF_Y), ellipse(115, 67, 6, 11, 30, SF_Y),
    ellipse(100, 90, 22, 21, 0, G),
  ],
  bloom: [
    rect(95, 80, 10, 82, G), ...sfLeaves, ...sfPetals, circle(100, 66, 21, SF_B),
    ...[[-10, 9], [10, 9], [-4, 14], [4, 14], [-14, 2], [14, 2]].map(([dx, dy]) => DOT(100 + dx, 66 + dy, 1.4, '#6B3F1E')),
  ],
}, { bud: { x: 100, y: 90, scale: 0.8 }, bloom: { x: 100, y: 66, scale: 0.8 } });

/* Ngô: thân thẳng, lá dài rủ hai bên, bắp mũm mĩm ôm lá bẹ, chỏm râu */
const CORN = pal('#FFD54A', '#E0A91E', '#FFF0A0');
const HUSK = pal('#A8DE8A', '#6FB45A', '#D4F2C4');
const SILK = pal('#E8A23C');
const KERNEL = '#F2C230';
const cornLeaves = [ellipse(66, 124, 32, 6, 28, G), ellipse(134, 114, 32, 6, -28, G)];
const corn = styledPair(['popcorn', 'rainbow'], {
  bud: [
    rect(96, 110, 8, 52, G), ...cornLeaves,
    circle(97, 68, 4, SILK), circle(103, 68, 4, SILK),
    ellipse(100, 92, 16, 22, 0, CORN),
    ellipse(86, 100, 9, 20, -15, HUSK), ellipse(114, 100, 9, 20, 15, HUSK),
  ],
  bloom: [
    rect(96, 96, 8, 66, G), ...cornLeaves,
    circle(95, 40, 5, SILK), circle(105, 40, 5, SILK), circle(100, 36, 5, SILK),
    ellipse(100, 70, 18, 28, 0, CORN),
    ...[[90, 50], [100, 46], [110, 50], [92, 92], [100, 96], [108, 92]].map(([x, y]) => rect(x - 2.5, y - 2.5, 5, 5, pal(KERNEL), { only: 'pixel' })),
    ...[[92, 50], [100, 47], [108, 50], [93, 91], [100, 94], [107, 91]].map(([x, y]) => DOT(x, y, 1.8, KERNEL)),
    ellipse(85, 88, 8, 22, -18, HUSK), ellipse(115, 88, 8, 22, 18, HUSK),
  ],
}, { bud: { x: 100, y: 90, scale: 0.6 }, bloom: { x: 100, y: 70, scale: 0.7 } });

/* Xương rồng: cột saguaro sống dọc, tay gập góc vuông, gai kem, hoa đỏ trên đỉnh (mặt ngầu theo loài) */
const CAC = pal('#3F8F4A', '#2A6334', '#69B56F');
const RIB = pal('#5FB06A');
const SPINE = pal('#FFF3D6');
const RED = pal('#E8434B', '#B02A31', '#FF8A8F');
const GOLD = pal('#FFD447', '#D99E1E', '#FFF0A0');
const spines = (pts: [number, number][]) => pts.map(([x, y]) => rect(x, y, 5, 5, SPINE, { gloss: false }));
const cactus = styledPair(['bunny', 'barrel'], {
  bud: [
    rect(118, 112, 16, 11, CAC), rect(127, 98, 11, 25, CAC), circle(132.5, 100, 5.5, CAC),
    rect(82, 86, 36, 76, CAC), circle(100, 88, 18, CAC),
    rect(90, 92, 5, 66, RIB, { only: 'pixel' }), rect(105, 92, 5, 66, RIB, { only: 'pixel' }),
    rect(91, 90, 2.5, 68, pal('#2F7A3C'), { only: 'clay', flat: true }), rect(106.5, 90, 2.5, 68, pal('#2F7A3C'), { only: 'clay', flat: true }),
    ...spines([[75, 120], [120, 140], [75, 145]]),
    ellipse(100, 68, 6, 8, 0, RED),
  ],
  bloom: [
    rect(124, 104, 24, 13, CAC), rect(135, 78, 13, 39, CAC), circle(141.5, 80, 6.5, CAC),
    rect(54, 118, 26, 13, CAC), rect(54, 96, 13, 35, CAC), circle(60.5, 98, 6.5, CAC),
    rect(80, 58, 40, 104, CAC), circle(100, 60, 20, CAC),
    rect(90, 66, 5, 92, RIB, { only: 'pixel' }), rect(105, 66, 5, 92, RIB, { only: 'pixel' }),
    rect(91, 64, 2.5, 94, pal('#2F7A3C'), { only: 'clay', flat: true }), rect(106.5, 64, 2.5, 94, pal('#2F7A3C'), { only: 'clay', flat: true }),
    ...spines([[75, 110], [120, 125], [75, 140], [120, 150], [50, 105], [145, 90]]),
    ellipse(90, 40, 6, 9, -40, RED), ellipse(110, 40, 6, 9, 40, RED), ellipse(100, 35, 7, 10, 0, RED), circle(100, 42, 4, GOLD),
  ],
}, { bud: { x: 100, y: 108, scale: 0.55 }, bloom: { x: 100, y: 84, scale: 0.6 } });

/* Monstera: bụi lá to xẻ trên cuống dài, xoè quạt */
const MON = pal('#3FA35A', '#2B7A41', '#7FD08F');
const PET = pal('#6CC070', '#4E9A52', '#9BE07F');
const NOTCH = pal('#E3F3E6');
/**
 * Lá Monstera: bầu dục + khía hình nêm cắt từ MÉP lá vào, màu sáng như lỗ thủng (vệt xẻ giữa lá thì bản pixel
 * mất hút, bản đất sét trông như đốm bóng); lá không có đốm bóng.
 * `cuts`: góc (radian, hệ của lá, âm = phía trên) của từng khía.
 */
function monLeaf(cx: number, cy: number, rx: number, ry: number, rot: number, cuts: number[]): StyledLayer[] {
  const a = (rot * Math.PI) / 180;
  const at = (u: number, v: number): [number, number] => [cx + u * Math.cos(a) - v * Math.sin(a), cy + u * Math.sin(a) + v * Math.cos(a)];
  const edge = (phi: number, k = 1.08) => at(rx * k * Math.cos(phi), ry * k * Math.sin(phi));
  const inner = (phi: number) => at(rx * 0.42 * Math.cos(phi), ry * 0.42 * Math.sin(phi));
  return [
    ellipse(cx, cy, rx, ry, rot, MON, { gloss: false }),
    ...cuts.map((phi) => poly([edge(phi - 0.16), edge(phi + 0.16), inner(phi)], NOTCH, { only: 'clay', flat: true })),
    // pixel: khía rộng hơn chút để không lọt giữa các ô lưới
    ...cuts.map((phi) => poly([edge(phi - 0.24, 1.2), edge(phi + 0.24, 1.2), inner(phi)], NOTCH, { only: 'pixel', cut: true })),
  ];
}
const UP = [-0.75, -1.57, -2.4];
const pothos = styledPair(['pole', 'trailing'], {
  bud: [
    stick(100, 160, 72, 104, 4, PET), stick(100, 160, 100, 96, 4, PET), stick(100, 160, 124, 92, 4, PET),
    ...monLeaf(72, 104, 16, 12, -30, [-1.2, -2.4]),
    ellipse(124, 90, 6, 15, 20, pal('#9BE07F')),
    ...monLeaf(100, 98, 21, 18, 0, [-0.3, -2.85]),
  ],
  bloom: [
    ...[[58, 92], [78, 62], [122, 62], [142, 92], [100, 86]].map(([x, y]) => stick(100, 160, x, y, 4, PET)),
    ...monLeaf(58, 92, 20, 15, -35, UP),
    ...monLeaf(142, 92, 20, 15, 35, UP),
    ...monLeaf(78, 62, 18, 15, -15, UP),
    ...monLeaf(122, 62, 18, 15, 15, UP),
    ...monLeaf(100, 88, 25, 21, 0, [-0.3, -2.85]),
  ],
}, { bud: { x: 100, y: 100, scale: 0.55 }, bloom: { x: 100, y: 90, scale: 0.6 } });

/* Cây cam: thân thẳng mảnh + một khối cầu lá, quả cam */
const CAN = pal('#3E9A47', '#2B6E33', '#6CC46F');
const ORANGE = pal('#FF9A2E', '#D9661A', '#FFC78A');
const BLOSSOM = pal('#FFFFFF', '#E8DDD0', '#FFFFFF');
const orange = styledPair(['kumquat', 'bonsai'], {
  bud: [
    rect(96, 112, 8, 50, TRUNK), circle(100, 86, 30, CAN),
    ...[[78, 76], [122, 78], [90, 106], [112, 104]].map(([x, y]) => circle(x, y, 5, BLOSSOM, { gloss: false })),
  ],
  bloom: [
    rect(95, 104, 10, 58, TRUNK), circle(100, 72, 38, CAN),
    ...[[70, 86], [130, 84], [84, 104], [118, 106], [100, 41]].map(([x, y]) => circle(x, y, 7.5, ORANGE)),
  ],
}, { bud: { x: 100, y: 88, scale: 0.6 }, bloom: { x: 100, y: 72, scale: 0.7 } });

/* Cherry: cây dù thấp rộng, thân chẻ đôi, vòm bông, quả đôi treo cuống dài */
const BLOOM_PINK = pal('#FFB7CF', '#E58AAA', '#FFE0EA');
const CHERRY = pal('#E8344A', '#A8182C', '#FF8A96');
const CH_STEM = pal('#5B3A23');
const cherryTrunk = [rect(95, 112, 10, 50, TRUNK), stick(100, 118, 74, 92, 7, TRUNK), stick(100, 118, 126, 92, 7, TRUNK)];
const cherry = styledPair(['weeping', 'lantern'], {
  bud: [
    ...cherryTrunk,
    ellipse(100, 92, 44, 20, 0, pal('#9ED977', '#6FB45A', '#C9EDB3')),
    ...[[76, 86], [100, 78], [124, 86], [88, 102], [112, 102]].map(([x, y]) => circle(x, y, 4, BLOOM_PINK, { gloss: false })),
  ],
  bloom: [
    ...cherryTrunk,
    circle(62, 80, 16, BLOOM_PINK), circle(138, 80, 16, BLOOM_PINK), circle(100, 64, 20, BLOOM_PINK),
    ellipse(100, 84, 54, 24, 0, BLOOM_PINK),
    stick(72, 98, 68, 116, 3, CH_STEM), stick(128, 98, 132, 116, 3, CH_STEM),
    ...[[63, 120], [74, 122], [127, 122], [138, 120]].map(([x, y]) => circle(x, y, 6.5, CHERRY)),
  ],
}, { bud: { x: 100, y: 94, scale: 0.6 }, bloom: { x: 100, y: 80, scale: 0.65 } });

/* Hoa hồng: một bông hồng nhiều lớp đội vương miện, cành mảnh thắt nơ (mặt quý cô theo loài) */
const ROSE = pal('#FF7FA6', '#D9507C', '#FFB3CA');
const ROSE_IN = pal('#FF9FBC', '#E9789A', '#FFD0DE');
const BOW = pal('#FFB3C8', '#E98AA4', '#FFE0EA');
const roseLeaves = [ellipse(84, 122, 12, 6, -30, G), ellipse(116, 110, 12, 6, 30, G)];
const rose = styledPair(['arch', 'dome'], {
  bud: [
    rect(97, 100, 6, 62, G), ...roseLeaves,
    ellipse(90, 98, 8, 12, -30, G), ellipse(110, 98, 8, 12, 30, G),
    ellipse(100, 84, 17, 22, 0, ROSE),
    poly([[89, 64], [92, 53], [96, 59], [100, 50], [104, 59], [108, 53], [111, 64]], GOLD),
  ],
  bloom: [
    rect(97, 84, 6, 78, G), ...roseLeaves,
    ellipse(91, 134, 8, 5, -25, BOW), ellipse(109, 134, 8, 5, 25, BOW), circle(100, 134, 3.5, BOW),
    ellipse(77, 72, 10, 13, -30, ROSE), ellipse(123, 72, 10, 13, 30, ROSE),
    circle(100, 66, 26, ROSE),
    ellipse(100, 52, 16, 9, 0, ROSE_IN, { gloss: false }),
    poly([[83, 44], [87, 28], [94, 38], [100, 24], [106, 38], [113, 28], [117, 44]], GOLD),
  ],
}, { bud: { x: 100, y: 88, scale: 0.6 }, bloom: { x: 100, y: 72, scale: 0.7 } });

/* Dưa hấu: dây bò lá tim xoè ngang + quả dưa giữa */
const MELON = pal('#4FAE4A', '#2E7A33', '#8FD67F');
const STRIPE = pal('#2E7A33');
const VINE = pal('#6CC070', '#4E9A52', '#9BE07F');
const HEART = pal('#7FCB6B', '#5A9E4A', '#B5E8A3');
const FLOWER = pal('#FFD447', '#D99E1E', '#FFF0A0');
const heart = (x: number, y: number, s: number): StyledLayer[] => [
  circle(x - 7 * s, y, 10 * s, HEART, { gloss: false }), circle(x + 7 * s, y, 10 * s, HEART, { gloss: false }),
  poly([[x - 16 * s, y + 4 * s], [x + 16 * s, y + 4 * s], [x, y + 20 * s]], HEART),
];
const watermelon = styledPair(['square', 'trellis'], {
  bud: [
    stick(48, 150, 152, 150, 4, VINE), ...heart(52, 128, 0.8), ...heart(148, 128, 0.8),
    circle(70, 120, 5, FLOWER), circle(130, 118, 5, FLOWER),
    ellipse(100, 136, 26, 20, 0, MELON),
    ellipse(88, 136, 3, 18, 10, STRIPE, { gloss: false }), ellipse(112, 136, 3, 18, -10, STRIPE, { gloss: false }),
  ],
  bloom: [
    stick(36, 148, 164, 148, 4, VINE), ...heart(48, 124, 1), ...heart(152, 124, 1),
    ellipse(100, 124, 38, 28, 0, MELON),
    ellipse(80, 124, 4, 26, 10, STRIPE, { gloss: false }), ellipse(120, 124, 4, 26, -10, STRIPE, { gloss: false }),
  ],
}, { bud: { x: 100, y: 134, scale: 0.6 }, bloom: { x: 100, y: 122, scale: 0.75 } });

/* Tulip: một bông chén đỏ mũm mĩm, thân mập, hai lá to mũi nhọn ở gốc */
const TULIP = pal('#F0464E', '#B82A33', '#FF8A8F');
const T_LEAF = pal('#6CC060', '#4C9A44', '#9EDF8E');
const tulipLeaves = (h: number): StyledLayer[] => [
  poly([[100, 160], [66, 152], [62, h], [88, 132]], T_LEAF),
  poly([[100, 160], [134, 152], [138, h], [112, 132]], T_LEAF),
];
const hydrangea = styledPair(['parrot', 'bouquet'], {
  bud: [
    rect(96, 104, 8, 58, G), ...tulipLeaves(118),
    ellipse(100, 64, 8, 12, 0, TULIP), ellipse(100, 86, 19, 24, 0, TULIP),
  ],
  bloom: [
    rect(95, 96, 10, 66, G), ...tulipLeaves(104),
    ellipse(81, 56, 10, 15, -15, TULIP), ellipse(119, 56, 10, 15, 15, TULIP), ellipse(100, 52, 11, 16, 0, TULIP),
    ellipse(100, 78, 30, 26, 0, TULIP),
  ],
}, { bud: { x: 100, y: 90, scale: 0.6 }, bloom: { x: 100, y: 82, scale: 0.75 } });

export const STYLED: Record<string, PlantStyle[]> = { sunflower, corn, cactus, pothos, orange, cherry, rose, watermelon, hydrangea };
