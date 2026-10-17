/**
 * Weather from Open-Meteo (no key, CORS `*`): the moving-day forecast, and the weather over a
 * trip. Forecasts only exist for the next 16 days; later trips use the same dates a year earlier.
 */
import { days, hours } from '../cache/store';
import type { Signals, TripWeather } from '../types';
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

type TripDaily = {
  daily: {
    time: string[];
    temperature_2m_max: (number | null)[];
    temperature_2m_min: (number | null)[];
    precipitation_sum: (number | null)[];
    snowfall_sum: (number | null)[];
    wind_gusts_10m_max: (number | null)[];
  };
};

const dayMs = 86_400_000;
const iso = (date: Date) => date.toISOString().slice(0, 10);
const utc = (isoDate: string) => new Date(`${isoDate}T00:00:00Z`);
const addDays = (date: Date, n: number) => new Date(date.getTime() + n * dayMs);

/** Longest window we fetch; longer trips are judged on their first month. */
const maxTripDays = 31;

/** Thresholds for a day to count: heat stress, heavy rain, storm gusts, real snow, hard frost. */
export const tripThresholds = { hotC: 35, heavyRainMm: 20, stormGustMs: 20, snowCm: 5, coldC: -15 };

export async function tripWeather(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string,
  ctx: AdapterContext,
  now = new Date(),
): Promise<AdapterResult<TripWeather>> {
  const today = utc(iso(now));
  const start = utc(startDate);
  let end = utc(endDate);
  if (end < start) return { value: undefined, status: 'skipped' };
  if (end < today) return { value: undefined, status: 'skipped' };

  let basis: TripWeather['basis'];
  let from: Date;
  let to: Date;
  if ((start.getTime() - today.getTime()) / dayMs <= 15) {
    basis = 'forecast';
    from = start < today ? today : start;
    const lastForecastDay = addDays(today, 15);
    to = end > lastForecastDay ? lastForecastDay : end;
  } else {
    // The archive lags a few days, so step back whole years until the dates are history.
    basis = 'last-year';
    end = addDays(start, Math.min(maxTripDays, (end.getTime() - start.getTime()) / dayMs + 1) - 1);
    let years = 1;
    const shift = (date: Date, n: number) => {
      const copy = new Date(date);
      copy.setUTCFullYear(copy.getUTCFullYear() - n);
      return copy;
    };
    while (shift(end, years) > addDays(today, -6)) years++;
    from = shift(start, years);
    to = shift(end, years);
  }

  const key = `tripweather:${lat.toFixed(2)},${lon.toFixed(2)}:${iso(from)}:${iso(to)}`;
  return cached(ctx, key, basis === 'forecast' ? hours(3) : days(30), async () => {
    const params = new URLSearchParams({
      latitude: lat.toFixed(4),
      longitude: lon.toFixed(4),
      daily:
        'temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,wind_gusts_10m_max',
      wind_speed_unit: 'ms',
      timezone: 'auto',
      start_date: iso(from),
      end_date: iso(to),
    });
    const host =
      basis === 'forecast'
        ? 'https://api.open-meteo.com/v1/forecast'
        : 'https://archive-api.open-meteo.com/v1/archive';
    const { daily } = await fetchJson<TripDaily>(
      `${host}?${params}`,
      { timeoutMs: 6000 },
      ctx.signal,
    );
    if (daily.time.length === 0) return undefined;

    const t = tripThresholds;
    const count = (values: (number | null)[], test: (value: number) => boolean) =>
      values.filter((value) => value !== null && test(value)).length;
    const known = (values: (number | null)[]) => values.filter((value) => value !== null);
    return {
      basis,
      from: daily.time[0],
      to: daily.time[daily.time.length - 1],
      days: daily.time.length,
      hotDays: count(daily.temperature_2m_max, (value) => value >= t.hotC),
      heavyRainDays: count(daily.precipitation_sum, (value) => value >= t.heavyRainMm),
      stormDays: count(daily.wind_gusts_10m_max, (value) => value >= t.stormGustMs),
      snowDays: count(daily.snowfall_sum, (value) => value >= t.snowCm),
      coldDays: count(daily.temperature_2m_min, (value) => value <= t.coldC),
      maxTempC: Math.round(Math.max(...known(daily.temperature_2m_max))),
      minTempC: Math.round(Math.min(...known(daily.temperature_2m_min))),
    };
  });
}
