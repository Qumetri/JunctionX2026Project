import { useRef, type FormEvent } from 'react';
import type { Assessment } from '../../shared/engine/score';
import type { HousingType, MovingAnswers, SourceId, SourceStatus } from '../../shared/types';
import { Checklist, Field, ServiceCard, Toggle } from '../components/blocks';
import { LiquidMeter } from '../components/LiquidMeter';
import { LiquidRing } from '../components/LiquidRing';
import { PlanPicker } from '../components/PlanPicker';
import { useMovingAssessment, type CalcState } from '../state/movingPlan';
import { storageKeys, useStoredSet } from '../state/useStoredSet';
import './EventPage.css';
import './MovingPage.css';

const levelLabel = { low: 'Low', medium: 'Medium', high: 'High' } as const;

const checklistItems = [
  { id: 'pack-essentials', label: 'Pack essentials early', hint: 'Documents, chargers, medicine' },
  { id: 'address-keys', label: 'Confirm address and keys', hint: 'Count keys at handover' },
  {
    id: 'transport-cover',
    label: 'Check transport coverage',
    hint: 'Perus level does not cover moving damage',
  },
  { id: 'emergency-contacts', label: 'Save emergency contacts', hint: 'Landlord, housing company' },
  { id: 'smoke-alarms', label: 'Test smoke alarms', hint: 'On your first evening' },
];

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

export function MovingPage() {
  const { plan, setPlan, report, calc, calculate, assessment, suggestion } = useMovingAssessment();
  const [checked, toggleChecked] = useStoredSet(storageKeys.movingChecklist);
  const toInput = useRef<HTMLInputElement>(null);

  const setAnswer = <K extends keyof MovingAnswers>(key: K, value: MovingAnswers[K]) =>
    setPlan({ ...plan, answers: { ...plan.answers, [key]: value } });

  const calculateRisk = (event: FormEvent) => {
    event.preventDefault();
    void calculate(plan);
  };

  const createPlan = async (event: FormEvent) => {
    event.preventDefault();
    if (!plan.to.trim()) {
      toInput.current?.focus();
      return;
    }
    // Recalculate so the forecast and traffic checks use the plan's moving date.
    if (await calculate(plan)) window.location.hash = '#risk-report';
  };

  const loading = calc.phase === 'loading';

  return (
    <>
      <section className="event-hero" aria-labelledby="moving-title">
        <div className="event-hero__inner">
          <h1 id="moving-title">Moving — Prepare better, stay protected</h1>
          <p className="event-hero__lead">
            Compare verified movers, rent a van or tools, get practical checklists and add
            single-trip insurance by If.
          </p>

          <div className="event-top">
            <form className="event-card risk-form" onSubmit={calculateRisk}>
              <h2>Where are you moving?</h2>
              <Field icon="pin" label="Moving to">
                <input
                  ref={toInput}
                  value={plan.to}
                  onChange={(event) => setPlan({ ...plan, to: event.target.value })}
                  placeholder="Street and number, town"
                  autoComplete="street-address"
                  aria-describedby="risk-form-note"
                  aria-invalid={calc.phase === 'error'}
                  required
                />
              </Field>
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
              <p className="event-form__note" id="risk-form-note">
                We check the building, the area and moving day against public data. Nothing is sent
                to If.
              </p>
            </form>

            <RiskPreview
              calc={calc}
              assessment={assessment}
              address={report?.signals.location?.label}
            />
          </div>
        </div>
      </section>

      <div className="event-body">
        {assessment && suggestion && (
          <PlanPicker
            suggestion={suggestion}
            flags={assessment.flags}
            detached={plan.answers.housing === 'detached'}
          />
        )}

        <form className="event-card plan-block" onSubmit={createPlan} aria-labelledby="plan-title">
          <div className="plan-block__head">
            <h2 id="plan-title">Create moving plan</h2>
            <p>
              Tell us a bit more and your risk score updates as you answer. The plan turns every
              risk into a dated step.
            </p>
          </div>
          <div className="plan-block__fields">
            <Field icon="pin" label="Moving from">
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
          <fieldset className="plan-block__answers">
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
          <div className="plan-block__footer">
            <button className="button button--primary" type="submit" disabled={loading}>
              Create moving plan
            </button>
            {!plan.to.trim() && (
              <p className="event-form__note">Add the address you're moving to first.</p>
            )}
          </div>
        </form>

        <section className="event-services" aria-label="Moving services">
          <ServiceCard
            icon="tag"
            title="Verified mover discounts"
            action={
              <a className="button button--primary button--small" href="#risk-report">
                View discounts
              </a>
            }
          >
            <p>Movers who carry their own liability cover, at a member price.</p>
          </ServiceCard>
          <ServiceCard
            icon="wrench"
            title="Van and tool rental"
            action={
              <a className="button button--primary button--small" href="#risk-report">
                Book rental
              </a>
            }
          >
            <p>Dollies, straps and a van for the day. Free tool rental for annual members.</p>
          </ServiceCard>
          <ServiceCard
            icon="shield"
            title="Single-trip insurance by If"
            action={
              <a className="button button--primary button--small" href="#risk-report">
                Get a quote
              </a>
            }
          >
            <p>Cover for things that break on moving day, if your home insurance leaves it out.</p>
          </ServiceCard>
        </section>

        <Checklist
          id="moving-checklist"
          title="Moving checklist"
          items={checklistItems}
          done={checked}
          onToggle={toggleChecked}
        />
      </div>
    </>
  );
}

