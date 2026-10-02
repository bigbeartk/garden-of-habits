import './backgrounds.css';

/** Ngọn cỏ: vị trí, chiều cao, độ nghiêng, độ trễ — tính sẵn, không random để hình ổn định. */
const BLADES = Array.from({ length: 44 }, (_, i) => {
  const x = 4 + i * 8.9;
  const h = 70 + ((i * 37) % 60);
  const lean = ((i * 13) % 11) - 5;
  return { x, h, lean, delay: (i % 11) * 0.16 + Math.floor(i / 11) * 0.08 };
});

const BACK_BLADES = Array.from({ length: 30 }, (_, i) => {
  const x = 10 + i * 13;
  const h = 40 + ((i * 29) % 40);
  const lean = ((i * 7) % 9) - 4;
  return { x, h, lean, delay: 0.4 + (i % 8) * 0.14 };
});

const FLOWERS = [
  { x: 40, y: 760, c: '#FFFDFB' },
  { x: 108, y: 742, c: '#FFE58A' },
  { x: 170, y: 768, c: '#FFB8C8' },
  { x: 236, y: 748, c: '#FFFDFB' },
  { x: 300, y: 764, c: '#FFE58A' },
  { x: 352, y: 744, c: '#FFB8C8' },
];

function blade(x: number, h: number, lean: number, base: number) {
  return `M${x - 3} ${base} Q ${x + lean * 0.4} ${base - h * 0.6} ${x + lean} ${base - h} Q ${x + lean * 0.4 + 2} ${base - h * 0.55} ${x + 3} ${base} Z`;
}

/**
 * Nền động "Cỏ nở": nền xanh, cỏ lần lượt mọc lên rồi đung đưa, hoa nhỏ nở dần.
 * Khung 390×844, phủ kín màn hình.
 */
export function GrassBloomScene() {
  return (
    <div className="bg-scene" data-testid="calendar-theme-grass" aria-hidden="true">
      <svg viewBox="0 0 390 844" preserveAspectRatio="xMidYMax slice" className="bg-scene__svg">
        <defs>
          <linearGradient id="grass-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D4F1F9" />
            <stop offset="45%" stopColor="#CDEFE3" />
            <stop offset="100%" stopColor="#9ED9A0" />
          </linearGradient>
        </defs>
        <rect width="390" height="844" fill="url(#grass-sky)" />
        <circle className="grass-sun" cx={320} cy={110} r={34} fill="#FFF1C1" />
        {/* đồi xa */}
        <path d="M0 690 Q 100 640 200 680 T 390 670 V 844 H 0 Z" fill="#B7E4B0" />
        {/* lớp cỏ sau */}
        <g fill="#8FD18A">
          {BACK_BLADES.map((b, i) => (
            <path key={i} className="grass-blade" style={{ animationDelay: `${b.delay}s, ${b.delay + 1.6}s` }} d={blade(b.x, b.h, b.lean, 790)} />
          ))}
        </g>
        <rect y={786} width={390} height={58} fill="#7CC46A" />
        {/* hoa nhỏ */}
        {FLOWERS.map((f, i) => (
          <g key={i} transform={`translate(${f.x} ${f.y})`}>
            <path d="M0 0 V 50" stroke="#5FA855" strokeWidth={3} />
            <g className="grass-flower" style={{ animationDelay: `${1.4 + i * 0.35}s` }}>
              {[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={0} cy={-6} r={5} fill={f.c} stroke="#5B4636" strokeWidth={1.2} transform={`rotate(${a})`} />)}
              <circle r={3.4} fill="#F5A623" />
            </g>
          </g>
        ))}
        {/* lớp cỏ trước */}
        <g fill="#6DBB5E">
          {BLADES.map((b, i) => (
            <path key={i} className="grass-blade" style={{ animationDelay: `${b.delay}s, ${b.delay + 1.6}s` }} d={blade(b.x, b.h, b.lean, 844)} />
          ))}
        </g>
      </svg>
    </div>
  );
}
