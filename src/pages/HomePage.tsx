import { Icon } from '../components/Icon';
import { lifeMoments, memberBenefits } from '../data/lifeMoments';
import './HomePage.css';

const navLinks = [
  { href: '#top', label: 'Home' },
  { href: '#risk-check', label: 'Risk Check' },
  ...lifeMoments.map((moment) => ({ href: `#${moment.id}`, label: moment.name })),
];

export function HomePage() {
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
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero__inner">
            <div className="hero__copy">
              <h1 id="hero-title">Risk insights and practical support before life’s decisions</h1>
              <p className="hero__lead">
                From moving and pet care to travel, Life Moments helps you prepare, stay protected
                and make better decisions.
              </p>
              <div className="hero__actions">
                <a className="button button--primary" href="#risk-check">
                  Start your risk check
                </a>
                <a className="button button--soft" href="#services">
                  View services
                </a>
              </div>
            </div>

            <aside className="moments-panel" aria-label="Example of a life moments plan">
              <p className="moments-panel__title">Your plan</p>
              <ul className="moments-panel__list">
                {lifeMoments.map((moment, index) => (
                  <li className="moment-row" key={moment.id}>
                    <span className="icon-tile">
                      <Icon name={moment.icon} />
                    </span>
                    <span className="moment-row__text">
                      <span className="moment-row__name">{moment.name}</span>
                      <span className="moment-row__teaser">{moment.teaser}</span>
                    </span>
                    <span className="moment-row__progress">
                      <span
                        className="meter"
                        role="meter"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={moment.readiness}
                        aria-label={`${moment.name} readiness`}
                      >
                        <span
                          className="meter__fill"
                          style={{
                            width: `${moment.readiness}%`,
                            animationDelay: `${300 + index * 160}ms`,
                          }}
                        />
                      </span>
                      <span className="moment-row__percent">{moment.readiness}% ready</span>
                    </span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <section className="services" id="services" aria-labelledby="services-title">
          <h2 id="services-title" className="visually-hidden">
            Services
          </h2>
          <div className="services__grid">
            {lifeMoments.map((moment) => (
              <article className="service-card" id={moment.id} key={moment.id}>
                <h3 className="service-card__title">
                  <span className="icon-tile icon-tile--small">
                    <Icon name={moment.icon} />
                  </span>
                  {moment.name}
                </h3>
                <ul className="service-card__list">
                  {moment.services.map((service) => (
                    <li key={service}>
                      <Icon name="check" className="service-card__check" />
                      {service}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="benefits" id="risk-check" aria-labelledby="benefits-title">
          <h2 id="benefits-title" className="benefits__title">
            Member benefits
          </h2>
          <ul className="benefits__strip">
            {memberBenefits.map((benefit) => (
              <li key={benefit.text}>
                <Icon name={benefit.icon} className="benefits__icon" />
                {benefit.text}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <p className="site-footer__tagline">
            If Life Moments. Insurance by If, practical support for your big decisions.
          </p>
          <ul className="site-footer__links">
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
