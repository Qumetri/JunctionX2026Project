import type { Level } from '../engine/movingRisk';

export type Destination = {
  id: string;
  name: string;
  /** EU/EEA or Switzerland: the European Health Insurance Card (EHIC) from Kela applies. */
  ehic: boolean;
  longHaul: boolean;
  /** Typical cost of private or emergency care for a visitor. */
  medicalCost: Level;
  medicalNote: string;
  /** Pet entry and return rules, from the EU pet travel rules. */
  pet: 'eu' | 'listed' | 'unlisted';
  entryNote?: string;
};

export const destinations: Destination[] = [
  {
    id: 'tallinn',
    name: 'Tallinn, Estonia',
    ehic: true,
    longHaul: false,
    medicalCost: 'low',
    medicalNote: 'Your EHIC card from Kela gets you public care at local prices.',
    pet: 'eu',
  },
  {
    id: 'stockholm',
    name: 'Stockholm, Sweden',
    ehic: true,
    longHaul: false,
    medicalCost: 'low',
    medicalNote: 'Your EHIC card from Kela gets you public care at local prices.',
    pet: 'eu',
  },
  {
    id: 'malaga',
    name: 'Málaga, Spain',
    ehic: true,
    longHaul: false,
    medicalCost: 'medium',
    medicalNote:
      'EHIC covers public care, but clinics in resort areas are often private and bill you directly.',
    pet: 'eu',
  },
  {
    id: 'bangkok',
    name: 'Bangkok, Thailand',
    ehic: false,
    longHaul: true,
    medicalCost: 'medium',
    medicalNote:
      'Private hospitals ask for a payment guarantee before treatment. Check vaccine advice at least a month ahead.',
    pet: 'unlisted',
  },
  {
    id: 'tokyo',
    name: 'Tokyo, Japan',
    ehic: false,
    longHaul: true,
    medicalCost: 'medium',
    medicalNote: 'Care is good but you pay in full as a visitor, often before treatment.',
    pet: 'listed',
  },
  {
    id: 'new-york',
    name: 'New York, USA',
    ehic: false,
    longHaul: true,
    medicalCost: 'high',
    medicalNote: 'Hospital bills in the US are among the highest in the world.',
    pet: 'listed',
    entryNote: 'Apply for an ESTA travel authorisation at least 72 hours before you fly.',
  },
];

export const travelPurposes = [
  { id: 'holiday', label: 'Holiday' },
  { id: 'active', label: 'Active holiday (skiing, diving)' },
  { id: 'business', label: 'Business trip' },
  { id: 'family', label: 'Visiting family' },
] as const;

export type TravelPurpose = (typeof travelPurposes)[number]['id'];
