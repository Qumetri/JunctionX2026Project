import { useCallback, useMemo, useState } from 'react';
import { destinationById } from '../../shared/data/destinations';
import { suggestTravelCover, travelCategoryNames } from '../../shared/data/travelCover';
import { assessFlags } from '../../shared/engine/score';
import { evaluateTravelRules, localIsoDate, tripFacts } from '../../shared/engine/travelRules';
import type { SourceStatus, TravelRequest, TravelSourceId } from '../../shared/types';
import { reportService, type TravelReport } from '../api/report';
import { storageKeys } from './useStoredSet';

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
    // Storage blocked: the trip and report only last for this visit.
  }
}

const inDays = (n: number) => {
  const date = new Date();
  date.setDate(date.getDate() + n);
  return localIsoDate(date);
};

/** Two months ahead, for two weeks and a bit: a typical holiday until the user picks dates. */
function defaultTrip(): TravelRequest {
  return {
    destinationId: 'bangkok',
    startDate: inDays(60),
    endDate: inDays(76),
    answers: { purpose: 'holiday', withPet: false, hasTravelInsurance: true },
  };
}

function loadTrip(): TravelRequest {
  const fallback = defaultTrip();
  const saved = readJson<Partial<TravelRequest>>(storageKeys.travelPlan);
  return { ...fallback, ...saved, answers: { ...fallback.answers, ...saved?.answers } };
}

function loadReport() {
  const report = readJson<TravelReport>(storageKeys.travelReport);
  return report?.signals?.sources ? report : undefined;
}

/** Preparation steps are a checklist; ticking them shows readiness, not a lower risk. */
const noActions: ReadonlySet<string> = new Set();

export type TravelCalcState =
  { phase: 'idle' } | { phase: 'loading'; progress: Partial<Record<TravelSourceId, SourceStatus>> };

/**
 * The trip form, the saved report and everything derived from them. Purpose, pet and insurance
 * re-run the rules on the saved signals at once; a new destination or new dates need a new check,
 * because the weather, advice and hazard data belong to them.
 */
export function useTravelAssessment() {
  const [trip, setTripState] = useState(loadTrip);
  const [report, setReport] = useState(loadReport);
  const [calc, setCalc] = useState<TravelCalcState>({ phase: 'idle' });

  const setTrip = useCallback((next: TravelRequest) => {
    setTripState(next);
    writeJson(storageKeys.travelPlan, next);
  }, []);

  const calculate = useCallback(async (request: TravelRequest) => {
    setCalc({ phase: 'loading', progress: {} });
    const next = await reportService.travelReport(request, (id, status) =>
      setCalc((current) =>
        current.phase === 'loading'
          ? { phase: 'loading', progress: { ...current.progress, [id]: status } }
          : current,
      ),
    );
    setReport(next);
    writeJson(storageKeys.travelReport, next);
    setCalc({ phase: 'idle' });
  }, []);

  const derived = useMemo(() => {
    if (!report) return undefined;
    const request: TravelRequest = { ...report.request, answers: trip.answers };
    const assessment = assessFlags(
      evaluateTravelRules(request, report.signals),
      noActions,
      travelCategoryNames,
    );
    const facts = tripFacts(request);
    return {
      request,
      assessment,
      facts,
      place: destinationById(request.destinationId),
      cover: suggestTravelCover(request, facts.length),
    };
  }, [trip.answers, report]);

  const stale =
    report !== undefined &&
    (report.request.destinationId !== trip.destinationId ||
      report.request.startDate !== trip.startDate ||
      report.request.endDate !== trip.endDate);

  return { trip, setTrip, report, calc, calculate, stale, ...derived };
}
