/**
 * Collects the open-data signals for the new address and turns them into flags.
 * Never rejects because one provider failed; only an address that can't be found is an error.
 */
import type { CacheStore } from '../cache/store';
import { evaluateRules } from '../engine/rules';
import { trafficNearby } from '../opendata/digitraffic';
import type { AdapterResult } from '../opendata/http';
import { building } from '../opendata/hsy';
import { geocode } from '../opendata/nominatim';
import { crimeRates, roadAccidents } from '../opendata/statfin';
import { floodArea } from '../opendata/syke';
import { drivingRoute } from '../opendata/osrm';
import { moveDayWeather } from '../opendata/weather';
import type {
  Flag,
  MoveRoute,
  MovingRequest,
  Signals,
  SourceId,
  SourceRef,
  SourceStatus,
} from '../types';

export type MovingReport = {
  request: MovingRequest;
  signals: Signals;
  flags: Flag[];
};

export class ReportError extends Error {
  readonly code: 'address-not-found';
  constructor(code: 'address-not-found', message: string) {
    super(message);
    this.code = code;
  }
}

export const sourceInfo: Record<SourceId, Omit<SourceRef, 'id' | 'status'>> = {
  geocode: {
    provider: 'OpenStreetMap Nominatim',
    dataset: 'Address search',
    url: 'https://nominatim.openstreetmap.org/',
  },
  route: {
    provider: 'OSRM',
    dataset: 'Driving route (OpenStreetMap)',
    url: 'https://project-osrm.org/',
  },
  building: {
    provider: 'HSY',
    dataset: 'Building register',
    url: 'https://www.hsy.fi/en/environmental-information/open-data/',
  },
  flood: {
    provider: 'SYKE',
    dataset: 'Flood risk areas',
    url: 'https://www.syke.fi/en/environmental-data',
  },
  crime: {
    provider: 'Statistics Finland',
    dataset: 'Offences by municipality (13h4)',
    url: 'https://pxdata.stat.fi/PxWeb/pxweb/en/StatFin/StatFin__rpk/',
  },
  accidents: {
    provider: 'Statistics Finland',
    dataset: 'Road accidents (12qh)',
    url: 'https://pxdata.stat.fi/PxWeb/pxweb/en/StatFin/StatFin__ton/',
  },
  weather: {
    provider: 'Open-Meteo',
    dataset: 'Daily forecast',
    url: 'https://open-meteo.com/',
  },
  traffic: {
    provider: 'Fintraffic Digitraffic',
    dataset: 'Traffic announcements',
    url: 'https://www.digitraffic.fi/en/road-traffic/',
  },
};

/** HSY's building register covers only these municipalities. */
const hsyArea = new Set(['Helsinki', 'Espoo', 'Vantaa', 'Kauniainen']);

export type Progress = (id: SourceId, status: SourceStatus) => void;

export async function buildMovingReport(
  request: MovingRequest,
  cache: CacheStore,
  onProgress: Progress = () => {},
): Promise<MovingReport> {
  const ctx = { cache };
  const sources: SourceRef[] = [];
  const track = async <T>(id: SourceId, work: Promise<AdapterResult<T>>) => {
    const result = await work;
    sources.push({ id, status: result.status, ...sourceInfo[id] });
    onProgress(id, result.status);
    return result.value;
  };
  const skip = (id: SourceId) =>
    track(id, Promise.resolve({ value: undefined, status: 'skipped' as const }));

  const location = await track('geocode', geocode(request.to, ctx));
  if (!location) {
    throw new ReportError(
      'address-not-found',
      'We could not find that address. Add the street number and town, for example "Mannerheimintie 10, Helsinki".',
    );
  }
  const { lat, lon, municipality } = location;

  // The old address only gives the distance. Nominatim allows one request a second.
  const moveRoute = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const origin = (await geocode(request.from, ctx)).value;
    if (!origin) return { origin, route: (await skip('route')) as MoveRoute | undefined };
    return { origin, route: await track('route', drivingRoute(origin, location, ctx)) };
  };

  const [buildingInfo, flood, weather, traffic, crime, trip] = await Promise.all([
    // A street-only match has several buildings around it; guessing one would borrow a
    // neighbour's year.
    municipality && hsyArea.has(municipality) && location.exact !== false
      ? track('building', building(lat, lon, ctx))
      : skip('building'),
    track('flood', floodArea(lat, lon, ctx)),
    track('weather', moveDayWeather(lat, lon, request.moveDate, ctx)),
    track('traffic', trafficNearby(lat, lon, request.moveDate, ctx)),
    municipality ? track('crime', crimeRates(municipality, ctx)) : skip('crime'),
    request.from.trim()
      ? moveRoute()
      : skip('route').then(() => ({ origin: undefined, route: undefined })),
  ]);

  // Accidents per resident need the population that comes with the crime rates.
  const accidents =
    municipality && crime?.population
      ? await track(
          'accidents',
          roadAccidents(
            municipality,
            { local: crime.population, national: crime.nationalPopulation },
            ctx,
          ),
        )
      : await skip('accidents');

  const signals: Signals = {
    location,
    origin: trip.origin,
    route: trip.route,
    building: buildingInfo,
    flood: flood?.area,
    crime: crime && {
      municipality: crime.municipality,
      year: crime.year,
      burglaryRate: crime.burglaryRate,
      arsonRate: crime.arsonRate,
      nationalBurglaryRate: crime.nationalBurglaryRate,
      nationalArsonRate: crime.nationalArsonRate,
    },
    accidents,
    weather,
    traffic,
    sources,
    collectedAt: new Date().toISOString(),
  };

  return { request, signals, flags: evaluateRules(request, signals) };
}
