import type { CSSProperties } from 'react';
import { liquidVars } from './liquidColor';
import './LiquidMeter.css';

type LiquidMeterProps = {
  /** 0–100 */
  value: number;
  label: string;
  /**
   * 'risk' (default): blue → yellow → red, flows faster and boils as the value rises.
   * 'progress': for values where more is better (readiness, completion). Stays blue and calm.
   */
  variant?: 'risk' | 'progress';
  className?: string;
};

/**
 * Bubbles flowing left to right through the fill (y in % of the bar height, size in px). `speed`
 * scales the trip time and `phase` offsets the loop, so no two bubbles move together. Calm bubbles
 * always flow; boil bubbles fade in as the value gets high.
 */
const bubbles = [
  { y: 30, size: 3, speed: 1, phase: 0 },
  { y: 62, size: 2, speed: 1.25, phase: 0.55 },
  { y: 45, size: 4, speed: 0.9, phase: 0.3 },
  { y: 72, size: 2.5, speed: 1.15, phase: 0.8 },
  { y: 38, size: 3, speed: 0.85, phase: 0.15 },
  { y: 55, size: 2, speed: 1.3, phase: 0.65 },
  { y: 66, size: 3.5, speed: 0.95, phase: 0.4 },
  { y: 35, size: 2.5, speed: 0.7, phase: 0.2, boil: true },
  { y: 58, size: 4.5, speed: 0.9, phase: 0.7, boil: true },
  { y: 28, size: 2, speed: 0.6, phase: 0.45, boil: true },
  { y: 50, size: 3.5, speed: 0.8, phase: 0.05, boil: true },
  { y: 70, size: 2.5, speed: 0.65, phase: 0.9, boil: true },
  { y: 42, size: 4, speed: 0.85, phase: 0.35, boil: true },
  { y: 64, size: 2, speed: 0.7, phase: 0.6, boil: true },
];

/**
 * A progress bar filled with liquid. All highlights are white or black overlays, so any fill
 * colour works.
 */
export function LiquidMeter({ value, label, variant = 'risk', className }: LiquidMeterProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const style = { '--value': `${clamped}%`, ...liquidVars(clamped, variant) } as CSSProperties;

  return (
    <span
      className={className ? `liquid ${className}` : 'liquid'}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      aria-label={label}
      style={style}
    >
      <span className="liquid__fill">
        {bubbles.map((bubble) => (
          <span
            key={`${bubble.y}-${bubble.phase}`}
            className={bubble.boil ? 'liquid__bubble liquid__bubble--boil' : 'liquid__bubble'}
            style={
              {
                '--y': `${bubble.y}%`,
                '--size': `${bubble.size}px`,
                '--speed': bubble.speed,
                '--phase': bubble.phase,
              } as CSSProperties
            }
          />
        ))}
      </span>
    </span>
  );
}
