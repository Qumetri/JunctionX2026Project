import { useState, type ReactNode } from 'react';
import { homePlans } from '../../shared/data/homePlans';
import { Icon, type IconName } from '../components/Icon';
import { JourneyPath, type StepState } from '../components/JourneyPath';
import { LiquidMeter } from '../components/LiquidMeter';
import { useMovingAssessment } from '../state/movingPlan';
import { storageKeys, useStoredSet } from '../state/useStoredSet';
import './HomePage.css';

const levelLabel = { low: 'Low', medium: 'Medium', high: 'High' } as const;

/** Items in the Moving page checklist; moving day counts as done when all are ticked. */
const checklistSize = 5;

type Step = {
  id: string;
  icon: IconName;
  title: string;
  body: string;
  href: string;
  action: string;
  /** Finished without the user marking it, judged from what they did on the other pages. */
  autoDone: boolean;
  status?: ReactNode;
};

function formatMoveDate(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  const days = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
  const day = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  if (days < 0) return `moved on ${day}`;
  if (days === 0) return 'moving today';
  return `on ${day}, in ${days} ${days === 1 ? 'day' : 'days'}`;
}

export function HomePage() {
  const { plan, report, assessment, suggestion } = useMovingAssessment();
  const [checked] = useStoredSet(storageKeys.movingChecklist);
  const [marked, toggleMarked] = useStoredSet(storageKeys.journeyDone);
  const [skipped, toggleSkipped] = useStoredSet(storageKeys.journeySkipped);
  const [selected, setSelected] = useState<string>();

  const steps: Step[] = [
    {
      id: 'risks',
      icon: 'alert',
      title: 'Check your risks',
      body: 'Enter the address you’re moving to. We check the building, the area and moving day against public data and score what could go wrong.',
      href: '#moving',
      action: 'Check your risks',
      autoDone: Boolean(report),
      status: assessment
        ? `${levelLabel[assessment.level]} risk, ${assessment.score} of 100 points`
        : 'Not checked yet',
    },
    {
      id: 'plan',
      icon: 'clipboard',
      title: 'Make your moving plan',
      body: 'Add your current address, the date, your home size and a few yes-or-no answers. Every risk becomes a dated step.',
      href: '#moving',
      action: 'Create moving plan',
      autoDone: Boolean(report && plan.from.trim()),
    },
    {
      id: 'actions',
      icon: 'check',
      title: 'Handle the top risks',
      body: 'Tick off the recommended actions in your risk report. Each one takes points off your score.',
      href: '#risk-report',
      action: 'Open risk report',
      autoDone: assessment?.readiness === 100,
      status: assessment && (
        <>
          <span>{assessment.readiness}% ready for moving day</span>
          <LiquidMeter value={assessment.readiness} variant="progress" label="Moving readiness" />
        </>
      ),
    },
    {
      id: 'cover',
      icon: 'shield',
      title: 'Choose your cover',
      body: 'See which home insurance level pays for the risks we found at your new address, and what each one leaves out.',
      href: '#moving',
      action: 'Compare cover',
      autoDone: false,
      status: suggestion && `Suggested for you: ${homePlans[suggestion.suggested].name}`,
    },
    {
      id: 'help',
      icon: 'truck',
      title: 'Book help',
      body: 'Movers who carry their own liability cover, and a van and tools for the day. Tool rental is free for annual members.',
      href: '#moving',
      action: 'See movers and rentals',
      autoDone: false,
    },
    {
      id: 'day',
      icon: 'key',
      title: 'Moving day',
      body: 'Pack the essentials, count the keys at handover and test the smoke alarm on your first evening.',
      href: '#moving',
      action: 'Open checklist',
      autoDone: checked.size >= checklistSize,
      status: (
        <>
          <span>
            {Math.min(checked.size, checklistSize)} of {checklistSize} checklist items done
          </span>
          <LiquidMeter
            value={(Math.min(checked.size, checklistSize) / checklistSize) * 100}
            variant="progress"
            label="Moving day checklist"
          />
        </>
      ),
    },
  ];

  const stateOf = (step: Step): StepState =>
    step.autoDone || marked.has(step.id) ? 'done' : skipped.has(step.id) ? 'skipped' : 'open';
  const states = new Map(steps.map((step) => [step.id, stateOf(step)]));
  const firstOpen = steps.find((step) => states.get(step.id) === 'open');
  const current = steps.find((step) => step.id === selected) ?? firstOpen ?? steps[0];
  const index = steps.indexOf(current);
  const state = states.get(current.id);
  const doneCount = steps.filter((step) => states.get(step.id) === 'done').length;
  const risksChecked = states.get('risks') === 'done';
  const moveDate = plan.to.trim() ? formatMoveDate(plan.moveDate) : undefined;

  // After finishing or skipping a step, show the next open one after it.
  const advanceFrom = (id: string) => {
    const at = steps.findIndex((step) => step.id === id);
    const next = steps.slice(at + 1).find((step) => states.get(step.id) === 'open');
    setSelected(next?.id);
  };

  const markDone = () => {
    if (skipped.has(current.id)) toggleSkipped(current.id);
    if (!marked.has(current.id)) toggleMarked(current.id);
    advanceFrom(current.id);
  };

  const skip = () => {
    if (!skipped.has(current.id)) toggleSkipped(current.id);
    advanceFrom(current.id);
  };

  const reopen = () => {
    if (marked.has(current.id)) toggleMarked(current.id);
    if (skipped.has(current.id)) toggleSkipped(current.id);
  };

  return (
    <section className="journey-page" aria-labelledby="journey-title">
      <div className="journey-page__inner">
        <header className="journey-page__head">
          <div>
            <h1 id="journey-title">Your move, step by step</h1>
            <p className="journey-page__lead">
              Six steps from the first risk check to your first night in the new home. Take them in
              order, or skip the ones you’ve already covered.
            </p>
            {moveDate && (
              <p className="journey-page__facts">
                <Icon name="pin" />
                Moving to {plan.to}, {moveDate}
              </p>
            )}
          </div>
          <div className="journey-page__progress">
            <span>
              {doneCount} of {steps.length} steps done
            </span>
            <LiquidMeter
              value={(doneCount / steps.length) * 100}
              variant="progress"
              label="Moving steps done"
            />
          </div>
        </header>

        <div className="journey-page__path">
          <JourneyPath
            label="Moving steps"
            selectedId={current.id}
            onSelect={setSelected}
            steps={steps.map((step) => ({
              id: step.id,
              title: step.title,
              state: states.get(step.id) ?? 'open',
            }))}
          />
        </div>

        {!risksChecked && current.id !== 'risks' && (
          <aside className="risk-first" aria-labelledby="risk-first-title">
            <span className="icon-tile">
              <Icon name="alert" />
            </span>
            <div>
              <h2 id="risk-first-title">Check your risks before you plan</h2>
              <p>
                Your plan, cover suggestion and checklist are built from the risks we find at the
                new address. It takes about a minute and only needs the address.
              </p>
            </div>
            <a className="button button--primary" href="#moving">
              Check risks first
            </a>
          </aside>
        )}

        <article className="step-panel" aria-labelledby="step-title" aria-live="polite">
          <span className="icon-tile">
            <Icon name={current.icon} />
          </span>
          <div className="step-panel__body">
            <p className="step-panel__count">
              Step {index + 1} of {steps.length}
              {state === 'done' && ', done'}
              {state === 'skipped' && ', skipped'}
            </p>
            <h2 id="step-title">{current.title}</h2>
            <p>{current.body}</p>
            {current.status && <div className="step-panel__status">{current.status}</div>}
          </div>
          <div className="step-panel__actions">
            <a className="button button--primary" href={current.href}>
              {current.action}
            </a>
            {state === 'open' && (
              <>
                <button className="button button--soft" type="button" onClick={markDone}>
                  Mark as done
                </button>
                <button className="step-panel__skip" type="button" onClick={skip}>
                  Skip this step
                </button>
              </>
            )}
            {state !== 'open' && !current.autoDone && (
              <button className="step-panel__skip" type="button" onClick={reopen}>
                {state === 'skipped' ? 'Undo skip' : 'Mark as not done'}
              </button>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
