/**
 * UK FCDO travel advice (gov.uk content API, no key, CORS `*`). Finland's own advice (um.fi) has
 * no API, so the UI names this as UK advice and links to um.fi (context/techStack.md).
 */
import { hours } from '../cache/store';
import type { TravelSignals } from '../types';
import { cached, fetchJson, type AdapterContext, type AdapterResult } from './http';

type Content = {
  public_updated_at?: string;
  details?: { alert_status?: string[]; change_description?: string };
};

export async function travelAdvice(
  slug: string,
  ctx: AdapterContext,
): Promise<AdapterResult<NonNullable<TravelSignals['advisory']>>> {
  return cached(ctx, `fcdo:${slug}`, hours(12), async () => {
    const page = await fetchJson<Content>(
      `https://www.gov.uk/api/content/foreign-travel-advice/${slug}`,
      { timeoutMs: 6000 },
      ctx.signal,
    );
    if (!page.details) return undefined;
    return {
      alerts: page.details.alert_status ?? [],
      change: (page.details.change_description ?? '').trim(),
      updated: (page.public_updated_at ?? '').slice(0, 10),
    };
  });
}