const previewLimit = 5;

function RiskPreview({
  calc,
  assessment,
  address,
}: {
  calc: CalcState;
  assessment?: Assessment;
  address?: string;
}) {
  if (calc.phase === 'loading') {
    return (
      <article className="event-card" aria-busy="true">
        <h2>Moving risk preview</h2>
        <ul className="source-progress" aria-live="polite">
          {(Object.keys(sourceLabels) as SourceId[]).map((id) => {
            const status = calc.progress[id];
            return (
              <li key={id} className={status ? `is-${status}` : 'is-pending'}>
                <span>{sourceLabels[id]}</span>
                <span className="source-progress__status">
                  {status ? statusLabels[status] : 'Checking…'}
                </span>
              </li>
            );
          })}
        </ul>
      </article>
    );
  }

  if (!assessment) {
    return (
      <article className="event-card">
        <h2>Moving risk preview</h2>
        <div className="preview">
          <p className="preview__empty">
            Enter the address you're moving to and press Calculate risk. Each risk we find adds
            points to your score, and each step you take removes them.
          </p>
          <LiquidRing value={0} label="No risk score yet">
            <span className="preview__caption-level">No score yet</span>
          </LiquidRing>
        </div>
      </article>
    );
  }

  const open = assessment.flags.filter((flag) => flag.status !== 'handled');
  const shown = open.slice(0, previewLimit);
  const more = open.length - shown.length;

  return (
    <article className="event-card">
      <h2>Moving risk preview</h2>
      {address && <p className="preview__address">{address}</p>}
      <div className="preview">
        <ul className="preview-flags">
          {shown.map((flag) => (
            <li key={flag.id}>
              <span className={`flag__dot flag__dot--${flag.severity}`} aria-hidden="true" />
              <span className="preview-flags__title">
                {flag.title}
                <span className="visually-hidden">, {flag.severity} risk</span>
              </span>
              <span className="preview-flags__points">+{flag.open}</span>
            </li>
          ))}
          {open.length === 0 && <li>Every risk is handled.</li>}
        </ul>
        <LiquidRing
          value={assessment.score}
          label={`Overall moving risk ${assessment.score} of 100`}
        >
          <span className="preview__caption-level">{levelLabel[assessment.level]} risk</span>
          <span className="preview__caption-sub">{assessment.score} of 100 points</span>
        </LiquidRing>
      </div>
      {more > 0 && (
        <p className="preview__more">
          {more} more {more === 1 ? 'risk' : 'risks'} in the detailed overview
        </p>
      )}
      <div className="preview__progress">
        <span>{assessment.readiness}% ready for moving day</span>
        <LiquidMeter value={assessment.readiness} variant="progress" label="Moving readiness" />
      </div>
      <a className="button button--soft preview__overview" href="#risk-report">
        See detailed overview
      </a>
    </article>
  );
}
