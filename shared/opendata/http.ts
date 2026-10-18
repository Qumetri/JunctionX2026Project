import type { CacheStore } from '../cache/store';
import type { SourceStatus } from '../types';

export type AdapterContext = { cache: CacheStore; signal?: AbortSignal };

export type AdapterResult<T> = { value: T | undefined; status: SourceStatus };

/** Aborts after `ms`, or earlier if the caller's signal aborts. */
function timeoutSignal(ms: number, outer?: AbortSignal) {
  const signals = [AbortSignal.timeout(ms)];
  if (outer) signals.push(outer);
  return AbortSignal.any(signals);
}

export async function fetchJson<T>(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
  outer?: AbortSignal,
): Promise<T> {
  const { timeoutMs = 4000, ...rest } = init;
  const response = await fetch(url, { ...rest, signal: timeoutSignal(timeoutMs, outer) });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} from ${url}`);
  return (await response.json()) as T;
}

/**
 * Cache first, then the network. Any failure returns `missing` instead of throwing, so one
 * slow provider never breaks the report.
 */
export async function cached<T>(
  ctx: AdapterContext,
  key: string,
  ttlMs: number,
  load: () => Promise<T | undefined>,
): Promise<AdapterResult<T>> {
  const hit = ctx.cache.get<T>(key);
  if (hit !== undefined) return { value: hit, status: 'cache' };
  try {
    const value = await load();
    if (value !== undefined) ctx.cache.set(key, value, ttlMs);
    return { value, status: value === undefined ? 'missing' : 'live' };
  } catch {
    return { value: undefined, status: 'missing' };
  }
}

/** Distance in kilometres between two WGS84 points. */
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 12_742 * Math.asin(Math.sqrt(a));
}
