import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import type { Route } from '../routes';
import ifLogo from '../assets/if-logo.png';
import './SiteLayout.css';

type NavLink = { href: string; label: string; route?: Route; hint?: string };

/** A link, or a pop-up menu of links when it has `items`. */
type NavEntry = NavLink | { label: string; items: NavLink[] };

const navEntries: NavEntry[] = [
  { href: '#top', label: 'Home', route: 'home' },
  {
    label: 'Moving',
    items: [
      {
        href: '#moving',
        label: 'Risk check',
        route: 'moving',
        hint: 'Tell us about the move and see your risks',
      },
      {
        href: '#moving-plan',
        label: 'Moving plan',
        route: 'moving-plan',
        hint: 'Cover, actions, help and the moving-day checklist',
      },
      {
        href: '#risk-report',
        label: 'Detailed risk overview',
        route: 'risk-report',
        hint: 'How each risk is scored',
      },
    ],
  },
  // Pet Care has no page of its own yet; it points at its card on the home page.
  { href: '#pet-care', label: 'Pet Care' },
  { href: '#travel', label: 'Travel', route: 'travel' },
];

/** Disclosure menu: opens on click, closes on Escape, outside click or picking a link. */
function NavMenu({ label, items, route }: { label: string; items: NavLink[]; route: Route }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLLIElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const active = items.some((item) => item.route === route);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <li className="site-nav__menu" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={active ? 'site-nav__trigger is-active' : 'site-nav__trigger'}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        {label}
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path d="M3 4.5 6 7.5 9 4.5" />
        </svg>
      </button>
      <ul className="site-nav__popup" id={menuId} hidden={!open}>
        {items.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              aria-current={item.route === route ? 'page' : undefined}
              onClick={() => setOpen(false)}
            >
              <span className="site-nav__popup-label">{item.label}</span>
              {item.hint && <span className="site-nav__popup-hint">{item.hint}</span>}
            </a>
          </li>
        ))}
      </ul>
    </li>
  );
}

type SiteLayoutProps = { route: Route; children: ReactNode };

export function SiteLayout({ route, children }: SiteLayoutProps) {
  return (
    <div className="page" id="top">
      <header className="site-header">
        <div className="site-header__inner">
          <a className="brand" href="#top" aria-label="IF Life Moments, home">
            <img className="brand__mark" src={ifLogo} alt="" />
            <span className="brand__name">Life Moments</span>
          </a>
          <nav aria-label="Main">
            <ul className="site-nav">
              {navEntries.map((entry) =>
                'items' in entry ? (
                  <NavMenu
                    key={entry.label}
                    label={entry.label}
                    items={entry.items}
                    route={route}
                  />
                ) : (
                  <li key={entry.href}>
                    <a
                      href={entry.href}
                      aria-current={entry.route && entry.route === route ? 'page' : undefined}
                    >
                      {entry.label}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </nav>
          {/* No accounts in the demo: logging in shows the demo member's benefits. */}
          <a className="site-header__login" href="#member-benefits">
            Log in
          </a>
        </div>
      </header>

      <main>{children}</main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <p className="site-footer__tagline">
            IF Life Moments. Insurance by IF, practical support for your big decisions.
          </p>
          <ul className="site-footer__links">
            <li>
              <a href="#member-benefits">Member benefits</a>
            </li>
            <li>
              <a href="#privacy">Privacy</a>
            </li>
            <li>
              <a href="#terms">Terms</a>
            </li>
            <li>
              <a href="#customer-service">Customer service</a>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
