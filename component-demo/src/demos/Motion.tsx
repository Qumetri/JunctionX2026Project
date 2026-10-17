import { motion } from 'motion/react';
import NumberFlow from '@number-flow/react';
import confetti from 'canvas-confetti';
import { useState } from 'react';

function Checkmark() {
  const [done, setDone] = useState(false);
  return (
    <div className="row">
      <button
        className={done ? 'tick done' : 'tick'}
        aria-pressed={done}
        aria-label="Mark step done"
        onClick={() => setDone((d) => !d)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 12.5 9.5 18 20 6.5" />
        </svg>
      </button>
      <span>{done ? 'Done' : 'Tap to mark done'}</span>
    </div>
  );
}

const CARDS = [
  { id: 'utilities', title: 'Switch utilities', note: 'Electricity and internet' },
  { id: 'movers', title: 'Book movers', note: 'Compare 3 quotes' },
  { id: 'address', title: 'Update address', note: 'Post, banks, employer' },
  { id: 'cover', title: 'Check cover', note: 'Contents and liability' },
];

const list = { show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

function StaggerCards() {
  return (
    <motion.ul className="cards" variants={list} initial="hidden" animate="show">
      {CARDS.map((c) => (
        <motion.li key={c.id} variants={item} whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} className="card">
          <strong>{c.title}</strong>
          <span>{c.note}</span>
        </motion.li>
      ))}
    </motion.ul>
  );
}

function CountUp() {
  const [done, setDone] = useState(3);
  const total = 8;
  const progress = Math.round((done / total) * 100);
  return (
    <div className="row">
      <NumberFlow value={progress} suffix="%" className="big-number" />
      <button className="btn" onClick={() => setDone((d) => Math.max(0, d - 1))}>
        −
      </button>
      <button className="btn btn--primary" onClick={() => setDone((d) => Math.min(total, d + 1))}>
        +
      </button>
      <span>
        {done} of {total} tasks done
      </span>
    </div>
  );
}

export function Confetti() {
  return (
    <button
      className="btn btn--primary"
      onClick={() => confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } })}
    >
      Plan complete
    </button>
  );
}

export function Motion() {
  return (
    <>
      <div className="demo">
        <p className="demo__title">Animated checkmark</p>
        <p className="demo__lib">Plain SVG + CSS stroke-dashoffset</p>
        <Checkmark />
      </div>

      <div className="demo">
        <p className="demo__title">Staggered reveal and hover / tap</p>
        <p className="demo__lib">motion (motion/react)</p>
        <StaggerCards />
      </div>

      <div className="demo">
        <p className="demo__title">Digit roll count-up</p>
        <p className="demo__lib">@number-flow/react</p>
        <CountUp />
      </div>

    </>
  );
}
