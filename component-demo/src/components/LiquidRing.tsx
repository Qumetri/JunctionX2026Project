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

/**
 * Calm bubbles always rise through the liquid; boil bubbles fade in as the value gets high.
 * Each starts `y` units below the bottom of the glass and rises to the surface, so bubbles show at
 * any fill level. `speed` scales the rise time and `phase` offsets the loop.
 */
const bubbles = [
  { x: 34, y: 2, r: 1.4, speed: 1.1, phase: 0 },
  { x: 47, y: 6, r: 2, speed: 0.9, phase: 0.45 },
  { x: 61, y: 0, r: 1.1, speed: 1.3, phase: 0.2 },
  { x: 73, y: 9, r: 1.7, speed: 1, phase: 0.7 },
  { x: 86, y: 4, r: 1.2, speed: 1.2, phase: 0.35 },
  { x: 40, y: 0, r: 1.6, speed: 0.8, phase: 0.6, boil: true },
  { x: 54, y: 5, r: 2.4, speed: 1, phase: 0.1, boil: true },
  { x: 66, y: 1, r: 1.3, speed: 0.7, phase: 0.85, boil: true },
  { x: 50, y: 8, r: 1.1, speed: 0.9, phase: 0.4, boil: true },
  { x: 79, y: 0, r: 1.9, speed: 0.75, phase: 0.25, boil: true },
  { x: 30, y: 3, r: 1.2, speed: 0.85, phase: 0.55, boil: true },
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

  // Inner glass spans y 16–104; leave a sliver of liquid visible at 0. Bubbles live in the
  // level group (surface at y 0), so they always stop at the surface, even while it moves.
  const glassBottom = 104;
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
                  key={`${bubble.x}-${bubble.y}`}
                  className={bubble.boil ? 'liquid-ring__bubble--boil' : undefined}
                  cx={bubble.x}
                  cy={glassBottom - surfaceY + bubble.r + bubble.y}
                  r={bubble.r}
                  style={
                    {
                      '--speed': bubble.speed,
                      '--phase': bubble.phase,
                      '--rise': glassBottom - surfaceY + bubble.r + bubble.y - 2,
                    } as CSSProperties
                  }
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
