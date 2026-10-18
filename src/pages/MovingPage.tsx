import { useEffect, useRef, useState, type FormEvent } from 'react';
import { RoughNotation } from 'react-rough-notation';
import { assess } from '../../shared/engine/score';
import type {
  CategoryId,
  HousingType,
  MovingAnswers,
  SourceId,
  SourceStatus,
} from '../../shared/types';
import type { MovingReport } from '../api/report';
import { Field, RiskRows, Toggle } from '../components/blocks';
import { AddressField } from '../components/AddressField';
import type { IconName } from '../components/Icon';
import { LiquidRing } from '../components/LiquidRing';
import { isPastDate, todayIso } from '../state/dates';
import { useMovingAssessment, type StaleField } from '../state/movingPlan';
import './EventPage.css';
import './MovingPage.css';

const sourceLabels: Record<SourceId, string> = {
  geocode: 'Finding the address',
  route: 'Distance between the addresses (OSRM)',
  building: 'Building register (HSY)',
  flood: 'Flood risk areas (SYKE)',
  crime: 'Burglary and arson rates (Statistics Finland)',
  accidents: 'Road accidents (Statistics Finland)',
  weather: 'Moving-day forecast (Open-Meteo)',
  traffic: 'Traffic announcements (Digitraffic)',
};

const statusLabels: Record<SourceStatus, string> = {
  live: 'Checked',
  cache: 'Checked',
  reference: 'Built-in 2025 figures',
  missing: 'No answer',
  skipped: 'Not needed',
};

const answerToggles: { key: Exclude<keyof MovingAnswers, 'housing'>; label: string }[] = [
  { key: 'selfMove', label: 'I move my things myself' },
  { key: 'valuables', label: 'Fragile or valuable items' },
  { key: 'groundFloor', label: 'Ground floor or street-level windows' },
  { key: 'renting', label: 'Renting the new home' },
  { key: 'dog', label: 'I have a dog' },
  { key: 'hasHomeInsurance', label: 'I already have home insurance' },
];

const levelLabel = { low: 'Low', medium: 'Medium', high: 'High' } as const;

const categoryIcons: Record<CategoryId, IconName> = {
  transport: 'truck',
  schedule: 'clock',
  keys: 'key',
  property: 'building',
};

const staleLabels: Record<StaleField, string> = {
  to: 'the new address',
  from: 'your current address',
  moveDate: 'the moving date',
};

