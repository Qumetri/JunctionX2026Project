import { useRef, useState } from 'react';
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from 'motion/react';
import {
  Button,
  Input,
  Label,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Tag,
  TagGroup,
  TagList,
  Text,
} from 'react-aria-components';

/* Stepper / wizard: plain state + CSS. */
const STEPS = ['Dates', 'Home', 'Movers', 'Confirm'];

export function Stepper() {
  const [step, setStep] = useState(0);
  return (
    <>
      <ol className="stepper" aria-label="Move setup steps">
        {STEPS.map((name, i) => (
          <li
            key={name}
            className={i < step ? 'is-done' : i === step ? 'is-current' : undefined}
            aria-current={i === step ? 'step' : undefined}
          >
            <span className="stepper__dot">{i < step ? '✓' : i + 1}</span>
            {name}
          </li>
        ))}
      </ol>
      <div className="row">
        <button className="btn" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Back
        </button>
        <button
          className="btn btn--primary"
          disabled={step === STEPS.length}
          onClick={() => setStep((s) => s + 1)}
        >
          {step === STEPS.length - 1 ? 'Finish' : step === STEPS.length ? 'Done' : 'Next'}
        </button>
      </div>
    </>
  );
}

/* Timeline: vertical list that staggers in. */
const EVENTS = [
  { when: '8 weeks before', what: 'Tell the insurer about the new address' },
  { when: '4 weeks before', what: 'Book movers and compare quotes' },
  { when: '1 week before', what: 'Switch electricity and internet' },
  { when: 'Moving day', what: 'Photograph rooms before boxes come out' },
];

export function Timeline() {
  return (
    <motion.ol
      className="timeline"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.15 } } }}
    >
      {EVENTS.map((e) => (
        <motion.li
          key={e.when}
          variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
        >
          <strong>{e.when}</strong>
          <span>{e.what}</span>
        </motion.li>
      ))}
    </motion.ol>
  );
}

/* Animated tabs: react-aria Tabs (keyboard and a11y) with a motion layoutId pill. */
const TABS = ['Overview', 'Checklist', 'Coverage'];

export function AnimatedTabs() {
  return (
    <Tabs className="tabs">
      <TabList aria-label="Plan views" className="tabs__list">
        {TABS.map((name) => (
          <Tab key={name} id={name} className="tabs__tab">
            {({ isSelected }) => (
              <>
                {isSelected && (
                  <motion.span
                    layoutId="tab-pill"
                    className="tabs__pill"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="tabs__label">{name}</span>
              </>
            )}
          </Tab>
        ))}
      </TabList>
      {TABS.map((name) => (
        <TabPanel key={name} id={name} className="tabs__panel">
          {name} content goes here.
        </TabPanel>
      ))}
    </Tabs>
  );
}

/* Tag / chip input: react-aria TagGroup for the chips, a text field to add. */
type TagItem = { id: string; name: string };

export function TagInput() {
  const [tags, setTags] = useState<TagItem[]>([{ id: 'pets', name: 'Pets' }]);
  const [draft, setDraft] = useState('');
  const add = () => {
    const name = draft.trim();
    if (!name) return;
    setTags((t) => [...t, { id: `${name}-${Date.now()}`, name }]);
    setDraft('');
  };
  return (
    <div className="field">
      <TagGroup
        aria-label="Household"
        onRemove={(keys) => setTags((t) => t.filter((x) => !keys.has(x.id)))}
      >
        <Label className="field__label">Who is moving with you?</Label>
        <TagList items={tags} className="tag-list">
          {(item) => (
            <Tag id={item.id} textValue={item.name} className="tag">
              {item.name}
              <Button slot="remove" aria-label={`Remove ${item.name}`} className="tag__remove">
                ×
              </Button>
            </Tag>
          )}
        </TagList>
      </TagGroup>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a name and press Enter"
          className="tag-input"
          aria-label="Add tag"
        />
        <Button type="submit" className="btn">
          Add
        </Button>
      </form>
      <Text slot="description" className="field__label">
        Focus a tag and press Delete to remove it.
      </Text>
    </div>
  );
}

/* Rating: plain buttons, keyboard via Tab + Enter/Space. */
export function Rating() {
  const [score, setScore] = useState(3);
  return (
    <div className="row">
      <div role="group" aria-label="Rating" className="stars">
        {[1, 2, 3, 4, 5].map((n) => (
          <motion.button
            key={n}
            type="button"
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            aria-pressed={n <= score}
            className={n <= score ? 'star is-on' : 'star'}
            whileTap={{ scale: 0.8 }}
            onClick={() => setScore(n)}
          >
            ★
          </motion.button>
        ))}
      </div>
      <span>{score} of 5</span>
    </div>
  );
}

/* Page transitions: AnimatePresence swaps two views. */
export function PageTransition() {
  const [view, setView] = useState<'a' | 'b'>('a');
  return (
    <>
      <div className="row" style={{ overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
            className="card"
            style={{ flex: 1 }}
          >
            <strong>{view === 'a' ? 'Step A: pick a home' : 'Step B: book movers'}</strong>
            <span>Slides and fades between views.</span>
          </motion.div>
        </AnimatePresence>
      </div>
      <button className="btn" onClick={() => setView((v) => (v === 'a' ? 'b' : 'a'))}>
        Switch view
      </button>
    </>
  );
}

/* Scroll-driven: progress bar and parallax tied to a scroll container. */
export function ScrollEffects() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: ref });
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  const shift = useTransform(scrollYProgress, [0, 1], [0, -60]);
  return (
    <div className="scroll-box" ref={ref}>
      <motion.div className="scroll-box__bar" style={{ scaleX, transformOrigin: '0 50%' }} />
      <motion.div className="scroll-box__hero" style={{ y: shift }}>
        Scroll inside this box
      </motion.div>
      {Array.from({ length: 8 }, (_, i) => (
        <p key={i} className="scroll-box__para">
          Paragraph {i + 1}. The bar and hero respond to scroll position.
        </p>
      ))}
    </div>
  );
}
