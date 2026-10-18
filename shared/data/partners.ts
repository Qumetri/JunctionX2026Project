/**
 * If's official partner benefits in Finland that matter when moving, as published on if.fi and
 * nordea.fi (checked 17 October 2026). If publishes no moving-company or van-rental partner, so
 * those are not listed here.
 */
import type { HousingType } from '../types';
import type { PlanId } from './homePlans';

export type PartnerBenefit = {
  id: string;
  partner: string;
  /** The benefit in a few words, shown large. */
  headline: string;
  detail: string;
  /** Home insurance levels the benefit needs. */
  plans: PlanId[];
  /** Further conditions, in plain words. */
  condition: string;
  /** Only for these home types; any home when left out. */
  housing?: HousingType[];
  sourceUrl: string;
};

const allLevels: PlanId[] = ['perus', 'laaja', 'laajaplus'];

export const partnerBenefits: PartnerBenefit[] = [
  {
    id: 'anticimex',
    partner: 'Anticimex',
    headline: 'Free maintenance plan',
    detail:
      'A building expert visits the new home and writes a maintenance plan, then visits again every four years. Free phone advice in between.',
    plans: ['laaja', 'laajaplus'],
    condition: 'Detached houses insured by you with IF.',
    housing: ['detached'],
    sourceUrl:
      'https://www.if.fi/henkiloasiakkaat/vakuutukset/kotivakuutus/omakotitalo/omakotitalon-kunnossapitosuunnitelma',
  },
  {
    id: 'nordea',
    partner: 'Nordea',
    headline: '25% off the first year',
    detail: 'Nordea customers get 25% off the first insurance period of a new IF home insurance.',
    plans: allLevels,
    condition: 'New home insurance only, first insurance period.',
    sourceUrl:
      'https://www.nordea.fi/henkiloasiakkaat/palvelumme/vakuutukset/if-vakuutukset/kotivakuutus.html',
  },
  {
    id: 'organisations',
    partner: 'Member organisations',
    headline: '10%, up to 15% off',
    detail:
      'Members of IF’s partner organisations, such as Suomen Omakotiliitto, Tehy, Jyty and Talentia, get a lasting discount.',
    plans: allLevels,
    condition: 'Home or casco insurance with IF, and insurance mail in Omat sivut.',
    sourceUrl:
      'https://www.if.fi/henkiloasiakkaat/vakuutukset/asiakasedut/etuja-jarjestojen-jasenille',
  },
  {
    id: 'loyalty',
    partner: 'IFin etuohjelma',
    headline: '10%, up to 15% with two policies',
    detail:
      'IF’s own loyalty programme. One qualifying policy gives 10%. Two from home, casco and personal cover give up to 15% on every eligible policy.',
    plans: allLevels,
    condition: 'Insurance mail in Omat sivut. Applied from the next insurance year.',
    sourceUrl: 'https://www.if.fi/henkiloasiakkaat/vakuutukset/asiakasedut/if-etuohjelma',
  },
];
