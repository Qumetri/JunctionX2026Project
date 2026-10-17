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
        <span className="liquid__bubbles" />
      </span>
    </span>
  );
}
