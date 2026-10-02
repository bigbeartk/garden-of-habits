import './backgrounds.css';

const INK = '#3B3552';

/** Hạt mưa: vị trí, độ dài, tốc độ, độ trễ — tính sẵn để hình ổn định. */
const DROPS = Array.from({ length: 70 }, (_, i) => ({
  x: (i * 53) % 400 - 5,
  len: 14 + ((i * 7) % 12),
  dur: 0.9 + ((i * 13) % 7) * 0.12,
  delay: -((i * 0.37) % 2.4),
  o: 0.35 + ((i * 11) % 5) * 0.1,
}));

/** Giọt nước chảy chậm trên kính */
const GLASS_DROPS = [
  { x: 60, y: 140, d: 0 }, { x: 140, y: 260, d: 2.2 }, { x: 250, y: 120, d: 4.1 },
  { x: 330, y: 300, d: 1.3 }, { x: 95, y: 420, d: 3.4 }, { x: 290, y: 470, d: 5.2 },
];

/**
 * Nền động "Mưa chill": nhìn ra cửa sổ đêm mưa tông xanh tím, mưa rơi, giọt nước chảy trên kính,
 * bậu cửa có tách trà bốc khói và đèn nến ấm. Khung 390×844, phủ kín màn hình.
 */
export function RainChillScene() {
  return (
    <div className="bg-scene" data-testid="calendar-theme-rain" aria-hidden="true">
      <svg viewBox="0 0 390 844" preserveAspectRatio="xMidYMax slice" className="bg-scene__svg">
        <defs>
          <linearGradient id="rain-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3E4A7A" />
            <stop offset="60%" stopColor="#6A7BB5" />
            <stop offset="100%" stopColor="#9AA8D8" />
          </linearGradient>
          <radialGradient id="rain-lamp">
            <stop offset="0%" stopColor="#FFE3A3" stopOpacity={0.75} />
            <stop offset="100%" stopColor="#FFE3A3" stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect width="390" height="844" fill="url(#rain-sky)" />
        {/* thành phố xa mờ */}
        <g fill="#56659E" opacity={0.7}>
          <rect x={0} y={600} width={46} height={160} /><rect x={50} y={560} width={38} height={200} />
          <rect x={92} y={620} width={54} height={140} /><rect x={150} y={580} width={34} height={180} />
          <rect x={188} y={630} width={60} height={130} /><rect x={252} y={570} width={42} height={190} />
          <rect x={298} y={610} width={50} height={150} /><rect x={352} y={590} width={40} height={170} />
        </g>
        <g fill="#FFE9B0" opacity={0.55}>
          {[[62, 590], [70, 620], [160, 600], [262, 600], [270, 640], [310, 640], [362, 620], [110, 650]].map(([x, y], i) => (
            <rect key={i} className="rain-window-light" style={{ animationDelay: `${i * 0.9}s` }} x={x} y={y} width={6} height={8} rx={1} />
          ))}
        </g>
        {/* mưa */}
        <g stroke="#DCE6FF" strokeLinecap="round">
          {DROPS.map((d, i) => (
            <line
              key={i}
              className="rain-drop"
              style={{ animationDuration: `${d.dur}s`, animationDelay: `${d.delay}s`, opacity: d.o }}
              x1={d.x}
              y1={-30}
              x2={d.x - 4}
              y2={-30 + d.len}
              strokeWidth={1.6}
            />
          ))}
        </g>
        {/* giọt nước trên kính */}
        {GLASS_DROPS.map((g, i) => (
          <g key={i} className="rain-glass" style={{ animationDelay: `${g.d}s` }}>
            <ellipse cx={g.x} cy={g.y} rx={4} ry={5.5} fill="#EEF3FF" opacity={0.75} />
            <ellipse cx={g.x - 1.2} cy={g.y - 2} rx={1.2} ry={1.6} fill="#FFFFFF" />
          </g>
        ))}
        {/* khung cửa sổ */}
        <g fill="none" stroke="#2E2A45" strokeWidth={10} opacity={0.55}>
          <path d="M195 0 V 770" />
          <path d="M0 400 H 390" />
        </g>
        {/* bậu cửa */}
        <rect x={0} y={770} width={390} height={74} fill="#8C6E5A" />
        <rect x={0} y={764} width={390} height={12} rx={4} fill="#A9876F" />
        {/* đèn nến ấm */}
        <circle className="rain-lamp" cx={70} cy={760} r={70} fill="url(#rain-lamp)" />
        <rect x={60} y={738} width={20} height={28} rx={4} fill="#FFF1C1" stroke={INK} strokeWidth={2} />
        <path className="rain-flame" d="M70 724 C 64 732 66 738 70 738 C 74 738 76 732 70 724 Z" fill="#FFB347" />
        {/* tách trà */}
        <g transform="translate(120 732)">
          <ellipse cx={22} cy={34} rx={30} ry={5} fill="#7A5D4C" />
          <path d="M0 4 H 44 V 22 A 12 12 0 0 1 32 34 H 12 A 12 12 0 0 1 0 22 Z" fill="#FFD6DE" stroke={INK} strokeWidth={2} />
          <path d="M44 9 q12 0 10 10 q-2 7 -10 7" fill="none" stroke={INK} strokeWidth={2.4} />
          <ellipse cx={22} cy={5} rx={20} ry={3.5} fill="#C98B5E" />
          <path d="M14 20 q2 2 4 0 M26 20 q2 2 4 0" fill="none" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
          {[8, 20, 32].map((x, i) => (
            <path key={x} className="rain-steam" style={{ animationDelay: `${i * 0.8}s` }} d={`M${x} -2 q-5 -8 0 -14 q5 -6 0 -14`} fill="none" stroke="#FFFDFB" strokeWidth={2.4} strokeLinecap="round" />
          ))}
        </g>
        {/* cây nhỏ */}
        <g transform="translate(206 736)">
          <path d="M4 10 L 8 34 H 26 L 30 10 Z" fill="#CDEFE3" stroke={INK} strokeWidth={2} />
          <path d="M17 10 C 6 2 6 -8 12 -12 C 18 -6 18 2 17 10 Z M17 10 C 26 0 32 -2 34 2 C 30 8 24 10 17 10 Z" fill="#8FCB84" stroke={INK} strokeWidth={1.6} />
        </g>
      </svg>
    </div>
  );
}
