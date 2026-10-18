/**
 * Active traffic announcements near the new address from Fintraffic Digitraffic (no key,
 * CORS `*`). Only TRAFFIC_ANNOUNCEMENT: the ROAD_WORK feed is about 6 MB, too heavy for a
 * browser. Messages describe the next few days, so this runs only for moves within 7 days.
 */
import { hours } from '../cache/store';
import type { Signals } from '../types';
import { cached, distanceKm, fetchJson, type AdapterContext, type AdapterResult } from './http';

type Position = [number, number];
type Geometry =
  | { type: 'Point'; coordinates: Position }
  | { type: 'LineString' | 'MultiPoint'; coordinates: Position[] }
  | { type: 'MultiLineString' | 'Polygon'; coordinates: Position[][] }
  | null;

type Messages = {
  features: {
    geometry: Geometry;
    properties: {
      announcements?: {
        title?: string;
        timeAndDuration?: { startTime?: string; endTime?: string };
      }[];
    };
  }[];
};

type Announcement = { title: string; points: Position[]; start?: string; end?: string };

function positions(geometry: Geometry): Position[] {
  if (!geometry) return [];
  switch (geometry.type) {
    case 'Point':
      return [geometry.coordinates];
    case 'LineString':
    case 'MultiPoint':
      return geometry.coordinates;
    default:
      return geometry.coordinates.flat();
  }
}

export async function trafficNearby(
  lat: number,
  lon: number,
  date: string,
  ctx: AdapterContext,
): Promise<AdapterResult<NonNullable<Signals['traffic']>>> {
  const daysAhead = (new Date(`${date}T00:00:00`).getTime() - Date.now()) / 86_400_000;
  if (daysAhead < -1 || daysAhead > 7) return { value: undefined, status: 'skipped' };

  const all = await cached<Announcement[]>(
    ctx,
    'digitraffic:announcements:v2',
    hours(0.25),
    async () => {
      const data = await fetchJson<Messages>(
        'https://tie.digitraffic.fi/api/traffic-message/v1/messages?inactiveHours=0&includeAreaGeometry=false&situationType=TRAFFIC_ANNOUNCEMENT',
        { headers: { 'Digitraffic-User': 'LifeMoments/JunctionX2026' } },
        ctx.signal,
      );
      return data.features.map((feature) => {
        const announcement = feature.properties.announcements?.[0];
        return {
          title: announcement?.title?.trim() ?? 'Traffic announcement',
          points: positions(feature.geometry),
          start: announcement?.timeAndDuration?.startTime,
          end: announcement?.timeAndDuration?.endTime,
        };
      });
    },
  );
  if (!all.value) return { value: undefined, status: all.status };

  // Only what is still on during moving day: an accident cleared tonight says nothing about a
  // move next week. No end time means open-ended.
  const dayStart = new Date(`${date}T00:00:00`).getTime();
  const dayEnd = dayStart + 86_400_000;
  const near = all.value
    .filter(
      (message) =>
        (!message.end || Date.parse(message.end) > dayStart) &&
        (!message.start || Date.parse(message.start) < dayEnd),
    )
    .map((message) => ({
      title: message.title.replace(/\.\s*$/, ''),
      distanceKm: Math.min(...message.points.map(([x, y]) => distanceKm(lat, lon, y, x))),
    }))
    .filter((message) => message.distanceKm <= 3)
    .sort((a, b) => a.distanceKm - b.distanceKm);
  return { value: near, status: all.status };
}
