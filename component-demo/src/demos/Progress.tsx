import { useState } from 'react';
import GaugeComponent from 'react-gauge-component';

/** Plain SVG ring: stroke-dasharray + stroke-dashoffset, animated with a CSS transition. */
export function Ring({ value, size = 120, stroke = 12 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${value}%`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 800ms ease' }}
        />
      </svg>
      <span aria-hidden="true">{value}%</span>
    </div>
  );
}

function Segments({ total, done }: { total: number; done: number }) {
  return (
    <div className="segments" role="img" aria-label={`${done} of ${total} steps done`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i < done ? 'is-on' : undefined} />
      ))}
    </div>
  );
}

export function Progress() {
  const [ring, setRing] = useState(62);
  const [steps, setSteps] = useState(3);

  return (
    <>
      <div className="demo">
        <p className="demo__title">Donut / ring</p>
        <p className="demo__lib">Plain SVG, no dependency</p>
        <div className="row">
          <Ring value={ring} />
          <label className="field">
            Value {ring}%
            <input type="range" min={0} max={100} value={ring} onChange={(e) => setRing(Number(e.target.value))} />
          </label>
        </div>
      </div>

      <div className="demo">
        <p className="demo__title">Half-circle gauge</p>
        <p className="demo__lib">react-gauge-component</p>
        <div style={{ maxWidth: 360 }}>
          <GaugeComponent
            type="semicircle"
            value={ring}
            minValue={0}
            maxValue={100}
            arc={{ subArcs: [{ limit: 33, color: '#2ecc71' }, { limit: 66, color: '#f1c40f' }, { color: '#e74c3c' }] }}
            labels={{ valueLabel: { formatTextValue: (v) => `${v}%` } }}
          />
        </div>
      </div>

      <div className="demo">
        <p className="demo__title">Segmented bar</p>
        <p className="demo__lib">Plain CSS</p>
        <Segments total={5} done={steps} />
        <div className="row" style={{ marginTop: '0.75rem' }}>
          <button className="btn" onClick={() => setSteps((s) => Math.max(0, s - 1))}>
            Undo step
          </button>
          <button className="btn btn--primary" onClick={() => setSteps((s) => Math.min(5, s + 1))}>
            Complete step
          </button>
          <span className="demo__lib" style={{ margin: 0 }}>
            {steps} / 5
          </span>
        </div>
      </div>

    </>
  );
}
