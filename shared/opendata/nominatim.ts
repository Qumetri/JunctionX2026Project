/**
 * Address → point with Nominatim (OpenStreetMap). No key; at most 1 request per second and
 * no as-you-type autocomplete, so it is called only when the user presses Calculate risk.
 */
import { days } from '../cache/store';
import type { GeoPoint } from '../types';
import { cached, fetchJson, type AdapterContext } from './http';

type NominatimHit = {
  lat: string;
  lon: string;
  display_name: string;
  address: {
    road?: string;
    house_number?: string;
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
  };
};

export function geocode(query: string, ctx: AdapterContext) {
  const q = query.trim();
  // `fi:` because answers cached before names were pinned to Finnish may hold "Helsingfors".
  return cached<GeoPoint>(ctx, `geocode:fi:${q.toLowerCase()}`, days(30), async () => {
    const params = new URLSearchParams({
      q,
      format: 'jsonv2',
      addressdetails: '1',
      countrycodes: 'fi',
      limit: '1',
      // Without this the browser's language decides: "Helsingfors" or "Хельсинки" match neither
      // the HSY area nor Statistics Finland's Finnish municipality names.
      'accept-language': 'fi',
    });
    const [hit] = await fetchJson<NominatimHit[]>(
      `https://nominatim.openstreetmap.org/search?${params}`,
      { timeoutMs: 5000 },
      ctx.signal,
    );
    if (!hit) return undefined;
    const { address } = hit;
    // `municipality` is the sub-region ("Helsingin seutukunta"); the town is in city/town/village.
    const municipality = address.city ?? address.town ?? address.village;
    const street = [address.road, address.house_number].filter(Boolean).join(' ');
    return {
      lat: Number(hit.lat),
      lon: Number(hit.lon),
      label:
        [street, [address.postcode, municipality].filter(Boolean).join(' ')]
          .filter(Boolean)
          .join(', ') || hit.display_name,
      postcode: address.postcode,
      municipality,
      exact: Boolean(address.house_number),
    };
  });
}
