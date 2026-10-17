import { useEffect, useState, type CSSProperties } from 'react';
import { homePlans } from '../../shared/data/homePlans';
import { planMatch, type Match } from '../../shared/engine/plans';
import { levelForScore, type ScoredFlag } from '../../shared/engine/score';
import { actions } from '../../shared/engine/rules';
import type { CategoryId, HousingType, Level, SourceStatus } from '../../shared/types';
import { Icon, type IconName } from '../components/Icon';
import { LiquidMeter } from '../components/LiquidMeter';
import { liquidColor } from '../components/liquidColor';
import { useMovingAssessment } from '../state/movingPlan';
import './RiskReportPage.css';

const categoryIcons: Record<CategoryId, IconName> = {
  transport: 'truck',
  schedule: 'clock',
  keys: 'key',
  property: 'building',
};

const levelLabel: Record<Level, string> = { low: 'Low', medium: 'Medium', high: 'High' };

const housingLabel: Record<HousingType, string> = {
  flat: 'Flat',
  terraced: 'Terraced house',
  detached: 'Detached house',
};

const gapIcons: Record<Match, IconName> = { full: 'check', partial: 'shield', none: 'alert' };
const gapLabel: Record<Match, string> = {
  full: 'Covered',
  partial: 'Partly covered',
  none: 'Not covered',
};
const gapClass: Record<Match, string> = { full: 'covered', partial: 'partial', none: 'gap' };

const sourceStatusText: Record<SourceStatus, string> = {
  live: 'checked now',
  cache: 'checked recently',
  reference: 'built-in figures',
  missing: 'no answer',
  skipped: 'not needed',
};

const euro = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

