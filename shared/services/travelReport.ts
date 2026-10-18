/**
 * Collects the open-data signals for a trip and turns them into flags, like movingReport.ts.
 * Never rejects: a provider that fails is marked missing and only its flags drop out.
 */
import type { CacheStore } from '../cache/store';
import { destinationById } from '../data/destinations';
import { evaluateTravelRules, localIsoDate, tripFacts } from '../engine/travelRules';
import { travelAdvice } from '../opendata/fcdo';
import { hazardsNear } from '../opendata/gdacs';
import type { AdapterResult } from '../opendata/http';
import { moveDayWeather, tripWeather } from '../opendata/weather';
import type {
  SourceRef,
  SourceStatus,
  TravelFlag,
  TravelRequest,
  TravelSignals,
  TravelSourceId,
} from '../types';

export type TravelReport = {
  request: TravelRequest;
  signals: TravelSignals;
  flags: TravelFlag[];
};

export const travelSourceInfo: Record<TravelSourceId, Omit<SourceRef, 'id' | 'status'>> = {
  advisory: {
    provider: 'UK FCDO',
    dataset: 'Foreign travel advice',
    url: 'https://www.gov.uk/foreign-travel-advice',
  },
  weather: {
    provider: 'Open-Meteo',
    dataset: 'Forecast and weather archive',
    url: 'https://open-meteo.com/',
  },
  departure: {
    provider: 'Open-Meteo',
    dataset: 'Helsinki Airport departure-day forecast',
    url: 'https://open-meteo.com/',
  },
  hazards: {
    provider: 'GDACS',
    dataset: 'Current disaster alerts',
    url: 'https://www.gdacs.org/',
  },
};

/** Helsinki-Vantaa airport. */
const helsinkiAirport = { lat: 60.317, lon: 24.963 };

/** Current hazard alerts only matter for trips that start soon. */
const hazardWindowDays = 30;

export type TravelProgress = (id: TravelSourceId, status: SourceStatus) => void;

export async function buildTravelReport(
  request: TravelRequest,
  cache: CacheStore,
  onProgress: TravelProgress = () => {},
): Promise<TravelReport> {
  const ctx = { cache };
  const place = destinationById(request.destinationId);
  const facts = tripFacts(request, localIsoDate());
  const sources: SourceRef<TravelSourceId>[] = [];
  const track = async <T>(id: TravelSourceId, work: Promise<AdapterResult<T>>) => {
    const result = await work;
    sources.push({ id, status: result.status, ...travelSourceInfo[id] });
    onProgress(id, result.status);
    return result.value;
  };
  const skip = (id: TravelSourceId) =>
    track(id, Promise.resolve({ value: undefined, status: 'skipped' as const }));

  const [advisory, weather, departure, hazards] = await Promise.all([
    track('advisory', travelAdvice(place.fcdoSlug, ctx)),
    track('weather', tripWeather(place.lat, place.lon, request.startDate, request.endDate, ctx)),
    track(
      'departure',
      moveDayWeather(helsinkiAirport.lat, helsinkiAirport.lon, request.startDate, ctx),
    ),
    facts.daysUntil <= hazardWindowDays && facts.daysUntil + facts.length >= 0
      ? track('hazards', hazardsNear(place, ctx))
      : skip('hazards'),
  ]);

  const signals: TravelSignals = {
    advisory,
    weather,
    departure,
    hazards,
    sources,
    collectedAt: new Date().toISOString(),
  };
  return { request, signals, flags: evaluateTravelRules(request, signals) };
}
