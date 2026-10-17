import { useCallback, useEffect, useRef, useState } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { Fade, Slide } from 'react-awesome-reveal';
import { useInView } from 'react-intersection-observer';
import Lenis from 'lenis';
import { Scrollama, Step } from 'react-scrollama';
import { useRive } from '@rive-app/react-canvas';
import { DotLottieReact, setWasmUrl } from '@lottiefiles/dotlottie-react';
import wasmUrl from '../../node_modules/@lottiefiles/dotlottie-web/dist/dotlottie-player.wasm?url';
import Typewriter from 'typewriter-effect';
import { RoughNotation } from 'react-rough-notation';
import ImportedMarquee from 'react-fast-marquee';
import Particles, { ParticlesProvider, useParticlesProvider } from '@tsparticles/react';
import type { Engine } from '@tsparticles/engine';
import { loadSlim } from '@tsparticles/slim';
import { Link, Element } from 'react-scroll';
import { Demo } from '../components/Demo';
import { Unavailable } from '../components/NoteCard';

/* C82 Formkit Auto Animate (list add, remove and reorder) */
const AUTO_TASKS = ['Book movers', 'Notify landlord', 'Order boxes', 'Change address'];

function AutoAnimateDemo() {
  const [parent] = useAutoAnimate<HTMLOListElement>();
  const [tasks, setTasks] = useState(AUTO_TASKS);
  const [counter, setCounter] = useState(1);
  return (
    <div className="b3-stack">
      <div className="row">
        <button
          type="button"
          className="btn"
          onClick={() => {
            setTasks((t) => [...t, `New task ${counter}`]);
            setCounter((c) => c + 1);
          }}
        >
          Add task
        </button>
        <button type="button" className="btn" onClick={() => setTasks((t) => t.slice(0, -1))}>
          Remove last
        </button>
        <button type="button" className="btn" onClick={() => setTasks((t) => [...t].reverse())}>
          Reverse order
        </button>
      </div>
      <ol className="plain-list b3-steps" ref={parent}>
        {tasks.map((task) => (
          <li key={task}>{task}</li>
        ))}
      </ol>
    </div>
  );
}

/* C83 React Awesome Reveal (preset reveals for service cards) */
const SERVICES = [
  { title: 'Moving', text: 'Movers, van, cleaning and the checklist.' },
  { title: 'Pet care', text: 'Papers, vet on call and a pet sitter.' },
  { title: 'Travel', text: 'Trip risk check and cover for the trip.' },
];

function RevealDemo() {
  return (
    <div className="b3-grid-3">
      {SERVICES.map((service, i) => (
        <Slide
          key={service.title}
          direction="up"
          triggerOnce
          delay={i * 120}
          duration={600}
          cascade={false}
        >
          <article className="card b3-service">
            <strong>{service.title}</strong>
            <p className="b3-hint">{service.text}</p>
          </article>
        </Slide>
      ))}
      <Fade triggerOnce className="b3-hint" style={{ gridColumn: '1 / -1' }}>
        Cards animate when they enter the screen. Scroll this demo to see them reveal.
      </Fade>
    </div>
  );
}

/* C84 React Intersection Observer (tips counted as seen) */
const TIPS = [
  'Photograph meter readings before handover.',
  'Ask your landlord for the deposit return date in writing.',
  'Book the elevator for moving day as early as possible.',
  'Keep passports and pet papers in your hand luggage.',
  'Check the travel cover covers your pet in the destination.',
  'Label boxes by room, not by content.',
];

function SeenTip({ text, onSeen }: { text: string; onSeen: (text: string) => void }) {
  const { ref, inView } = useInView({ threshold: 0.8, triggerOnce: true });
  useEffect(() => {
    if (inView) onSeen(text);
  }, [inView, onSeen, text]);
  return (
    <li ref={ref} className={inView ? 'b3-tip is-seen' : 'b3-tip'}>
      {text}
    </li>
  );
}

