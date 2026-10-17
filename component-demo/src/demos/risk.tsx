import { useState } from 'react';
import GaugeComponent from 'react-gauge-component';
import NumberFlow from '@number-flow/react';
import { motion } from 'motion/react';
import { LiquidMeter } from '../components/LiquidMeter';
import { LiquidRing } from '../components/LiquidRing';
import { Demo } from '../components/Demo';

function Slider({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <input type="range" min={0} max={100} value={value} aria-label={label} onChange={(e) => onChange(Number(e.target.value))} />
  );
}

/* Plain SVG ring: stroke-dasharray + stroke-dashoffset, animated with a CSS transition. */
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

function RingDemo() {
  const [v, setV] = useState(62);
  return (
    <div className="row">
      <Ring value={v} />
      <Slider value={v} onChange={setV} label="Ring value" />
    </div>
  );
}

function GaugeDemo() {
  const [v, setV] = useState(62);
  return (
    <>
      <div style={{ maxWidth: 360 }}>
        <GaugeComponent
          type="semicircle"
          value={v}
          minValue={0}
          maxValue={100}
          arc={{ subArcs: [{ limit: 33, color: '#2ecc71' }, { limit: 66, color: '#f1c40f' }, { color: '#e74c3c' }] }}
          labels={{ valueLabel: { formatTextValue: (x) => `${x}%` } }}
        />
      </div>
      <Slider value={v} onChange={setV} label="Gauge value" />
    </>
  );
}

function SegmentsDemo() {
  const [done, setDone] = useState(3);
  const total = 5;
  return (
    <>
      <div className="segments" role="img" aria-label={`${done} of ${total} steps done`}>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={i < done ? 'is-on' : undefined} />
        ))}
      </div>
      <div className="row" style={{ marginTop: '0.75rem' }}>
        <button className="btn" onClick={() => setDone((s) => Math.max(0, s - 1))}>
          Undo step
        </button>
        <button className="btn btn--primary" onClick={() => setDone((s) => Math.min(total, s + 1))}>
          Complete step
        </button>
        <span>{done} / {total}</span>
      </div>
    </>
  );
}

/* C21 Liquid meter (bar): both variants */
function LiquidMeterDemo() {
  const [v, setV] = useState(55);
  return (
    <div className="liquid-demo">
      <LiquidMeter value={v} label="Risk level" variant="risk" />
      <LiquidMeter value={v} label="Move readiness" variant="progress" />
      <div className="row">
        <Slider value={v} onChange={setV} label="Liquid meter value" />
        <output>{v}</output>
      </div>
    </div>
  );
}

/* C22 Liquid ring: both variants */
function LiquidRingDemo() {
  const [v, setV] = useState(55);
  return (
    <>
      <div className="row" style={{ gap: '2rem' }}>
        {(['risk', 'progress'] as const).map((variant) => (
          <figure key={variant} style={{ margin: 0, textAlign: 'center' }}>
            <LiquidRing value={v} label={`${variant} variant`} variant={variant} />
            <figcaption className="demo__lib">{variant}</figcaption>
          </figure>
        ))}
      </div>
      <div className="row">
        <Slider value={v} onChange={setV} label="Liquid ring value" />
        <output>{v}</output>
      </div>
    </>
  );
}

/* C23 Count-up */
function CountUpDemo() {
  const [done, setDone] = useState(3);
  const total = 8;
  const progress = Math.round((done / total) * 100);
  return (
    <div className="row">
      <NumberFlow value={progress} suffix="%" className="big-number" />
      <button className="btn" onClick={() => setDone((d) => Math.max(0, d - 1))}>−</button>
      <button className="btn btn--primary" onClick={() => setDone((d) => Math.min(total, d + 1))}>+</button>
      <span>{done} of {total} tasks done</span>
    </div>
  );
}

