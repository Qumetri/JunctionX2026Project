import { useEffect, useRef, useState, type FormEvent } from 'react';
import { RoughNotation } from 'react-rough-notation';
import { destinations, travelPurposes } from '../../shared/data/destinations';
import { travelCover } from '../../shared/data/travelCover';
import { travelActions } from '../../shared/engine/travelRules';
import { travelSummaryInput } from '../../shared/engine/travelSummary';
import type {
  Level,
  SourceStatus,
  TravelCategoryId,
  TravelPurpose,
  TravelSourceId,
} from '../../shared/types';
import { Field, RiskRows, ServiceCard, Toggle } from '../components/blocks';
import { FlagItem } from '../components/FlagItem';
import { Icon, type IconName } from '../components/Icon';
import { LiquidMeter } from '../components/LiquidMeter';
import { LiquidRing } from '../components/LiquidRing';
import { StepBoard } from '../components/StepBoard';
import { isPastDate, todayIso } from '../state/dates';
import { useTravelAssessment } from '../state/travelPlan';
import { storageKeys, useStoredBoard } from '../state/useStoredSet';
import { useTravelSummary } from '../state/useTravelSummary';
import '../components/ReportSummary.css';
import './EventPage.css';
import './MovingPage.css';
import './TravelPage.css';

const levelLabel: Record<Level, string> = { low: 'Low', medium: 'Medium', high: 'High' };

const categoryIcons: Record<TravelCategoryId, IconName> = {
  health: 'heart',
  trip: 'plane',
  destination: 'globe',
  belongings: 'tag',
};

const sourceLabels: Record<TravelSourceId, string> = {
  advisory: 'Travel advice (UK Foreign Office)',
  weather: 'Weather on your dates (Open-Meteo)',
  departure: 'Departure-day forecast at Helsinki Airport',
  hazards: 'Disaster alerts near your destination (GDACS)',
};

const sourceIds = Object.keys(sourceLabels) as TravelSourceId[];

/** How long each source stays on screen before the next one is shown as checking. */
const sourceDwellMs = 500;

const statusLabels: Record<SourceStatus, string> = {
  live: 'Checked',
  cache: 'Checked',
  reference: 'Built-in figures',
  missing: 'No answer',
  skipped: 'Not needed',
};

const sourceStatusText: Record<SourceStatus, string> = {
  live: 'checked now',
  cache: 'checked recently',
  reference: 'built-in figures',
  missing: 'no answer',
  skipped: 'not needed',
};

const dayMs = 86_400_000;

const shortDate = (date: Date) =>
  date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });

/** "By 15 December", from how many days before departure a step is due. */
function dueHint(startDate: string, dueDays: number) {
  if (dueDays === 0) return 'On the day or during the trip';
  const due = new Date(new Date(`${startDate}T00:00:00Z`).getTime() - dueDays * dayMs);
  const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  return due < today ? 'As soon as you can' : `By ${shortDate(due)}`;
}

function tripLength(startDate: string, endDate: string) {
  const days =
    Math.round(
      (new Date(`${endDate}T00:00:00Z`).getTime() - new Date(`${startDate}T00:00:00Z`).getTime()) /
        dayMs,
    ) + 1;
  return Number.isFinite(days) && days > 0 ? days : 1;
}

