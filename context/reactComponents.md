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
