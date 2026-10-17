import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { FormsGroup } from './demos/forms';
import { RiskGroup } from './demos/risk';
import { ChecklistsGroup } from './demos/checklists';
import { CardsGroup } from './demos/cards';
import { FeedbackGroup } from './demos/feedback';
import { MapsGroup } from './demos/maps';
import { DataEntryGroup } from './demos/dataEntry';
import { NavigationGroup } from './demos/navigation';
import { MediaGroup } from './demos/media';
import { MotionGroup } from './demos/motion';
import { DataGroup } from './demos/data';
import { TablesGroup } from './demos/tables';
import { ChartsGroup } from './demos/charts';
import { ExportShareGroup } from './demos/exportShare';

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
        <p>
          Every live example has an ID (C01 to C121) shown in its title. The review checklist is in
          context/componentReview.md.
        </p>
      </header>

      <Section title="A. Forms and inputs (C01 to C17)" note="Form controls, pickers, validation and file input.">
        <FormsGroup />
      </Section>

      <Section title="B. Risk and score visuals (C18 to C30)" note="Rings, gauges, liquid meters, charts and risk badges.">
        <RiskGroup />
      </Section>

      <Section title="C. Checklists and timelines (C31 to C37)" note="Checkmarks, reorderable lists, progress and countdowns.">
        <ChecklistsGroup />
      </Section>

      <Section title="D. Cards (C38 to C43)" note="Card layouts with hover, flip, expand, snap and tilt.">
        <CardsGroup />
      </Section>

      <Section title="E. Feedback and overlays (C44 to C54)" note="Toasts, alerts, dialogs, menus, loading and empty states.">
        <FeedbackGroup />
      </Section>

      <Section title="F. Maps, icons and page motion (C55 to C59)" note="Route preview, icons, tabs, page transitions and scroll effects.">
        <MapsGroup />
      </Section>

      <Section title="G. Forms and data entry (C60 to C66)" note="Phone, masks, number formats, form libraries and validation.">
        <DataEntryGroup />
      </Section>

      <Section title="H. Navigation, overlays and command UI (C67 to C75)" note="Menus, hover cards, popovers, command palette, shortcuts, tour and consent.">
        <NavigationGroup />
      </Section>

      <Section title="I. Media and images (C76 to C81)" note="Lightbox, zoom, video, before and after slider, webcam and lazy images.">
        <MediaGroup />
      </Section>

      <Section title="J. Motion and scroll effects (C82 to C93)" note="Auto-animate, reveals, smooth scroll, scrollytelling, animated text and particles.">
        <MotionGroup />
      </Section>

      <Section title="K. Data, state and i18n (C94 to C101)" note="Query and store, dates, geo maths, translations, error boundaries and hooks.">
        <DataGroup />
      </Section>

      <Section title="L. Tables, lists and layout (C102 to C107)" note="Sortable tables, virtual lists, split panes, tree, kanban and sharing.">
        <TablesGroup />
      </Section>

      <Section title="M. Charts, maps and calendars (C108 to C112)" note="Municipality map, calendar, donut, flow and treemap charts.">
        <ChartsGroup />
      </Section>

      <Section title="N. Export, share and assistant (C113 to C121)" note="PDF, print, image capture, QR, calendar file, Markdown, chat and signature.">
        <ExportShareGroup />
      </Section>
    </main>
  );
}
