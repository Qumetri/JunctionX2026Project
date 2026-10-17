import { Drawer } from 'vaul';
import {
  Button,
  Disclosure,
  DisclosurePanel,
  OverlayArrow,
  Tooltip,
  TooltipTrigger,
} from 'react-aria-components';

function Chevron() {
  return (
    <svg className="accordion__chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function Accordion() {
  const items = [
    { id: 'a', title: 'What is covered on moving day?', body: 'Damage to belongings in transit is typically covered by the mover liability option you choose.' },
    { id: 'b', title: 'When should I tell my insurer?', body: 'Usually two to four weeks before the move, so the new address is in place from day one.' },
  ];
  return (
    <div className="accordion">
      {items.map((it) => (
        <Disclosure key={it.id} className="accordion__item">
          <Button slot="trigger" className="accordion__trigger">
            {it.title}
            <Chevron />
          </Button>
          <DisclosurePanel className="accordion__panel">{it.body}</DisclosurePanel>
        </Disclosure>
      ))}
    </div>
  );
}

function SheetDemo() {
  return (
    <Drawer.Root>
      <Drawer.Trigger className="btn btn--primary">Open moving checklist</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="sheet-overlay" />
        <Drawer.Content className="sheet" aria-describedby={undefined}>
          <div className="sheet__handle" />
          <Drawer.Title style={{ margin: '0 0 0.5rem' }}>Moving checklist</Drawer.Title>
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            Drag this sheet down, or press Escape, to dismiss it. Vaul handles the gesture.
          </p>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export function Overlays() {
  return (
    <>
      <div className="demo">
        <p className="demo__title">Bottom sheet</p>
        <p className="demo__lib">vaul</p>
        <SheetDemo />
      </div>

      <div className="demo">
        <p className="demo__title">Tooltip</p>
        <p className="demo__lib">react-aria-components TooltipTrigger</p>
        <TooltipTrigger delay={200}>
          <Button className="btn">Hover or focus me</Button>
          <Tooltip className="tooltip">
            <OverlayArrow>
              <svg width="10" height="6" viewBox="0 0 10 6"><path d="M0 0 L5 6 L10 0" fill="var(--ink)" /></svg>
            </OverlayArrow>
            Packing boxes are free to borrow from the mover on day one.
          </Tooltip>
        </TooltipTrigger>
      </div>

      <div className="demo">
        <p className="demo__title">Accordion</p>
        <p className="demo__lib">react-aria-components Disclosure</p>
        <Accordion />
      </div>
    </>
  );
}
