/**
 * Driving route between the old and the new address with the public OSRM demo server
 * (OpenStreetMap data). No key, CORS open. Falls back to the straight-line distance when the
 * router is unreachable, so the move always has a distance.
 */
import { days } from '../cache/store';
import type { GeoPoint, MoveRoute } from '../types';
import { cached, distanceKm, fetchJson, type AdapterContext } from './http';

type OsrmResponse = {
  code: string;
  routes: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[];
};

export async function drivingRoute(from: GeoPoint, to: GeoPoint, ctx: AdapterContext) {
  const pair = `${from.lon.toFixed(5)},${from.lat.toFixed(5)};${to.lon.toFixed(5)},${to.lat.toFixed(5)}`;
  const result = await cached<MoveRoute>(ctx, `route:${pair}`, days(30), async () => {
    const response = await fetchJson<OsrmResponse>(
      `https://router.project-osrm.org/route/v1/driving/${pair}?overview=simplified&geometries=geojson`,
      { timeoutMs: 5000 },
      ctx.signal,
    );
    const [route] = response.routes ?? [];
    if (response.code !== 'Ok' || !route) return undefined;
    return {
      distanceKm: Math.round(route.distance / 100) / 10,
      durationMin: Math.round(route.duration / 60),
      // GeoJSON is [lon, lat]; the map wants [lat, lon].
      path: route.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
      byRoad: true,
    };
  });
  if (result.value) return result;

  const straight = distanceKm(from.lat, from.lon, to.lat, to.lon);
  return {
    value: {
      distanceKm: Math.round(straight * 10) / 10,
      path: [
        [from.lat, from.lon],
        [to.lat, to.lon],
      ],
      byRoad: false,
    } satisfies MoveRoute,
    status: 'missing' as const,
  };
}
