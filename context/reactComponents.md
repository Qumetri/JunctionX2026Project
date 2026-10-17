# Ready-made React components and animations for Life Moments

Target stack: React 19, TypeScript, Vite, plain CSS (no Tailwind yet).

Checked on 2026-10-17 with `npm view` (version, license, peer dependencies, last publish date). Sizes are `dist.unpackedSize` from npm, which is unminified and not gzipped, so treat them as upper bounds. Gzipped bundle sizes were not measured.

Recommendation rule: prefer zero-dependency plain SVG/CSS where the piece is simple, and use one accessible headless library (react-aria-components) for form controls and overlays so we do not hand-roll keyboard and a11y behaviour.

---

## 1. Form fields with leading icons

### 1a. Date, date-range, number, select, toggle (recommended: react-aria-components)

- **Name:** react-aria-components (Adobe React Aria, headless and accessible)
- **Link:** https://react-spectrum.adobe.com/react-aria/components.html
- **License:** Apache-2.0
- **Size:** about 7 MB unpacked (tree-shakes well; only imported components ship)
- **React 19:** yes. Peer `react ^19.0.0-rc` and newer. Last publish 2026-10-09 (v1.22.1).
- **Good for:** `DatePicker`, `DateRangePicker`, `NumberField`, `Select`, `Switch`, `ComboBox`, `Tooltip`, `Modal`, `Popover`, `Disclosure`. Each component comes with keyboard, screen reader, and locale support. Styling is plain CSS through `className` or `data-*` attributes, so it fits our no-Tailwind setup. Leading icons go in a wrapper `<div>` around the field.
- **Snippet:**

```tsx
import { DateRangePicker, Dialog, Group, Label, Popover, Button, Calendar, RangeCalendar, DateInput, DateSegment, I18nProvider } from 'react-aria-components';
import { CalendarIcon } from './icons';

<DateRangePicker className="field" startName="from" endName="to">
  <Label>Move dates</Label>
  <Group className="field__control">
    <span className="field__icon"><CalendarIcon /></span>
    <DateInput slot="start">{(s) => <DateSegment segment={s} />}</DateInput>
    <span>–</span>
    <DateInput slot="end">{(s) => <DateSegment segment={s} />}</DateInput>
    <Button>▾</Button>
  </Group>
  <Popover><Dialog><RangeCalendar><Calendar /></RangeCalendar></Dialog></Popover>
</DateRangePicker>
```

Simpler single-date and select/number fields follow the same pattern (`DatePicker`, `Select`, `NumberField`, `Switch`).

### 1b. Calendar grid only (alternative: react-day-picker)

- **Link:** https://daypicker.dev
- **License:** MIT
- **Size:** about 1 MB unpacked
- **React 19:** yes. Peer `react >=16.8`. v10.0.2, last publish 2026-09-30.
- **Good for:** a styled calendar if we want custom markup and our own input. Use it when react-aria's date components are too heavy for a specific design. Headless enough to skin with CSS.

### 1c. Select with search, multi-select (alternative: react-select)

- **Link:** https://react-select.com
- **License:** MIT
- **Size:** about 0.4 MB unpacked
- **React 19:** yes. Peer includes `^19.0.0`. v5.10.2, but last publish 2025-07, so it is maintained more slowly than the others.
- **Good for:** searchable selects and async options. Use it only if we need a pre-built, very feature-rich select.

### 1d. Location / address autocomplete

There is no good drop-in package here that is both maintained and free of API keys. Two options:

**Option A (recommended for the prototype): Downshift combobox + OSM geocoder (Photon).**

- **Downshift:** https://github.com/downshift-js/downshift. License MIT. v9.4.0, last publish 2026-06-30. Peer `react >=16.12.0`, so React 19 is fine. Headless combobox hooks; we style the input ourselves.
- **Data:** Photon (https://photon.komoot.io) is a free OpenStreetMap geocoder with no key. Its usage policy limits heavy use, so keep to a debounced fetch for a demo. Check the policy before production.
- **Snippet:**

```tsx
import { useCombobox } from 'downshift';
const [items, setItems] = useState<string[]>([]);
const { isOpen, getInputProps, getMenuProps, getItemProps, highlightedIndex } = useCombobox({
  items,
  onInputValueChange: async ({ inputValue }) => {
    if (!inputValue || inputValue.length < 3) return setItems([]);
    const r = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(inputValue)}&limit=5`);
    const json = await r.json();
    setItems(json.features.map((f: any) => f.properties.name));
  },
});
```

**Option B (if we want Google-quality results): @vis.gl/react-google-maps.**

- **Link:** https://visgl.github.io/react-google-maps/
- **License:** MIT. v1.10.1. Peer `react >=16.8 || ^19`, so React 19 is supported.
- **Size:** about 1.5 MB unpacked.
- **Good for:** the Places Autocomplete hook. It needs a Google Maps API key and billing enabled, which is a risk for a hackathon demo.
- **Also seen:** `use-places-autocomplete` (MIT, peer `react >=16.8`). It is still installable, but its last publish is 2023-08, so treat it as stale.

---

## 2. Donut / ring, half-circle gauge, segmented bar

### 2a. Donut / ring progress (recommended: plain SVG, zero dependencies)

A ring is an SVG `<circle>` with `stroke-dasharray` and `stroke-dashoffset`. It is about 20 lines of code, has no dependency, and is easy to animate with CSS transitions. Use this for our own design.

```tsx
export function Ring({ value, size = 120, stroke = 12 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${value}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent)" strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 800ms ease' }}
      />
    </svg>
  );
}
```

Alternative: **react-circular-progressbar**. MIT, v2.2.0, peer `react >=0.14`, last publish 2025-02. It has no React 19 issues, but it is small enough that writing our own is simpler.

### 2b. Half-circle gauge (recommended: react-gauge-component)

- **Link:** https://github.com/antoniolanza1996/react-gauge-component
- **License:** MIT
- **Size:** about 0.8 MB unpacked
- **React 19:** yes. Peer `^19.x`. v2.0.29, last publish 2026-04.
- **Good for:** a gauge with colour sub-arcs, labels, and animation, for example a "risk level" meter. It is a complete chart, so it is heavier than the ring above, but it covers the arc, the needle, and the sub-ranges.
- **Snippet:**

```tsx
import GaugeComponent from 'react-gauge-component';
<GaugeComponent
  type="semicircle"
  value={62}
  minValue={0}
  maxValue={100}
  arc={{ subArcs: [{ limit: 33, color: '#2ecc71' }, { limit: 66, color: '#f1c40f' }, { color: '#e74c3c' }] }}
  labels={{ valueLabel: { formatTextValue: (v) => `${v}%` } }}
