/**
 * Rebuilds shared/reference/petPlaces.ts, the saved copy of Finnish dog parks and vets that the
 * Pet Care page shows when no Overpass server answers. Input is the Geofabrik Finland extract
 * filtered with osmium (https://osmcode.org/osmium-tool/):
 *
 *   curl -LO https://download.geofabrik.de/europe/finland-latest.osm.pbf
 *   osmium tags-filter -o pets.osm.pbf finland-latest.osm.pbf nwr/leisure=dog_park nwr/amenity=veterinary
 *   osmium export -f geojsonseq -a type,id -o pets.geojsonseq pets.osm.pbf
 *   node scripts/pet-places.mjs pets.geojsonseq && npx prettier --write shared/reference/petPlaces.ts
 *
 * Each place is the centre of its bounding box, as Overpass `out center` gives it.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const input = process.argv[2];
if (!input) throw new Error('usage: node scripts/pet-places.mjs <pets.geojsonseq>');

/** Same box as FINLAND_BBOX in shared/opendata/photon.ts. */
const box = [59.5, 19.0, 70.1, 31.6];

const corners = (coordinates) =>
  typeof coordinates[0] === 'number' ? [coordinates] : coordinates.flatMap(corners);
const round = (n) => Math.round(n * 1e5) / 1e5;

const rows = new Map();
for (const line of readFileSync(input, 'utf8').split('\n')) {
  const text = line.replace(/^\x1e/, '').trim();
  if (!text) continue;
  const { geometry, properties: tags } = JSON.parse(text);
  const kind =
    tags.leisure === 'dog_park' ? 'dog-park' : tags.amenity === 'veterinary' ? 'vet' : undefined;
  if (!kind) continue; // a member node of a park outline, with tags of its own
  const points = corners(geometry.coordinates);
  const lons = points.map(([lon]) => lon);
  const lats = points.map(([, lat]) => lat);
  const lat = round((Math.min(...lats) + Math.max(...lats)) / 2);
  const lon = round((Math.min(...lons) + Math.max(...lons)) / 2);
  if (lat < box[0] || lat > box[2] || lon < box[1] || lon > box[3]) continue;
  // A closed way can come out as an area and, for a multipolygon, under its relation id.
  const type = tags['@type'] === 'way' || tags['@type'] === 'relation' ? tags['@type'] : 'node';
  const id = `${type}/${tags['@id']}`;
  rows.set(id, [id, kind, tags['name:en'] ?? tags.name ?? '', lat, lon]);
}

const sorted = [...rows.values()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
const today = new Date().toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
writeFileSync(
  new URL('../shared/reference/petPlaces.ts', import.meta.url),
  `/**
 * Dog parks and vets in Finland from OpenStreetMap, saved on ${today}
 * (© OpenStreetMap contributors, ODbL). Used when the Overpass API is slow or down, which is
 * common on the free public servers. Rows: id, kind, name ('' = unnamed), lat, lon.
 * Rebuilt with scripts/pet-places.mjs.
 */
import type { PetPlaceKind } from '../opendata/overpass';

/** Box the snapshot covers: min lat, min lon, max lat, max lon. */
export const petPlacesBox = ${JSON.stringify(box)} as const;

export const petPlacesSnapshot: [string, PetPlaceKind, string, number, number][] = [
${sorted.map((row) => `  ${JSON.stringify(row)},`).join('\n')}
];
`,
);
console.log(`${sorted.length} places`);
