/**
 * Dog parks and vets near a point, from OpenStreetMap through the Overpass API (no key, sends
 * CORS headers). Finnish dog parks are mostly fenced "koira-aitaus" areas tagged leisure=dog_park.
 * The free Overpass servers are often slow or busy, so in the capital region a saved copy
 * (shared/reference/petPlaces.ts) answers when the live query fails.
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
  const seen = new Set<string>();
  const count: Record<PetPlaceKind, number> = { 'dog-park': 0, vet: 0 };
  return places.filter((place) => {
    const id = `${place.kind}:${place.name}`;
    if (place.name !== fallbackName[place.kind] && seen.has(id)) return false;
    if (count[place.kind] >= LIMIT[place.kind]) return false;
    seen.add(id);
    count[place.kind] += 1;
    return true;
  });
}

async function live(lat: number, lon: number, ctx: AdapterContext): Promise<RawPlace[]> {
  const around = `(around:${RADIUS_M},${lat},${lon})`;
  const query = `[out:json][timeout:10];(nwr["leisure"="dog_park"]${around};nwr["amenity"="veterinary"]${around};);out center tags;`;
  const json = await fetchJson<{ elements: OverpassElement[] }>(
    'https://overpass-api.de/api/interpreter',
    { method: 'POST', body: new URLSearchParams({ data: query }), timeoutMs: 10_000 },
    ctx.signal,
  );
  return json.elements.flatMap((element) => {
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
  const { petPlacesBox, petPlacesSnapshot } = await import('../reference/petPlaces');
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
