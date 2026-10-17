import Typewriter from 'typewriter-effect';
import { Icon } from '../components/Icon';
import { LiquidMeter } from '../components/LiquidMeter';
import { lifeMoments, memberBenefits } from '../data/lifeMoments';
import { movingSteps, resetAllProgress, useMovingJourney } from '../state/movingJourney';
import { useMovingAssessment } from '../state/movingPlan';
import './HomePage.css';

/** C89: the decision the hero is about, typed and replaced in turn. */
const heroWords = ['your move', 'a new pet', 'your next trip', 'life’s decisions'];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The hub: every life moment, with Moving progress taken from the user's own plan. */
export function HomePage() {
  const { report, assessment, doneActions } = useMovingAssessment();
  const journey = useMovingJourney(assessment, doneActions);
  const nextStep = movingSteps.find((step) => journey.states[step.id] === 'open');

  const moments = lifeMoments.map((moment) => {
    if (moment.id !== 'moving') return moment;
    return {
      ...moment,
      readiness: report ? journey.progress : 0,
      teaser: !report
        ? 'Start with a risk check of your new address'
        : nextStep
          ? `Next: ${nextStep.title.toLowerCase()}`
          : 'Every step is done',
    };
  });

  const reset = () => {
    if (!window.confirm('Clear your answers, risk report and plan progress?')) return;
    resetAllProgress();
    window.location.hash = '#top';
    window.location.reload();
  };

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__inner">
          <div className="hero__copy">
            <h1
              id="hero-title"
              aria-label="Risk insights and practical support before life’s decisions"
            >
              Risk insights and practical support before
              <span className="hero__typed" aria-hidden="true">
                {prefersReducedMotion() ? (
                  'life’s decisions'
                ) : (
                  <Typewriter
                    options={{ loop: true, delay: 55, deleteSpeed: 30 }}
                    onInit={(typewriter) => {
                      heroWords.forEach((word) => {
                        typewriter.typeString(word).pauseFor(1600).deleteAll();
                      });
                      typewriter.start();
                    }}
                  />
                )}
              </span>
            </h1>
            <p className="hero__lead">
              From moving and pet care to travel, Life Moments helps you prepare, stay protected and
              make better decisions.
            </p>
            <div className="hero__actions">
              <a className="button button--primary" href={report ? '#moving-plan' : '#moving'}>
                {report ? 'Continue your moving plan' : 'Start your risk check'}
              </a>
              <a className="button button--soft" href="#services">
                View services
              </a>
            </div>
          </div>

          <aside className="moments-panel" aria-label="Your life moments">
            <p className="moments-panel__title">Your plan</p>
            <ul className="moments-panel__list">
              {moments.map((moment) => (
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
            <button className="moments-panel__reset" type="button" onClick={reset}>
              Reset progress
            </button>
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

      <section className="benefits" aria-labelledby="benefits-title">
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
