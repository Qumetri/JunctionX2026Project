import { useEffect, useRef, useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { TransformComponent, TransformWrapper, useControls } from 'react-zoom-pan-pinch';
import ReactPlayer from 'react-player';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import Webcam from 'react-webcam';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { Demo } from '../components/Demo';
import { Unavailable } from '../components/NoteCard';

/** Drawn illustrations as data URIs, so the media demos do not need network access. */
function illustration(label: string, bg: string, fg: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260">` +
    `<rect width="400" height="260" fill="${bg}"/>` +
    `<path d="M0 200 L120 120 L220 190 L300 130 L400 200 L400 260 L0 260Z" fill="${fg}" opacity=".22"/>` +
    `<text x="200" y="128" font-family="system-ui,sans-serif" font-size="26" font-weight="700" text-anchor="middle" fill="${fg}">${label}</text>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const PHOTOS = [
  { alt: 'Living room, Kallio flat', src: illustration('Living room', '#dbe7ff', '#1557e8') },
  { alt: 'Kitchen, boxes stacked', src: illustration('Kitchen', '#e8f5e9', '#2e7d32') },
  { alt: 'Hallway with the cat carrier', src: illustration('Hallway', '#fff1d6', '#b26a00') },
  { alt: 'Balcony', src: illustration('Balcony', '#f3e5f5', '#7b1fa2') },
];

/* C76 Lightbox (photo viewer with swipe) */
function LightboxDemo() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  return (
    <div className="b3-stack">
      <div className="b3-thumbs">
        {PHOTOS.map((photo, i) => (
          <button
            key={photo.alt}
            type="button"
            className="b3-thumbs__btn"
            onClick={() => {
              setIndex(i);
              setOpen(true);
            }}
            aria-label={`Open photo: ${photo.alt}`}
          >
            <img src={photo.src} alt="" />
          </button>
        ))}
      </div>
      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={index}
        slides={PHOTOS.map((p) => ({ src: p.src, alt: p.alt }))}
      />
    </div>
  );
}

/* C77 Pinch and pan (floor plan with zoom controls) */
function PlanControls() {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="row">
      <button type="button" className="btn" onClick={() => zoomIn()}>
        Zoom in
      </button>
      <button type="button" className="btn" onClick={() => zoomOut()}>
        Zoom out
      </button>
      <button type="button" className="btn" onClick={() => resetTransform()}>
        Reset
      </button>
    </div>
  );
}

function FloorPlan() {
  return (
    <svg
      viewBox="0 0 480 300"
      className="b3-plan"
      role="img"
      aria-label="Apartment floor plan, 72 square metres"
    >
      <rect
        x="10"
        y="10"
        width="460"
        height="280"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
      />
      <line x1="250" y1="10" x2="250" y2="170" stroke="currentColor" strokeWidth="3" />
      <line x1="10" y1="170" x2="250" y2="170" stroke="currentColor" strokeWidth="3" />
      <line x1="250" y1="200" x2="470" y2="200" stroke="currentColor" strokeWidth="3" />
      <path d="M90 10 h40" stroke="var(--surface)" strokeWidth="6" />
      <text x="130" y="95" textAnchor="middle" fontSize="15" fill="currentColor">
        Living room 24 m²
      </text>
      <text x="370" y="110" textAnchor="middle" fontSize="15" fill="currentColor">
        Bedroom 14 m²
      </text>
      <text x="130" y="230" textAnchor="middle" fontSize="15" fill="currentColor">
        Kitchen 12 m²
      </text>
      <text x="370" y="260" textAnchor="middle" fontSize="15" fill="currentColor">
        Bath 6 m²
      </text>
      <rect x="28" y="28" width="22" height="22" fill="#e0402f" />
      <text x="58" y="44" fontSize="13" fill="currentColor">
        Meter cabinet (photo)
      </text>
    </svg>
  );
}

function ZoomDemo() {
  return (
    <div className="b3-zoom">
      <TransformWrapper initialScale={1} minScale={0.6} maxScale={4} centerOnInit>
        <PlanControls />
        <TransformComponent wrapperClass="b3-zoom__wrap" contentClass="b3-zoom__content">
          <FloorPlan />
        </TransformComponent>
      </TransformWrapper>
      <p className="b3-hint">Pinch or drag on touch screens. Scroll wheel zooms on desktop.</p>
    </div>
  );
}

/* C78 React Player (how-to video) */
const HOW_TO_VIDEO = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

function PlayerDemo() {
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // Some blocked or offline media never reports an error, so give up after a while.
    if (ready || failed) return undefined;
    const timer = window.setTimeout(() => setFailed(true), 15000);
    return () => window.clearTimeout(timer);
  }, [ready, failed]);
  if (failed) {
    return (
      <Unavailable>
        The sample video could not load (offline or blocked). The checklist still works without it.
      </Unavailable>
    );
  }
  return (
    <div className="b3-player">
      <ReactPlayer
        src={HOW_TO_VIDEO}
        controls
        width="100%"
        height="100%"
        onReady={() => setReady(true)}
        onError={() => setFailed(true)}
      />
    </div>
  );
}

/* C79 Before and after slider */
function CompareDemo() {
  return (
    <div className="b3-compare">
      <ReactCompareSlider
        itemOne={
          <ReactCompareSliderImage
            src={illustration('Move-in: clean wall', '#e8f5e9', '#2e7d32')}
            alt="Move-in: clean wall"
          />
        }
        itemTwo={
          <ReactCompareSliderImage
            src={illustration('Move-out: scuffed wall', '#fdecea', '#b71c1c')}
            alt="Move-out: scuffed wall"
          />
        }
      />
      <p className="b3-hint">
        Drag the handle. Photos taken at move-in and move-out are the evidence for a deposit
        dispute.
      </p>
    </div>
  );
}

/* C80 Webcam (meter reading photo) */
function WebcamDemo() {
  const camRef = useRef<Webcam | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [shot, setShot] = useState<string | null>(null);

  if (camError) {
    return (
      <div className="b3-stack">
        <Unavailable>
          No camera available ({camError}). Using a sample meter photo instead.
        </Unavailable>
        <img
          className="b3-shot"
          src={illustration('Meter: 04512 kWh', '#fff', '#101a33')}
          alt="Sample meter reading"
        />
      </div>
    );
  }

  return (
    <div className="b3-stack">
      <Webcam
        ref={camRef}
        audio={false}
        width={320}
        screenshotFormat="image/jpeg"
        videoConstraints={{ facingMode: 'environment' }}
        onUserMediaError={(err) =>
          setCamError(err instanceof Error ? err.message : 'permission denied')
        }
        className="b3-webcam"
      />
      <div className="row">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => setShot(camRef.current?.getScreenshot() ?? null)}
        >
          Take meter photo
        </button>
        {shot && (
          <img className="b3-shot" src={shot} alt="Meter reading captured from the camera" />
        )}
      </div>
    </div>
  );
}

/* C81 Lazy-loaded partner logos */
const PARTNER_NAMES = [
  'Quick Movers',
  'Anticimex',
  'Verisure',
  'FirstVet',
  'Van rental',
  'Cleaning crew',
  'Storage unit',
  'Pet sitter',
  'Internet provider',
  'Electricity',
  'Parking permit',
  'Furniture pickup',
];

function LogoDemo() {
  const [loaded, setLoaded] = useState(0);
  return (
    <div className="b3-stack">
      <ul className="b3-logos">
        {PARTNER_NAMES.map((name, i) => (
          <li key={name}>
            <LazyLoadImage
              src={illustration(
                name,
                ['#dbe7ff', '#e8f5e9', '#fff1d6', '#f3e5f5'][i % 4],
                '#101a33',
              )}
              alt={`${name} logo`}
              width="100%"
              height={80}
              effect="opacity"
              afterLoad={() => setLoaded((n) => n + 1)}
            />
          </li>
        ))}
      </ul>
      <p className="b3-hint" role="status">
        Loaded {loaded} of {PARTNER_NAMES.length} logos. Scroll down the page to load the rest.
      </p>
    </div>
  );
}

export function MediaGroup() {
  return (
    <>
      <Demo id="C76" title="Photo lightbox with swipe" lib="yet-another-react-lightbox">
        <LightboxDemo />
      </Demo>
      <Demo id="C77" title="Pinch and pan floor plan" lib="react-zoom-pan-pinch">
        <ZoomDemo />
      </Demo>
      <Demo id="C78" title="How-to video" lib="react-player">
        <PlayerDemo />
      </Demo>
      <Demo id="C79" title="Move-in and move-out photo slider" lib="react-compare-slider">
        <CompareDemo />
      </Demo>
      <Demo id="C80" title="Meter photo from the webcam" lib="react-webcam">
        <WebcamDemo />
      </Demo>
      <Demo id="C81" title="Lazy-loaded partner logos" lib="react-lazy-load-image-component">
        <LogoDemo />
      </Demo>
    </>
  );
}
