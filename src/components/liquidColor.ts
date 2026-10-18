const blue = '#1557e8';
const yellow = '#f0b400';
const red = '#e0402f';

/**
 * Blue up to 35, blends to yellow by 50, holds to 65, blends to red by 80.
 * Mixed in oklch so the blends stay saturated; oklab would pass through grey halfway.
 */
export function liquidColor(value: number) {
  const mix = (from: string, to: string, start: number, end: number) => {
    const t = Math.round(((value - start) / (end - start)) * 100);
    return `color-mix(in oklch, ${to} ${t}%, ${from})`;
  };
  if (value <= 35) return blue;
  if (value < 50) return mix(blue, yellow, 35, 50);
  if (value <= 65) return yellow;
  if (value < 80) return mix(yellow, red, 65, 80);
  return red;
}

/** CSS custom properties shared by every liquid component (meter, ring). */
export function liquidVars(value: number, variant: 'risk' | 'progress' = 'risk') {
  if (variant === 'progress') {
    return { '--liquid': blue, '--flow': '4s', '--boil': '0', '--boil-speed': '2s' };
  }
  const heat = value / 100;
  return {
    '--liquid': liquidColor(value),
    '--flow': `${(6 - heat * 4.4).toFixed(2)}s`,
    '--boil': Math.max(0, Math.min(1, (value - 45) / 40)).toFixed(2),
    '--boil-speed': `${(2.3 - heat * 1.7).toFixed(2)}s`,
  };
}
