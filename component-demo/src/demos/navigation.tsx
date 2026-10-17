import { useState } from 'react';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import * as HoverCard from '@radix-ui/react-hover-card';
import * as Avatar from '@radix-ui/react-avatar';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import {
  autoUpdate,
  flip,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import { Command } from 'cmdk';
import { useHotkeys } from 'react-hotkeys-hook';
import { Joyride, STATUS, type Step } from 'react-joyride';
import CookieConsent from 'react-cookie-consent';
import { Demo } from '../components/Demo';

/* C67 Radix Navigation Menu (desktop nav with dropdowns) */
const NAV = [
  {
    label: 'Moving',
    links: [
      { title: 'Plan your move', text: 'Dates, rooms and a checklist' },
      { title: 'Compare movers', text: 'Verified partners in your area' },
      { title: 'Address change', text: 'Tell your bank, employer and post' },
    ],
  },
  {
    label: 'Pet care',
    links: [
      { title: 'Pet relocation', text: 'Vaccines and papers before a flight' },
      { title: 'Vet on call', text: 'Telehealth with a partner clinic' },
    ],
  },
  {
    label: 'Travel',
    links: [
      { title: 'Trip risk check', text: 'Destination, health and cancellation' },
      { title: 'Rental car', text: 'Excess and damage cover' },
    ],
  },
];

function NavDemo() {
  return (
    <NavigationMenu.Root className="b3-nav">
      <NavigationMenu.List className="b3-nav__list">
        {NAV.map((group) => (
          <NavigationMenu.Item key={group.label}>
            <NavigationMenu.Trigger className="b3-nav__trigger">
              {group.label} <span aria-hidden="true">▾</span>
            </NavigationMenu.Trigger>
            <NavigationMenu.Content className="b3-nav__content">
              <ul className="b3-nav__links">
                {group.links.map((link) => (
                  <li key={link.title}>
                    <NavigationMenu.Link href="#C67" className="b3-nav__link">
                      <strong>{link.title}</strong>
                      <span>{link.text}</span>
                    </NavigationMenu.Link>
                  </li>
                ))}
              </ul>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        ))}
        <NavigationMenu.Item>
          <NavigationMenu.Link href="#C67" className="b3-nav__trigger">
            Member benefits
          </NavigationMenu.Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
}

/* C68 Radix Hover Card (partner preview on hover or focus) */
const PARTNERS = [
  {
    name: 'Quick Movers Oy',
    kind: 'Movers',
    rating: '4.8',
    from: '390 €',
    area: 'Helsinki region',
  },
  {
    name: 'FirstVet Clinic',
    kind: 'Pet care',
    rating: '4.9',
    from: '45 € video visit',
    area: 'Finland, online',
  },
  {
    name: 'Anticimex',
    kind: 'Pest control',
    rating: '4.6',
    from: 'Quote on site',
    area: 'Nationwide',
  },
];

function PartnerHoverDemo() {
  return (
    <p className="b3-inline-list">
      Partners:{' '}
      {PARTNERS.map((p, i) => (
        <span key={p.name}>
          <HoverCard.Root openDelay={150} closeDelay={100}>
            <HoverCard.Trigger asChild>
              <button type="button" className="b3-link">
                {p.name}
              </button>
            </HoverCard.Trigger>
            <HoverCard.Portal>
              <HoverCard.Content className="b3-hovercard" sideOffset={8}>
                <strong>{p.name}</strong>
                <p className="b3-hint">
                  {p.kind} · rated {p.rating}/5
                </p>
                <p className="b3-hint">
                  From {p.from} · {p.area}
                </p>
                <button type="button" className="btn btn--primary">
                  Ask for a quote
                </button>
              </HoverCard.Content>
            </HoverCard.Portal>
          </HoverCard.Root>
          {i < PARTNERS.length - 1 ? ', ' : ''}
        </span>
      ))}
    </p>
  );
}

/* C69 Radix Avatar (image with initials fallback) */
const MEMBER_PHOTO = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#dbe7ff"/><circle cx="32" cy="26" r="11" fill="#1557e8"/><path d="M12 60c2-12 11-18 20-18s18 6 20 18z" fill="#1557e8"/></svg>',
)}`;

function AvatarDemo() {
  return (
    <div className="row">
      <Avatar.Root className="b3-avatar">
        <Avatar.Image className="b3-avatar__img" src={MEMBER_PHOTO} alt="Member photo" />
        <Avatar.Fallback className="b3-avatar__fallback" delayMs={600}>
          MK
        </Avatar.Fallback>
      </Avatar.Root>
      <Avatar.Root className="b3-avatar">
        <Avatar.Image className="b3-avatar__img" src="https://avatars.invalid/none.png" alt="" />
        <Avatar.Fallback className="b3-avatar__fallback">JH</Avatar.Fallback>
      </Avatar.Root>
      <span className="b3-hint">
        Left: photo. Right: the image URL fails, so the initials show.
      </span>
    </div>
  );
}

/* C70 Radix Scroll Area (long checklist in a side panel) */
const CHECKLIST_LONG = Array.from({ length: 30 }, (_, i) => {
  const tasks = [
    'Order boxes and tape',
    'Notify landlord in writing',
    'Measure doorways for the sofa',
    'Book parking permit for the van',
    'Transfer electricity contract',
    'Photograph meter readings',
    'Move the cat carrier to the car first',
  ];
  return `${i + 1}. ${tasks[i % tasks.length]}`;
});

function ScrollAreaDemo() {
  return (
    <ScrollArea.Root className="b3-scroll">
      <ScrollArea.Viewport className="b3-scroll__viewport">
        <ol className="b3-scroll__list">
          {CHECKLIST_LONG.map((task) => (
            <li key={task}>{task}</li>
          ))}
        </ol>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar className="b3-scrollbar" orientation="vertical">
        <ScrollArea.Thumb className="b3-scrollbar__thumb" />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  );
}

/* C71 Floating UI (popover anchored to a pin, with flip and shift) */
function FloatingDemo() {
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'top',
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip(), shift({ padding: 8 })],
  });
  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'dialog' });
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);

  return (
    <div className="b3-floating-row">
      <button
        type="button"
        ref={refs.setReference}
        className="btn"
        aria-label="Flood risk for Kaivopuisto"
        {...getReferenceProps()}
      >
        Kaivopuisto pin
      </button>
      {open && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          className="b3-popover"
          {...getFloatingProps()}
        >
          <strong>Sea flood zone</strong>
          <p className="b3-hint">
            SYKE flood-risk sample for Kaivopuisto: part of the shoreline is in a medium-risk zone.
            Ground-floor items are the first to move.
          </p>
        </div>
      )}
    </div>
  );
}

/* C72 cmdk (command palette) */
const COMMANDS = [
  {
    group: 'Moving',
    items: ['Plan your move', 'Compare movers', 'Moving checklist', 'Book a van'],
  },
  { group: 'Pet care', items: ['Pet relocation papers', 'Vet on call', 'Pet sitter'] },
  { group: 'Travel', items: ['Trip risk check', 'Travel cover quote', 'Rental car excess'] },
];

function CommandDemo() {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div className="b3-stack">
      <Command className="b3-cmd" label="Jump to a service">
        <Command.Input className="b3-cmd__input" placeholder="Type 'van', 'vet' or 'flight'" />
        <Command.List className="b3-cmd__list">
          <Command.Empty className="b3-hint">No match. Try &quot;movers&quot;.</Command.Empty>
          {COMMANDS.map((group) => (
            <Command.Group key={group.group} heading={group.group} className="b3-cmd__group">
              {group.items.map((item) => (
                <Command.Item
                  key={item}
                  value={item}
                  onSelect={(value) => setPicked(value)}
                  className="b3-cmd__item"
                >
                  {item}
                </Command.Item>
              ))}
            </Command.Group>
          ))}
        </Command.List>
      </Command>
      <p className="b3-hint" role="status">
        {picked ? `Opening: ${picked}` : 'Pick an item with the arrow keys and Enter.'}
      </p>
    </div>
  );
}

/* C73 React Hotkeys Hook (keyboard steps for the checklist) */
const KEY_STEPS = ['Book movers', 'Pack the kitchen', 'Transfer utilities', 'Photograph meters'];

function HotkeysDemo() {
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState<boolean[]>(KEY_STEPS.map(() => false));

  useHotkeys('n', () => setIndex((i) => Math.min(i + 1, KEY_STEPS.length - 1)));
  useHotkeys('p', () => setIndex((i) => Math.max(i - 1, 0)));
  useHotkeys('c', () => setDone((d) => d.map((v, i) => (i === index ? !v : v))), [index]);

  return (
    <div className="b3-stack">
      <p className="b3-hint">
        Keys: <kbd>n</kbd> next, <kbd>p</kbd> previous, <kbd>c</kbd> mark done. Works when the focus
        is not in a text field.
      </p>
      <ol className="plain-list b3-steps">
        {KEY_STEPS.map((step, i) => (
          <li key={step} className={i === index ? 'is-current' : undefined}>
            <span aria-hidden="true">{done[i] ? '☑' : '☐'}</span> {step}
          </li>
        ))}
      </ol>
    </div>
  );
}

/* C74 React Joyride (first-run tour) */
const TOUR_STEPS: Step[] = [
  {
    target: '.b3-tour-risk',
    content: 'Start with the risk check. It takes about two minutes.',
  },
  {
    target: '.b3-tour-moving',
    content: 'Then the moving plan builds a checklist from your dates and rooms.',
  },
  {
    target: '.b3-tour-checklist',
    content: 'Tick items off as you go. Reminders arrive before each deadline.',
  },
];

function TourDemo() {
  const [run, setRun] = useState(false);
  return (
    <div className="b3-stack">
      <div className="b3-tour">
        <div className="b3-tour__block b3-tour-risk">Risk check: 2 open items</div>
        <div className="b3-tour__block b3-tour-moving">Moving plan: 14 Nov 2026</div>
        <div className="b3-tour__block b3-tour-checklist">Checklist: 5 of 18 done</div>
      </div>
      <div className="row">
        <button type="button" className="btn btn--primary" onClick={() => setRun(true)}>
          Start tour
        </button>
      </div>
      <Joyride
        steps={TOUR_STEPS}
        run={run}
        continuous
        onEvent={(data) => {
          if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) setRun(false);
        }}
        options={{ showProgress: true, primaryColor: '#1557e8', zIndex: 2000, skipBeacon: true }}
      />
    </div>
  );
}

/* C75 React Cookie Consent (EU consent banner, inline in the demo) */
const CONSENT_COOKIE = 'b3_demo_consent';

function ConsentDemo() {
  const [version, setVersion] = useState(0);
  const [status, setStatus] = useState('No choice yet');
  return (
    <div className="b3-stack">
      <CookieConsent
        key={version}
        disableStyles
        containerClasses="b3-cookie"
        contentClasses="b3-cookie__text"
        buttonClasses="btn btn--primary"
        declineButtonClasses="btn"
        buttonWrapperClasses="b3-cookie__actions"
        cookieName={CONSENT_COOKIE}
        enableDeclineButton
        buttonText="Accept analytics"
        declineButtonText="Only essential"
        expires={150}
        onAccept={() => setStatus('Accepted analytics cookies')}
        onDecline={() => setStatus('Essential cookies only')}
      >
        We use essential cookies to keep your plan. With your consent we also measure which life
        moments you open.
      </CookieConsent>
      <div className="row">
        <span className="b3-hint" role="status">
          Status: {status}
        </span>
        <button
          type="button"
          className="btn"
          onClick={() => {
            document.cookie = `${CONSENT_COOKIE}=; Max-Age=0; path=/`;
            setStatus('Reset: banner shown again');
            setVersion((v) => v + 1);
          }}
        >
          Reset choice
        </button>
      </div>
    </div>
  );
}

export function NavigationGroup() {
  return (
    <>
      <Demo
        id="C67"
        title="Desktop navigation with dropdowns"
        lib="@radix-ui/react-navigation-menu"
      >
        <NavDemo />
      </Demo>
      <Demo id="C68" title="Partner hover card" lib="@radix-ui/react-hover-card">
        <PartnerHoverDemo />
      </Demo>
      <Demo id="C69" title="Member avatar with initials" lib="@radix-ui/react-avatar">
        <AvatarDemo />
      </Demo>
      <Demo id="C70" title="Scrollable checklist panel" lib="@radix-ui/react-scroll-area">
        <ScrollAreaDemo />
      </Demo>
      <Demo id="C71" title="Anchored popover with flip and shift" lib="@floating-ui/react">
        <FloatingDemo />
      </Demo>
      <Demo id="C72" title="Command palette" lib="cmdk">
        <CommandDemo />
      </Demo>
      <Demo id="C73" title="Keyboard shortcuts" lib="react-hotkeys-hook">
        <HotkeysDemo />
      </Demo>
      <Demo id="C74" title="First-run guided tour" lib="react-joyride">
        <TourDemo />
      </Demo>
      <Demo id="C75" title="Cookie consent banner" lib="react-cookie-consent">
        <ConsentDemo />
      </Demo>
    </>
  );
}
