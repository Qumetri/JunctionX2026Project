/**
 * If home insurance levels in Finland (Perus, Laaja, LaajaPlus), from context/ifInsurancePlans.md
 * §1.1–1.2. Figures were read from if.fi through a summarising tool; re-check before quoting.
 * No prices: If publishes them only through its calculator.
 */
import type { CoverageTag } from '../types';

export type PlanId = 'perus' | 'laaja' | 'laajaplus';

export type HomePlan = {
  id: PlanId;
  name: string;
  tagline: string;
  covers: Partial<Record<CoverageTag, 'full' | 'partial'>>;
};

export const planOrder: PlanId[] = ['perus', 'laaja', 'laajaplus'];

const base = {
  'water-damage': 'full',
  fire: 'full',
  'natural-hazard': 'full',
  liability: 'full',
  'home-contents': 'full',
} as const;

export const homePlans: Record<PlanId, HomePlan> = {
  perus: {
    id: 'perus',
    name: 'Perus',
    tagline: 'The essentials: fire, leaks, natural hazards and liability.',
    covers: base,
  },
  laaja: {
    id: 'laaja',
    name: 'Laaja',
    tagline: 'Adds breakage during the move, theft and vandalism.',
    covers: { ...base, theft: 'full', transit: 'full', valuables: 'partial' },
  },
  laajaplus: {
    id: 'laajaplus',
    name: 'LaajaPlus',
    tagline: 'Higher limits, smaller deductions and moisture damage to the structure.',
    covers: {
      ...base,
      theft: 'full',
      transit: 'full',
      valuables: 'full',
      'structure-moisture': 'full',
    },
  },
};

/**
 * One row per perk. A string is what the level gives; `false` means not included.
 * `detachedOnly` rows apply to detached houses and cottages.
 */
export type Perk = {
  id: string;
  label: string;
  values: Record<PlanId, string | false>;
  detachedOnly?: boolean;
};

export const perks: Perk[] = [
  {
    id: 'both-homes',
    label: 'Belongings covered in the old and the new home',
    values: { perus: '3 months', laaja: '3 months', laajaplus: '3 months' },
  },
  {
    id: 'core-damage',
    label: 'Fire, leak, electrical and natural-hazard damage',
    values: { perus: 'Included', laaja: 'Included', laajaplus: 'Included' },
  },
  {
    id: 'liability',
    label: 'Liability for damage you cause to others',
    values: { perus: 'Up to €200,000', laaja: 'Up to €200,000', laajaplus: 'Up to €200,000' },
  },
  {
    id: 'legal',
    label: 'Legal protection',
    values: { perus: 'Up to €10,000', laaja: 'Up to €10,000', laajaplus: 'Up to €10,000' },
  },
  {
    id: 'temporary-housing',
    label: 'Extra living costs if the home becomes unusable',
    values: { perus: '85%, 12 months', laaja: '85%, 12 months', laajaplus: '85%, 12 months' },
  },
  {
    id: 'breakage',
    label: 'Sudden breakage, including during the move',
    values: { perus: false, laaja: 'Included', laajaplus: 'Included' },
  },
  {
    id: 'theft',
    label: 'Theft and vandalism',
    values: { perus: false, laaja: 'Included', laajaplus: 'Included' },
  },
  {
    id: 'fittings',
    label: 'Fixed fittings',
    values: { perus: false, laaja: 'Up to €10,000', laajaplus: 'Up to €10,000' },
  },
  {
    id: 'item-limit',
    label: 'Limit per item',
    values: { perus: '€5,000', laaja: '€5,000', laajaplus: '€17,000' },
  },
  {
    id: 'art-jewellery',
    label: 'Art and jewellery in total',
    values: { perus: false, laaja: false, laajaplus: 'Up to €50,000' },
  },
  {
    id: 'age-deductions',
    label: 'Smaller age deductions on older items',
    values: { perus: false, laaja: false, laajaplus: 'Included' },
  },
  {
    id: 'baggage',
    label: 'Travel baggage deductible',
    values: { perus: false, laaja: false, laajaplus: '€50' },
  },
  {
    id: 'maintenance-plan',
    label: 'Maintenance plan with an Anticimex visit every 4 years',
    values: { perus: false, laaja: 'Included', laajaplus: 'Included' },
    detachedOnly: true,
  },
  {
    id: 'structure-moisture',
    label: 'Moisture and pest damage to the structure',
    values: { perus: false, laaja: false, laajaplus: 'Up to €15,000 per claim' },
    detachedOnly: true,
  },
];

export const planSourceUrl = 'https://www.if.fi/henkiloasiakkaat/vakuutukset/kotivakuutus';
