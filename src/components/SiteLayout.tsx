import type { ReactNode } from 'react';
import type { Route } from '../routes';
import './SiteLayout.css';

const navLinks: { href: string; label: string; route?: Route }[] = [
  { href: '#top', label: 'Home', route: 'home' },
  { href: '#risk-report', label: 'Risk Check', route: 'risk-report' },
  { href: '#moving', label: 'Moving', route: 'moving' },
  // Pet Care has no page of its own yet; it points at its card on the home page.
  { href: '#pet-care', label: 'Pet Care' },
  { href: '#travel', label: 'Travel', route: 'travel' },
];

type SiteLayoutProps = { route: Route; children: ReactNode };

export function SiteLayout({ route, children }: SiteLayoutProps) {
  return (
    <div className="page" id="top">
      <header className="site-header">
        <div className="site-header__inner">
          <a className="brand" href="#top" aria-label="If Life Moments, home">
            <span className="brand__mark" aria-hidden="true">
              If
            </span>
            <span className="brand__name">Life Moments</span>
          </a>
          <nav aria-label="Main">
            <ul className="site-nav">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    aria-current={link.route && link.route === route ? 'page' : undefined}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
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
            If Life Moments. Insurance by If, practical support for your big decisions.
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
