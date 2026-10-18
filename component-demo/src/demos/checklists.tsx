import { useEffect, useState } from 'react';
import { Reorder, motion, useMotionValue, useTransform } from 'motion/react';
import { Demo } from '../components/Demo';

/* C31 Animated checkmark */
function CheckmarkDemo() {
  const [done, setDone] = useState(false);
  return (
    <div className="row">
      <button className={done ? 'tick done' : 'tick'} aria-pressed={done} aria-label="Mark step done" onClick={() => setDone((d) => !d)}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 12.5 9.5 18 20 6.5" />
        </svg>
      </button>
      <span>{done ? 'Done' : 'Tap to mark done'}</span>
    </div>
  );
}

/* C32 Timeline */
const EVENTS = [
  { when: '8 weeks before', what: 'Tell the insurer about the new address' },
  { when: '4 weeks before', what: 'Book movers and compare quotes' },
  { when: '1 week before', what: 'Switch electricity and internet' },
  { when: 'Moving day', what: 'Photograph rooms before boxes come out' },
];

function TimelineDemo() {
  return (
    <motion.ol className="timeline" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.15 } } }}>
      {EVENTS.map((e) => (
        <motion.li key={e.when} variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}>
          <strong>{e.when}</strong>
          <span>{e.what}</span>
        </motion.li>
      ))}
    </motion.ol>
  );
}

/* C33 Drag-to-reorder list */
function ReorderDemo() {
  const [items, setItems] = useState(['Book movers', 'Forward mail', 'Change address', 'Check cover']);
  return (
    <Reorder.Group axis="y" values={items} onReorder={setItems} className="reorder" aria-label="Drag to reorder">
      {items.map((item) => (
        <Reorder.Item key={item} value={item} className="reorder__item">
          <span aria-hidden="true">≡</span> {item}
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}

/* C34 Swipe-to-complete row */
function SwipeRow({ label, onDone }: { label: string; onDone: () => void }) {
  const x = useMotionValue(0);
  const bg = useTransform(x, [0, 120], ['rgba(46,160,67,0)', 'rgba(46,160,67,0.3)']);
  return (
    <motion.div className="swipe" style={{ backgroundColor: bg }}>
      <motion.div
        className="swipe__card"
        drag="x"
        dragConstraints={{ left: 0, right: 160 }}
        dragElastic={0.05}
        style={{ x }}
        onDragEnd={(_, info) => {
          if (info.offset.x > 100) onDone();
        }}
      >
        {label}
      </motion.div>
      <span className="swipe__hint" aria-hidden="true">Drag right to complete</span>
    </motion.div>
  );
}

function SwipeDemo() {
  const [rows, setRows] = useState(['Forward mail', 'Read meter', 'Pack the kitchen']);
  const [done, setDone] = useState<string[]>([]);
  return (
    <div className="stack">
      {rows.map((r) => (
        <SwipeRow key={r} label={r} onDone={() => setDone((d) => [...d, r])} />
      ))}
      <p className="demo__lib">Completed: {done.length ? done.join(', ') : 'none yet'}</p>
      <button className="btn" onClick={() => {
        setRows(['Forward mail', 'Read meter', 'Pack the kitchen']);
        setDone([]);
      }}>
        Reset
      </button>
    </div>
  );
}

/* C35 Grouped checklist with progress per group */
const GROUPS: Record<string, string[]> = {
  'Before the move': ['Tell the insurer', 'Book movers', 'Forward mail'],
  'Moving day': ['Photograph rooms', 'Collect keys'],
};

function GroupedChecklistDemo() {
  const [done, setDone] = useState<Set<string>>(new Set(['Tell the insurer']));
  const toggle = (item: string) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  return (
    <div className="stack">
      {Object.entries(GROUPS).map(([group, items]) => {
        const count = items.filter((i) => done.has(i)).length;
        const pct = Math.round((count / items.length) * 100);
        return (
          <div key={group} className="group">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <strong>{group}</strong>
              <span className="demo__lib">{count}/{items.length}</span>
            </div>
            <div className="bar-track">
              <motion.div className="bar-track__fill" animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
            </div>
            <ul className="plain-list">
              {items.map((item) => (
                <li key={item}>
                  <label className="row">
                    <input type="checkbox" checked={done.has(item)} onChange={() => toggle(item)} />
                    <span className={done.has(item) ? 'is-struck' : undefined}>{item}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

/* C36 Countdown to move date */
function CountdownDemo() {
  const [target, setTarget] = useState('2026-11-14');
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const ms = Math.max(0, new Date(`${target}T09:00:00`).getTime() - now);
  const parts = [
    ['days', Math.floor(ms / 86_400_000)],
    ['hours', Math.floor((ms / 3_600_000) % 24)],
    ['min', Math.floor((ms / 60_000) % 60)],
    ['sec', Math.floor((ms / 1000) % 60)],
  ] as const;
  return (
    <>
      <div className="countdown" role="timer" aria-live="off">
        {parts.map(([label, n]) => (
          <div key={label} className="countdown__cell">
            <strong>{String(n).padStart(2, '0')}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <label className="row">
        Move date
        <input type="date" value={target} onChange={(e) => e.target.value && setTarget(e.target.value)} className="tag-input" />
      </label>
    </>
  );
}

/* C37 Journey path drawn as steps complete */
const JOURNEY_D = 'M 20 60 Q 110 20 200 60 T 380 60';
const MILESTONES: [number, number][] = [
  [20, 60],
  [110, 40],
  [200, 60],
  [290, 80],
  [380, 60],
];

function JourneyDemo() {
  const [step, setStep] = useState(1);
  return (
    <>
      <svg viewBox="0 0 400 120" width="100%" role="img" aria-label={`Step ${step + 1} of 5`} style={{ maxWidth: 400 }}>
        <path d={JOURNEY_D} fill="none" stroke="var(--track)" strokeWidth={6} strokeLinecap="round" />
        <motion.path
          d={JOURNEY_D}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={6}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: step / 4 }}
          transition={{ duration: 0.6 }}
        />
        {MILESTONES.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={8} fill={i <= step ? 'var(--accent)' : 'var(--surface)'} stroke="var(--accent)" strokeWidth={2} />
        ))}
      </svg>
      <div className="row">
        <button className="btn" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Back</button>
        <button className="btn btn--primary" disabled={step === 4} onClick={() => setStep((s) => s + 1)}>Next step</button>
      </div>
    </>
  );
}

export function ChecklistsGroup() {
  return (
    <>
      <Demo id="C31" title="Animated checkmark" lib="plain SVG + CSS stroke-dashoffset">
        <CheckmarkDemo />
      </Demo>
      <Demo id="C32" title="Timeline" lib="motion stagger">
        <TimelineDemo />
      </Demo>
      <Demo id="C33" title="Drag-to-reorder list" lib="motion Reorder">
        <ReorderDemo />
      </Demo>
      <Demo id="C34" title="Swipe-to-complete row" lib="motion drag + onDragEnd">
        <SwipeDemo />
      </Demo>
      <Demo id="C35" title="Grouped checklist with progress" lib="plain CSS + motion width">
        <GroupedChecklistDemo />
      </Demo>
      <Demo id="C36" title="Countdown to move date" lib="plain JS timer">
        <CountdownDemo />
      </Demo>
      <Demo id="C37" title="Journey path (drawn as steps complete)" lib="plain SVG + motion pathLength">
        <JourneyDemo />
      </Demo>
    </>
  );
}
