import './backgrounds.css';

/** Một khối pixel trên lưới: [x, y, rộng, cao, màu] (đơn vị = 1 điểm ảnh lưới, 1 điểm = 3px trên iPhone 13). */
type Px = [number, number, number, number, string];

function Pixels({ px, className }: { px: Px[]; className?: string }) {
  return (
    <g className={className}>
      {px.map(([x, y, w, h, c], i) => <rect key={i} x={x} y={y} width={w} height={h} fill={c} />)}
    </g>
  );
}

const WALL: Px[] = [
  [0, 0, 130, 282, '#2B2147'],
  [0, 200, 130, 64, '#241B3D'],
  [0, 264, 130, 18, '#3A2A5C'], // sàn
  [0, 264, 130, 2, '#4C3878'],
];

const WINDOW: Px[] = [
  [6, 18, 44, 42, '#4A3C78'],
  [8, 20, 40, 38, '#121A3A'],
  [27, 20, 2, 38, '#4A3C78'],
  [8, 38, 40, 2, '#4A3C78'],
  [38, 23, 6, 6, '#FFE58A'], // trăng
  [40, 23, 4, 2, '#121A3A'],
  [6, 60, 44, 3, '#6B5A9E'], // bậu cửa
];

const STARS: Px[] = [[11, 24, 1, 1, '#FFFFFF'], [19, 29, 1, 1, '#FFFFFF'], [31, 26, 1, 1, '#FFFFFF'], [14, 45, 1, 1, '#FFFFFF'], [36, 49, 1, 1, '#FFFFFF'], [44, 42, 1, 1, '#FFFFFF']];

const POSTER: Px[] = [
  [92, 22, 28, 30, '#FF5FD2'],
  [94, 24, 24, 26, '#1A1033'],
  // "invader" pixel
  [100, 30, 2, 2, '#4DF3FF'], [110, 30, 2, 2, '#4DF3FF'],
  [102, 32, 8, 2, '#4DF3FF'],
  [100, 34, 12, 2, '#4DF3FF'],
  [98, 36, 4, 2, '#4DF3FF'], [104, 36, 4, 2, '#4DF3FF'], [110, 36, 4, 2, '#4DF3FF'],
  [98, 38, 16, 2, '#4DF3FF'],
  [98, 40, 2, 2, '#4DF3FF'], [112, 40, 2, 2, '#4DF3FF'],
  [102, 42, 2, 2, '#4DF3FF'], [108, 42, 2, 2, '#4DF3FF'],
];

const SHELF: Px[] = [
  [66, 72, 58, 3, '#6B4E9B'],
  // chậu cây nhỏ
  [70, 64, 8, 8, '#E38E6E'], [71, 58, 2, 6, '#7BBF6A'], [74, 56, 2, 8, '#8FD18A'], [68, 59, 3, 2, '#8FD18A'], [76, 58, 3, 2, '#7BBF6A'],
  // hộp game
  [84, 60, 6, 12, '#FF5FD2'], [91, 62, 6, 10, '#4DF3FF'], [98, 58, 6, 14, '#FFE58A'],
  // tay cầm
  [108, 66, 12, 5, '#E3D9FF'], [110, 67, 2, 2, '#FF5FD2'], [116, 67, 2, 2, '#4DF3FF'],
];

const DESK: Px[] = [
  [26, 214, 102, 4, '#6B4E9B'],
  [26, 218, 102, 2, '#4C3878'],
  [30, 220, 4, 18, '#4C3878'],
  [120, 220, 4, 16, '#4C3878'],
  // loa
  [52, 196, 6, 18, '#1A1033'], [53, 199, 4, 4, '#3B2A66'], [53, 206, 4, 4, '#3B2A66'],
  // chân màn hình
  [78, 208, 4, 6, '#1A1033'], [72, 212, 16, 2, '#1A1033'],
  [111, 208, 3, 6, '#1A1033'],
  // chuột
  [100, 210, 4, 4, '#E3D9FF'],
  // cốc
  [34, 206, 6, 8, '#FFD6DE'], [40, 208, 2, 4, '#FFD6DE'],
];

const MONITOR: Px[] = [
  [60, 176, 40, 32, '#1A1033'], // viền màn chính
  [102, 182, 20, 26, '#1A1033'], // màn phụ dọc
];

