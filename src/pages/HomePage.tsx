import { Icon } from '../components/Icon';
import { LiquidMeter } from '../components/LiquidMeter';
import { lifeMoments, memberBenefits } from '../data/lifeMoments';
import './HomePage.css';

export function HomePage() {
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__inner">
          <div className="hero__copy">
            <h1 id="hero-title">Risk insights and practical support before life’s decisions</h1>
            <p className="hero__lead">
              From moving and pet care to travel, Life Moments helps you prepare, stay protected and
              make better decisions.
            </p>
            <div className="hero__actions">
              <a className="button button--primary" href="#risk-report">
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
              {lifeMoments.map((moment) => (
                <li className="moment-row" key={moment.id}>
                  <span className="icon-tile">
                    <Icon name={moment.icon} />
                  </span>
                  <span className="moment-row__text">
                    <span className="moment-row__name">{moment.name}</span>
                    <span className="moment-row__teaser">{moment.teaser}</span>
                  </span>
                  <span className="moment-row__progress">
                    <LiquidMeter
                      className="liquid--compact"
                      value={moment.readiness}
                      variant="progress"
                      label={`${moment.name} readiness`}
                    />
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
            <article
              className="service-card"
              key={moment.id}
              id={moment.id === 'pet-care' ? moment.id : undefined}
            >
              <h3 className="service-card__title">
                <span className="icon-tile icon-tile--small">
                  <Icon name={moment.icon} />
                </span>
                {moment.id === 'pet-care' ? (
                  moment.name
                ) : (
                  <a className="service-card__link" href={`#${moment.id}`}>
                    {moment.name}
                  </a>
                )}
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
        <div className="benefits__head">
          <h2 id="benefits-title" className="benefits__title">
            Member benefits
          </h2>
          <a className="benefits__more" href="#member-benefits">
            See all benefits
          </a>
        </div>
        <ul className="benefits__strip">
          {memberBenefits.map((benefit) => (
            <li key={benefit.text}>
              <Icon name={benefit.icon} className="benefits__icon" />
              {benefit.text}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
