import { useState } from 'react';
import { homePlans, planOrder } from '../../shared/data/homePlans';
import { partnerBenefits, type PartnerBenefit } from '../../shared/data/partners';
import { actions } from '../../shared/engine/rules';
import type { Assessment } from '../../shared/engine/score';
import type { CategoryId, HousingType } from '../../shared/types';
import { Checklist, RiskRows, ServiceCard } from '../components/blocks';
import { Icon, type IconName } from '../components/Icon';
import { JourneyPath } from '../components/JourneyPath';
import { LiquidMeter } from '../components/LiquidMeter';
import { LiquidRing } from '../components/LiquidRing';
import { PlanPicker } from '../components/PlanPicker';
import {
  actionIdsFor,
  movingChecklist,
  movingSteps,
  useMovingJourney,
  type MovingStepId,
} from '../state/movingJourney';
import { useMovingAssessment } from '../state/movingPlan';
import './EventPage.css';
import './MovingPage.css';
import './MovingPlanPage.css';

const levelLabel = { low: 'Low', medium: 'Medium', high: 'High' } as const;

const categoryIcons: Record<CategoryId, IconName> = {
  transport: 'truck',
  schedule: 'clock',
  keys: 'key',
  property: 'building',
};

const previewLimit = 5;

function formatMoveDate(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  const days = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
  const day = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  if (days < 0) return `moved on ${day}`;
  if (days === 0) return 'moving today';
  return `on ${day}, in ${days} ${days === 1 ? 'day' : 'days'}`;
}

/** Step two of the Moving journey: the plan built from the risk check. */
export function MovingPlanPage() {
  const { plan, report, assessment, suggestion, doneActions, toggleAction } = useMovingAssessment();
  const journey = useMovingJourney(assessment, doneActions);
  const [selected, setSelected] = useState<MovingStepId>();

  if (!report || !assessment || !suggestion) {
    return (
      <section className="event-hero" aria-labelledby="plan-title">
        <div className="event-hero__inner plan-empty">
          <h1 id="plan-title">Your moving plan</h1>
          <p className="event-hero__lead">
            Your plan is built from a risk check of the address you’re moving to. It takes about a
            minute.
          </p>
          <a className="button button--primary" href="#moving">
            Check your risks
          </a>
        </div>
      </section>
    );
  }

  const { states } = journey;
  const firstOpen = movingSteps.find((step) => states[step.id] === 'open');
  const current = movingSteps.find((step) => step.id === selected) ?? firstOpen ?? movingSteps[0];
  const index = movingSteps.indexOf(current);
  const state = states[current.id];
  const address = report.signals.location?.label ?? report.request.to;
  const moveDate = formatMoveDate(plan.moveDate);

  // After finishing or skipping a step, show the next open one after it.
  const advanceFrom = (id: MovingStepId) => {
    const at = movingSteps.findIndex((step) => step.id === id);
    const next = movingSteps
      .slice(at + 1)
      .find((step) => step.id !== id && states[step.id] === 'open');
    setSelected(next?.id);
  };

  return (
    <>
      <section className="event-hero" aria-labelledby="plan-title">
        <div className="event-hero__inner">
          <div className="plan-head">
            <div>
              <h1 id="plan-title">Your moving plan</h1>
              <p className="plan-head__facts">
                <Icon name="pin" />
                {address}
                {moveDate && `, ${moveDate}`}
              </p>
            </div>
            <div className="plan-head__progress">
              <span>
                {journey.doneCount} of {movingSteps.length} steps done
              </span>
              <LiquidMeter
                value={journey.progress}
                variant="progress"
                label="Moving plan progress"
              />
            </div>
          </div>

          <RiskSummary assessment={assessment} />
        </div>
      </section>

      <div className="event-body plan-body">
        <div className="event-card plan-path">
          <JourneyPath
            label="Moving plan steps"
            selectedId={current.id}
            onSelect={(id) => setSelected(id as MovingStepId)}
            steps={movingSteps.map((step) => ({
              id: step.id,
              title: step.title,
              state: states[step.id],
            }))}
          />
        </div>

        <article className="step-panel" aria-labelledby="step-title">
          <header className="step-panel__head">
            <span className="icon-tile">
              <Icon name={current.icon} />
            </span>
            <div className="step-panel__intro">
              <p className="step-panel__count">
                Step {index + 1} of {movingSteps.length}
                {state === 'done' && ', done'}
                {state === 'skipped' && ', skipped'}
              </p>
              <h2 id="step-title">{current.title}</h2>
              <p>{current.lead}</p>
            </div>
            <div className="step-panel__actions">
              {state === 'open' && (
                <>
                  <button
                    className="button button--soft button--small"
                    type="button"
                    onClick={() => {
                      journey.markDone(current.id);
                      advanceFrom(current.id);
                    }}
                  >
                    Mark as done
                  </button>
                  <button
                    className="step-panel__skip"
                    type="button"
                    onClick={() => {
                      journey.skip(current.id);
                      advanceFrom(current.id);
                    }}
                  >
                    Skip this step
                  </button>
                </>
              )}
              {state !== 'open' && !journey.autoDone[current.id] && (
                <button
                  className="step-panel__skip"
                  type="button"
                  onClick={() => journey.reopen(current.id)}
                >
                  {state === 'skipped' ? 'Undo skip' : 'Mark as not done'}
                </button>
              )}
            </div>
          </header>

          <div className="step-panel__content">
            {current.id === 'cover' && (
              <PlanPicker
                suggestion={suggestion}
                flags={assessment.flags}
                detached={plan.answers.housing === 'detached'}
              />
            )}

            {current.id === 'actions' && (
              <Checklist
                id="moving-actions"
                title="Recommended actions"
                items={actionIdsFor(assessment).map((id) => ({
                  id,
                  label: actions[id].title,
                  hint: actions[id].partnerOffer,
                }))}
                done={doneActions}
                onToggle={toggleAction}
              />
            )}

            {current.id === 'help' && (
              <div className="help-step">
                <section aria-labelledby="partners-title">
                  <h3 className="help-step__title" id="partners-title">
                    If partner benefits
                  </h3>
                  <ul className="partner-grid">
                    {partnerBenefits.map((benefit) => (
                      <PartnerCard
                        key={benefit.id}
                        benefit={benefit}
                        housing={plan.answers.housing}
                      />
                    ))}
                  </ul>
                </section>

                <section aria-labelledby="movers-title">
                  <h3 className="help-step__title" id="movers-title">
                    Movers and van rental
                  </h3>
                  <p className="help-step__note">
                    If has no official moving or van-rental partner. Whoever you book, check these
                    first.
                  </p>
                  <ul className="help-tips">
                    <li>
                      A moving company is liable for what it breaks. Ask to see its liability
                      insurance before you book.
                    </li>
                    <li>
                      Breakage while you carry or drive your own things is covered from{' '}
                      {homePlans.laaja.name} up, not in {homePlans.perus.name}.
                    </li>
                    <li>
                      A rented trailer needs its own insurance. Check what the rental includes.
                    </li>
                  </ul>
                  <div className="event-services help-step__bookings">
                    <ServiceCard
                      icon="truck"
                      title="Movers"
                      action={
                        <BookButton
                          booked={journey.booked.has('movers')}
                          onToggle={() => journey.toggleBooked('movers')}
                        />
                      }
                    />
                    <ServiceCard
                      icon="wrench"
                      title="Van or trailer"
                      action={
                        <BookButton
                          booked={journey.booked.has('van')}
                          onToggle={() => journey.toggleBooked('van')}
                        />
                      }
                    />
                  </div>
                </section>
              </div>
            )}

            {current.id === 'day' && (
              <Checklist
                id="moving-checklist"
                title="Moving day checklist"
                items={movingChecklist}
                done={journey.checked}
                onToggle={journey.toggleChecked}
              />
            )}
          </div>
        </article>
      </div>
    </>
  );
}