export function TravelPage() {
  const {
    trip,
    setTrip,
    report,
    calc,
    calculate,
    stale,
    request,
    assessment,
    facts,
    place,
    cover,
  } = useTravelAssessment();
  const [board, setBoard] = useStoredBoard(storageKeys.travelBoard);
  const detailsRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const leavingInput = useRef<HTMLInputElement>(null);
  const returnInput = useRef<HTMLInputElement>(null);
  const [highlighted, setHighlighted] = useState(false);
  const leavingPast = isPastDate(trip.startDate);
  const returnPast = isPastDate(trip.endDate);
  const dateError = leavingPast
    ? 'The leaving date can’t be in the past. Pick today or a later date.'
    : returnPast
      ? 'The coming-back date can’t be in the past. Pick today or a later date.'
      : '';

  // C90: the hand-drawn highlight is drawn a moment after the page opens.
  useEffect(() => {
    const timer = window.setTimeout(() => setHighlighted(true), 300);
    return () => window.clearTimeout(timer);
  }, []);

  const summaryInput =
    assessment && facts && cover && place && request
      ? travelSummaryInput(assessment, facts, cover, {
          destination: place.name,
          startDate: request.startDate,
          endDate: request.endDate,
        })
      : undefined;
  const brief = useTravelSummary(summaryInput);

  const loading = calc.phase === 'loading';

  // The four checks run in parallel, but the list shows them one at a time: a source is marked
  // checked only once its result is in and its turn has come, so the check reads as a sequence.
  const progress = calc.phase === 'loading' ? calc.progress : {};
  const [turn, setTurn] = useState(0);
  const currentReady =
    loading && turn < sourceIds.length && progress[sourceIds[turn]] !== undefined;
  useEffect(() => {
    if (!currentReady) return;
    const timer = window.setTimeout(() => setTurn((n) => n + 1), sourceDwellMs);
    return () => window.clearTimeout(timer);
  }, [currentReady, turn]);

  const setAnswer = <K extends keyof typeof trip.answers>(
    key: K,
    value: (typeof trip.answers)[K],
  ) => setTrip({ ...trip, answers: { ...trip.answers, [key]: value } });

  const showDetails = () =>
    requestAnimationFrame(() => detailsRef.current?.scrollIntoView({ block: 'start' }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (leavingPast || returnPast) {
      (leavingPast ? leavingInput : returnInput).current?.focus();
      return;
    }
    setTurn(0);
    await calculate(trip);
    showDetails();
  };

  // Preparation steps from the open flags, earliest deadline first.
  const stepIds = [...new Set(assessment?.flags.flatMap((flag) => flag.actionIds) ?? [])];
  const steps = stepIds
    .map((id) => travelActions[id])
    .filter(Boolean)
    .sort((a, b) => b.dueDays - a.dueDays)
    .map((action) => ({
      id: action.id,
      label: action.title,
      hint: request ? dueHint(request.startDate, action.dueDays) : undefined,
    }));
  const doneCount = steps.filter((step) => board.done.includes(step.id)).length;
  const readiness = steps.length === 0 ? 0 : Math.round((doneCount / steps.length) * 100);

  const formDays = tripLength(trip.startDate, trip.endDate);
  const formDaysUntil = Math.round(
    (new Date(`${trip.startDate}T00:00:00Z`).getTime() -
      new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`).getTime()) /
      dayMs,
  );
  const tripLabel = `${formDays} ${formDays === 1 ? 'day' : 'days'}, ${
    formDaysUntil > 0 ? `leaving in ${formDaysUntil} days` : 'already started'
  }`;

  return (
    <>
      <section className="event-hero" aria-labelledby="travel-title">
        <div className="event-hero__inner">
          <h1 id="travel-title">
            Travel — Check risks{' '}
            <RoughNotation
              type="highlight"
              show={highlighted}
              color="#ffe27a"
              animationDuration={800}
              animate={!window.matchMedia('(prefers-reduced-motion: reduce)').matches}
            >
              before
            </RoughNotation>{' '}
            you go
          </h1>
          <p className="event-hero__lead">
            The season, how soon you leave and how long you stay all change what can go wrong. Check
            your trip against live travel advice, weather and disaster alerts, and get a plan for
            the weeks before you go.
          </p>

          <div className="event-top">
            <form className="event-card" onSubmit={submit} ref={formRef}>
              <h2>Travel risk check</h2>
              <div className="event-form__grid">
                <Field icon="globe" label="Destination">
                  <select
                    value={trip.destinationId}
                    onChange={(event) => setTrip({ ...trip, destinationId: event.target.value })}
                  >
                    {destinations.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field icon="compass" label="Purpose of travel">
                  <select
                    value={trip.answers.purpose}
                    onChange={(event) => setAnswer('purpose', event.target.value as TravelPurpose)}
                  >
                    {travelPurposes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field icon="calendar" label="Leaving">
                  <input
                    ref={leavingInput}
                    type="date"
                    min={todayIso()}
                    aria-invalid={leavingPast}
                    value={trip.startDate}
                    onChange={(event) => {
                      const startDate = event.target.value;
                      const endDate = trip.endDate < startDate ? startDate : trip.endDate;
                      setTrip({ ...trip, startDate, endDate });
                    }}
                    required
                  />
                </Field>
                <Field icon="calendar" label="Coming back">
                  <input
                    ref={returnInput}
                    type="date"
                    value={trip.endDate}
                    min={trip.startDate}
                    aria-invalid={returnPast}
                    onChange={(event) => setTrip({ ...trip, endDate: event.target.value })}
                    required
                  />
                </Field>
              </div>
              {dateError && (
                <p className="travel-form__error" role="alert">
                  {dateError}
                </p>
              )}
              <div className="travel-form__toggles">
                <Toggle
                  label="Travelling with a pet"
                  checked={trip.answers.withPet}
                  onChange={(value) => setAnswer('withPet', value)}
                />
                <Toggle
                  label="I already have travel insurance"
                  checked={trip.answers.hasTravelInsurance}
                  onChange={(value) => setAnswer('hasTravelInsurance', value)}
                />
              </div>
              <p className="event-form__note">{tripLabel}</p>
              {stale && !loading && (
                <p className="travel-form__stale" role="status">
                  You changed the destination or dates. Check again to update the weather and travel
                  advice.
                </p>
              )}
              <button
                className="button button--primary event-form__submit"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Checking your trip…' : report ? 'Check again' : 'Check travel risks'}
              </button>
            </form>

            {assessment && place && !loading ? (
              <article className="event-card" aria-labelledby="snapshot-title">
                <h2 id="snapshot-title">Risk snapshot</h2>
                <div className="preview">
                  <RiskRows
                    rows={assessment.categories.map((category) => ({
                      id: category.id,
                      name: category.name,
                      level: category.level,
                      icon: categoryIcons[category.id],
                    }))}
                  />
                  <LiquidRing
                    value={assessment.score}
                    label={`Overall travel risk ${assessment.score} of 100`}
                  >
                    <span className="preview__caption-level">
                      {levelLabel[assessment.level]} risk
                    </span>
                    <span className="preview__caption-sub">{place.name}</span>
                  </LiquidRing>
                </div>
                <ul className="snapshot-flags" aria-label="Biggest risks">
                  {assessment.flags.slice(0, 3).map((flag) => (
                    <li key={flag.id}>
                      <span
                        className={`flag__dot flag__dot--${flag.severity}`}
                        aria-hidden="true"
                      />
                      <span className="snapshot-flags__title">{flag.title}</span>
                      <span className="snapshot-flags__points">+{flag.open}</span>
                    </li>
                  ))}
                </ul>
                <div className="preview__progress">
                  <span>{readiness}% of your preparation done</span>
                  <LiquidMeter value={readiness} variant="progress" label="Travel readiness" />
                </div>
                <button
                  type="button"
                  className="button button--soft preview__overview"
                  onClick={showDetails}
                >
                  See the detailed overview
                </button>
              </article>
            ) : (
              <article className="event-card" aria-busy={loading}>
                <h2>What we check</h2>
                <ul className="source-progress" aria-live="polite">
                  {sourceIds.map((id, index) => {
                    const status = progress[id];
                    const done = loading && index < turn;
                    const state = !loading
                      ? 'idle'
                      : done
                        ? (status ?? 'pending')
                        : index === turn
                          ? 'pending'
                          : 'waiting';
                    const text =
                      state === 'waiting'
                        ? 'Waiting'
                        : done && status
                          ? statusLabels[status]
                          : 'Checking…';
                    return (
                      <li key={id} className={`is-${state}`}>
                        <span>{sourceLabels[id]}</span>
                        {state !== 'idle' && (
                          <span key={text} className="source-progress__status">
                            {text}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <p className="event-form__note">
                  Public data, no sign-in. Trips more than 16 days away use the weather on the same
                  dates last year.
                </p>
              </article>
            )}
          </div>
        </div>
      </section>

      <div className="event-body">
        {report && assessment && request && place && brief && (
          <section className="trip" ref={detailsRef} aria-labelledby="trip-title">
            <header className="trip__head">
              <h2 id="trip-title">Your trip to {place.name}</h2>
              <p>
                {summaryInput?.dates}, {facts?.length} days
                {facts && facts.daysUntil > 0 ? `, leaving in ${facts.daysUntil} days` : ''}
                {facts?.peak ? `. ${facts.peak}.` : '.'} Every risk adds points to your score; open
                one to see where they come from.
              </p>
            </header>

            <div className="trip__lead">
              <section
                className="report-summary"
                aria-labelledby="trip-summary-title"
                aria-busy={brief.writing}
              >
                <h2 id="trip-summary-title">In short</h2>
                <div className="report-summary__text" key={brief.summary.source} aria-live="polite">
                  <p>{brief.summary.overview}</p>
                  {brief.summary.cover && <p>{brief.summary.cover}</p>}
                </div>
                <p className="report-summary__source">
                  {brief.writing
                    ? 'Writing a summary with the local AI model…'
                    : brief.summary.source === 'ai'
                      ? `Written by a local AI model (${brief.summary.model}) from the results below. It runs on this computer.`
                      : brief.summary.reason === 'rejected'
                        ? "Built from the results below. The local AI model's answer didn't pass our checks."
                        : 'Built from the results below. The local AI model was not available.'}
                </p>
              </section>
              <article className="cover-card" aria-labelledby="cover-title">
                <span className="icon-tile icon-tile--small">
                  <Icon name="shield" />
                </span>
                <h2 id="cover-title">{cover?.name}</h2>
                <p>{cover?.reason}</p>
                <ul>
                  <li>Medical costs abroad: no deductible and no upper limit</li>
                  <li>
                    Cancellation for illness: up to €
                    {travelCover.cancellationLimitEur.toLocaleString('en-GB')} per person
                  </li>
                  <li>
                    Cancellation cover needs the policy at least {travelCover.buyDaysBefore} days
                    before you leave
                  </li>
                </ul>
                <a className="button button--primary button--small" href={travelCover.url}>
                  See IF travel insurance
                </a>
              </article>
            </div>

            <div className="trip__grid">
              {assessment.categories.map((category) => (
                <article className="trip-card" key={category.id}>
                  <div className="trip-card__head">
                    <span className="icon-tile icon-tile--small">
                      <Icon name={categoryIcons[category.id]} />
                    </span>
                    <h3>
                      {category.name}
                      <span className={`level-text level-text--${category.level}`}>
                        {category.flags.length === 0
                          ? 'No risks found'
                          : `${levelLabel[category.level]}, ${category.points} points`}
                      </span>
                    </h3>
                  </div>
                  {category.flags.length > 0 && (
                    <ul className="trip-card__flags">
                      {category.flags.map((flag) => (
                        <li key={flag.id}>
                          <FlagItem flag={flag} />
                        </li>
                      ))}
                    </ul>
                  )}
                  <LiquidMeter
                    className="trip-card__meter"
                    value={category.score}
                    label={`${category.name} risk score`}
                  />
                </article>
              ))}
            </div>

            <section className="tips" aria-labelledby="tips-title" aria-busy={brief.writing}>
              <div className="tips__head">
                <h2 id="tips-title">Tips for this trip</h2>
                <p>
                  {brief.writing
                    ? 'The local AI model is tailoring these to your trip…'
                    : brief.summary.tipsSource === 'ai'
                      ? `Tailored to your trip by a local AI model (${brief.summary.model}) from our expert tips.`
                      : 'Our expert tips for your biggest risks.'}
                </p>
              </div>
              <ul className="tips__list" key={brief.summary.tipsSource} aria-live="polite">
                {brief.summary.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </section>

            <StepBoard
              id="travel-checklist"
              title="Before you go"
              items={steps}
              board={board}
              onChange={setBoard}
            />

            <footer className="trip__sources">
              <p>
                Data:{' '}
                {report.signals.sources
                  .map(
                    (source) =>
                      `${source.provider}, ${source.dataset} (${sourceStatusText[source.status]})`,
                  )
                  .join('; ')}
                . Helsinki Airport delay figure from EUROCONTROL. Read Finland's own travel advice
                at <a href="https://um.fi/">um.fi</a>.
              </p>
              <p>This is guidance, not a binding offer. Check your policy terms for exact cover.</p>
            </footer>
          </section>
        )}

        <section className="event-services" aria-label="Travel services">
          <ServiceCard
            icon="globe"
            title="Travel risk checks"
            action={
              <button
                type="button"
                className="button button--primary button--small"
                onClick={() => formRef.current?.scrollIntoView({ block: 'center' })}
              >
                Run risk check
              </button>
            }
          >
            <p>Travel advice, weather and disaster alerts for where you are going.</p>
          </ServiceCard>
          <ServiceCard
            icon="heart"
            title="Medical support abroad"
            action={
              <a className="button button--primary button--small" href={travelCover.url}>
                View cover
              </a>
            }
          >
            <p>Medical costs abroad with no upper limit, and a 24/7 assistance line.</p>
          </ServiceCard>
          <ServiceCard
            icon="paw"
            title="Travelling with a pet"
            action={
              <button
                type="button"
                className="button button--primary button--small"
                onClick={() => {
                  setAnswer('withPet', true);
                  if (report) showDetails();
                  else formRef.current?.scrollIntoView({ block: 'center' });
                }}
              >
                Add my pet
              </button>
            }
          >
            <p>Entry rules, rabies tests and the vet visit before you come home.</p>
          </ServiceCard>
        </section>
      </div>
    </>
  );
}