function listOf(items: string[]) {
  if (items.length < 2) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/**
 * Step one of the Moving journey: the risk calculation. A successful calculation goes straight
 * on to the moving plan, which shows the result.
 */
export function MovingPage() {
  const { plan, setPlan, report, calc, calculate, assessment, stale } = useMovingAssessment();
  const toInput = useRef<HTMLInputElement>(null);
  const dateInput = useRef<HTMLInputElement>(null);
  const [highlighted, setHighlighted] = useState(false);
  const datePast = isPastDate(plan.moveDate);

  // C90: the hand-drawn highlight is drawn a moment after the page opens.
  useEffect(() => {
    const timer = window.setTimeout(() => setHighlighted(true), 300);
    return () => window.clearTimeout(timer);
  }, []);

  const setAnswer = <K extends keyof MovingAnswers>(key: K, value: MovingAnswers[K]) =>
    setPlan({ ...plan, answers: { ...plan.answers, [key]: value } });

  const calculateRisk = async (event: FormEvent) => {
    event.preventDefault();
    if (!plan.to.trim()) {
      toInput.current?.focus();
      return;
    }
    if (datePast) {
      dateInput.current?.focus();
      return;
    }
    // Answers already count; only new addresses or a new date need fresh open data.
    if (report && stale.length === 0) {
      window.location.hash = '#moving-plan';
      return;
    }
    if (await calculate(plan)) window.location.hash = '#moving-plan';
  };

  const loading = calc.phase === 'loading';
  const submitLabel = loading
    ? 'Calculating risk…'
    : !report
      ? 'Calculate risk'
      : stale.length > 0
        ? 'Calculate again'
        : 'Open your moving plan';

  return (
    <section className="event-hero" aria-labelledby="moving-title">
      <div className="event-hero__inner">
        <h1 id="moving-title">
          Moving —{' '}
          <RoughNotation
            type="highlight"
            show={highlighted}
            color="#ffe27a"
            animationDuration={800}
            animate={!window.matchMedia('(prefers-reduced-motion: reduce)').matches}
          >
            Prepare better
          </RoughNotation>
          , stay protected
        </h1>
        <p className="event-hero__lead">
          Start with a risk check of your new address. We turn the result into a moving plan: the
          right cover, practical actions, help for the day and a checklist.
        </p>

        <div className="event-top risk-check">
          <form className="event-card" onSubmit={calculateRisk} aria-labelledby="risk-check-title">
            <h2 id="risk-check-title">Tell us about your move</h2>
            <div className="risk-check__fields">
              <AddressField
                icon="pin"
                label="Moving to"
                className="risk-check__wide"
                inputRef={toInput}
                value={plan.to}
                onChange={(to) => setPlan({ ...plan, to })}
                placeholder="Street and number, town"
                invalid={calc.phase === 'error'}
                required
              />
              <AddressField
                icon="pin"
                label="Moving from"
                className="risk-check__wide"
                value={plan.from}
                onChange={(from) => setPlan({ ...plan, from })}
                placeholder="Current address"
              />
              <Field icon="calendar" label="Moving date">
                <input
                  ref={dateInput}
                  type="date"
                  min={todayIso()}
                  value={plan.moveDate}
                  onChange={(event) => setPlan({ ...plan, moveDate: event.target.value })}
                  aria-invalid={datePast}
                  required
                />
              </Field>
              <Field icon="ruler" label="Home size, m²">
                <input
                  type="number"
                  min={10}
                  max={500}
                  inputMode="numeric"
                  value={plan.homeSizeM2}
                  onChange={(event) => setPlan({ ...plan, homeSizeM2: Number(event.target.value) })}
                  required
                />
              </Field>
              <Field icon="home" label="Home type">
                <select
                  value={plan.answers.housing}
                  onChange={(event) => setAnswer('housing', event.target.value as HousingType)}
                >
                  <option value="flat">Flat</option>
                  <option value="terraced">Terraced house</option>
                  <option value="detached">Detached house</option>
                </select>
              </Field>
            </div>
            {datePast && (
              <p className="risk-form__error" role="alert">
                The moving date can’t be in the past. Pick today or a later date.
              </p>
            )}

            <fieldset className="risk-check__answers">
              <legend>About your move</legend>
              {answerToggles.map(({ key, label }) => (
                <Toggle
                  key={key}
                  label={label}
                  checked={plan.answers[key]}
                  onChange={(value) => setAnswer(key, value)}
                />
              ))}
            </fieldset>

            {calc.phase === 'error' && (
              <p className="risk-form__error" role="alert">
                {calc.message}
              </p>
            )}
            <button
              className="button button--primary event-form__submit"
              type="submit"
              disabled={loading}
            >
              {submitLabel}
            </button>
            <p className="event-form__note">
              Nothing is sent to IF. Your moving plan opens as soon as the check is done.
            </p>
          </form>

          <div className="risk-check__side">
            {report && assessment && !loading && (
              <LiveRisk report={report} assessment={assessment} stale={stale} />
            )}
            <article className="event-card" aria-busy={loading}>
              <h2>What we check</h2>
              <ul className="source-progress" aria-live="polite">
                {(Object.keys(sourceLabels) as SourceId[]).map((id) => {
                  const status = calc.phase === 'loading' ? calc.progress[id] : undefined;
                  const state = calc.phase !== 'loading' ? 'idle' : (status ?? 'pending');
                  return (
                    <li key={id} className={`is-${state}`}>
                      <span>{sourceLabels[id]}</span>
                      {state !== 'idle' && (
                        <span className="source-progress__status">
                          {status ? statusLabels[status] : 'Checking…'}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
              <p className="event-form__note">
                Public data about the building, the area, the route and moving day. No keys or
                sign-in needed.
              </p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * The risk for the last calculated address, re-scored on every answer. Points that need new open
 * data (another address or date) wait for Calculate again.
 */
function LiveRisk({
  report,
  assessment,
  stale,
}: {
  report: MovingReport;
  assessment: ReturnType<typeof assess>;
  stale: StaleField[];
}) {
  const calculated = assess(report.flags, new Set()).score;
  const change = assessment.score - calculated;
  const address = report.signals.location?.label ?? report.request.to;
  const top = assessment.flags.slice(0, 3);

  return (
    <article className="event-card live-risk" aria-labelledby="live-risk-title">
      <h2 id="live-risk-title">Your risk now</h2>
      <div className="live-risk__body">
        <LiquidRing value={assessment.score} label={`Moving risk ${assessment.score} of 100`}>
          <span className="preview__caption-level">{levelLabel[assessment.level]} risk</span>
        </LiquidRing>
        <div className="live-risk__text" aria-live="polite">
          <p className="live-risk__address">{address}</p>
          {change !== 0 && (
            <p className={change > 0 ? 'live-risk__change is-up' : 'live-risk__change is-down'}>
              {change > 0 ? `+${change}` : change} points since the last check
            </p>
          )}
          <p className="live-risk__note">
            {stale.length > 0
              ? `You changed ${listOf(stale.map((field) => staleLabels[field]))}. Calculate again to check them.`
              : 'Updates as you change your answers.'}
          </p>
        </div>
      </div>
      {top.length > 0 && (
        <RiskRows
          rows={top.map((flag) => ({
            id: flag.id,
            name: flag.title,
            level: flag.severity,
            icon: categoryIcons[flag.category],
          }))}
        />
      )}
    </article>
  );
}
