import { useCallback, useMemo, useState } from 'react';
import { evaluateRules } from '../../shared/engine/rules';
import { assess } from '../../shared/engine/score';
import { suggestPlan } from '../../shared/engine/plans';
import { ReportError } from '../../shared/services/movingReport';
import type { MovingRequest, SourceId, SourceStatus } from '../../shared/types';
import { reportService, type MovingReport } from '../api/report';
import { storageKeys, useStoredSet } from './useStoredSet';

export type MovingPlan = MovingRequest;

export const defaultMovingPlan: MovingPlan = {
  to: '',
  from: '',
  moveDate: '',
  homeSizeM2: 50,
  answers: {
    housing: 'flat',
    groundFloor: false,
    renting: true,
    selfMove: true,
    valuables: false,
    dog: false,
    hasHomeInsurance: true,
  },
};

/** A month from today: a sensible default until the user picks a date. */
function defaultMoveDate() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
}

function readJson<T>(key: string): T | undefined {
  try {
    return (JSON.parse(localStorage.getItem(key) ?? 'null') as T | null) ?? undefined;
  } catch {
    return undefined;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked: the plan and report only last for this visit.
  }
}

export function loadMovingPlan(): MovingPlan {
  const saved = readJson<Partial<MovingPlan>>(storageKeys.movingPlan);
  return {
    ...defaultMovingPlan,
    moveDate: defaultMoveDate(),
    ...saved,
    answers: { ...defaultMovingPlan.answers, ...saved?.answers },
  };
}

export function loadMovingReport() {
  const report = readJson<MovingReport>(storageKeys.movingReport);
  return report?.signals?.sources ? report : undefined;
}

/**
 * Recommended actions live in the moving plan as their own step and do not change the risk:
 * the score describes the move, not how far along the user is.
 */
const noActions: ReadonlySet<string> = new Set();

export type CalcState =
  | { phase: 'idle' }
  | { phase: 'loading'; progress: Partial<Record<SourceId, SourceStatus>> }
  | { phase: 'error'; message: string };

/**
 * The plan form, the saved report and everything derived from them. Answers re-run the rules
 * on the saved signals instantly; only Calculate risk goes to the network.
 */
export function useMovingAssessment() {
  const [plan, setPlanState] = useState(loadMovingPlan);
  const [report, setReport] = useState(loadMovingReport);
  const [calc, setCalc] = useState<CalcState>({ phase: 'idle' });
  const [doneActions, toggleAction] = useStoredSet(storageKeys.movingActions);

  const setPlan = useCallback((next: MovingPlan) => {
    setPlanState(next);
    writeJson(storageKeys.movingPlan, next);
  }, []);

  const calculate = useCallback(async (request: MovingPlan) => {
    setCalc({ phase: 'loading', progress: {} });
    try {
      const next = await reportService.movingReport(request, (id, status) =>
        setCalc((current) =>
          current.phase === 'loading'
            ? { phase: 'loading', progress: { ...current.progress, [id]: status } }
            : current,
        ),
      );
      setReport(next);
      writeJson(storageKeys.movingReport, next);
      setCalc({ phase: 'idle' });
      return true;
    } catch (error) {
      setCalc({
        phase: 'error',
        message:
          error instanceof ReportError
            ? error.message
            : 'Something went wrong while checking the address. Try again in a moment.',
      });
      return false;
    }
  }, []);

  // The signals belong to the address that was calculated; answers and date come from the form.
  const derived = useMemo(() => {
    if (!report) return undefined;
    const request = { ...plan, to: report.request.to };
    const assessment = assess(evaluateRules(request, report.signals), noActions);
    return { assessment, suggestion: suggestPlan(assessment.flags, assessment.level) };
  }, [plan, report]);

  return { plan, setPlan, report, calc, calculate, doneActions, toggleAction, ...derived };
}
