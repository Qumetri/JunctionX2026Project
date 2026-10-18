/**
 * Address suggestions while the user types, with Photon (OpenStreetMap, no key). Nominatim's
 * usage policy rules out as-you-type queries, so only the text the user picks (or types) goes to
 * Nominatim, when they press Calculate risk.
 */
import { fetchJson } from './http';

export type AddressSuggestion = {
  /** What goes into the address field, in the same form Nominatim resolves on Calculate. */
  label: string;
  lat: number;
  lon: number;
};

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    district?: string;
    state?: string;
    countrycode?: string;
  };
};

// Rough Finland box (min lon, min lat, max lon, max lat). Photon ranks inside it, and results
// outside it are dropped too, so a city name cannot pull in a town abroad.
const FINLAND_BBOX = '19.0,59.5,31.6,70.1';

/** "Mannerheimintie 1, 00100 Helsinki". A street address wins over a point-of-interest name. */
export function formatSuggestion(properties: PhotonFeature['properties']) {
  const street = properties.street
    ? [properties.street, properties.housenumber].filter(Boolean).join(' ')
    : '';
  const lead = street || properties.name || '';
  const place = [properties.postcode, properties.city ?? properties.district]
    .filter(Boolean)
    .join(' ');
  return lead && place && lead !== place ? `${lead}, ${place}` : lead || place;
}

export async function searchAddresses(
  query: string,
  signal?: AbortSignal,
): Promise<AddressSuggestion[]> {
  const params = new URLSearchParams({ q: query.trim(), limit: '10', bbox: FINLAND_BBOX });
  const json = await fetchJson<{ features: PhotonFeature[] }>(
    `https://photon.komoot.io/api/?${params}`,
    { timeoutMs: 4000 },
    signal,
  );

  // Photon returns several points of interest on the same address, so keep one per label.
  const seen = new Set<string>();
  const suggestions: AddressSuggestion[] = [];
  for (const feature of json.features) {
    if (feature.properties.countrycode !== 'FI') continue;
    const label = formatSuggestion(feature.properties);
    if (!label || seen.has(label)) continue;
    seen.add(label);
    const [lon, lat] = feature.geometry.coordinates;
    suggestions.push({ label, lat, lon });
    if (suggestions.length === 5) break;
  }
  return suggestions;
}
