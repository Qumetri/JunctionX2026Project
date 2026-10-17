import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { LiquidDemo } from './demos/Liquid';
import { Icons, FileDrop, RouteMap, Skeleton, Toasts } from './demos/Feedback';
import {
  AnimatedTabs,
  PageTransition,
  Rating,
  ScrollEffects,
  Stepper,
  TagInput,
  Timeline,
} from './demos/Flow';
import { FormFields } from './demos/FormFields';
import { Progress } from './demos/Progress';
import { Confetti, Motion } from './demos/Motion';
import { Overlays } from './demos/Overlays';

type SectionProps = { title: string; note: string; children: ReactNode };

function Section({ title, note, children }: SectionProps) {
  return (
    <section className="section">
      <h2>{title}</h2>
      <p className="section__note">{note}</p>
      {children}
    </section>
  );
}

export default function App() {
  return (
    <main className="page">
      <Toaster richColors />
      <header>
        <h1>Life Moments component demo</h1>
        <p>One live example per category from context/reactComponents.md.</p>
      </header>

      <Section
        title="1. Form fields with leading icons"
        note="react-aria-components for date, select, number and switch. Downshift plus Photon for location autocomplete."
      >
        <FormFields />
      </Section>

      <Section
        title="2. Donut, half-circle gauge, segmented bar"
        note="Ring is plain SVG. Gauge is react-gauge-component. Segments are plain CSS."
      >
        <Progress />
      </Section>

      <Section
        title="3. Liquid / water-wave progress"
        note="Our own LiquidMeter, copied from the main app. Drag the slider to change the value."
      >
        <LiquidDemo />
      </Section>

      <Section
        title="4 to 5. Checkmarks, micro-interactions, count-up"
        note="Checkmark is plain SVG and CSS. Stagger and hover use motion. Count-up uses @number-flow/react."
      >
        <Motion />
      </Section>

      <Section
        title="6. Bottom sheet, tooltip, accordion"
        note="vaul for the sheet. react-aria-components for tooltip and accordion."
      >
        <Overlays />
      </Section>

      <Section title="7. Confetti" note="canvas-confetti, one call on click.">
        <Confetti />
      </Section>

      <Section title="8. More components and animations" note="Added beyond the original list. Each is a live example.">
        <div className="demo">
          <p className="demo__title">Toast</p>
          <p className="demo__lib">sonner</p>
          <Toasts />
        </div>
        <div className="demo">
          <p className="demo__title">Skeleton loader</p>
          <p className="demo__lib">plain CSS shimmer</p>
          <Skeleton />
        </div>
        <div className="demo">
          <p className="demo__title">Stepper / wizard</p>
          <p className="demo__lib">plain state + CSS</p>
          <Stepper />
        </div>
        <div className="demo">
          <p className="demo__title">Timeline</p>
          <p className="demo__lib">motion stagger</p>
          <Timeline />
        </div>
        <div className="demo">
          <p className="demo__title">Animated tabs</p>
          <p className="demo__lib">react-aria-components Tabs + motion layoutId</p>
          <AnimatedTabs />
        </div>
        <div className="demo">
          <p className="demo__title">Tag / chip input</p>
          <p className="demo__lib">react-aria-components TagGroup</p>
          <TagInput />
        </div>
        <div className="demo">
          <p className="demo__title">Rating</p>
          <p className="demo__lib">plain buttons + motion tap</p>
          <Rating />
        </div>
        <div className="demo">
          <p className="demo__title">File drop</p>
          <p className="demo__lib">react-dropzone</p>
          <FileDrop />
        </div>
        <div className="demo">
          <p className="demo__title">Route / map preview</p>
          <p className="demo__lib">leaflet (BSD-2), OSM tiles need network</p>
          <RouteMap />
        </div>
        <div className="demo">
          <p className="demo__title">Icon set</p>
          <p className="demo__lib">lucide-react</p>
          <Icons />
        </div>
        <div className="demo">
          <p className="demo__title">Page transition</p>
          <p className="demo__lib">motion AnimatePresence</p>
          <PageTransition />
        </div>
        <div className="demo">
          <p className="demo__title">Scroll-driven effects</p>
          <p className="demo__lib">motion useScroll + useTransform</p>
          <ScrollEffects />
        </div>
      </Section>
    </main>
  );
}
