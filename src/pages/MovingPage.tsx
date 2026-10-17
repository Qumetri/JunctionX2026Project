import { useRef, type FormEvent } from 'react';
import type { HousingType, MovingAnswers, SourceId, SourceStatus } from '../../shared/types';
import { Field, Toggle } from '../components/blocks';
import { useMovingAssessment } from '../state/movingPlan';
import './EventPage.css';
import './MovingPage.css';

const sourceLabels: Record<SourceId, string> = {
  geocode: 'Finding the address',
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

/**
 * Step one of the Moving journey: the risk calculation. A successful calculation goes straight
 * on to the moving plan, which shows the result.
 */
export function MovingPage() {
  const { plan, setPlan, report, calc, calculate } = useMovingAssessment();
  const toInput = useRef<HTMLInputElement>(null);

  const setAnswer = <K extends keyof MovingAnswers>(key: K, value: MovingAnswers[K]) =>
    setPlan({ ...plan, answers: { ...plan.answers, [key]: value } });

  const calculateRisk = async (event: FormEvent) => {
    event.preventDefault();
    if (!plan.to.trim()) {
      toInput.current?.focus();
      return;
    }
    if (await calculate(plan)) window.location.hash = '#moving-plan';
  };

  const loading = calc.phase === 'loading';
  const savedAddress = report?.signals.location?.label ?? report?.request.to;

  return (
    <section className="event-hero" aria-labelledby="moving-title">
      <div className="event-hero__inner">
        <h1 id="moving-title">Moving — Prepare better, stay protected</h1>
        <p className="event-hero__lead">
          Start with a risk check of your new address. We turn the result into a moving plan: the
          right cover, practical actions, help for the day and a checklist.
        </p>

        {savedAddress && !loading && (
          <aside className="plan-ready">
            <p>
              Your moving plan for <strong>{savedAddress}</strong> is ready. Change your answers
              below and calculate again to update it.
            </p>
            <a className="button button--soft button--small" href="#moving-plan">
              Open your moving plan
            </a>
          </aside>
        )}

        <div className="event-top risk-check">
          <form className="event-card" onSubmit={calculateRisk} aria-labelledby="risk-check-title">
            <h2 id="risk-check-title">Tell us about your move</h2>
            <div className="risk-check__fields">
              <Field icon="pin" label="Moving to" className="risk-check__wide">
                <input
                  ref={toInput}
                  value={plan.to}
                  onChange={(event) => setPlan({ ...plan, to: event.target.value })}
                  placeholder="Street and number, town"
                  autoComplete="street-address"
                  aria-invalid={calc.phase === 'error'}
                  required
                />
              </Field>
              <Field icon="pin" label="Moving from" className="risk-check__wide">
                <input
                  value={plan.from}
                  onChange={(event) => setPlan({ ...plan, from: event.target.value })}
                  placeholder="Current address"
                  autoComplete="off"
                />
              </Field>
              <Field icon="calendar" label="Moving date">
                <input
                  type="date"
                  value={plan.moveDate}
                  onChange={(event) => setPlan({ ...plan, moveDate: event.target.value })}
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
              {loading ? 'Calculating risk…' : 'Calculate risk'}
            </button>
            <p className="event-form__note">
              Nothing is sent to If. Your moving plan opens as soon as the check is done.
            </p>
          </form>

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
              Public data about the building, the area and moving day. No keys or sign-in needed.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