function InViewDemo() {
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const markSeen = useCallback((text: string) => {
    setSeen((prev) => (prev.has(text) ? prev : new Set(prev).add(text)));
  }, []);
  return (
    <div className="b3-stack">
      <p className="b3-hint" role="status">
        Seen {seen.size} of {TIPS.length} tips
      </p>
      <ul className="b3-tip-box">
        {TIPS.map((tip) => (
          <SeenTip key={tip} text={tip} onSeen={markSeen} />
        ))}
      </ul>
    </div>
  );
}

/* C85 Lenis (smooth scrolling in a long page) */
function LenisDemo() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!wrapper || !content) return undefined;
    const lenis = new Lenis({ wrapper, content, duration: 1.2, autoRaf: true });
    lenisRef.current = lenis;
    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const jump = (id: string) => {
    const target = contentRef.current?.querySelector<HTMLElement>(`#${id}`);
    if (target) lenisRef.current?.scrollTo(target, { offset: -8 });
  };

  return (
    <div className="b3-stack">
      <div className="row">
        <button type="button" className="btn" onClick={() => jump('lenis-before')}>
          Before the move
        </button>
        <button type="button" className="btn" onClick={() => jump('lenis-after')}>
          After the move
        </button>
      </div>
      <div ref={wrapperRef} className="b3-smooth" data-lenis-wrapper="">
        <div ref={contentRef}>
          <section id="lenis-before" className="b3-smooth__section">
            <strong>Before the move</strong>
            <p className="b3-hint">Six weeks out: book movers, order boxes, notify the landlord.</p>
            <p className="b3-hint">Four weeks out: transfer utilities and internet.</p>
          </section>
          <section className="b3-smooth__section">
            <strong>Two weeks out</strong>
            <p className="b3-hint">Confirm the van, parking permit and the elevator booking.</p>
          </section>
          <section className="b3-smooth__section">
            <strong>Moving day</strong>
            <p className="b3-hint">
              Photograph the meters and the empty rooms before the keys go back.
            </p>
          </section>
          <section id="lenis-after" className="b3-smooth__section">
            <strong>After the move</strong>
            <p className="b3-hint">Send the address change, file the deposit claim if needed.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

/* C86 React Scrollama (scrollytelling with a sticky visual) */
const STORY = [
  { title: '1. Book the movers', text: 'Six weeks out. Compare three quotes.', color: '#dbe7ff' },
  { title: '2. Pack by room', text: 'Start with the rooms you use least.', color: '#e8f5e9' },
  { title: '3. Move the pet', text: 'Carrier first, then the car is loaded.', color: '#fff1d6' },
  {
    title: '4. Check the meters',
    text: 'Photos at handover protect your deposit.',
    color: '#f3e5f5',
  },
];

function ScrollytellingDemo() {
  const [active, setActive] = useState(0);
  return (
    <div className="b3-scrolly">
      <div className="b3-scrolly__visual" style={{ background: STORY[active].color }}>
        <strong>{STORY[active].title}</strong>
      </div>
      <div className="b3-scrolly__steps">
        <Scrollama offset={0.5} onStepEnter={({ data }) => setActive(Number(data))}>
          {STORY.map((step, i) => (
            <Step data={i} key={step.title}>
              <div className="b3-scrolly__step">
                <strong>{step.title}</strong>
                <p className="b3-hint">{step.text}</p>
              </div>
            </Step>
          ))}
        </Scrollama>
      </div>
    </div>
  );
}

/* C87 Rive (state-machine animation). Needs a .riv file in public/. Without one, the CSS fallback shows. */
const RIVE_SRC = '/risk-character.riv';

function RiveFallback() {
  return (
    <div className="b3-risk-fallback" aria-label="Risk character (CSS fallback)">
      <span className="b3-risk-fallback__face" />
    </div>
  );
}

function RiveDemo() {
  const [failed, setFailed] = useState(false);
  const { RiveComponent } = useRive({
    src: RIVE_SRC,
    autoplay: true,
    onLoadError: () => setFailed(true),
  });
  return (
    <div className="b3-stack">
      <div className="b3-rive">{failed ? <RiveFallback /> : <RiveComponent />}</div>
      {failed && (
        <Unavailable>
          No Rive file at {RIVE_SRC}. Add a .riv file to public/ to play the character. The CSS
          stand-in is shown.
        </Unavailable>
      )}
    </div>
  );
}

/* C88 dotLottie (local Lottie JSON, no network needed) */
setWasmUrl(wasmUrl);

const PULSE_LOTTIE = {
  v: '5.7.4',
  fr: 30,
  ip: 0,
  op: 60,
  w: 200,
  h: 200,
  nm: 'pulse',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'dot',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [60, 60, 100], i: { x: [0.6], y: [1] }, o: { x: [0.4], y: [0] } },
            { t: 30, s: [100, 100, 100], i: { x: [0.6], y: [1] }, o: { x: [0.4], y: [0] } },
            { t: 60, s: [60, 60, 100] },
          ],
        },
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          it: [
            { ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [80, 80] }, nm: 'ellipse' },
            {
              ty: 'fl',
              c: { a: 0, k: [0.08, 0.46, 0.91, 1] },
              o: { a: 0, k: 100 },
              r: 1,
              nm: 'fill',
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              sk: { a: 0, k: 0 },
              sa: { a: 0, k: 0 },
              nm: 'transform',
            },
          ],
          nm: 'dot shape',
        },
      ],
      ip: 0,
      op: 60,
      st: 0,
      bm: 0,
    },
  ],
};

