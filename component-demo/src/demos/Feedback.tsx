import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { Drawer } from 'vaul';
import {
  Button,
  Dialog,
  DialogTrigger,
  Disclosure,
  DisclosurePanel,
  Heading,
  Menu,
  MenuItem,
  MenuTrigger,
  Modal,
  ModalOverlay,
  OverlayArrow,
  Popover,
  Tooltip,
  TooltipTrigger,
} from 'react-aria-components';
import { Demo } from '../components/Demo';

/* C44 Toast */
function ToastDemo() {
  return (
    <div className="row">
      <button className="btn" onClick={() => toast.success('Movers booked for 14 March')}>Success toast</button>
      <button
        className="btn"
        onClick={() =>
          toast('Electricity switch saved', {
            description: 'We will confirm the start date by email.',
            action: { label: 'Undo', onClick: () => toast.info('Undone') },
          })
        }
      >
        Toast with action
      </button>
      <button className="btn" onClick={() => toast.error('Could not reach the quote service')}>Error toast</button>
    </div>
  );
}

/* C45 Skeleton loader */
function SkeletonDemo() {
  const [loading, setLoading] = useState(true);
  return (
    <>
      <div className="card" aria-busy={loading}>
        {loading ? (
          <>
            <div className="skeleton skeleton--title" />
            <div className="skeleton skeleton--line" />
            <div className="skeleton skeleton--line skeleton--short" />
          </>
        ) : (
          <>
            <strong>3-bedroom flat, Helsinki</strong>
            <span>Contents cover from 24 EUR a month. Ready to review.</span>
          </>
        )}
      </div>
      <button className="btn" onClick={() => setLoading((v) => !v)}>
        {loading ? 'Show loaded content' : 'Show skeleton'}
      </button>
    </>
  );
}

/* C46 Inline alert with dismiss */
function AlertDemo() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div role="status" className="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}>
            <span>Your quote expires in 3 days.</span>
            <button className="btn" onClick={() => setOpen(false)}>Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>
      {!open && <button className="btn" onClick={() => setOpen(true)}>Show alert again</button>}
    </>
  );
}

/* C47 Accordion */
function Chevron() {
  return (
    <svg className="accordion__chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function AccordionDemo() {
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

/* C48 Tooltip */
function TooltipDemo() {
  return (
    <TooltipTrigger delay={200}>
      <Button className="btn">Hover or focus me</Button>
      <Tooltip className="tooltip">
        <OverlayArrow>
          <svg width="10" height="6" viewBox="0 0 10 6"><path d="M0 0 L5 6 L10 0" fill="var(--ink)" /></svg>
        </OverlayArrow>
        Packing boxes are free to borrow from the mover on day one.
      </Tooltip>
    </TooltipTrigger>
  );
}

/* C49 Bottom sheet */
function SheetDemo() {
  return (
    <Drawer.Root>
      <Drawer.Trigger className="btn btn--primary">Open moving checklist</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="sheet-overlay" />
        <Drawer.Content className="sheet" aria-describedby={undefined}>
          <div className="sheet__handle" />
          <Drawer.Title style={{ margin: '0 0 0.5rem' }}>Moving checklist</Drawer.Title>
          <p style={{ color: 'var(--muted)', margin: 0 }}>Drag this sheet down, or press Escape, to dismiss it.</p>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

/* C50 Modal dialog (confirm) */
function ModalDemo() {
  return (
    <DialogTrigger>
      <Button className="btn btn--danger">Cancel my move plan</Button>
      <ModalOverlay className="modal-overlay">
        <Modal className="modal">
          <Dialog role="alertdialog" className="modal__dialog">
            {({ close }) => (
              <>
                <Heading slot="title" className="modal__title">Cancel this plan?</Heading>
                <p>Your checklist will be kept for 30 days.</p>
                <div className="row">
                  <Button className="btn" onPress={close}>Keep plan</Button>
                  <Button className="btn btn--primary" onPress={close}>Cancel plan</Button>
                </div>
              </>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
}

/* C51 Menu / dropdown */
function MenuDemo() {
  const [last, setLast] = useState('none yet');
  return (
    <div className="stack">
      <MenuTrigger>
        <Button className="btn">Plan actions ▾</Button>
        <Popover className="popover">
          <Menu className="menu" onAction={(key) => setLast(String(key))}>
            <MenuItem id="share" className="listbox-item">Share plan</MenuItem>
            <MenuItem id="export" className="listbox-item">Export checklist</MenuItem>
            <MenuItem id="archive" className="listbox-item">Archive</MenuItem>
          </Menu>
        </Popover>
      </MenuTrigger>
      <p className="demo__lib">Last action: {last}</p>
    </div>
  );
}

/* C52 Spinner and indeterminate bar */
function SpinnerDemo() {
  return (
    <div className="stack">
      <div className="row">
        <span className="spinner" role="status" aria-label="Loading" />
        <span>Checking quotes</span>
      </div>
      <div className="indeterminate" aria-hidden="true">
        <span />
      </div>
    </div>
  );
}

/* C53 Empty state with call to action */
function EmptyDemo() {
  const [added, setAdded] = useState(false);
  return (
    <div className="empty">
      <svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="var(--muted)" strokeWidth="2" aria-hidden="true">
        <rect x="8" y="12" width="32" height="26" rx="4" />
        <path d="M8 24h10l3 4h6l3-4h10" />
      </svg>
      <strong>No moving tasks yet</strong>
      <span>Add your move date to get a checklist for the weeks before.</span>
      <button className="btn btn--primary" onClick={() => setAdded(true)} disabled={added}>
        {added ? 'Date added' : 'Add move date'}
      </button>
    </div>
  );
}

/* C54 Confetti burst */
function ConfettiDemo() {
  return (
    <button className="btn btn--primary" onClick={() => confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } })}>
      Plan complete
    </button>
  );
}

export function FeedbackGroup() {
  return (
    <>
      <Demo id="C44" title="Toast" lib="sonner">
        <ToastDemo />
      </Demo>
      <Demo id="C45" title="Skeleton loader" lib="plain CSS shimmer">
        <SkeletonDemo />
      </Demo>
      <Demo id="C46" title="Inline alert with dismiss" lib="motion AnimatePresence, role=status">
        <AlertDemo />
      </Demo>
      <Demo id="C47" title="Accordion" lib="react-aria-components Disclosure">
        <AccordionDemo />
      </Demo>
      <Demo id="C48" title="Tooltip" lib="react-aria-components TooltipTrigger">
        <TooltipDemo />
      </Demo>
      <Demo id="C49" title="Bottom sheet" lib="vaul">
        <SheetDemo />
      </Demo>
      <Demo id="C50" title="Modal dialog (confirm)" lib="react-aria-components Modal + Dialog">
        <ModalDemo />
      </Demo>
      <Demo id="C51" title="Menu / dropdown" lib="react-aria-components Menu">
        <MenuDemo />
      </Demo>
      <Demo id="C52" title="Spinner and indeterminate bar" lib="plain CSS">
        <SpinnerDemo />
      </Demo>
      <Demo id="C53" title="Empty state with call to action" lib="plain SVG + CSS">
        <EmptyDemo />
      </Demo>
      <Demo id="C54" title="Confetti burst" lib="canvas-confetti">
        <ConfettiDemo />
      </Demo>
    </>
  );
}
