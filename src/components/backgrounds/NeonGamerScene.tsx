import './backgrounds.css';

const INK = '#140B2B';

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  x: (i * 71) % 390,
  y: 80 + ((i * 113) % 560),
  r: 1.5 + (i % 3),
  c: i % 2 ? '#FF5FD2' : '#4DF3FF',
  delay: (i % 6) * 0.7,
}));

/**
 * Nền động "Gaming neon": phòng tối tím than, lưới neon dưới sàn, cô gái chibi đeo tai nghe phát sáng
 * ngồi trước PC; màn hình nhấp nháy, bàn phím đổi màu RGB, đầu nhún theo nhạc, nốt nhạc bay lên.
 * Khung 390×844, phủ kín màn hình.
 */
export function NeonGamerScene() {
  return (
    <div className="bg-scene" data-testid="calendar-theme-gamer" aria-hidden="true">
      <svg viewBox="0 0 390 844" preserveAspectRatio="xMidYMax slice" className="bg-scene__svg">
        <defs>
          <linearGradient id="neon-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#140B2B" />
            <stop offset="55%" stopColor="#2A1450" />
            <stop offset="100%" stopColor="#3B1C66" />
          </linearGradient>
          <radialGradient id="neon-screen-glow">
            <stop offset="0%" stopColor="#4DF3FF" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#4DF3FF" stopOpacity={0} />
          </radialGradient>
          <linearGradient id="neon-rgb" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FF5FD2" />
            <stop offset="50%" stopColor="#4DF3FF" />
            <stop offset="100%" stopColor="#B26BFF" />
          </linearGradient>
        </defs>
        <rect width="390" height="844" fill="url(#neon-sky)" />
        {/* dải đèn neon trên tường */}
        <path className="neon-strip" d="M20 70 H 370" stroke="#FF5FD2" strokeWidth={4} strokeLinecap="round" />
        <path className="neon-strip neon-strip--b" d="M20 84 H 370" stroke="#4DF3FF" strokeWidth={3} strokeLinecap="round" />
        {/* hạt sáng trôi */}
        {PARTICLES.map((p, i) => (
          <circle key={i} className="neon-particle" style={{ animationDelay: `${p.delay}s` }} cx={p.x} cy={p.y} r={p.r} fill={p.c} />
        ))}
        {/* lưới neon dưới sàn */}
        <g stroke="#B26BFF" strokeWidth={1.2} opacity={0.55}>
          {[0, 1, 2, 3, 4].map((i) => <path key={`h${i}`} d={`M0 ${770 + i * 16} H 390`} />)}
          {[-200, -100, 0, 100, 200, 300, 400, 500].map((x) => <path key={x} d={`M195 760 L ${x} 844`} />)}
        </g>
        {/* bàn */}
        <rect x={60} y={752} width={320} height={10} rx={4} fill="#2B1F4D" stroke="#B26BFF" strokeWidth={1.5} />
        <path d="M90 762 V 844 M350 762 V 844" stroke="#2B1F4D" strokeWidth={8} />
        {/* màn hình */}
        <circle className="neon-glow" cx={268} cy={700} r={90} fill="url(#neon-screen-glow)" />
        <g transform="translate(212 650)">
          <rect x={0} y={0} width={112} height={72} rx={6} fill="#120A26" stroke="#4DF3FF" strokeWidth={3} />
          <rect className="neon-screen" x={6} y={6} width={100} height={60} rx={3} fill="#1F3A7A" />
          <path className="neon-screen-art" d="M14 54 L 34 34 L 48 46 L 66 24 L 98 54 Z" fill="#FF5FD2" opacity={0.85} />
          <circle cx={84} cy={18} r={7} fill="#FFE58A" />
          <rect x={50} y={72} width={12} height={20} fill="#2B1F4D" />
          <rect x={36} y={90} width={40} height={6} rx={3} fill="#2B1F4D" />
        </g>
        {/* bàn phím RGB */}
        <rect className="neon-keyboard" x={196} y={738} width={92} height={12} rx={4} fill="url(#neon-rgb)" stroke={INK} strokeWidth={1.5} />
        {/* ghế gaming */}
        <path d="M70 668 Q 66 640 92 636 Q 120 634 124 664 L 126 740 H 74 Z" fill="#3A2E5C" stroke="#FF5FD2" strokeWidth={2.5} />
        {/* cô gái (nhìn nghiêng, quay về màn hình) */}
        <g className="neon-girl">
          {/* thân */}
          <path d="M96 744 C 92 714 104 694 128 694 C 150 694 160 712 158 744 Z" fill="#FFB8D9" stroke={INK} strokeWidth={2.5} />
          {/* tay đặt lên bàn phím */}
          <path d="M150 716 C 172 722 188 732 204 738" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
          <path d="M150 716 C 172 722 188 732 204 738" fill="none" stroke="#FFE0C2" strokeWidth={6} strokeLinecap="round" />
          <g className="neon-head">
            {/* tóc sau */}
            <path d="M98 676 C 92 640 116 620 140 624 C 166 628 172 656 166 684 L 160 706 C 150 694 112 694 104 704 Z" fill="#5A3A8C" stroke={INK} strokeWidth={2.5} />
            {/* mặt */}
            <ellipse cx={140} cy={666} rx={24} ry={22} fill="#FFE0C2" stroke={INK} strokeWidth={2.5} />
            {/* mái tóc */}
            <path d="M114 660 C 116 638 138 632 160 640 C 164 650 160 656 154 656 C 146 648 130 650 114 660 Z" fill="#5A3A8C" stroke={INK} strokeWidth={2} />
            {/* mắt nhìn màn hình */}
            <ellipse cx={150} cy={668} rx={2.8} ry={3.6} fill={INK} />
            <circle cx={151} cy={667} r={1} fill="#FFFFFF" />
            <ellipse cx={156} cy={676} rx={4} ry={2.4} fill="#FF9FB2" />
            <path d="M152 680 q3 2 6 -1" fill="none" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
            {/* tai nghe neon */}
            <path d="M112 664 C 110 630 164 626 166 656" fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
            <path className="neon-headphone" d="M112 664 C 110 630 164 626 166 656" fill="none" stroke="#FF5FD2" strokeWidth={3.5} strokeLinecap="round" />
            <rect x={104} y={656} width={16} height={22} rx={7} fill="#2B1F4D" stroke="#FF5FD2" strokeWidth={2.5} />
            <circle className="neon-headphone" cx={112} cy={667} r={3} fill="#4DF3FF" />
          </g>
        </g>
        {/* nốt nhạc bay lên */}
        {[0, 1, 2].map((i) => (
          <g key={i} className="neon-note" style={{ animationDelay: `${i * 1.3}s` }} transform={`translate(${96 + i * 14} 640)`}>
            <path d="M0 0 V -14 L 9 -17 V -3" fill="none" stroke={i % 2 ? '#4DF3FF' : '#FF5FD2'} strokeWidth={2} strokeLinecap="round" />
            <ellipse cx={-2.5} cy={0} rx={3} ry={2.4} fill={i % 2 ? '#4DF3FF' : '#FF5FD2'} />
            <ellipse cx={6.5} cy={-3} rx={3} ry={2.4} fill={i % 2 ? '#4DF3FF' : '#FF5FD2'} />
          </g>
        ))}
      </svg>
    </div>
  );
}
