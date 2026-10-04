import './backgrounds.css';

const INK = '#5B4636';
/** nâng thảm + mèo + tim lên khỏi mép dưới (thanh vuốt Home của iPhone) */
const CAT_LIFT = 72;

/**
 * Nền động "Mèo vươn vai": nền pastel, một chú mèo chibi duỗi người theo nhịp,
 * đuôi ve vẩy, tim nhỏ bay lên. Vẽ trong khung 390×844 (cỡ iPhone 13), phủ kín màn hình.
 */
export function CatStretchScene() {
  return (
    <div className="bg-scene" data-testid="calendar-theme-cat" aria-hidden="true">
      <svg viewBox="0 0 390 844" preserveAspectRatio="xMidYMax slice" className="bg-scene__svg">
        <defs>
          <linearGradient id="cat-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFD6DE" />
            <stop offset="55%" stopColor="#E3D9FF" />
            <stop offset="100%" stopColor="#CDEFE3" />
          </linearGradient>
        </defs>
        <rect width="390" height="844" fill="url(#cat-sky)" />
        {/* mây bông mềm */}
        <g fill="#FFFDFB" opacity={0.75}>
          <g className="cat-cloud cat-cloud--a">
            <circle cx={70} cy={120} r={22} /><circle cx={95} cy={110} r={28} /><circle cx={122} cy={122} r={20} /><rect x={70} y={118} width={52} height={24} />
          </g>
          <g className="cat-cloud cat-cloud--b">
            <circle cx={290} cy={190} r={18} /><circle cx={312} cy={180} r={24} /><circle cx={336} cy={192} r={17} /><rect x={290} y={188} width={46} height={20} />
          </g>
        </g>
        {/* chấm sao nhỏ lấp lánh */}
        <g fill="#FFFDFB">
          {[[40, 300], [350, 330], [210, 70], [320, 520], [60, 560]].map(([x, y], i) => (
            <circle key={i} className="cat-twinkle" style={{ animationDelay: `${i * 0.6}s` }} cx={x} cy={y} r={3} />
          ))}
        </g>
        <g transform={`translate(0 ${-CAT_LIFT})`}>
        {/* thảm */}
        <ellipse cx={120} cy={826} rx={118} ry={20} fill="#FFC9D6" opacity={0.85} />
        <ellipse cx={120} cy={826} rx={92} ry={12} fill="none" stroke="#FFFDFB" strokeWidth={2.5} strokeDasharray="7 7" opacity={0.8} />

        {/* chú mèo */}
        <g transform="translate(52 784) scale(0.58)">
          {/* đuôi */}
          <g className="cat-tail">
            <path d="M138 34 C 168 30 176 0 160 -16" fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" />
            <path d="M138 34 C 168 30 176 0 160 -16" fill="none" stroke="#FFD8A8" strokeWidth={8} strokeLinecap="round" />
          </g>
          <g className="cat-body">
            {/* chân sau */}
            <ellipse cx={128} cy={64} rx={11} ry={8} fill="#FFD8A8" stroke={INK} strokeWidth={2.5} />
            {/* thân: mông nhô cao, ngực hạ thấp như đang vươn vai */}
            <path d="M24 60 C 30 30 70 6 112 10 C 146 14 154 46 140 66 C 110 72 60 72 24 60 Z" fill="#FFD8A8" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
            <path d="M70 18 q8 -6 14 0 M92 14 q8 -6 14 0" fill="none" stroke="#F2B57E" strokeWidth={4} strokeLinecap="round" />
          </g>
          {/* chân trước duỗi dài */}
          <g className="cat-paws">
            <path d="M28 60 L -18 66" stroke={INK} strokeWidth={15} strokeLinecap="round" />
            <path d="M28 60 L -18 66" stroke="#FFD8A8" strokeWidth={10} strokeLinecap="round" />
            <ellipse cx={-20} cy={66} rx={10} ry={7} fill="#FFFDFB" stroke={INK} strokeWidth={2.5} />
          </g>
          {/* đầu */}
          <g className="cat-head">
            <path d="M-6 28 L -2 2 L 16 20 Z" fill="#FFD8A8" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
            <path d="M34 20 L 52 4 L 54 30 Z" fill="#FFD8A8" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
            <path d="M0 22 L 2 10 L 10 18 Z M38 18 L 48 10 L 48 24 Z" fill="#FFB8C8" />
            <ellipse cx={24} cy={40} rx={32} ry={26} fill="#FFD8A8" stroke={INK} strokeWidth={3} />
            <path d="M10 40 q5 4 10 0 M30 40 q5 4 10 0" fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
            <path d="M22 47 l3 2 l3 -2" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <ellipse cx={8} cy={48} rx={5} ry={3} fill="#FF9FB2" />
            <ellipse cx={41} cy={48} rx={5} ry={3} fill="#FF9FB2" />
            <path d="M-2 44 h-10 M-1 49 h-9 M50 44 h10 M49 49 h9" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
          </g>
        </g>
        {/* tim bay lên */}
        {/* vị trí đặt ở thẻ g bao ngoài: transform của keyframes CSS đè lên thuộc tính transform của chính phần tử */}
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${118 + i * 18} 782)`}>
            <path
              className="cat-heart"
              style={{ animationDelay: `${i * 1.4}s` }}
              d="M0 6 C -8 0 -6 -8 0 -4 C 6 -8 8 0 0 6 Z"
              fill="#FF8FA8"
            />
          </g>
        ))}
        </g>
      </svg>
    </div>
  );
}