/>
```

If we want a simpler look, the same SVG ring trick works with a `Math.PI` arc instead of a full circle.

### 2c. Segmented progress bar (plain CSS)

Use a flex row of `<span>` segments with `background` set to `--accent` when the index is below the current step. A transition on `background-color` gives the fill effect. No dependency needed.

---

## 3. Liquid / water-wave progress (alternatives and inspiration)

We already have our own, so these are for reference. I did not find a maintained, React 19 ready "liquid fill" package that I would trust for a hackathon. The closest verified options are:

- **react-wavify** (MIT, v1.12.0, last publish 2026-06). It is a wave-shaped SVG animation (about 16 kB unpacked), good for a decorative wave header or a wave behind a card. It is not a fill-level gauge. Peer `react >=15`, so React 19 works in practice, but the declared peer range is old.
- **Pattern for inspiration:** a clipped SVG path with two `<path>` waves animated via CSS `translateX` keyframes, with `overflow: hidden` on a circle or rounded rectangle. Our own version can use the same approach. Search CodePen for "CSS liquid progress" or "SVG wave fill" for examples; I did not verify specific pens in this pass.

---

## 4. Checklist with animated checkmarks

- **Recommended: plain SVG + CSS.** Draw the tick with a path and animate `stroke-dashoffset` from the path length to 0 on the `checked` state. About 15 lines, no dependency.

```css
.tick path { stroke-dasharray: 24; stroke-dashoffset: 24; transition: stroke-dashoffset 300ms ease; }
.tick.done path { stroke-dashoffset: 0; }
```

- **Alternative: motion** (see section 5). Use `motion.path` with `pathLength` animation when we already import it.

---

## 5. Cards with micro-interactions, count-up, staggered reveal

### 5a. Motion (recommended for micro-interactions and stagger)

- **Link:** https://motion.dev (formerly framer-motion)
- **License:** MIT
- **Size:** about 0.8 MB unpacked for the full package. Using the `motion/react` entry with `LazyMotion` keeps the bundle smaller.
- **React 19:** yes. Peer `^18 || ^19`. v14.3.0.
- **Good for:** hover and press (`whileHover`, `whileTap`), staggered reveal (`variants` with `staggerChildren`), layout animations, and animated checkmarks. One library covers all three.
- **Snippet:**

```tsx
import { motion } from 'motion/react';
const list = { show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

<motion.ul variants={list} initial="hidden" animate="show">
  {cards.map((c) => (
    <motion.li key={c.id} variants={item} whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
      {c.title}
    </motion.li>
  ))}
</motion.ul>
```

### 5b. Number count-up (recommended: @number-flow/react)

- **Link:** https://number-flow.barvian.me
- **License:** MIT
- **Size:** about 25 kB unpacked
- **React 19:** yes. Peer `^18 || ^19`. v0.6.2, last publish 2026-07.
- **Good for:** animated digit changes (numbers rolling to their new value), which reads better than a plain count-up for "X of Y tasks done" or a percentage.
- **Snippet:**

```tsx
import NumberFlow from '@number-flow/react';
<NumberFlow value={progress} suffix="%" />
```

Alternative: **react-countup** (MIT, v6.5.3, peer `>=16.3`). It works, but its last publish was 2024-11, so it is less active.

---

## 6. Bottom sheet, tooltip, accordion

### 6a. Bottom sheet / drawer (recommended: vaul)

- **Link:** https://vaul.emilkowal.ski
- **License:** MIT
- **Size:** about 0.2 MB unpacked
- **React 19:** yes. Peer includes `^19.0.0`. v1.1.2, but last publish 2024-12, so it is stable rather than actively developed.
- **Good for:** a mobile-style drag-to-dismiss sheet, which suits the phone-width layout.
- **Snippet:**

```tsx
import { Drawer } from 'vaul';
<Drawer.Root>
  <Drawer.Trigger>Open plan</Drawer.Trigger>
  <Drawer.Portal>
    <Drawer.Overlay />
    <Drawer.Content>
      <Drawer.Title>Moving checklist</Drawer.Title>
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
```

Alternative: a `Modal` from react-aria-components with CSS to slide from the bottom. No extra dependency, and it gives proper focus handling.

### 6b. Tooltip (recommended: react-aria-components Tooltip, or Radix)

- **Radix Tooltip:** `@radix-ui/react-tooltip`. MIT, v1.4.1, peers include `^19.0`. Use it if we already use other Radix primitives.
- **react-aria-components `Tooltip`:** Apache-2.0, already recommended in section 1, so this is the default choice to avoid a second library.

### 6c. Accordion (recommended: react-aria-components Disclosure, or Radix)

- **Radix Accordion:** `@radix-ui/react-accordion`. MIT, v1.3.1, peers include `^19.0`. Handles multiple and single open modes and keyboard use.
- **react-aria-components `Disclosure` / `DisclosureGroup`:** same license and dependency as section 1. Recommended to keep one set of primitives.

---

## 7. Confetti / success burst

### Recommended: canvas-confetti

- **Link:** https://github.com/catdad/canvas-confetti
- **License:** ISC (permissive, like MIT)
- **Size:** about 92 kB unpacked
- **React 19:** not a React package, so no peer dependency. Works with any framework. v1.9.4, last publish 2025-10.
- **Good for:** a one-call burst when a checklist item or the whole plan is completed.
- **Snippet:**

```ts
import confetti from 'canvas-confetti';
confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
```

Alternative: **react-confetti** (MIT, v6.4.0, peer `^19.0.0`, last publish 2025-03). It is a full-window component, which suits a one-off celebration screen but is heavier to add for a single burst.

---

## Recommended picks at a glance

| Category | Pick | License | React 19 | Why |
| --- | --- | --- | --- | --- |
| Date, date-range, number, select, toggle | react-aria-components | Apache-2.0 | Yes | Accessible headless controls, plain CSS styling |
| Calendar grid (only if needed) | react-day-picker | MIT | Yes | Light, skinnable |
| Location autocomplete | Downshift + Photon (OSM) | MIT | Yes | No API key for the demo |
| Donut / ring | Plain SVG | n/a | n/a | No dependency, about 20 lines |
| Half-circle gauge | react-gauge-component | MIT | Yes | Complete gauge with colour arcs |
| Segmented bar | Plain CSS | n/a | n/a | Trivial |
| Liquid / wave | Own SVG + CSS (react-wavify for decoration) | MIT | Yes (declared peer is old) | No trustworthy liquid-fill package found |
| Checkmark | Plain SVG + CSS stroke animation | n/a | n/a | No dependency |
| Micro-interactions, stagger | motion | MIT | Yes | One library for hover, tap, stagger |
| Count-up | @number-flow/react | MIT | Yes | Digit roll, small |
| Bottom sheet | vaul | MIT | Yes | Mobile drag sheet |
| Tooltip, accordion | react-aria-components | Apache-2.0 | Yes | Same family as the form controls |
| Confetti | canvas-confetti | ISC | n/a (no React peer) | Single call, small |

## Notes

- Recommended new dependencies for the prototype: `react-aria-components`, `motion`, `@number-flow/react`, `vaul`, `canvas-confetti`, `downshift`, `react-gauge-component`. Everything else is plain SVG and CSS.
- Stale-ish but still usable: `react-select` (last publish 2025-07), `vaul` (2024-12), `react-countup` (2024-11), `react-circular-progressbar` (2025-02).
- Sizes are unminified npm unpacked sizes, not gzipped bundle sizes. A bundle check after install is the reliable measure.
- Not verified in this pass: specific CodePen/GitHub liquid-fill snippets, and live demos. The liquid category has no confirmed drop-in package.

---

## 8. Additional components and animations (added 2026-10-17)

Checked with `npm view` on 2026-10-17. Live examples for each are in `component-demo/` (section 8, plus the liquid variants in section 3).

Libraries added to the demo:

- **sonner** (toast). MIT, v2.0.8, last publish 2026-08-09. Peer `react ^18 || ^19`. Use for success, error and action toasts. Live example: `component-demo/src/demos/Feedback.tsx`.
- **react-dropzone** (file drop). MIT, v20.1.4, last publish 2026-10-17. Peer `react >=18`. Hook-based drag-and-drop with MIME accept rules. Example: `demos/Feedback.tsx`.
- **lucide-react** (icon set). ISC, v1.59.0, last publish 2026-10-17. Peer `react ^16.5.1 || ^17 || ^18 || ^19`. Named imports tree-shake, so the unpacked size (about 36 MB) overstates what ships. Example: `demos/Feedback.tsx`.
- **leaflet** (route / map preview). BSD-2-Clause, v1.9.4, last publish 2025-08. No React peer. Used directly in a `useEffect`, so no React wrapper is needed. Tiles come from OpenStreetMap and need network. Example: `demos/Feedback.tsx`.
- **react-aria-components** (animated tabs, tag input). Already a dependency from section 1. Uses the `Tabs` and `TagGroup` components, which bring keyboard support and screen-reader support.
- **motion** (page transitions, timeline stagger, scroll-driven effects). Already a dependency from section 5. Uses `AnimatePresence`, `layoutId`, `useScroll` and `useTransform`. No new package needed.

Built with plain CSS or state (no dependency):

- **Stepper / wizard**: an ordered list with a current step, plus Back and Next controls.
- **Timeline**: a vertical list with a staggered entrance.
- **Skeleton loader**: a CSS gradient shimmer. The `react-loading-skeleton` package (MIT, v3.5.0, last publish 2024-09) would also work, but it is stale and not needed for one shimmer.
- **Rating**: `aria-pressed` star buttons with a tap animation. The `react-rating-stars-component` package was rejected: last publish 2022-05.

Considered and rejected:

- **react-leaflet** v5.0.0. Its license is Hippocratic-2.1, which is not a standard permissive license. Use leaflet directly instead.
- **react-tag-autocomplete** v7.5.1 (ISC, last publish 2025-08, peer `react ^18 || ^19`). Viable if the tag input needs suggestions. Not used in the demo, which uses the plain react-aria TagGroup.
- **Illustrations**: no maintained, permissive illustration package was verified in this pass. Not demoed.

Liquid components (section 3 of the demo):

- `LiquidMeter` (bar) and `LiquidRing` (ring) are both shown in `risk` and `progress` variants. Source: `src/components/LiquidMeter.tsx`, `LiquidRing.tsx`, `liquidColor.ts` and their CSS files.

---

## 9. Round 3: more components (IDs C10 to C59)

Round 3 added 30 live examples to `component-demo/`, so the demo now has 59 components. Each one has an ID shown on the page, and the full list is in `context/componentReview.md`.

No new npm packages were added in this round. Every new piece uses one of these:

- **Already installed**: react-aria-components (checkbox, radio, slider, toggle group, combobox, modal, menu), motion (drag, layout, pathLength, useMotionValue, Reorder), @number-flow/react, lucide-react, sonner, vaul, react-dropzone, leaflet.
- **Plain CSS or SVG** (no dependency): OTP input, password strength meter, risk meter, radar chart, sparkline, stacked donut, bar chart, traffic-light badge, heatmap, countdown, journey path, flip card, scroll-snap carousel, spotlight card, inline alert, spinner, empty state.

Both liquid components are in the demo: `LiquidMeter` (C21) and `LiquidRing` (C22), each in the `risk` and `progress` variants.

Round 3 list:

| ID | Component | Source | Life-event use |
| --- | --- | --- | --- |
| C10 | OTP code input | plain inputs with auto-advance | Verify a phone or email code at signup |
| C11 | Password strength meter | plain CSS segments | Account creation |
| C12 | Checkbox group with select-all | react-aria-components | Choose documents to bring |
| C13 | Radio option cards | react-aria-components RadioGroup | Pick transport or a plan tier |
| C14 | Budget range slider | react-aria-components Slider | Set a moving budget |
| C15 | Segmented control | react-aria-components ToggleButtonGroup | Switch between two or three views |
| C16 | Searchable combobox | react-aria-components ComboBox | Choose a country or city |
| C17 | Validated text field | plain input, validation on blur | Enter an email for reminders |
| C24 | Risk meter with marker | plain CSS gradient | Show a score on a low-to-high scale |
| C25 | Radar chart | plain SVG, motion morphs the path | Compare coverage before and after |
| C26 | Sparkline with draw-in | plain SVG, motion pathLength | Trend over time |
| C27 | Stacked donut breakdown | plain SVG, stroke-dasharray | Premium or cost split |
| C28 | Animated bar chart | motion height | Tasks completed per month |
| C29 | Traffic-light risk badge | plain CSS | Low, medium or high risk label |
| C30 | Calendar heatmap | plain CSS grid | Busy days before the move |
| C33 | Drag-to-reorder list | motion Reorder | Reorder move tasks by priority |
| C34 | Swipe-to-complete row | motion drag | Mark a task done on mobile |
| C35 | Grouped checklist with progress | plain CSS + motion width | Tasks grouped by phase |
| C36 | Countdown to move date | plain JS timer | Days left until the move |
| C37 | Journey path | plain SVG + motion pathLength | Show progress along the plan |
| C39 | Flip card | plain CSS 3D | Reveal a price or detail |
| C40 | Expandable card | motion layout | Show coverage details on demand |
| C41 | Scroll-snap carousel | plain CSS scroll-snap | Browse tips or offers |
| C42 | Spotlight card | plain CSS + pointer | Highlight a card on hover |
| C43 | Tilt card | motion useMotionValue | Plan summary card |
| C46 | Inline alert with dismiss | motion AnimatePresence | Quote expiring soon |
| C50 | Modal dialog (confirm) | react-aria-components Modal | Confirm cancelling a plan |
| C51 | Menu / dropdown | react-aria-components Menu | Plan actions |
| C52 | Spinner and indeterminate bar | plain CSS | Loading quotes |
| C53 | Empty state with call to action | plain SVG + CSS | No tasks yet |

---

## 10. Batch 3: 62 new packages (IDs C60 to C121)

Checked on 2026-10-17 with `npm view` only. Nothing was installed and no code was changed.

What the Design PNGs need that batches 1 to 9 do not cover: a desktop nav with dropdowns (home page), masked and formatted inputs (Moving from/to, Moving date, Home size, Destination, Travel dates), a phone number for reminders, a membership card with an avatar, a partner logo strip, a risk-report summary that can be printed or saved as PDF, a Finnish municipality map, and a move-task calendar.

Columns:
- **npm package**: exact name for `npm install`.
- **Size**: `dist.unpackedSize` from npm. Unminified and not gzipped, so an upper bound.
- **React 19**: `Yes` means the peer range lists React 19. `Likely` means an open lower bound (`>=`) and a recent publish, but not tested. `Unverified` means the package is stale (2024 or older), the peer range stops at 18 or below, or the license is missing. `n/a` means it has no React dependency.
- **Docs**: the npm `homepage` field, or the project site where the field is empty.

Licence is MIT unless the table says otherwise. Flagged rows are marked in the Name column.

### 10a. Forms and data entry

| ID | Name | npm package | Use in this app | License | Size | React 19 | Last publish | Docs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C60 | React Phone Number Input | `react-phone-number-input` | Phone field with country code (Finland as default) for reminder SMS | MIT | ~10.5 MB (mostly metadata, tree-shakes) | Likely (`>=16.8`) | 2026-08 | https://gitlab.com/catamphetamine/react-phone-number-input |
| C61 | React Input Mask | `@react-input/mask` | Masks for date (DD.MM.YYYY) and Finnish postal code (5 digits) on the Moving and Travel forms | MIT | ~90 kB | Yes (`^19.0.0-rc`) | 2024-12 | https://github.com/GoncharukOrg/react-input/tree/main/packages/mask |
| C62 | React Number Format | `react-number-format` | Formatted EUR amounts with thousand separators (budget, home size in m2) | MIT | ~244 kB | Yes | 2026-03 | https://s-yadav.github.io/react-number-format/docs/intro |
| C63 | React Hook Form | `react-hook-form` | Form state for "Plan your move" and "Travel risk check" (fewer re-renders, submit and reset) | MIT | ~1.57 MB | Yes (`^19`) | 2026-10 | https://react-hook-form.com |
| C64 | Zod | `zod` | Schema validation for the same forms, one source for types and error messages | MIT | ~6.1 MB (ships all locales, tree-shakes) | n/a (no React dependency) | 2026-10 | https://zod.dev |
| C65 | Hookform Resolvers | `@hookform/resolvers` | Connects Zod schemas to React Hook Form | MIT | ~1.17 MB | n/a (peer is react-hook-form) | 2026-10 | https://react-hook-form.com |
| C66 | React Textarea Autosize | `react-textarea-autosize` | Notes field that grows with the text ("Anything else about the move?") | MIT | ~88 kB | Yes (`^19`) | 2025-03 | https://github.com/Andarist/react-textarea-autosize#readme |

### 10b. Navigation, overlays, and command UI

| ID | Name | npm package | Use in this app | License | Size | React 19 | Last publish | Docs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C67 | Radix Navigation Menu | `@radix-ui/react-navigation-menu` | Desktop top nav with dropdowns (Risk Check, Moving, Pet Care, Travel) | MIT | ~251 kB | Yes (`^19`) | 2026-10 | https://radix-ui.com/primitives |
| C68 | Radix Hover Card | `@radix-ui/react-hover-card` | Preview a partner (mover, vet, rental) on hover or focus | MIT | ~80 kB | Yes (`^19`) | 2026-10 | https://radix-ui.com/primitives |
| C69 | Radix Avatar | `@radix-ui/react-avatar` | Member avatar with initials fallback in the header and on the membership card | MIT | ~45 kB | Yes (`^19`) | 2026-10 | https://radix-ui.com/primitives |
| C70 | Radix Scroll Area | `@radix-ui/react-scroll-area` | Styled scroll area for long plan or partner lists in side panels | MIT | ~227 kB | Yes (`^19`) | 2026-10 | https://radix-ui.com/primitives |
| C71 | Floating UI React | `@floating-ui/react` | Anchor popovers and tooltips to pins, chips and cards, with flip and shift | MIT | ~934 kB | Likely (`>=17`) | 2026-07 | https://floating-ui.com/docs/react |
| C72 | cmdk | `cmdk` | Ctrl/Cmd+K command palette to jump to Moving, Travel or a service | MIT | ~82 kB | Yes (`^19`) | 2025-08 | https://github.com/pacocoursey/cmdk#readme |
| C73 | React Hotkeys Hook | `react-hotkeys-hook` | Keyboard shortcuts for the command palette and checklist (for example "n" for next step) | MIT | ~31 kB | Likely (`>=16.8`) | 2026-06 | https://react-hotkeys-hook.vercel.app/ |
| C74 | React Joyride | `react-joyride` | Guided first-run tour: Risk Check, then the Moving plan | MIT | ~720 kB | Yes (`16.8 - 19`) | 2026-07 | https://react-joyride.com/ |
| C75 | React Cookie Consent | `react-cookie-consent` | Cookie and analytics consent banner for an EU audience | MIT | ~71 kB | Likely (`>=18`) | 2026-08 | https://github.com/Mastermindzh/react-cookie-consent#readme |

### 10c. Media and images

| ID | Name | npm package | Use in this app | License | Size | React 19 | Last publish | Docs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C76 | Yet Another React Lightbox | `yet-another-react-lightbox` | Open a partner photo or illustration card full size, with swipe | MIT | ~241 kB | Yes (`^19`) | 2026-07 | https://yet-another-react-lightbox.com |
| C77 | React Zoom Pan Pinch | `react-zoom-pan-pinch` | Pinch and pan on the route preview and on scanned documents | MIT | ~1.2 MB | Likely (`*`) | 2026-09 | https://github.com/BetterTyped/react-zoom-pan-pinch#readme |
| C78 | React Player | `react-player` | Embed how-to videos (packing, van loading) inside the checklist | MIT | ~41 kB | Yes (`^19`) | 2025-11 | https://github.com/cookpete/react-player |
| C79 | React Compare Slider | `react-compare-slider` | Before and after photo slider for move-in and move-out condition | MIT | ~155 kB | Likely (`>=16.8`) | 2026-03 | https://react-compare-slider.js.org |
| C80 | React Webcam (flagged) | `react-webcam` | Take a photo of meter readings or damage for the handover checklist | MIT | ~168 kB | Unverified (last publish 2023-10, peer `>=16.2`) | 2023-10 | https://github.com/mozmorris/react-webcam |
| C81 | React Lazy Load Image Component | `react-lazy-load-image-component` | Lazy-load partner logos and illustration images on the home page | MIT | ~95 kB | Yes (`^19`), but stale | 2024-12 | https://github.com/Aljullu/react-lazy-load-image-component#readme |

### 10d. Motion and scroll effects

| ID | Name | npm package | Use in this app | License | Size | React 19 | Last publish | Docs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C82 | Formkit Auto Animate | `@formkit/auto-animate` | One-line animation when checklist items are added, removed or reordered (use `/react` entry) | MIT | ~59 kB | Likely (no React peer declared) | 2026-07 | https://github.com/formkit/auto-animate#readme |
| C83 | React Awesome Reveal | `react-awesome-reveal` | Preset fade and slide reveals for the three service cards on the home page | MIT | ~115 kB | Likely (`>=16.14`) | 2026-10 | https://react-awesome-reveal.morello.dev |
| C84 | React Intersection Observer | `react-intersection-observer` | `useInView` hook for reveals, lazy loads and "seen" tracking | MIT | ~168 kB | Yes (`^19`) | 2026-08 | https://github.com/thebuilder/react-intersection-observer#readme |
| C85 | Lenis | `lenis` | Smooth scrolling for the long home and Moving pages | MIT | ~458 kB | Likely (`>=17`) | 2026-10 | https://github.com/darkroomengineering/lenis |
| C86 | React Scrollama | `react-scrollama` | Scrollytelling: a sticky visual changes through "how a move goes" steps | MIT | ~103 kB | Yes (`^19`) | 2025-06 | https://github.com/squirrelsquirrel88/react-scrollama#readme |
| C87 | Rive React Canvas | `@rive-app/react-canvas` | Small state-machine animation, for example a risk character that reacts to the score | MIT | ~48 kB | Yes (`^19`) | 2026-09 | https://github.com/rive-app/rive-react#readme |
| C88 | dotLottie React | `@lottiefiles/dotlottie-react` | Play Lottie or dotLottie files: loading truck, success tick, empty states | MIT | ~530 kB | Yes (`^19`) | 2026-10 | https://docs.lottiefiles.com/en/runtimes/distributions/react |
| C89 | Typewriter Effect | `typewriter-effect` | Rotating hero words ("moving", "a new pet", "travel") | MIT | ~238 kB | Likely (`>=17`) | 2025-04 | https://github.com/tameemsafi/typewriterjs#readme |
| C90 | React Rough Notation | `react-rough-notation` | Hand-drawn underline or highlight on key words in the hero headline | MIT | ~91 kB | Yes (`^18.2 \|\| ^19`) | 2025-09 | https://github.com/linkstrifer/react-rough-notation#readme |
| C91 | React Fast Marquee (flagged) | `react-fast-marquee` | Scrolling strip of partner names (verified movers, Anticimex, Verisure) | MIT | ~50 kB | Unverified (peer `>=16.8 \|\| ^18`, last publish 2024-07) | 2024-07 | https://github.com/justin-chu/react-fast-marquee#readme |
| C92 | tsParticles React | `@tsparticles/react` | Subtle particle background for the hero, used sparingly (needs an engine package too) | MIT | ~4 kB wrapper, engine extra | Likely (`>=16.8`) | 2026-08 | https://github.com/tsparticles/tsparticles#readme |
| C93 | React Scroll | `react-scroll` | Smooth scroll to in-page anchors (Checklist, Member benefits) from the header | MIT | ~139 kB | Yes (`^19`) | 2025-02 | https://github.com/fisshy/react-scroll |

### 10e. Data, state, and i18n

| ID | Name | npm package | Use in this app | License | Size | React 19 | Last publish | Docs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C94 | TanStack Query | `@tanstack/react-query` | Cache, retry and loading and error states for the open-data calls (weather, statistics) | MIT | ~1.79 MB | Yes (`^18 \|\| ^19`) | 2026-10 | https://tanstack.com/query |
| C95 | Zustand | `zustand` | Small store for the multi-step plan (event, inputs) across pages | MIT | ~95 kB | Likely (`>=18`) | 2026-08 | https://github.com/pmndrs/zustand |
| C96 | date-fns | `date-fns` | Countdown maths, due dates ("3 weeks before the move") and a Finnish locale | MIT | ~10.9 MB (tree-shakes per function) | n/a (no React dependency) | 2026-05 | https://date-fns.org |
| C97 | Turf.js | `@turf/turf` | Distance and buffer checks between addresses and partner locations | MIT | ~604 kB | n/a (no React dependency) | 2026-08 | https://turfjs.org |
| C98 | react-i18next (with i18next) | `react-i18next` (+ `i18next`) | Finnish, Swedish and English copy switch; i18next is about 526 kB unpacked and has no React dependency | MIT | ~965 kB (react-i18next) | Likely (`>=16.8`) | 2026-10 | https://github.com/i18next/react-i18next |
| C99 | React Error Boundary | `react-error-boundary` | Fallback card when one partner widget or data source fails | MIT | ~52 kB | Yes (`^18 \|\| ^19`) | 2026-09 | https://react-error-boundary-lib.vercel.app/ |
| C100 | usehooks-ts | `usehooks-ts` | Ready hooks: `useMediaQuery`, `useLocalStorage`, `useDebounceValue` for the address field | MIT | ~251 kB | Yes (`^19`), last publish 2025-02 | 2025-02 | https://usehooks-ts.com |
| C101 | React Infinite Scroll Component | `react-infinite-scroll-component` | Infinite list of tips or partner offers | MIT | ~217 kB | Likely (`>=17`) | 2026-06 | https://github.com/ankeetmaini/react-infinite-scroll-component#readme |

### 10f. Tables, lists, and layout

| ID | Name | npm package | Use in this app | License | Size | React 19 | Last publish | Docs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C102 | TanStack Table | `@tanstack/react-table` | Sortable membership comparison and partner tables | MIT | ~123 kB | Likely (`>=18`) | 2026-10 | https://tanstack.com/table |
| C103 | React Virtuoso | `react-virtuoso` | Virtualized long lists (partner directory, large checklists) | MIT | ~247 kB | Yes (`>=16 ... >=19`) | 2026-10 | https://virtuoso.dev/ |
| C104 | React Resizable Panels | `react-resizable-panels` | Split layout on desktop: checklist on the left, map on the right | MIT | ~968 kB | Yes (`^18 \|\| ^19`) | 2026-10 | https://react-resizable-panels.vercel.app/ |
| C105 | React Arborist | `react-arborist` | Nested checklist tree (phase, then task) with keyboard navigation | MIT | ~447 kB | Likely (`>=18`) | 2026-10 | https://react-arborist.netlify.app |
| C106 | Hello Pangea DnD | `@hello-pangea/dnd` | Kanban-style drag between columns (To do, Booked, Done) | Apache-2.0 | ~1.26 MB | Yes (`^18 \|\| ^19`), last publish 2025-02 | 2025-02 | https://github.com/hello-pangea/dnd#readme |
| C107 | React Share | `react-share` | Share buttons for the plan (WhatsApp, email, link copy) | MIT | ~579 kB | Yes (`^18 \|\| ^19`) | 2026-10 | https://github.com/nygardk/react-share#readme |

### 10g. Charts, maps, and calendars

| ID | Name | npm package | Use in this app | License | Size | React 19 | Last publish | Docs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C108 | React Simple Maps | `react-simple-maps` | Choropleth of Finnish municipalities by risk score (GeoJSON from open data) | MIT | ~217 kB | Yes (`19.x`) | 2026-09 | https://www.react-simple-maps.io/ |
| C109 | React Big Calendar | `react-big-calendar` | Week and month calendar of move tasks and bookings | MIT | ~1.77 MB | Yes (`^19`) | 2026-06 | https://github.com/bigcalendar/react-big-calendar#readme |
| C110 | visx Shape | `@visx/shape` | Low-level arcs, pies and lines for custom risk gauges and donuts (depends on `@visx/group` and `@visx/scale`) | MIT | ~227 kB | Yes (`^18 \|\| ^19`) | 2026-06 | https://github.com/airbnb/visx#readme |
| C111 | Nivo Sankey | `@nivo/sankey` | Flow diagram of the moving budget or cost split | MIT | ~199 kB | Yes (`^19`) | 2025-05 | https://nivo.rocks |
| C112 | Nivo Treemap | `@nivo/treemap` | Treemap of cost categories in the risk report | MIT | ~247 kB | Yes (`^19`) | 2025-05 | https://nivo.rocks |

### 10h. Export, share, and AI layer

| ID | Name | npm package | Use in this app | License | Size | React 19 | Last publish | Docs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C113 | React PDF Renderer | `@react-pdf/renderer` | Generate a downloadable PDF of the checklist or risk report | MIT | ~320 kB | Yes (`^19`) | 2026-08 | https://github.com/diegomura/react-pdf#readme |
| C114 | React PDF (viewer) | `react-pdf` | Show policy-terms PDFs from `data/opendata/` inside the app | MIT | ~337 kB | Yes (`^19`) | 2026-09 | https://www.npmjs.com/package/react-pdf |
| C115 | React To Print | `react-to-print` | Print button for the risk report | MIT | ~53 kB | Yes (`~19`) | 2026-02 | https://github.com/MatthewHerbst/react-to-print#readme |
| C116 | html2canvas | `html2canvas` | Capture a shareable image of the report summary card | MIT | ~3.38 MB | n/a (no React dependency) | 2025-11 | https://html2canvas.hertzen.com |
| C117 | react-qr-code | `react-qr-code` | QR code of the plan link or a membership card | MIT | ~20 kB | Likely (`*`) | 2026-06 | https://github.com/rosskhanas/react-qr-code#readme |
| C118 | ics | `ics` | Generate `.ics` calendar files for move day and reminders (no React) | ISC | ~72 kB | n/a (no React dependency) | 2026-10 | https://github.com/adamgibbons/ics |
| C119 | React Markdown | `react-markdown` | Render the AI summary safely as Markdown | MIT | ~53 kB | Likely (`>=18`) | 2025-03 | https://github.com/remarkjs/react-markdown#readme |
| C120 | assistant-ui | `@assistant-ui/react` | Optional chat panel to ask questions about the plan (heavy, about 2.9 MB) | MIT | ~2.9 MB | Yes (`^18 \|\| ^19`) | 2026-10 | https://www.assistant-ui.com/ |
| C121 | React Signature Canvas (flagged) | `react-signature-canvas` | Sign the van rental agreement on touch screens | Apache-2.0 | ~42 kB | Unverified (latest is `1.1.0-alpha.2`, peer `0.14 - 19`) | 2025-03 | https://github.com/agilgur5/react-signature-canvas |

### Checked and not added

These were checked with `npm view` and left out because they duplicate an earlier ID or are not UI:

- Same function as an existing ID: `input-otp` (C10), `react-countdown` (C36), `react-spinners` and `react-loader-spinner` (C52), `react-hot-toast` and `react-toastify` (C44), `react-tabs` and `@radix-ui/react-tabs` (C57), `@radix-ui/react-dialog` (C50), `@radix-ui/react-dropdown-menu` (C51), `@radix-ui/react-switch`, `@radix-ui/react-slider`, `@radix-ui/react-checkbox`, `@radix-ui/react-radio-group`, `@radix-ui/react-toggle-group` (C04, C14, C12, C13, C15), `@radix-ui/react-collapsible` (C47), `@radix-ui/react-toast` (C44), `@radix-ui/react-progress` (C20), `react-gauge-chart` and `react-speedometer` (C19), `react-step-progress-bar` (C20), `react-chrono` and `react-vertical-timeline-component` (C32; the latter has no license in npm metadata), `react-parallax-tilt` (C43), `react-scroll-parallax` (C59), `react-rewards` (C54), `recharts`, `chart.js`, `react-chartjs-2`, `@nivo/pie`, `@nivo/bar` (C25 to C28), `maplibre-gl` and `react-map-gl` (C55), `react-tiny-popover` (C48 and C51 overlap, Floating UI covers it), `@use-gesture/react` (C34 and C43 overlap), `react-swipeable` (C34), `react-tinder-card` (C34; stale 2023 with peer `<=18`), `react-flip-toolkit` and `react-collapse` (C40 and C47; stale), `react-content-loader` (C45), `react-simple-typewriter` (stale 2022; `typewriter-effect` used instead), `react-masonry-css` (stale 2022), `react-headroom` (stale 2022).
- Icon sets, same function as C56: `@phosphor-icons/react` (about 33 MB unpacked), `@tabler/icons-react`, `@heroicons/react`, `@iconify/react`, `react-icons`.
- Alternatives to a chosen ID: `@fullcalendar/react` (MIT core, but premium plugins are commercial), `@tanstack/react-form` (alternative to C63), `@headlessui/react` (overlaps C50 to C51), `@tanstack/react-virtual` (alternative to C103), `@chatscope/chat-ui-kit-react` (alternative to C120), `driver.js` (alternative to C74; framework-agnostic, MIT, no React peer), `lottie-react` (alternative to C88; peer `^18.2` or `^19`, MIT), `embla-carousel-react` and `swiper` (alternatives to C41), `react-datepicker` and `react-calendar` (alternatives to C01), `react-helmet-async` and `@sentry/react` (not UI).
- Not verified as a package: `react-vertical-timeline-component` has no licence in npm metadata. Illustration packs were not checked as npm packages.

### Summary

- 62 new IDs, C60 to C121. Each has a package that was checked on npm on 2026-10-17.
- Flagged for a manual check before use: C80 (`react-webcam`, stale 2023), C91 (`react-fast-marquee`, peer does not list 19), C121 (`react-signature-canvas`, alpha only). Also stale but declared for 19: C81, C100, C106.
- Heavy packages to tree-shake or avoid unless needed: C60 (`react-phone-number-input`, about 10.5 MB unpacked), C64 (`zod`), C96 (`date-fns`), C116 (`html2canvas`, about 3.4 MB), C120 (`@assistant-ui/react`, about 2.9 MB).
