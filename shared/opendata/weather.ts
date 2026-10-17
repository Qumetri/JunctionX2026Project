/** Moving-day forecast from Open-Meteo (no key, CORS `*`). Only the next 16 days exist. */
import { hours } from '../cache/store';
import type { Signals } from '../types';
import { cached, fetchJson, type AdapterContext, type AdapterResult } from './http';

type Daily = {
  daily: {
    time: string[];
    precipitation_sum: (number | null)[];
    snowfall_sum: (number | null)[];
    temperature_2m_min: (number | null)[];
    wind_gusts_10m_max: (number | null)[];
  };
};

export async function moveDayWeather(
  lat: number,
  lon: number,
  date: string,
  ctx: AdapterContext,
): Promise<AdapterResult<NonNullable<Signals['weather']>>> {
  const daysAhead = (new Date(`${date}T00:00:00`).getTime() - Date.now()) / 86_400_000;
  if (daysAhead < -1 || daysAhead > 15) return { value: undefined, status: 'skipped' };

  const key = `weather:${lat.toFixed(2)},${lon.toFixed(2)}:${date}`;
  return cached(ctx, key, hours(1), async () => {
    const params = new URLSearchParams({
      latitude: lat.toFixed(4),
      longitude: lon.toFixed(4),
      daily: 'precipitation_sum,snowfall_sum,temperature_2m_min,wind_gusts_10m_max',
      wind_speed_unit: 'ms',
      timezone: 'Europe/Helsinki',
      start_date: date,
      end_date: date,
    });
    const { daily } = await fetchJson<Daily>(
      `https://api.open-meteo.com/v1/forecast?${params}`,
      {},
      ctx.signal,
    );
    if (daily.time[0] !== date) return undefined;
    return {
      date,
      precipitationMm: daily.precipitation_sum[0] ?? 0,
      snowfallCm: daily.snowfall_sum[0] ?? 0,
      tempMinC: daily.temperature_2m_min[0] ?? 0,
      gustMaxMs: Math.round(daily.wind_gusts_10m_max[0] ?? 0),
    };
  });
}
