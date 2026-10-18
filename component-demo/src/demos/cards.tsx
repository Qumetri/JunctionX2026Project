import { useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'motion/react';
import { Demo } from '../components/Demo';

const CARDS = [
  { id: 'utilities', title: 'Switch utilities', note: 'Electricity and internet' },
  { id: 'movers', title: 'Book movers', note: 'Compare 3 quotes' },
  { id: 'address', title: 'Update address', note: 'Post, banks, employer' },
  { id: 'cover', title: 'Check cover', note: 'Contents and liability' },
];

const list = { show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

/* C38 Staggered cards with hover and tap */
function StaggerDemo() {
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

/* C39 Flip card */
function FlipDemo() {
  const [flipped, setFlipped] = useState(false);
  return (
    <button className={`flip${flipped ? ' is-flipped' : ''}`} aria-pressed={flipped} onClick={() => setFlipped((f) => !f)}>
      <span className="flip__inner">
        <span className="flip__face">
          <strong>Contents cover</strong>
          <span>Tap to see the price</span>
        </span>
        <span className="flip__face flip__face--back">
          <strong>From 24 EUR / month</strong>
          <span>Tap to flip back</span>
        </span>
      </span>
    </button>
  );
}

/* C40 Expandable card with layout animation */
function ExpandableDemo() {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((o) => !o);
  return (
    <motion.div
      layout
      className="card expandable"
      role="button"
      tabIndex={0}
      aria-expanded={open}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      }}
    >
      <motion.strong layout>Liability cover explained</motion.strong>
      <AnimatePresence initial={false}>
        {open && (
          <motion.p key="body" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
            Liability covers damage you cause to other people or property, for example to a neighbour's flat during the move.
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* C41 Scroll-snap carousel */
const TIPS = [
  'Photograph every room before the boxes come out.',
  'Forward your mail for at least 3 months.',
  'Read the meter on the day you leave.',
  'Ask movers about their liability option.',
];

function SnapDemo() {
  return (
    <div className="snap" role="region" aria-label="Moving tips">
      {TIPS.map((t) => (
        <article key={t} className="card snap__item" tabIndex={0}>
          {t}
        </article>
      ))}
    </div>
  );
}

/* C42 Spotlight card: a glow follows the pointer */
function SpotlightDemo() {
  return (
    <div
      className="spot"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`);
      }}
    >
      <strong>Move a home, keep the paperwork</strong>
      <span>Move your mouse over this card.</span>
    </div>
  );
}

/* C43 Tilt card */
function TiltDemo() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-60, 60], [8, -8]);
  const rotateY = useTransform(x, [-100, 100], [-8, 8]);
  return (
    <motion.div
      className="tilt"
      style={{ rotateX, rotateY }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - r.left - r.width / 2);
        y.set(e.clientY - r.top - r.height / 2);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      <strong>Plan summary</strong>
      <span>Tilts toward the pointer.</span>
    </motion.div>
  );
}

export function CardsGroup() {
  return (
    <>
      <Demo id="C38" title="Staggered cards with hover and tap" lib="motion variants">
        <StaggerDemo />
      </Demo>
      <Demo id="C39" title="Flip card" lib="plain CSS 3D transform">
        <FlipDemo />
      </Demo>
      <Demo id="C40" title="Expandable card" lib="motion layout + AnimatePresence">
        <ExpandableDemo />
      </Demo>
      <Demo id="C41" title="Scroll-snap carousel" lib="plain CSS scroll-snap">
        <SnapDemo />
      </Demo>
      <Demo id="C42" title="Spotlight card" lib="plain CSS radial gradient + pointer">
        <SpotlightDemo />
      </Demo>
      <Demo id="C43" title="Tilt card" lib="motion useMotionValue + useTransform">
        <TiltDemo />
      </Demo>
    </>
  );
}