/* C24 Risk meter with marker */
function RiskMeterDemo() {
  const [v, setV] = useState(40);
  const label = v < 34 ? 'Low' : v < 67 ? 'Medium' : 'High';
  return (
    <>
      <div className="risk-bar" role="img" aria-label={`Risk ${v} out of 100, ${label}`}>
        <span className="risk-bar__marker" style={{ left: `${v}%` }} />
      </div>
      <div className="row">
        <Slider value={v} onChange={setV} label="Risk score" />
        <strong>{label}</strong>
      </div>
    </>
  );
}

/* C25 Radar chart: before and after coverage */
const AXES = ['Contents', 'Liability', 'Moving', 'Home', 'Travel'];
const BEFORE = [30, 40, 20, 50, 35];
const AFTER = [85, 75, 70, 60, 40];
const C = 130;
const R = 100;

function radarPoint(i: number, value: number): [number, number] {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / AXES.length;
  const r = (R * value) / 100;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
}

function radarPath(values: number[]) {
  return `${values.map((v, i) => radarPoint(i, v).map((n) => n.toFixed(1)).join(' ')).map((p, i) => (i === 0 ? `M ${p}` : `L ${p}`)).join(' ')} Z`;
}

function RadarDemo() {
  const [after, setAfter] = useState(false);
  return (
    <div className="radar">
      <svg viewBox="0 0 260 260" width="260" role="img" aria-label={after ? 'Coverage after' : 'Coverage before'}>
        {[25, 50, 75, 100].map((g) => (
          <polygon key={g} points={AXES.map((_, i) => radarPoint(i, g).join(',')).join(' ')} fill="none" stroke="var(--line)" />
        ))}
        {AXES.map((a, i) => {
          const [x, y] = radarPoint(i, 100);
          return <line key={a} x1={C} y1={C} x2={x} y2={y} stroke="var(--line)" />;
        })}
        <motion.path d={radarPath(after ? AFTER : BEFORE)} fill="var(--accent)" fillOpacity={0.25} stroke="var(--accent)" strokeWidth={2} />
        {AXES.map((a, i) => {
          const [x, y] = radarPoint(i, 118);
          return (
            <text key={a} x={x} y={y} fontSize="10" textAnchor="middle" fill="var(--muted)">
              {a}
            </text>
          );
        })}
      </svg>
      <button className="btn" aria-pressed={after} onClick={() => setAfter((a) => !a)}>
        {after ? 'Show before' : 'Show after moving plan'}
      </button>
    </div>
  );
}

