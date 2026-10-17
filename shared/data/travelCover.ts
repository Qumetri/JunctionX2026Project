/**
 * If travel insurance (matkavakuutus) facts from if.fi, as summarised in
 * context/ifInsurancePlans.md §1.4, and the computed cover note for one trip.
 */
import type { TravelCoverageTag, TravelFlag, TravelRequest } from '../types';

export const travelCover = {
  /** Cancellation cover only applies if the policy was bought this many days before departure. */
  buyDaysBefore: 3,
  /** Continuous (jatkuva) cover: each trip up to this many days. */
  continuousMaxDays: 45,
  /** Cancellation or interruption due to illness, per person per trip. */
  cancellationLimitEur: 5000,
  /** Tags travel insurance pays for. Baggage is also in every home insurance level. */
  pays: ['medical-abroad', 'trip-cancellation', 'travel-delay', 'baggage'] as TravelCoverageTag[],
  url: 'https://www.if.fi/henkiloasiakkaat/vakuutukset/matkavakuutus',
};

export const travelCategoryNames = {
  health: 'Health abroad',
  trip: 'Cancellation and delay',
  destination: 'Safety and weather',
  belongings: 'Luggage and pets',
} as const;

/** A flag is paid for when travel insurance covers every tag on it. */
export const coveredByTravelInsurance = (flag: TravelFlag) =>
  flag.coverageTags.length > 0 && flag.coverageTags.every((tag) => travelCover.pays.includes(tag));

export type CoverSuggestion = {
  kind: 'fixed-term' | 'continuous' | 'check-yours';
  name: string;
  reason: string;
};

export function suggestTravelCover(request: TravelRequest, tripDays: number): CoverSuggestion {
  const long = tripDays > travelCover.continuousMaxDays;
  if (request.answers.hasTravelInsurance) {
    return long
      ? {
          kind: 'fixed-term',
          name: 'Cover for the extra days',
          reason: `Continuous cover ends after day ${travelCover.continuousMaxDays} of a trip. Ask IF how to cover the rest of this ${tripDays}-day trip.`,
        }
      : {
          kind: 'check-yours',
          name: 'Your travel insurance',
          reason:
            'Check that it is valid for the whole trip, and that it includes cancellation cover.',
        };
  }
  return long
    ? {
        kind: 'fixed-term',
        name: 'Fixed-term travel insurance',
        reason: `Continuous cover only covers trips up to ${travelCover.continuousMaxDays} days, so this ${tripDays}-day trip needs fixed-term cover.`,
      }
    : {
        kind: 'fixed-term',
        name: 'Fixed-term travel insurance',
        reason: `Covers this trip only. Continuous cover suits you better if you travel several times a year (each trip up to ${travelCover.continuousMaxDays} days).`,
      };
}
