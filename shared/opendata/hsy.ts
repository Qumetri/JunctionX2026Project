/**
 * Building facts from the HSY building register (Helsinki, Espoo, Vantaa, Kauniainen).
 * HSY sends no CORS headers, so the browser calls the same-origin `/proxy/hsy` path
 * (Vite proxy in dev, host rewrite when deployed). Node or React Native can pass
 * `https://kartta.hsy.fi/geoserver` as the base instead.
 */
import { days } from '../cache/store';
import type { Signals } from '../types';
import { cached, distanceKm, fetchJson, type AdapterContext } from './http';

export const hsyBase = { url: '/proxy/hsy' };

type Ring = [number, number][];
type BuildingFeature = {
  geometry:
    | { type: 'Polygon'; coordinates: Ring[] }
    | { type: 'MultiPolygon'; coordinates: Ring[][] }
    | null;
  properties: {
    valm_v: number | null;
    kerrosluku: number | null;
    kayttark: string | null;
    polttoaine: string | null;
  };
};

function rings(feature: BuildingFeature): Ring[] {
  if (!feature.geometry) return [];
  return feature.geometry.type === 'Polygon'
    ? feature.geometry.coordinates.slice(0, 1)
    : feature.geometry.coordinates.map((polygon) => polygon[0]);
}

function contains(ring: Ring, lon: number, lat: number) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Distance from the point to the nearest corner of the building, in km. */
function nearestCornerKm(feature: BuildingFeature, lon: number, lat: number) {
  const corners = rings(feature).flat();
  if (corners.length === 0) return Infinity;
  return Math.min(...corners.map(([x, y]) => distanceKm(lat, lon, y, x)));
}

export function building(lat: number, lon: number, ctx: AdapterContext) {
  const key = `hsy:${lat.toFixed(5)},${lon.toFixed(5)}`;
  return cached<NonNullable<Signals['building']>>(ctx, key, days(7), async () => {
    // About ±30 m. With `EPSG:4326` in the bbox, GeoServer reads lon,lat order.
    const d = 0.0003;
    const bbox = [lon - d * 2, lat - d, lon + d * 2, lat + d].map((n) => n.toFixed(6)).join(',');
    const params = new URLSearchParams({
      service: 'WFS',
      version: '2.0.0',
      request: 'GetFeature',
      typeNames: 'ilmasto_ja_energia:rakennukset',
      outputFormat: 'application/json',
      srsName: 'EPSG:4326',
      bbox: `${bbox},EPSG:4326`,
      propertyName: 'valm_v,kerrosluku,kayttark,polttoaine,geom',
    });
    const data = await fetchJson<{ features: BuildingFeature[] }>(
      `${hsyBase.url}/wfs?${params}`,
      { timeoutMs: 5000 },
      ctx.signal,
    );
    const dated = data.features.filter((feature) => feature.properties.valm_v);
    // Geocoded points often land on the street, so take the containing building or the nearest.
    const match =
      dated.find((feature) => rings(feature).some((ring) => contains(ring, lon, lat))) ??
      [...dated].sort((a, b) => nearestCornerKm(a, lon, lat) - nearestCornerKm(b, lon, lat))[0];
    if (!match) return undefined;
    const { valm_v, kerrosluku, kayttark, polttoaine } = match.properties;
    return {
      year: valm_v ?? undefined,
      // The register uses a huge sentinel for unknown floor counts.
      floors: kerrosluku && kerrosluku < 200 ? kerrosluku : undefined,
      use: kayttark ?? undefined,
      heating: polttoaine ?? undefined,
    };
  });
}
