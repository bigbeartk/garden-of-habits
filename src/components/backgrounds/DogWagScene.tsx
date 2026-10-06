import './backgrounds.css';

const INK = '#5B4636';
const FUR = '#F4A35C';
const CREAM = '#FFF1DD';
/** nâng cún + bóng lên khỏi mép dưới (thanh vuốt Home của iPhone), giống nền mèo */
const DOG_LIFT = 72;
/** mặt cỏ nơi cún ngồi (trước khi nâng) */
const GROUND = 844 - DOG_LIFT;

/**
 * Nền động "Cún vẫy đuôi": trời nắng vàng bơ → peach, đồi cỏ mint. Chú Corgi chibi nhìn nghiêng (thân ngang như mèo), lệch giữa
 * (chừa góc phải dưới cho nút menu nổi): đuôi cụt vẫy, đầu nghiêng, tai giật, chân trước nhún; bóng nảy trước mũi, dấu chân hiện
 * rồi mờ trên cỏ. Vẽ trong khung 390×844 (cỡ iPhone 13), phủ kín màn hình.
 */
export function DogWagScene() {
  return (
    <div className="bg-scene" data-testid="calendar-theme-dog" aria-hidden="true">
      <svg viewBox="0 0 390 844" preserveAspectRatio="xMidYMax slice" className="bg-scene__svg">
        <defs>
          <linearGradient id="dog-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF1C1" />
            <stop offset="60%" stopColor="#FFE0D2" />
            <stop offset="100%" stopColor="#FFD6DE" />
          </linearGradient>
        </defs>
        <rect width="390" height="844" fill="url(#dog-sky)" />

        {/* mặt trời có tia xoay chậm */}
        <g transform="translate(320 110)">
          <g className="dog-sun">
            {Array.from({ length: 8 }, (_, i) => (
              <rect key={i} x={-3} y={-50} width={6} height={14} rx={3} fill="#FFD27A" transform={`rotate(${i * 45})`} />
            ))}
          </g>
          <circle r={28} fill="#FFE58A" stroke="#F7C65A" strokeWidth={3} />
        </g>

        {/* mây bông */}
        <g fill="#FFFDFB" opacity={0.8}>
          <g className="dog-cloud">
            <circle cx={70} cy={170} r={20} /><circle cx={94} cy={160} r={26} /><circle cx={120} cy={172} r={18} /><rect x={70} y={168} width={50} height={22} />
          </g>
          <g className="dog-cloud dog-cloud--b">
            <circle cx={250} cy={260} r={15} /><circle cx={270} cy={252} r={20} /><circle cx={290} cy={262} r={14} /><rect x={250} y={260} width={40} height={16} />
          </g>
        </g>

        {/* đồi cỏ */}
        <path d={`M0 ${GROUND - 26} C 110 ${GROUND - 62} 270 ${GROUND - 54} 390 ${GROUND - 30} L390 844 L0 844 Z`} fill="#CDEFE3" />
        <path d={`M0 ${GROUND + 20} C 120 ${GROUND - 4} 280 ${GROUND + 2} 390 ${GROUND + 18} L390 844 L0 844 Z`} fill="#B5E4CF" />
        {[[30, -34], [96, -48], [300, -46], [356, -32]].map(([x, dy], i) => (
          <g key={i} transform={`translate(${x} ${GROUND + dy})`}>
            <circle r={4} fill={i % 2 ? '#FFB8C8' : '#FFFDFB'} stroke={INK} strokeWidth={1} />
            <circle r={1.5} fill="#FFD27A" />
          </g>
        ))}

        {/* dấu chân cún trên cỏ, hiện lần lượt rồi mờ */}
        {[[38, GROUND + 30], [70, GROUND + 18], [102, GROUND + 34]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${i % 2 ? 14 : -10})`}>
            <g className="dog-paw" style={{ animationDelay: `${i * 0.8}s` }} fill="#8FCBB0">
              <ellipse cx={0} cy={3} rx={5} ry={4} />
              <circle cx={-5} cy={-4} r={2} /><circle cx={0} cy={-6} r={2} /><circle cx={5} cy={-4} r={2} />
            </g>
          </g>
        ))}

        <g transform={`translate(0 ${-DOG_LIFT})`}>
          {/* bóng nảy: vị trí đặt ở thẻ g ngoài, keyframes ở thẻ g trong (transform CSS đè thuộc tính transform) */}
          <ellipse className="dog-ball-shadow" cx={94} cy={846} rx={11} ry={3.5} fill={INK} opacity={0.18} />
          <g transform="translate(94 832)">
            <g className="dog-ball">
              <circle r={11} fill="#F2647A" stroke={INK} strokeWidth={2.5} />
              <path d="M-10 -2 C -4 4 4 4 10 -2" fill="none" stroke="#FFFDFB" strokeWidth={2.5} strokeLinecap="round" />
            </g>
          </g>

          {/* chú Corgi nhìn nghiêng sang trái (giống mèo) */}
          <g className="dog" transform={`translate(130 ${844 - 85}) scale(0.85)`}>
            <Corgi />
          </g>
        </g>
      </svg>
    </div>
  );
}

/** Corgi: thân dài nằm ngang, chân ngắn đi tất trắng, tai to dựng, mông tròn, đuôi cụt. Toạ độ: mặt đất y = 100. */
function Corgi() {
  return (
    <>
      <g className="dog-tail">
        <ellipse cx={150} cy={42} rx={9} ry={6.5} fill={FUR} stroke={INK} strokeWidth={2.5} />
      </g>
      {/* chân sau (phía xa) + chân trước */}
      {[110, 126, 52, 68].map((x, k) => (
        <g key={x} className={k >= 2 ? `dog-leg dog-leg--${k - 1}` : undefined}>
          <rect x={x} y={74} width={14} height={25} rx={6} fill={FUR} stroke={INK} strokeWidth={2.5} />
          <rect x={x} y={88} width={14} height={11} rx={5} fill={CREAM} stroke={INK} strokeWidth={2.5} />
        </g>
      ))}
      <path d="M40 50 C 40 32 58 28 78 28 L 114 28 C 138 28 152 44 150 62 C 148 78 134 86 116 86 L 58 86 C 46 86 40 72 40 58 Z" fill={FUR} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <path d="M58 80 C 78 89 104 89 120 80 C 104 84 78 84 58 80 Z" fill={CREAM} />
      <ellipse cx={136} cy={66} rx={9} ry={13} fill={CREAM} />
      <path d="M22 44 C 22 64 38 80 54 82 L 58 52 C 46 56 32 52 22 44 Z" fill={CREAM} />
      <path d="M40 20 C 50 32 54 46 50 58" fill="none" stroke="#E8505B" strokeWidth={6} strokeLinecap="round" />
      <circle cx={50} cy={62} r={4.5} fill="#FFD27A" stroke={INK} strokeWidth={1.5} />
      <g className="dog-head">
        {/* tai vẽ TRƯỚC đầu: chân tai chìm vào trong đầu nên đầu phủ lên, tai như mọc ra từ đầu */}
        <path d="M38 22 C 42 6 48 -8 56 -14 C 60 -4 61 10 56 24 Z" fill="#E8914A" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
        <g className="dog-ear">
          <path d="M16 24 C 14 8 17 -8 22 -18 C 32 -10 40 2 44 20 Z" fill={FUR} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
          <path d="M22 16 C 21 6 23 -4 25 -10 C 31 -4 35 4 37 14 Z" fill="#FFB8C8" />
        </g>
        <ellipse cx={34} cy={30} rx={26} ry={22} fill={FUR} stroke={INK} strokeWidth={3} />
        <path d="M32 10 C 28 18 24 26 20 30" fill="none" stroke={CREAM} strokeWidth={4} strokeLinecap="round" />
        <path d="M18 30 C 6 30 -6 36 -6 44 C -6 52 8 54 22 50 C 28 48 28 34 18 30 Z" fill={CREAM} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
        <ellipse cx={-4} cy={40} rx={4.5} ry={3.5} fill={INK} />
        <path d="M2 48 q6 4 12 0" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />
        <path d="M6 50 q3 7 6 0 Z" fill="#FF8FA8" stroke={INK} strokeWidth={1.2} />
        <path d="M24 26 q5 -5 10 0" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
        <ellipse cx={32} cy={38} rx={5} ry={3} fill="#FF9FB2" />
      </g>
    </>
  );
}