/** One partner benefit, with the home insurance levels it needs. */
function PartnerCard({ benefit, housing }: { benefit: PartnerBenefit; housing: HousingType }) {
  const fitsHome = !benefit.housing || benefit.housing.includes(housing);
  const host = new URL(benefit.sourceUrl).hostname.replace(/^www\./, '');

  return (
    <li className={fitsHome ? 'partner' : 'partner partner--other-home'}>
      <p className="partner__name">{benefit.partner}</p>
      <p className="partner__headline">{benefit.headline}</p>
      <p className="partner__detail">{benefit.detail}</p>
      <ul className="partner__plans" aria-label="Home insurance levels">
        {planOrder.map((id) => {
          const included = benefit.plans.includes(id);
          return (
            <li key={id} className={included ? 'is-included' : undefined}>
              {included && <Icon name="check" />}
              {homePlans[id].name}
              <span className="visually-hidden">{included ? ', included' : ', not included'}</span>
            </li>
          );
        })}
      </ul>
      <p className="partner__condition">
        {fitsHome ? benefit.condition : `${benefit.condition} Your new home is not one.`}
      </p>
      <a className="partner__link" href={benefit.sourceUrl} target="_blank" rel="noreferrer">
        Terms at {host}
      </a>
    </li>
  );
}

function BookButton({ booked, onToggle }: { booked: boolean; onToggle: () => void }) {
  return (
    <button
      className={`button button--small ${booked ? 'button--soft' : 'button--primary'}`}
      type="button"
      aria-pressed={booked}
      onClick={onToggle}
    >
      {booked ? (
        <>
          <Icon name="check" className="book-button__icon" />
          Booked
        </>
      ) : (
        'Mark as booked'
      )}
    </button>
  );
}

/** The risk check result: an estimate per risk, no points. The detailed overview explains those. */
function RiskSummary({ assessment }: { assessment: Assessment }) {
  const shown = assessment.flags.slice(0, previewLimit);
  const more = assessment.flags.length - shown.length;

  return (
    <article className="event-card plan-risk-card">
      <h2>Your moving risk</h2>
      <div className="preview">
        {shown.length === 0 ? (
          <p className="preview__empty">We found no risks for this move.</p>
        ) : (
          <RiskRows
            rows={shown.map((flag) => ({
              id: flag.id,
              name: flag.title,
              level: flag.severity,
              icon: categoryIcons[flag.category],
            }))}
          />
        )}
        <LiquidRing
          value={assessment.score}
          label={`Overall moving risk ${assessment.score} of 100`}
        >
          <span className="preview__caption-level">{levelLabel[assessment.level]} risk</span>
        </LiquidRing>
      </div>
      {more > 0 && (
        <p className="preview__more">
          {more} more {more === 1 ? 'risk' : 'risks'} in the detailed overview
        </p>
      )}
      <div className="plan-risk-links">
        <a className="button button--soft button--small" href="#risk-report">
          See detailed overview
        </a>
        <a className="plan-risk-links__change" href="#moving">
          Change your answers
        </a>
      </div>
    </article>
  );
}