/** Khung game trên màn chính: trời, đất, khối gạch; nhân vật nhảy ở lớp riêng */
const GAME: Px[] = [
  [62, 178, 36, 28, '#5DA9FF'],
  [62, 200, 36, 6, '#3FA34D'],
  [62, 199, 36, 1, '#7CD36B'],
  [80, 188, 4, 4, '#C9772E'], [84, 188, 4, 4, '#FFD15C'], [88, 188, 4, 4, '#C9772E'],
  [66, 181, 6, 2, '#FFFFFF'], [70, 180, 4, 1, '#FFFFFF'],
];
const HERO: Px[] = [[70, 194, 4, 2, '#E8473F'], [70, 196, 4, 3, '#2E5BD8'], [71, 193, 2, 1, '#E8473F']];

/** Màn phụ: dòng chữ chạy */
const CODE: Px[] = [
  [104, 185, 12, 1, '#4DF3FF'], [104, 188, 8, 1, '#FF5FD2'], [106, 191, 12, 1, '#7CD36B'],
  [104, 194, 6, 1, '#4DF3FF'], [106, 197, 10, 1, '#FFE58A'], [104, 200, 14, 1, '#FF5FD2'], [104, 203, 9, 1, '#4DF3FF'],
];

const KEYBOARD: Px[] = [[64, 211, 30, 3, '#FF5FD2']];

const TOWER: Px[] = [
  [104, 222, 16, 28, '#1A1033'],
  [106, 224, 12, 24, '#2B1F4D'],
];
const FANS: Px[] = [[108, 227, 8, 6, '#4DF3FF'], [108, 237, 8, 6, '#FF5FD2']];

/** Ghế gaming + cô gái nhìn từ sau, đeo tai nghe */
const CHAIR: Px[] = [
  [30, 186, 22, 30, '#FF5FD2'], [32, 188, 18, 26, '#C23FA0'],
  [36, 216, 10, 6, '#1A1033'], [40, 222, 2, 12, '#1A1033'], [32, 234, 18, 2, '#1A1033'],
];
const GIRL: Px[] = [
  [34, 196, 16, 18, '#B26BFF'], // áo hoodie
  [32, 200, 4, 10, '#B26BFF'], [48, 200, 4, 10, '#B26BFF'],
  [36, 178, 14, 18, '#5A3A8C'], // tóc
  [34, 182, 2, 14, '#5A3A8C'], [50, 182, 2, 14, '#5A3A8C'],
  [37, 176, 12, 2, '#5A3A8C'],
];
const HEADPHONE: Px[] = [
  [35, 175, 16, 2, '#FF5FD2'], [33, 177, 2, 4, '#FF5FD2'], [51, 177, 2, 4, '#FF5FD2'],
  [31, 181, 4, 7, '#4DF3FF'], [51, 181, 4, 7, '#4DF3FF'],
];

const LED: Px[] = [[0, 10, 130, 2, '#FF5FD2']];

/**
 * Nền động "Gaming pixel": căn phòng gaming vẽ kiểu pixel (mỗi ô 3px, sắc cạnh).
 * Hiệu ứng nhảy khung như game cổ: sao nhấp nháy, đèn LED/bàn phím đổi màu RGB, nhân vật trên màn
 * hình nhảy, chữ trên màn phụ chạy, quạt case nhấp nháy, cô gái nhún đầu theo nhạc.
 */
export function PixelGamingRoomScene() {
  return (
    <div className="bg-scene" data-testid="calendar-theme-gamer" aria-hidden="true">
      <svg viewBox="0 0 130 282" preserveAspectRatio="xMidYMax slice" className="bg-scene__svg pixel-scene" shapeRendering="crispEdges">
        <Pixels px={WALL} />
        <Pixels px={LED} className="pixel-rgb" />
        <Pixels px={WINDOW} />
        {STARS.map((s, i) => (
          <g key={i} className="pixel-twinkle" style={{ animationDelay: `${(i % 3) * 0.5}s` }}>
            <Pixels px={[s]} />
          </g>
        ))}
        <Pixels px={POSTER} className="pixel-poster" />
        <Pixels px={SHELF} />
        {/* góc bàn máy dời xuống sát đáy để lộ ra dưới thẻ lịch */}
        <g transform="translate(0 28)">
          <Pixels px={MONITOR} />
          <Pixels px={GAME} />
          <Pixels px={HERO} className="pixel-hero" />
          <Pixels px={CODE} className="pixel-code" />
          <Pixels px={DESK} />
          <Pixels px={KEYBOARD} className="pixel-rgb" />
          <Pixels px={TOWER} />
          <Pixels px={FANS} className="pixel-fans" />
          <Pixels px={CHAIR} />
          <g className="pixel-bob">
            <Pixels px={GIRL} />
            <Pixels px={HEADPHONE} className="pixel-rgb" />
          </g>
        </g>
      </svg>
    </div>
  );
}
