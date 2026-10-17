import { useEffect, useId, useState, type CSSProperties, type ReactNode } from 'react';
import { liquidVars } from './liquidColor';
import './LiquidRing.css';

type LiquidRingProps = {
  /** 0–100 */
  value: number;
  label: string;
  variant?: 'risk' | 'progress';
  children?: ReactNode;
};

/** One wave period is 40 units; the path spans enough periods to slide one period sideways. */
const wavePath = (() => {
  let d = 'M -80 0 Q -70 -4 -60 0';
  for (let x = -40; x <= 200; x += 20) d += ` T ${x} 0`;
  return `${d} V 130 H -80 Z`;
})();

const bubbles = [
  { x: 42, r: 1.6, delay: '0s' },
  { x: 58, r: 2.2, delay: '-0.7s' },
  { x: 71, r: 1.3, delay: '-1.3s' },
  { x: 50, r: 1.1, delay: '-1.9s' },
  { x: 79, r: 1.8, delay: '-0.4s' },
];

/**
 * The ring from the designs, filled with the same liquid as LiquidMeter: the ring arc shows the
 * value, the glass inside fills to the same level and boils when the value is high.
 */
export function LiquidRing({ value, label, variant = 'risk', children }: LiquidRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const clipId = `ring-${useId().replace(/[^\w-]/g, '')}`;
  const [shown, setShown] = useState(0);

  // Start empty so the ring fills on load, then follow every change.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(clamped));
    return () => cancelAnimationFrame(frame);
  }, [clamped]);

  // Inner glass spans y 16–104; leave a sliver of liquid visible at 0.
  const surfaceY = 102 - (shown / 100) * 86;

  return (
    <figure className="liquid-ring" style={liquidVars(clamped, variant) as CSSProperties}>
      <svg viewBox="0 0 120 120" role="img" aria-label={label}>
        <defs>
          <clipPath id={clipId}>
            <circle cx="60" cy="60" r="44" />
          </clipPath>
        </defs>
        <circle className="liquid-ring__track" cx="60" cy="60" r="54" />
        <circle
          className="liquid-ring__arc"
          cx="60"
          cy="60"
          r="54"
          pathLength={100}
          strokeDasharray="100"
          strokeDashoffset={100 - shown}
        />
        <g clipPath={`url(#${clipId})`}>
          <circle className="liquid-ring__glass" cx="60" cy="60" r="44" />
          <g className="liquid-ring__level" style={{ transform: `translateY(${surfaceY}px)` }}>
            <path className="liquid-ring__wave liquid-ring__wave--back" d={wavePath} />
            <path className="liquid-ring__wave" d={wavePath} />
            <g className="liquid-ring__bubbles">
              {bubbles.map((bubble) => (
                <circle
                  key={bubble.x}
                  cx={bubble.x}
                  cy="70"
                  r={bubble.r}
                  style={{ animationDelay: bubble.delay }}
                />
              ))}
            </g>
          </g>
        </g>
        <circle className="liquid-ring__rim" cx="60" cy="60" r="44" />
      </svg>
      {children && <figcaption>{children}</figcaption>}
    </figure>
  );
}
