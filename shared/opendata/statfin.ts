/**
 * Statistics Finland PxWeb (no key, CORS `*`). Variable codes carry date suffixes and change
 * between table versions, so each query is built from the table's cached metadata. Requests go
 * one at a time: parallel bursts get HTTP 429.
 */
import { days } from '../cache/store';
import { referenceCrimeRates, referenceCrimeYear } from '../reference/figures';
import type { Signals } from '../types';
import { cached, fetchJson, type AdapterContext, type AdapterResult } from './http';

const api = 'https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin';

type Meta = { variables: { code: string; values: string[]; valueTexts: string[] }[] };
type JsonStat = {
  id: string[];
  size: number[];
  dimension: Record<string, { category: { index: Record<string, number> } }>;
  value: (number | null)[];
};

let queue: Promise<unknown> = Promise.resolve();

/** Runs `task` after every earlier StatFin request has finished. */
function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

function metadata(table: string, ctx: AdapterContext) {
  return cached<Meta>(ctx, `statfin-meta:${table}`, days(30), () =>
    enqueue(() => fetchJson<Meta>(`${api}/${table}`, { timeoutMs: 6000 }, ctx.signal)),
  );
}

function query(table: string, selection: Record<string, string[]>, ctx: AdapterContext) {
  const body = {
    query: Object.entries(selection).map(([code, values]) => ({
      code,
      selection: { filter: 'item', values },
    })),
    response: { format: 'json-stat2' },
  };
  return enqueue(() =>
    fetchJson<JsonStat>(
      `${api}/${table}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        timeoutMs: 6000,
      },
      ctx.signal,
    ),
  );
}

/** Reads one cell of a json-stat2 response by category code per dimension. */
function cell(data: JsonStat, codes: Record<string, string>) {
  let offset = 0;
  data.id.forEach((dimension, i) => {
    const index = data.dimension[dimension].category.index[codes[dimension]];
    offset = offset * data.size[i] + index;
  });
  return data.value[offset] ?? undefined;
}

const variable = (meta: Meta, prefix: string) =>
  meta.variables.find((v) => v.code === prefix || v.code.startsWith(`${prefix}_`));

/** Municipality code (KU091) for a name, using the table's own value texts. */
function areaCode(meta: Meta, prefix: string, municipality: string) {
  const area = variable(meta, prefix);
  const i = area?.valueTexts.findIndex((text) => text.toLowerCase() === municipality.toLowerCase());
  return area && i !== undefined && i >= 0 ? area.values[i] : undefined;
}

/** Latest final year. Provisional years carry `*` in their text ("2025*"), not in the code. */
function lastFullYear(meta: Meta) {
  const years = variable(meta, 'timeperiod');
  if (!years) return undefined;
  for (let i = years.values.length - 1; i >= 0; i--) {
    if (!years.valueTexts[i].includes('*')) return years.values[i];
  }
  return undefined;
}

const burglaryClass = '101T103a0101';
const arsonClass = '351';

type Crime = NonNullable<Signals['crime']> & { population: number; nationalPopulation: number };

/** Home burglary and arson per 10,000 residents (rpk/13h4), with the national rate. */
export async function crimeRates(
  municipality: string,
  ctx: AdapterContext,
): Promise<AdapterResult<Crime>> {
  const result = await cached<Crime>(ctx, `statfin-crime:${municipality}`, days(30), async () => {
    const meta = (await metadata('rpk/13h4.px', ctx)).value;
    if (!meta) return undefined;
    const area = variable(meta, 'alue');
    const crimeClass = variable(meta, 'rikokset');
    const year = lastFullYear(meta);
    const code = areaCode(meta, 'alue', municipality);
    if (!area || !crimeClass || !year || !code) return undefined;

    const data = await query(
      'rpk/13h4.px',
      {
        [area.code]: ['SSS', code],
        [crimeClass.code]: [burglaryClass, arsonClass],
        contentscode: ['rik_10000', 'rikokset_lkm'],
        timeperiod_y: [year],
      },
      ctx,
    );
    const get = (areaValue: string, crime: string, measure: string) =>
      cell(data, {
        [area.code]: areaValue,
        [crimeClass.code]: crime,
        contentscode: measure,
        timeperiod_y: year,
      }) ?? 0;
    const burglaryRate = get(code, burglaryClass, 'rik_10000');
    const nationalBurglaryRate = get('SSS', burglaryClass, 'rik_10000');
    if (!burglaryRate || !nationalBurglaryRate) return undefined;
    return {
      municipality,
      year,
      burglaryRate,
      arsonRate: get(code, arsonClass, 'rik_10000'),
      nationalBurglaryRate,
      nationalArsonRate: get('SSS', arsonClass, 'rik_10000'),
      // Count ÷ rate gives the population the rate was computed for.
      population: (get(code, burglaryClass, 'rikokset_lkm') / burglaryRate) * 10_000,
      nationalPopulation:
        (get('SSS', burglaryClass, 'rikokset_lkm') / nationalBurglaryRate) * 10_000,
    };
  });
  if (result.value) return result;

  // Offline or table unreachable: the built-in 2025 figures for the capital region.
  const local = referenceCrimeRates[municipality];
  const national = referenceCrimeRates.Finland;
  if (!local) return result;
  return {
    status: 'reference',
    value: {
      municipality,
      year: referenceCrimeYear,
      burglaryRate: local.burglary,
      arsonRate: local.arson,
      nationalBurglaryRate: national.burglary,
      nationalArsonRate: national.arson,
      population: 0,
      nationalPopulation: 0,
    },
  };
}

/** Road accidents with injuries (ton/12qh), last full year, per 10,000 residents. */
export function roadAccidents(
  municipality: string,
  population: { local: number; national: number },
  ctx: AdapterContext,
) {
  return cached<NonNullable<Signals['accidents']>>(
    ctx,
    `statfin-accidents:${municipality}`,
    days(30),
    async () => {
      if (!population.local || !population.national) return undefined;
      const meta = (await metadata('ton/12qh.px', ctx)).value;
      if (!meta) return undefined;
      const area = variable(meta, 'alue');
      const roadClass = variable(meta, 'tieluokka');
      const roadUser = variable(meta, 'tienkayttaja');
      const year = lastFullYear(meta);
      const code = areaCode(meta, 'alue', municipality);
      if (!area || !roadClass || !roadUser || !year || !code) return undefined;

      const data = await query(
        'ton/12qh.px',
        {
          [area.code]: ['SSS', code],
          [roadClass.code]: ['SSS'],
          [roadUser.code]: ['SSS'],
          contentscode: ['konn'],
          timeperiod_y: [year],
        },
        ctx,
      );
      const get = (areaValue: string) =>
        cell(data, {
          [area.code]: areaValue,
          [roadClass.code]: 'SSS',
          [roadUser.code]: 'SSS',
          contentscode: 'konn',
          timeperiod_y: year,
        }) ?? 0;
      const count = get(code);
      const national = get('SSS');
      if (!national) return undefined;
      return {
        municipality,
        year,
        count,
        rate: (count / population.local) * 10_000,
        nationalRate: (national / population.national) * 10_000,
      };
    },
  );
}
