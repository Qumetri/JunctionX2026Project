/**
 * Dog parks and vets near a point, from OpenStreetMap through the Overpass API (no key, sends
 * CORS headers). Finnish dog parks are mostly fenced "koira-aitaus" areas tagged leisure=dog_park.
 * The free Overpass servers are often slow or busy, so the query asks the main server and two
 * community mirrors with the full planet, one after another but without waiting long for each;
 * anywhere in Finland a saved copy (shared/reference/petPlaces.ts) answers when none of them do.
 */
import { days } from '../cache/store';
import { cached, distanceKm, fetchJson, type AdapterContext, type AdapterResult } from './http';

export type PetPlaceKind = 'dog-park' | 'vet';

export type PetPlace = {
  id: string;
  kind: PetPlaceKind;
  name: string;
  lat: number;
  lon: number;
  /** Straight-line distance from the search point. */
  km: number;
};

type OverpassAnswer = { elements?: OverpassElement[]; remark?: string };

type OverpassElement = {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type RawPlace = Omit<PetPlace, 'km'>;

const RADIUS_M = 3000;

/**
 * Tried in order until one answers. Only instances that hold the whole planet and send CORS
 * headers belong here (overpass.osm.ch, for example, has Switzerland only).
 */
const endpoints = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
/** For all servers together; after this the saved copy answers. */
const TIMEOUT_MS = 7000;
/**
 * A busy server usually fails fast (429/500/504, or a CORS error on its error page) and the next
 * one is asked at once. A hung one gets this long before the next is asked beside it.
 */
const HEDGE_MS = 2000;
/** Places with the same name closer than this are one place mapped as several areas. */
const SAME_PLACE_KM = 0.3;
/** How many of each kind the page lists, nearest first. */
const LIMIT: Record<PetPlaceKind, number> = { 'dog-park': 4, vet: 2 };
const fallbackName: Record<PetPlaceKind, string> = { 'dog-park': 'Dog park', vet: 'Vet clinic' };

/** The nearest few of each kind within the radius. */
function nearest(lat: number, lon: number, raw: RawPlace[]): PetPlace[] {
  const places = raw
    .map((place) => ({ ...place, km: distanceKm(lat, lon, place.lat, place.lon) }))
    .filter((place) => place.km <= RADIUS_M / 1000)
    .sort((a, b) => a.km - b.km);

  // OSM often maps one park as several areas with the same name; keep the nearest of each.
  // Two clinics of one chain share a name too, so only close ones count as the same place.
  const kept: PetPlace[] = [];
  const count: Record<PetPlaceKind, number> = { 'dog-park': 0, vet: 0 };
  for (const place of places) {
    if (count[place.kind] >= LIMIT[place.kind]) continue;
    const duplicate =
      place.name !== fallbackName[place.kind] &&
      kept.some(
        (other) =>
          other.kind === place.kind &&
          other.name === place.name &&
          distanceKm(other.lat, other.lon, place.lat, place.lon) < SAME_PLACE_KM,
      );
    if (duplicate) continue;
    kept.push(place);
    count[place.kind] += 1;
  }
  return kept;
}

async function ask(url: string, data: string, signal: AbortSignal): Promise<OverpassElement[]> {
  const json = await fetchJson<OverpassAnswer>(
    url,
    { method: 'POST', body: new URLSearchParams({ data }), timeoutMs: TIMEOUT_MS },
    signal,
  );
  // An overloaded server still answers 200, with a "runtime error" remark and no or only
  // some elements. Treat that as a failure, or "nothing nearby" gets cached for a week.
  if (!Array.isArray(json.elements) || json.remark) throw new Error(json.remark ?? 'no elements');
  return json.elements;
}

/**
 * The first complete answer from any server. The next server is asked when the one before
 * fails or has been quiet for HEDGE_MS; the rest are cancelled once one answers.
 */
async function query(data: string, outer?: AbortSignal): Promise<OverpassElement[]> {
  const done = new AbortController();
  const signal = AbortSignal.any([
    done.signal,
    AbortSignal.timeout(TIMEOUT_MS),
    ...(outer ? [outer] : []),
  ]);
  try {
    return await new Promise<OverpassElement[]>((resolve, reject) => {
      let next = 0;
      let running = 0;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const start = () => {
        clearTimeout(timer);
        if (signal.aborted || next >= endpoints.length) {
          if (running === 0) reject(signal.reason ?? new Error('no Overpass server answered'));
          return;
        }
        const url = endpoints[next++];
        running += 1;
        ask(url, data, signal).then(resolve, () => {
          running -= 1;
          start();
        });
        timer = setTimeout(start, HEDGE_MS);
      };
      signal.addEventListener('abort', () => clearTimeout(timer));
      start();
    });
  } finally {
    done.abort();
  }
}

async function live(lat: number, lon: number, ctx: AdapterContext): Promise<RawPlace[]> {
  const around = `(around:${RADIUS_M},${lat},${lon})`;
  const data = `[out:json][timeout:10];(nwr["leisure"="dog_park"]${around};nwr["amenity"="veterinary"]${around};);out center tags;`;
  const elements = await query(data, ctx.signal);
  return elements.flatMap((element) => {
    const point = element.center ?? element;
    if (point.lat === undefined || point.lon === undefined) return [];
    const tags = element.tags ?? {};
    const kind: PetPlaceKind = tags.leisure === 'dog_park' ? 'dog-park' : 'vet';
    const name = tags['name:en'] ?? tags.name ?? fallbackName[kind];
    return [{ id: `${element.type}/${element.id}`, kind, name, lat: point.lat, lon: point.lon }];
  });
}

/** The saved copy, loaded only when needed; undefined outside the area it covers. */
async function saved(lat: number, lon: number): Promise<RawPlace[] | undefined> {
  // The chunk can be gone when a tab from before a new deploy asks for it.
  const loaded = await import('../reference/petPlaces').catch(() => undefined);
  if (!loaded) return undefined;
  const { petPlacesBox, petPlacesSnapshot } = loaded;
  const [minLat, minLon, maxLat, maxLon] = petPlacesBox;
  if (lat < minLat || lat > maxLat || lon < minLon || lon > maxLon) return undefined;
  return petPlacesSnapshot.map(([id, kind, name, placeLat, placeLon]) => ({
    id,
    kind,
    name: name || fallbackName[kind],
    lat: placeLat,
    lon: placeLon,
  }));
}

export async function nearbyPetPlaces(
  lat: number,
  lon: number,
  ctx: AdapterContext,
): Promise<AdapterResult<PetPlace[]>> {
  // Rounded to about 100 m, so small moves of the same point share a cache entry.
  const key = `petplaces:${lat.toFixed(3)},${lon.toFixed(3)}`;
  const result = await cached(ctx, key, days(7), async () =>
    nearest(lat, lon, await live(lat, lon, ctx)),
  );
  if (result.value || ctx.signal?.aborted) return result;

  const raw = await saved(lat, lon);
  return raw
    ? { value: nearest(lat, lon, raw), status: 'reference' }
    : { value: undefined, status: 'missing' };
}
