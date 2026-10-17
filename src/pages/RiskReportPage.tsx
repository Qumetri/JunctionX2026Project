import { useEffect, useState, type CSSProperties } from 'react';
import { Icon, type IconName } from '../components/Icon';
import { LiquidMeter } from '../components/LiquidMeter';
import { liquidColor } from '../components/liquidColor';
import { demoMovingReport } from '../data/movingReport';
import {
  levelForScore,
  scoreReport,
  type CategoryId,
  type GapStatus,
  type Level,
} from '../engine/movingRisk';
import { loadMovingPlan } from '../state/movingPlan';
import { storageKeys, useStoredSet } from '../state/useStoredSet';
import './RiskReportPage.css';

const report = demoMovingReport;

const categoryIcons: Record<CategoryId, IconName> = {
  transport: 'truck',
  schedule: 'clock',
  keys: 'key',
  property: 'building',
};

const levelLabel: Record<Level, string> = { low: 'Low', medium: 'Medium', high: 'High' };

const gapIcons: Record<GapStatus, IconName> = { covered: 'check', partial: 'shield', gap: 'alert' };
const gapLabel: Record<GapStatus, string> = {
  covered: 'Covered',
  partial: 'Partly covered',
  gap: 'Not covered',
};

const euro = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

function formatMoveDate(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00`);
  const days = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
  const label = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  if (days > 1) return `${label}, in ${days} days`;
  if (days === 1) return `${label}, tomorrow`;
  if (days === 0) return `${label}, today`;
  return label;
}

export function RiskReportPage() {
  const [doneActions, toggleAction] = useStoredSet(storageKeys.movingActions);
  const [plan] = useState(loadMovingPlan);
  const { mitigated, categories, overall, readiness: ready } = scoreReport(report, doneActions);

  return (
    <div className="report">
      <header className="report__intro">
        <h1>Your risk report</h1>
        <p>
          Moving from {plan.from} to {plan.to}. Based on your answers, public data about the
          building and area, and your current If home insurance.
        </p>
      </header>

      <section className="report__overview" aria-label="Risk overview">
        <article className="summary-card">
          <h2 className="summary-card__title">Report summary</h2>
          <div className="summary-card__body">
            <dl className="summary-card__facts">
              <div>
                <dt>Life event</dt>
                <dd>Moving</dd>
              </div>
              <div>
                <dt>Moving date</dt>
                <dd>{formatMoveDate(plan.moveDate)}</dd>
              </div>
              <div>
                <dt>New address</dt>
                <dd>{plan.to}</dd>
              </div>
              <div>
                <dt>New home</dt>
                <dd>
                  {report.summary.homeLabel}, {plan.homeSizeM2} m²
                </dd>
              </div>
              <div>
                <dt>Ready for moving day</dt>
                <dd>{ready}%</dd>
              </div>
            </dl>
            <RiskGauge score={overall} />
          </div>
        </article>

        <div className="risk-grid">
          {categories.map((category) => (
            <article className="risk-card" key={category.id}>
              <div className="risk-card__head">
                <span className="icon-tile icon-tile--small">
                  <Icon name={categoryIcons[category.id]} />
                </span>
                <h3 className="risk-card__title">
                  {category.name}
                  <span className={`level-text level-text--${category.level}`}>
                    {category.score === 0 ? 'Handled' : levelLabel[category.level]}
                  </span>
                </h3>
              </div>

              <ul className="risk-card__flags">
                {category.flags.map((flag) => {
                  const isMitigated = mitigated.has(flag.id);
                  return (
                    <li key={flag.id}>
                      <details className={isMitigated ? 'flag flag--resolved' : 'flag'}>
                        <summary>
                          <span
                            className={`flag__dot flag__dot--${isMitigated ? 'resolved' : flag.severity}`}
                            aria-hidden="true"
                          />
                          <span className="flag__title">{flag.title}</span>
                          <span className="visually-hidden">
                            {isMitigated ? ', handled' : `, ${flag.severity} risk`}
                          </span>
                        </summary>
                        <div className="flag__body">
                          <p>{flag.why}</p>
                          {flag.estimateEur !== undefined && (
                            <p className="flag__estimate">
                              Average claim in Finland: {euro.format(flag.estimateEur)}
                            </p>
                          )}
                          <p className="flag__evidence">{flag.evidence}</p>
                        </div>
                      </details>
                    </li>
                  );
                })}
              </ul>

              <LiquidMeter
                className="risk-card__meter"
                value={category.score}
                label={`${category.name} risk score`}
              />
            </article>
          ))}
        </div>
      </section>

      <section className="report__section" aria-labelledby="actions-title">
        <div className="section-head">
          <h2 id="actions-title">Recommended actions</h2>
          <p>Tick off what you have done. Your risk levels update as you go.</p>
        </div>
        <div className="actions-panel">
          {categories.map((category) => {
            const actions = report.actions.filter((action) =>
              action.resolves.some((flagId) => category.flags.some((flag) => flag.id === flagId)),
            );
            return (
              <div className="actions-group" key={category.id}>
                <h3 className="actions-group__title">{category.name}</h3>
                <ul className="actions-group__list">
                  {actions.map((action) => (
                    <li key={action.id}>
                      <label className="action">
                        <input
                          type="checkbox"
                          checked={doneActions.has(action.id)}
                          onChange={() => toggleAction(action.id)}
                        />
                        <span className="action__text">
                          {action.title}
                          {action.partnerOffer && (
                            <span className="action__offer">{action.partnerOffer}</span>
                          )}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section className="report__section" aria-labelledby="gaps-title">
        <div className="section-head">
          <h2 id="gaps-title">Protection gap check</h2>
          <p>Compared with your If home insurance, Perus level.</p>
        </div>
        <ul className="gaps-panel">
          {report.protectionGaps.map((gap) => (
            <li className={`gap gap--${gap.status}`} key={gap.id}>
              <span className="gap__icon">
                <Icon name={gapIcons[gap.status]} />
              </span>
              <div className="gap__text">
                <p className="gap__status">{gapLabel[gap.status]}</p>
                <h3 className="gap__title">{gap.title}</h3>
                <p className="gap__detail">{gap.detail}</p>
                {gap.suggestion && (
                  <a className="gap__link" href="#risk-report">
                    {gap.suggestion}
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <footer className="report__sources">
        <p>Data from {report.sources.join(', ')}.</p>
        <p>This is guidance, not a binding offer. Check your policy terms for exact cover.</p>
      </footer>
    </div>
  );
}

/** Half-circle gauge. Zone ticks mark where the level changes (40 and 70). */
function RiskGauge({ score }: { score: number }) {
  const [shown, setShown] = useState(0);

  // Start from zero so the needle swings in on load, then follows every change.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(score));
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const level = levelForScore(score);
  const tick = (value: number) => {
    const angle = Math.PI * (1 - value / 100);
    const point = (radius: number) =>
      `${100 + radius * Math.cos(angle)} ${100 - radius * Math.sin(angle)}`;
    return `M ${point(66)} L ${point(72)}`;
  };

  return (
    <figure className="gauge" style={{ '--gauge': liquidColor(score) } as CSSProperties}>
      <svg viewBox="0 0 200 116" role="img" aria-label={`Overall risk ${score} out of 100`}>
        <path className="gauge__track" d="M 20 100 A 80 80 0 0 1 180 100" pathLength={100} />
        <path
          className="gauge__value"
          d="M 20 100 A 80 80 0 0 1 180 100"
          pathLength={100}
          strokeDasharray="100"
          strokeDashoffset={100 - shown}
        />
        <path className="gauge__tick" d={tick(40)} />
        <path className="gauge__tick" d={tick(70)} />
        <g className="gauge__needle" style={{ transform: `rotate(${shown * 1.8 - 90}deg)` }}>
          <line x1="100" y1="100" x2="100" y2="40" />
        </g>
        <circle className="gauge__hub" cx="100" cy="100" r="6" />
      </svg>
      <figcaption>
        <span className="gauge__level">{levelLabel[level]} risk</span>
        <span className="gauge__score">Overall {score} of 100</span>
      </figcaption>
    </figure>
  );
}
