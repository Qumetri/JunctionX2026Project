/**
 * Current natural-hazard events from GDACS (no key, CORS `*`): earthquakes, tropical cyclones,
 * floods, volcanoes and wildfires with an orange or red alert, in the destination country or
 * within 500 km of it.
 */
import { hours } from '../cache/store';
import type { TravelSignals } from '../types';
import { cached, distanceKm, fetchJson, type AdapterContext, type AdapterResult } from './http';

type Feature = {
  geometry: { type: string; coordinates: number[] };
  properties: {
    eventtype: string;
    name: string;
    alertlevel: string;
    iscurrent: string | boolean;
    iso3?: string;
    affectedcountries?: { iso3: string }[];
  };
};

const typeNames: Record<string, string> = {
  EQ: 'Earthquake',
  TC: 'Tropical cyclone',
  FL: 'Flood',
  VO: 'Volcano',
  WF: 'Wildfire',
};

const nearKm = 500;

export async function hazardsNear(
  place: { lat: number; lon: number; iso3: string },
  ctx: AdapterContext,
): Promise<AdapterResult<NonNullable<TravelSignals['hazards']>>> {
  // One list for every destination; the filter runs on the cached copy.
  const result = await cached(ctx, 'gdacs:current', hours(3), async () => {
    const { features } = await fetchJson<{ features: Feature[] }>(
      'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=EQ,TC,FL,VO,WF&alertlevel=Orange;Red',
      { timeoutMs: 8000 },
      ctx.signal,
    );
    return features
      .filter((feature) => String(feature.properties.iscurrent) === 'true')
      .map(({ geometry, properties }) => ({
        type: typeNames[properties.eventtype] ?? properties.eventtype,
        name: properties.name.trim(),
        alert: properties.alertlevel as 'Orange' | 'Red',
        countries: [
          properties.iso3 ?? '',
          ...(properties.affectedcountries ?? []).map((country) => country.iso3),
        ],
        point: geometry.type === 'Point' ? geometry.coordinates : undefined,
      }));
  });
  if (!result.value) return { value: undefined, status: result.status };

  const near = result.value.flatMap(({ type, name, alert, countries, point }) => {
    const km = point ? distanceKm(place.lat, place.lon, point[1], point[0]) : Infinity;
    if (!countries.includes(place.iso3) && km > nearKm) return [];
    return [{ type, name, alert, distanceKm: Number.isFinite(km) ? Math.round(km) : 0 }];
  });
  return { value: near, status: result.status };
}
