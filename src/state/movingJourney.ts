import type { Assessment } from '../../shared/engine/score';
import type { IconName } from '../components/Icon';
import type { StepState } from '../components/JourneyPath';
import { storageKeys, useStoredSet } from './useStoredSet';

export type MovingStepId = 'cover' | 'actions' | 'help' | 'day';

/** The moving plan, in order. Risk calculation comes before it, on the Moving page. */
export const movingSteps: { id: MovingStepId; title: string; icon: IconName; lead: string }[] = [
  {
    id: 'cover',
    title: 'Choose your cover',
    icon: 'shield',
    lead: 'Compare the three home insurance levels against the risks we found. The bar shows how much moving risk is left with the level you pick.',
  },
  {
    id: 'actions',
    title: 'Do the recommended actions',
    icon: 'clipboard',
    lead: 'Practical steps for the risks at your new address. Tick them off as you go.',
  },
  {
    id: 'help',
    title: 'Partners and help',
    icon: 'tag',
    lead: 'If partner benefits for your new home, and what to check before you book movers or a van.',
  },
  {
    id: 'day',
    title: 'Moving day',
    icon: 'key',
    lead: 'The things people forget on the day itself.',
  },
];

export const movingChecklist = [
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

/** Every recommended action for the risks found, without duplicates. */
export function actionIdsFor(assessment?: Assessment) {
  return [...new Set(assessment?.flags.flatMap((flag) => flag.actionIds) ?? [])];
}

/**
 * Progress through the moving plan. A step is done when the user marks it, or when what it asks
 * for is finished (every action ticked, a service booked, the whole checklist). `doneActions`
 * comes from useMovingAssessment so both hooks never hold their own copy of the same key.
 */
export function useMovingJourney(
  assessment: Assessment | undefined,
  doneActions: ReadonlySet<string>,
) {
  const [marked, toggleMarked] = useStoredSet(storageKeys.journeyDone);
  const [skipped, toggleSkipped] = useStoredSet(storageKeys.journeySkipped);
  const [booked, toggleBooked] = useStoredSet(storageKeys.movingBooked);
  const [checked, toggleChecked] = useStoredSet(storageKeys.movingChecklist);

  const actionIds = actionIdsFor(assessment);
  const autoDone: Record<MovingStepId, boolean> = {
    cover: false,
    actions: actionIds.length > 0 && actionIds.every((id) => doneActions.has(id)),
    help: booked.size > 0,
    day: movingChecklist.every((item) => checked.has(item.id)),
  };

  const stateOf = (id: MovingStepId): StepState =>
    autoDone[id] || marked.has(id) ? 'done' : skipped.has(id) ? 'skipped' : 'open';
  const states = Object.fromEntries(
    movingSteps.map((step) => [step.id, stateOf(step.id)]),
  ) as Record<MovingStepId, StepState>;
  const doneCount = movingSteps.filter((step) => states[step.id] === 'done').length;

  const markDone = (id: MovingStepId) => {
    if (skipped.has(id)) toggleSkipped(id);
    if (!marked.has(id)) toggleMarked(id);
  };
  const skip = (id: MovingStepId) => {
    if (!skipped.has(id)) toggleSkipped(id);
  };
  const reopen = (id: MovingStepId) => {
    if (marked.has(id)) toggleMarked(id);
    if (skipped.has(id)) toggleSkipped(id);
  };

  return {
    states,
    autoDone,
    doneCount,
    progress: Math.round((doneCount / movingSteps.length) * 100),
    markDone,
    skip,
    reopen,
    booked,
    toggleBooked,
    checked,
    toggleChecked,
  };
}

/** Clears every saved answer, report and tick, for a fresh demo run. */
export function resetAllProgress() {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('lifeMoments.'))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage blocked: there is nothing saved to clear.
  }
}