function LottieDemo() {
  return (
    <div className="b3-lottie-row">
      <div className="b3-lottie">
        <DotLottieReact data={PULSE_LOTTIE} loop autoplay />
      </div>
      <p className="b3-hint">
        Loading state while the partner quote is fetched. The animation is bundled, not downloaded.
      </p>
    </div>
  );
}

/* C89 Typewriter Effect (rotating hero words) */
function TypewriterDemo() {
  return (
    <div className="b3-hero">
      Get ready for{' '}
      <span className="b3-hero__words">
        <Typewriter
          onInit={(tw) => {
            tw.typeString('a move.')
              .pauseFor(1200)
              .deleteAll()
              .typeString('a new pet.')
              .pauseFor(1200)
              .deleteAll()
              .typeString('a trip abroad.')
              .pauseFor(1200)
              .deleteAll()
              .start();
          }}
          options={{ loop: true, delay: 45, deleteSpeed: 25, cursor: '|' }}
        />
      </span>
    </div>
  );
}

/* C90 React Rough Notation (hand-drawn highlight) */
function RoughDemo() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setShow(true), 300);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <div className="b3-stack">
      <div className="b3-hero">
        Your move,{' '}
        <RoughNotation type="highlight" show={show} color="#ffe27a" animationDuration={800}>
          planned in one place
        </RoughNotation>
        , with reminders before each deadline.
      </div>
      <div className="row">
        <button type="button" className="btn" onClick={() => setShow(false)}>
          Hide
        </button>
        <button type="button" className="btn" onClick={() => setShow(true)}>
          Draw again
        </button>
      </div>
    </div>
  );
}

/* C91 React Fast Marquee (partner strip) */
// The package is CommonJS without an __esModule flag, so a default import can arrive wrapped as { default }.
const Marquee = ((ImportedMarquee as unknown as { default?: typeof ImportedMarquee }).default ??
  ImportedMarquee) as typeof ImportedMarquee;

const PARTNER_STRIP = [
  'Verified movers',
  'Anticimex (pest control)',
  'Verisure (alarm)',
  'FirstVet (pets)',
  'Van rental',
  'Storage units',
];

function MarqueeDemo() {
  return (
    <Marquee speed={40} pauseOnHover gradient={false} className="b3-marquee">
      {PARTNER_STRIP.map((name) => (
        <span key={name} className="b3-marquee__item">
          {name}
        </span>
      ))}
    </Marquee>
  );
}

