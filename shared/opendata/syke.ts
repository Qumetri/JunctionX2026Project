/** Is the point inside a SYKE flood risk area? ArcGIS REST point query, no key, CORS allowed. */
import { days } from '../cache/store';
import type { Signals } from '../types';
import { cached, fetchJson, type AdapterContext } from './http';

const base = 'https://paikkatieto.ymparisto.fi/arcgis/rest/services/Tulva';

type QueryResult = {
  features?: { attributes: { Nimi?: string; TulvaTyyppi?: string } }[];
  error?: unknown;
};

/** Proposed 2024 flood risk areas first, then the sea-flood management plan areas. */
const layers = [
  'Tulvariskialueet_2024_ehdotetut/MapServer/0',
  'VHSTULVAMERISuunnitelmat/MapServer/0',
];

export function floodArea(lat: number, lon: number, ctx: AdapterContext) {
  const key = `syke:${lat.toFixed(4)},${lon.toFixed(4)}`;
  // Wrapped so that "outside every area" (null) is cached too.
  return cached<{ area: Signals['flood'] }>(ctx, key, days(30), async () => {
    for (const layer of layers) {
      const params = new URLSearchParams({
        geometry: `${lon},${lat}`,
        geometryType: 'esriGeometryPoint',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        // The VHS layer has no Merkittavyys field; asking for it fails the query.
        outFields: 'Nimi,TulvaTyyppi',
        returnGeometry: 'false',
        f: 'json',
      });
      const data = await fetchJson<QueryResult>(`${base}/${layer}/query?${params}`, {}, ctx.signal);
      // ArcGIS reports errors with HTTP 200 and an `error` body.
      if (data.error) throw new Error('SYKE query failed');
      const hit = data.features?.[0]?.attributes;
      if (hit?.Nimi) return { area: { name: hit.Nimi, type: hit.TulvaTyyppi ?? '' } };
    }
    return { area: null };
  });
}
