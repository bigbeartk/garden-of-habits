import { ArtView } from '../content/ArtView';
import { INK } from '../content/Face';
import { getPot } from '../content/pots/registry';

/** Ô dáng chưa mở: chậu đất nung trống + dấu ? lớn + ổ khoá. Cố ý không vẽ gì của cây để giữ bí mật. */
export function LockedStyleArt() {
  return (
    <svg viewBox="0 0 200 240" className="picker__scene" data-testid="locked-style-art" aria-hidden="true">
      <ArtView art={getPot('terracotta').art} />
      <text x={96} y={128} textAnchor="middle" fontSize={110} fontWeight={800} fill="#E3D9FF" stroke={INK} strokeWidth={4} fontFamily="'Baloo 2', sans-serif">?</text>
      <g transform="translate(132 96)" stroke={INK} strokeWidth={4} strokeLinejoin="round">
        <path d="M8 22 V12 a14 14 0 0 1 28 0 V22" fill="none" strokeLinecap="round" />
        <rect x={0} y={22} width={44} height={34} rx={9} fill="#FFF1C1" />
        <circle cx={22} cy={38} r={4.5} fill={INK} stroke="none" />
      </g>
    </svg>
  );
}
