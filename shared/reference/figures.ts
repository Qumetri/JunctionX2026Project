/**
 * Static figures shown next to flags. Each carries its source so the UI can cite it.
 * Values are from context/backendMovingPlan.md §2 ("Reference figures").
 */

type Figure = { value: number; unit: string; year: number; source: string; url: string };

const financeFinland = 'https://www.finanssiala.fi/aiheet/palo-murto-vuotovahingot/';
const pronto = 'https://www.pelastusopisto.fi/tutkimus-ja-kehitys/pronto/';
const eurocontrol = 'https://ansperformance.eu/csv/';

export const figures = {
  waterClaimEur: {
    value: 4300,
    unit: '€ per leak claim',
    year: 2025,
    source: 'Finance Finland',
    url: financeFinland,
  },
  burglaryClaimEur: {
    value: 1000,
    unit: '€ per burglary or theft claim',
    year: 2025,
    source: 'Finance Finland',
    url: financeFinland,
  },
  buildingFireDamageEur: {
    value: 36796,
    unit: '€ average damage per building fire',
    year: 2024,
    source: 'Pelastusopisto PRONTO',
    url: pronto,
  },
  firesWithoutDetector: {
    value: 605,
    unit: 'residential fires with no smoke detector',
    year: 2024,
    source: 'Pelastusopisto PRONTO',
    url: pronto,
  },
  /** Computed from Eurocontrol apt_dly_2025 (context/techStack.md, "Travel disruption data"). */
  helsinkiWeatherDelayShare: {
    value: 95,
    unit: "% of Helsinki Airport's air-traffic flow delay caused by weather",
    year: 2025,
    source: 'EUROCONTROL',
    url: eurocontrol,
  },
} satisfies Record<string, Figure>;

/**
 * Rates per 10,000 residents from Statistics Finland rpk/13h4 (2025), used when the live
 * table can't be reached. Keys are municipality names as the geocoder returns them.
 */
export const referenceCrimeRates: Record<string, { burglary: number; arson: number }> = {
  Finland: { burglary: 6.03, arson: 0.4 },
  Helsinki: { burglary: 6.11, arson: 0.43 },
  Espoo: { burglary: 6.02, arson: 0.37 },
  Vantaa: { burglary: 9.84, arson: 0.51 },
};
export const referenceCrimeYear = '2025';
