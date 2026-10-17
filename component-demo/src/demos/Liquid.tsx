import { useState } from 'react';
import { LiquidMeter } from '../components/LiquidMeter';
import { LiquidRing } from '../components/LiquidRing';

type Variant = 'risk' | 'progress';

export function LiquidDemo() {
  const [value, setValue] = useState(55);
  return (
    <>
      <div className="demo">
        <p className="demo__title">Liquid meter (LiquidMeter, bar)</p>
        <p className="demo__lib">LiquidMeter.tsx + LiquidMeter.css + liquidColor.ts</p>
        <div className="liquid-demo">
          <LiquidMeter value={value} label="Risk level" variant="risk" />
          <LiquidMeter value={value} label="Move readiness" variant="progress" />
        </div>
      </div>

      <div className="demo">
        <p className="demo__title">Liquid ring (LiquidRing)</p>
        <p className="demo__lib">LiquidRing.tsx + LiquidRing.css</p>
        <div className="row" style={{ gap: '2rem' }}>
          {(['risk', 'progress'] as Variant[]).map((variant) => (
            <figure key={variant} style={{ margin: 0, textAlign: 'center' }}>
              <LiquidRing value={value} label={`${variant} variant`} variant={variant} />
              <figcaption className="demo__lib">{variant}</figcaption>
            </figure>
          ))}
        </div>
      </div>

      <div className="demo">
        <div className="row">
          <input
            type="range"
            min={0}
            max={100}
            value={value}
            aria-label="Liquid value"
            onChange={(e) => setValue(Number(e.target.value))}
          />
          <output>{value}</output>
        </div>
      </div>
    </>
  );
}
