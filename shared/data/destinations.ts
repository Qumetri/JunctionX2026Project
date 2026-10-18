/**
 * Travel destinations the risk check knows. Coordinates feed the weather and hazard checks, the
 * FCDO slug the travel advice; the rest is hand-written from public sources (Kela EHIC, EU pet
 * travel rules, FCDO entry requirements) and only changes when those rules do.
 */
import type { Level, TravelPurpose } from '../types';

export type Destination = {
  id: string;
  name: string;
  country: string;
  /** ISO 3166-1 alpha-3, as GDACS lists affected countries. */
  iso3: string;
  /** Page name under gov.uk/foreign-travel-advice/. */
  fcdoSlug: string;
  lat: number;
  lon: number;
  /** EU/EEA or Switzerland: the European Health Insurance Card (EHIC) from Kela applies. */
  ehic: boolean;
  /** No direct flight from Helsinki for most trips, so usually a connection. */
  longHaul: boolean;
  /** Typical cost of private or emergency care for a visitor. */
  medicalCost: Level;
  medicalNote: string;
  /** Pet entry and return rules, from the EU pet travel rules. */
  pet: 'eu' | 'listed' | 'unlisted';
  /** Travel vaccines are recommended beyond the Finnish vaccination programme. */
  vaccines: boolean;
  /** Something to apply for or fill in before arrival. */
  entry?: { title: string; detail: string; actionId: string };
  /** Known seasonal hazards by month (1–12); the weather check adds the measured side. */
  seasons?: { months: number[]; label: string; points: number }[];
};

export const destinations: Destination[] = [
  {
    id: 'tallinn',
    name: 'Tallinn, Estonia',
    country: 'Estonia',
    iso3: 'EST',
    fcdoSlug: 'estonia',
    lat: 59.437,
    lon: 24.754,
    ehic: true,
    longHaul: false,
    medicalCost: 'low',
    medicalNote: 'Your EHIC card from Kela gets you public care at local prices.',
    pet: 'eu',
    vaccines: false,
  },
  {
    id: 'stockholm',
    name: 'Stockholm, Sweden',
    country: 'Sweden',
    iso3: 'SWE',
    fcdoSlug: 'sweden',
    lat: 59.329,
    lon: 18.069,
    ehic: true,
    longHaul: false,
    medicalCost: 'low',
    medicalNote: 'Your EHIC card from Kela gets you public care at local prices.',
    pet: 'eu',
    vaccines: false,
  },
  {
    id: 'rome',
    name: 'Rome, Italy',
    country: 'Italy',
    iso3: 'ITA',
    fcdoSlug: 'italy',
    lat: 41.903,
    lon: 12.496,
    ehic: true,
    longHaul: false,
    medicalCost: 'medium',
    medicalNote: 'EHIC covers public care, but you may wait long in public A&E or pay a share.',
    pet: 'eu',
    vaccines: false,
  },
  {
    id: 'malaga',
    name: 'Málaga, Spain',
    country: 'Spain',
    iso3: 'ESP',
    fcdoSlug: 'spain',
    lat: 36.721,
    lon: -4.421,
    ehic: true,
    longHaul: false,
    medicalCost: 'medium',
    medicalNote:
      'EHIC covers public care, but clinics in resort areas are often private and bill you directly.',
    pet: 'eu',
    vaccines: false,
  },
  {
    id: 'gran-canaria',
    name: 'Gran Canaria, Spain',
    country: 'Spain',
    iso3: 'ESP',
    fcdoSlug: 'spain',
    lat: 27.92,
    lon: -15.547,
    ehic: true,
    longHaul: false,
    medicalCost: 'medium',
    medicalNote:
      'EHIC covers public care, but clinics in resort areas are often private and bill you directly.',
    pet: 'eu',
    vaccines: false,
  },
  {
    id: 'bangkok',
    name: 'Bangkok, Thailand',
    country: 'Thailand',
    iso3: 'THA',
    fcdoSlug: 'thailand',
    lat: 13.756,
    lon: 100.502,
    ehic: false,
    longHaul: true,
    medicalCost: 'medium',
    medicalNote: 'Private hospitals ask for a payment guarantee before treatment.',
    pet: 'unlisted',
    vaccines: true,
    entry: {
      title: 'Thailand Digital Arrival Card',
      detail:
        'Fill it in online in the 3 days before you land. Your passport must be valid for 6 months after arrival.',
      actionId: 'arrival-card',
    },
    seasons: [
      {
        months: [5, 6, 7, 8, 9, 10],
        label: 'Rainy season (May–October): heavy downpours and street flooding',
        points: 4,
      },
    ],
  },
  {
    id: 'tokyo',
    name: 'Tokyo, Japan',
    country: 'Japan',
    iso3: 'JPN',
    fcdoSlug: 'japan',
    lat: 35.676,
    lon: 139.65,
    ehic: false,
    longHaul: true,
    medicalCost: 'medium',
    medicalNote: 'Care is good but you pay in full as a visitor, often before treatment.',
    pet: 'listed',
    vaccines: false,
    seasons: [
      {
        months: [8, 9, 10],
        label: 'Typhoon season (August–October): flights and trains can stop for a day or two',
        points: 5,
      },
    ],
  },
  {
    id: 'new-york',
    name: 'New York, USA',
    country: 'United States',
    iso3: 'USA',
    fcdoSlug: 'usa',
    lat: 40.713,
    lon: -74.006,
    ehic: false,
    longHaul: true,
    medicalCost: 'high',
    medicalNote: 'Hospital bills in the US are among the highest in the world.',
    pet: 'listed',
    vaccines: false,
    entry: {
      title: 'ESTA travel authorisation',
      detail: 'Apply at least 72 hours before you fly.',
      actionId: 'apply-esta',
    },
    seasons: [
      {
        months: [12, 1, 2, 3],
        label: 'Winter storms (December–March) can close the airports',
        points: 3,
      },
      {
        months: [8, 9, 10],
        label: 'Peak of the Atlantic hurricane season (August–October)',
        points: 2,
      },
    ],
  },
];

export const destinationById = (id: string) =>
  destinations.find((item) => item.id === id) ?? destinations[0];

export const travelPurposes: { id: TravelPurpose; label: string }[] = [
  { id: 'holiday', label: 'Holiday' },
  { id: 'active', label: 'Active holiday (skiing, diving)' },
  { id: 'business', label: 'Business trip' },
  { id: 'family', label: 'Visiting family' },
];
