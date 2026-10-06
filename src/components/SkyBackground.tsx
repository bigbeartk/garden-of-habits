import type { ReactNode } from 'react';
import type { TimeOfDay } from '../domain/timeOfDay';
import { useI18n } from '../i18n/I18nProvider';
import './scene.css';

function Cloud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="#FFFFFF" opacity={0.9}>
      <circle cx={0} cy={0} r={12} />
      <circle cx={14} cy={-6} r={15} />
      <circle cx={30} cy={0} r={12} />
      <rect x={0} y={0} width={30} height={12} />
    </g>
  );
}

function SkyDecor({ time }: { time: TimeOfDay }) {
  return (
    <svg className="sky__decor" viewBox="0 0 390 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {time === 'morning' && (
        <>
          <circle cx={60} cy={70} r={30} fill="#FFE58A" />
          <Cloud x={250} y={60} />
          <Cloud x={300} y={120} s={0.7} />
        </>
      )}
      {time === 'noon' && (
        <>
          <circle cx={195} cy={40} r={36} fill="#FFF3A0" />
          <Cloud x={40} y={90} s={0.9} />
          <Cloud x={290} y={70} />
        </>
      )}
      {time === 'afternoon' && (
        <>
          <circle cx={320} cy={150} r={40} fill="#FFB38A" opacity={0.9} />
          <Cloud x={50} y={60} s={0.8} />
        </>
      )}
      {time === 'evening' && (
        <>
          <circle cx={310} cy={60} r={26} fill="#FFF6D5" />
          <circle cx={322} cy={52} r={22} fill="#6E679F" />
          {[[40, 40], [90, 90], [150, 30], [220, 80], [60, 150], [260, 140], [350, 120]].map(([x, y]) => (
            <circle key={`${x}-${y}`} className="sky__star" cx={x} cy={y} r={2.2} fill="#FFFDE8" />
          ))}
        </>
      )}
    </svg>
  );
}

export function SkyBackground({ time, children }: { time: TimeOfDay; children?: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className={`sky sky--${time}`} data-testid="sky" data-time={time} aria-label={t.sky[time]}>
      <SkyDecor time={time} />
      <div className="sky__content">{children}</div>
    </div>
  );
}