/* C92 tsParticles (subtle background, engine loaded with the slim bundle) */
async function initParticles(engine: Engine): Promise<void> {
  await loadSlim(engine);
}

function ParticlesInner() {
  const { loaded } = useParticlesProvider();
  return (
    <div className="b3-particles">
      {loaded && (
        <Particles
          id="b3-particles"
          className="b3-particles__canvas"
          options={{
            background: { color: { value: 'transparent' } },
            fpsLimit: 30,
            particles: {
              number: { value: 28, density: { enable: true } },
              color: { value: '#6d97ff' },
              opacity: { value: 0.35 },
              size: { value: { min: 1, max: 3 } },
              move: { enable: true, speed: 0.6 },
              links: { enable: true, distance: 120, color: '#6d97ff', opacity: 0.2 },
            },
          }}
        />
      )}
      <p className="b3-particles__text">Plan the move without the paperwork chase.</p>
    </div>
  );
}

function ParticlesDemo() {
  return (
    <ParticlesProvider init={initParticles}>
      <ParticlesInner />
    </ParticlesProvider>
  );
}

/* C93 React Scroll (smooth in-page anchors inside a scroll box) */
const SCROLL_BOX_ID = 'b3-scrollbox-93';

function ScrollLinksDemo() {
  return (
    <div className="b3-stack">
      <nav className="row" aria-label="Plan sections">
        <Link containerId={SCROLL_BOX_ID} to="b3-checklist" smooth duration={400} className="btn">
          Checklist
        </Link>
        <Link containerId={SCROLL_BOX_ID} to="b3-benefits" smooth duration={400} className="btn">
          Member benefits
        </Link>
      </nav>
      <div id={SCROLL_BOX_ID} className="b3-scrollbox">
        <Element name="b3-checklist" className="b3-scrollbox__section">
          <strong>Checklist</strong>
          <p className="b3-hint">Eighteen tasks, sorted by the weeks before the move.</p>
        </Element>
        <div className="b3-scrollbox__filler" />
        <Element name="b3-benefits" className="b3-scrollbox__section">
          <strong>Member benefits</strong>
          <p className="b3-hint">
            Discounted movers, pet papers and a 30-day travel cover extension.
          </p>
        </Element>
      </div>
    </div>
  );
}

export function MotionGroup() {
  return (
    <>
      <Demo id="C82" title="Animated list changes" lib="@formkit/auto-animate">
        <AutoAnimateDemo />
      </Demo>
      <Demo id="C83" title="Preset reveals for service cards" lib="react-awesome-reveal">
        <RevealDemo />
      </Demo>
      <Demo id="C84" title="Tips seen while scrolling" lib="react-intersection-observer">
        <InViewDemo />
      </Demo>
      <Demo id="C85" title="Smooth scroll with anchors" lib="lenis">
        <LenisDemo />
      </Demo>
      <Demo id="C86" title="Scrollytelling: how a move goes" lib="react-scrollama">
        <ScrollytellingDemo />
      </Demo>
      <Demo id="C87" title="Risk character (state machine)" lib="@rive-app/react-canvas">
        <RiveDemo />
      </Demo>
      <Demo id="C88" title="Loading animation" lib="@lottiefiles/dotlottie-react">
        <LottieDemo />
      </Demo>
      <Demo id="C89" title="Rotating hero words" lib="typewriter-effect">
        <TypewriterDemo />
      </Demo>
      <Demo id="C90" title="Hand-drawn highlight" lib="react-rough-notation">
        <RoughDemo />
      </Demo>
      <Demo id="C91" title="Partner marquee" lib="react-fast-marquee">
        <MarqueeDemo />
      </Demo>
      <Demo id="C92" title="Hero particles" lib="@tsparticles/react + @tsparticles/slim">
        <ParticlesDemo />
      </Demo>
      <Demo id="C93" title="Scroll to in-page sections" lib="react-scroll">
        <ScrollLinksDemo />
      </Demo>
    </>
  );
}