/* C26 Sparkline with draw-in */
function SparklineDemo() {
  const [seed, setSeed] = useState(0);
  const data = Array.from({ length: 12 }, (_, i) => 40 + 25 * Math.sin(i * 0.8 + seed) + (i % 3) * 4);
  const w = 260;
  const h = 60;
  const d = data
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${((i / (data.length - 1)) * w).toFixed(1)} ${(h - (v / 100) * h).toFixed(1)}`)
    .join(' ');
  return (
    <div className="row">
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label="Sparkline">
        <motion.path key={seed} d={d} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
      </svg>
      <button className="btn" onClick={() => setSeed((s) => s + 1)}>Refresh</button>
    </div>
  );
}

/* C27 Stacked donut breakdown */
const PARTS = [
  { label: 'Contents', v: 40, color: '#1557e8' },
  { label: 'Liability', v: 25, color: '#f0b400' },
  { label: 'Movers', v: 20, color: '#e0402f' },
  { label: 'Other', v: 15, color: '#2a9d8f' },
];

function BreakdownDemo() {
  const r = 50;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="row">
      <svg viewBox="0 0 120 120" width="160" role="img" aria-label="Premium breakdown">
        {PARTS.map((p) => {
          const len = (circ * p.v) / 100;
          const el = (
            <circle
              key={p.label}
              cx={60}
              cy={60}
              r={r}
              fill="none"
              stroke={p.color}
              strokeWidth={14}
              strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 60 60)"
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <ul className="legend">
        {PARTS.map((p) => (
          <li key={p.label}>
            <span className="legend__dot" style={{ background: p.color }} />
            {p.label} {p.v}%
          </li>
        ))}
      </ul>
    </div>
  );
}

/* C28 Animated bar chart */
const MONTHS: [string, number][] = [
  ['Jun', 4],
  ['Jul', 7],
  ['Aug', 9],
  ['Sep', 6],
  ['Oct', 12],
];

function BarChartDemo() {
  const [run, setRun] = useState(0);
  return (
    <>
      <div className="bars" key={run} role="img" aria-label="Tasks done per month">
        {MONTHS.map(([m, v], i) => (
          <div key={m} className="bars__col">
            <motion.div className="bar" initial={{ height: 0 }} animate={{ height: v * 6 }} transition={{ delay: i * 0.08, duration: 0.6 }} />
            <span>{m}</span>
          </div>
        ))}
      </div>
      <button className="btn" onClick={() => setRun((r) => r + 1)}>Replay</button>
    </>
  );
}

/* C29 Traffic-light risk badge */
const LEVELS = [
  { id: 'low', label: 'Low risk', color: '#2ea043' },
  { id: 'medium', label: 'Medium risk', color: '#f0b400' },
  { id: 'high', label: 'High risk', color: '#e0402f' },
];

function TrafficDemo() {
  const [level, setLevel] = useState('medium');
  const current = LEVELS.find((l) => l.id === level) ?? LEVELS[1];
  return (
    <>
      <span className="traffic" style={{ ['--dot' as string]: current.color }} role="status">
        <span className="traffic__dot" />
        {current.label}
      </span>
      <div className="row">
        {LEVELS.map((l) => (
          <button key={l.id} className="btn" aria-pressed={l.id === level} onClick={() => setLevel(l.id)}>
            {l.label}
          </button>
        ))}
      </div>
    </>
  );
}

/* C30 Calendar heatmap */
function HeatmapDemo() {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <div>
      <div className="heat-days">
        {days.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="heatmap" role="img" aria-label="Tasks per day, 5 weeks">
        {Array.from({ length: 35 }, (_, i) => {
          const level = (i * 37 + 11) % 5;
          return <span key={i} className={`heat heat--${level}`} title={`${level} tasks`} />;
        })}
      </div>
      <p className="demo__lib">Darker means more move tasks due that day. Dummy data.</p>
    </div>
  );
}

export function RiskGroup() {
  return (
    <>
      <Demo id="C18" title="Donut / ring progress" lib="plain SVG, zero dependency">
        <RingDemo />
      </Demo>
      <Demo id="C19" title="Half-circle gauge" lib="react-gauge-component">
        <GaugeDemo />
      </Demo>
      <Demo id="C20" title="Segmented progress bar" lib="plain CSS">
        <SegmentsDemo />
      </Demo>
      <Demo id="C21" title="Liquid meter (bar)" lib="LiquidMeter.tsx, risk and progress variants">
        <LiquidMeterDemo />
      </Demo>
      <Demo id="C22" title="Liquid ring" lib="LiquidRing.tsx, risk and progress variants">
        <LiquidRingDemo />
      </Demo>
      <Demo id="C23" title="Count-up numbers" lib="@number-flow/react">
        <CountUpDemo />
      </Demo>
      <Demo id="C24" title="Risk meter with marker" lib="plain CSS gradient">
        <RiskMeterDemo />
      </Demo>
      <Demo id="C25" title="Radar chart (coverage)" lib="plain SVG, motion morphs the shape">
        <RadarDemo />
      </Demo>
      <Demo id="C26" title="Sparkline with draw-in" lib="plain SVG, motion pathLength">
        <SparklineDemo />
      </Demo>
      <Demo id="C27" title="Stacked donut breakdown" lib="plain SVG, stroke-dasharray">
        <BreakdownDemo />
      </Demo>
      <Demo id="C28" title="Animated bar chart" lib="motion height animation">
        <BarChartDemo />
      </Demo>
      <Demo id="C29" title="Traffic-light risk badge" lib="plain CSS">
        <TrafficDemo />
      </Demo>
      <Demo id="C30" title="Calendar heatmap" lib="plain CSS grid">
        <HeatmapDemo />
      </Demo>
    </>
  );
}