function formatMoveDate(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'Not set';
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

/** Points an action removes: its share of every flag it belongs to. */
function actionPoints(actionId: string, flags: ScoredFlag[]) {
  return Math.round(
    flags
      .filter((flag) => flag.actionIds.includes(actionId))
      .reduce((sum, flag) => sum + flag.total / flag.actionIds.length, 0),
  );
}

export function RiskReportPage() {
  const { plan, report, assessment, suggestion, doneActions, toggleAction } = useMovingAssessment();

  if (!report || !assessment || !suggestion) {
    return (
      <div className="report">
        <header className="report__intro">
          <h1>Your risk report</h1>
          <p>
            No report yet. Enter the address you're moving to on the Moving page and press Calculate
            risk.
          </p>
          <a className="button button--primary report__start" href="#moving">
            Go to Moving
          </a>
        </header>
      </div>
    );
  }

  const address = report.signals.location?.label ?? report.request.to;
  const suggested = homePlans[suggestion.suggested];
  const gaps = assessment.flags.filter(
    (flag) => flag.status !== 'handled' && flag.severity !== 'low',
  );

  return (
    <div className="report">
      <header className="report__intro">
        <h1>Your risk report</h1>
        <p>
          {plan.from ? `Moving from ${plan.from} to ${address}. ` : `Moving to ${address}. `}
          Every risk adds points to your score. Open a risk to see where its points come from, and
          tick off actions to remove them.
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
                <dd>{address}</dd>
              </div>
              <div>
                <dt>New home</dt>
                <dd>
                  {housingLabel[plan.answers.housing]}, {plan.homeSizeM2} m²
                  {report.signals.building?.year ? `, built ${report.signals.building.year}` : ''}
                </dd>
              </div>
              <div>
                <dt>Ready for moving day</dt>
                <dd>{assessment.readiness}%</dd>
              </div>
            </dl>
            <RiskGauge score={assessment.score} />
          </div>
        </article>

        <div className="risk-grid">
          {assessment.categories.map((category) => (
            <article className="risk-card" key={category.id}>
              <div className="risk-card__head">
                <span className="icon-tile icon-tile--small">
                  <Icon name={categoryIcons[category.id]} />
                </span>
                <h3 className="risk-card__title">
                  {category.name}
                  <span className={`level-text level-text--${category.level}`}>
                    {category.flags.length === 0
                      ? 'No risks found'
                      : category.points === 0
                        ? 'Handled'
                        : `${levelLabel[category.level]}, ${category.points} points`}
                  </span>
                </h3>
              </div>

              <ul className="risk-card__flags">
                {category.flags.map((flag) => {
                  const handled = flag.status === 'handled';
                  return (
                    <li key={flag.id}>
                      <details className={handled ? 'flag flag--resolved' : 'flag'}>
                        <summary>
                          <span
                            className={`flag__dot flag__dot--${handled ? 'resolved' : flag.severity}`}
                            aria-hidden="true"
                          />
                          <span className="flag__title">{flag.title}</span>
                          <span className="flag__points">{handled ? '0' : `+${flag.open}`}</span>
                          <span className="visually-hidden">
                            {handled ? ', handled' : `, ${flag.severity} risk`}
                          </span>
                        </summary>
                        <div className="flag__body">
                          <p>{flag.why}</p>
                          <ul className="flag__lines" aria-label="Where the points come from">
                            {flag.points.map((line) => (
                              <li key={line.label}>
                                <span>+{line.points}</span>
                                {line.label}
                              </li>
                            ))}
                            {flag.doneActions > 0 && (
                              <li className="flag__lines-done">
                                <span>−{flag.total - flag.open}</span>
                                {flag.doneActions} of {flag.actionIds.length} actions done
                              </li>
                            )}
                          </ul>
                          {flag.estimateEur !== undefined && (
                            <p className="flag__estimate">
                              Average claim in Finland: {euro.format(flag.estimateEur)}
                            </p>
                          )}
                          {flag.evidence.map((line) => (
                            <p className="flag__evidence" key={line}>
                              {line}
                            </p>
                          ))}
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
          <p>Tick off what you have done. Each action removes its share of the points.</p>
        </div>
        <div className="actions-panel">
          {assessment.categories
            .filter((category) => category.flags.length > 0)
            .map((category) => {
              const ids = [...new Set(category.flags.flatMap((flag) => flag.actionIds))];
              return (
                <div className="actions-group" key={category.id}>
                  <h3 className="actions-group__title">{category.name}</h3>
                  <ul className="actions-group__list">
                    {ids.map((id) => {
                      const action = actions[id];
                      return (
                        <li key={id}>
                          <label className="action">
                            <input
                              type="checkbox"
                              checked={doneActions.has(id)}
                              onChange={() => toggleAction(id)}
                            />
                            <span className="action__text">
                              {action.title}
                              <span className="action__points">
                                −{actionPoints(id, assessment.flags)} points
                              </span>
                              {action.partnerOffer && (
                                <span className="action__offer">{action.partnerOffer}</span>
                              )}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
        </div>
      </section>

      <section className="report__section" aria-labelledby="gaps-title">
        <div className="section-head">
          <h2 id="gaps-title">Protection gap check</h2>
          <p>Your medium and high risks against the suggested level, {suggested.name}.</p>
        </div>
        {gaps.length === 0 ? (
          <p className="report__empty">No medium or high risks are left open.</p>
        ) : (
          <ul className="gaps-panel">
            {gaps.map((flag) => {
              const match = planMatch(suggestion.suggested, flag);
              return (
                <li className={`gap gap--${gapClass[match]}`} key={flag.id}>
                  <span className="gap__icon">
                    <Icon name={gapIcons[match]} />
                  </span>
                  <div className="gap__text">
                    <p className="gap__status">{gapLabel[match]}</p>
                    <h3 className="gap__title">{flag.title}</h3>
                    <p className="gap__detail">
                      {match === 'full'
                        ? `${suggested.name} pays if this happens.`
                        : match === 'partial'
                          ? `${suggested.name} pays up to its per-item limit. LaajaPlus raises it to €17,000.`
                          : 'Home insurance does not pay for this. The actions above lower it.'}
                    </p>
                    {match !== 'none' && (
                      <a className="gap__link" href="#moving">
                        Compare home insurance levels
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <footer className="report__sources">
        <p>
          Data:{' '}
          {report.signals.sources
            .map(
              (source) =>
                `${source.provider}, ${source.dataset} (${sourceStatusText[source.status]})`,
            )
            .join('; ')}
          . Claim figures from Finance Finland and Pelastusopisto PRONTO.
        </p>
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
