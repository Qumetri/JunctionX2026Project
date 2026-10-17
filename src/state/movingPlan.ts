import { demoMovingReport } from '../data/movingReport';
import { storageKeys } from './useStoredSet';

export type MovingPlan = {
  from: string;
  to: string;
  moveDate: string;
  homeSizeM2: number;
};

export const defaultMovingPlan: MovingPlan = {
  from: demoMovingReport.summary.fromAddress,
  to: demoMovingReport.summary.toAddress,
  moveDate: demoMovingReport.summary.moveDate,
  homeSizeM2: 48,
};

export function loadMovingPlan(): MovingPlan {
  try {
    const saved = JSON.parse(
      localStorage.getItem(storageKeys.movingPlan) ?? 'null',
    ) as Partial<MovingPlan> | null;
    return { ...defaultMovingPlan, ...saved };
  } catch {
    return defaultMovingPlan;
  }
}

export function saveMovingPlan(plan: MovingPlan) {
  try {
    localStorage.setItem(storageKeys.movingPlan, JSON.stringify(plan));
  } catch {
    // Storage blocked: the report falls back to the demo plan.
  }
}
