/**
 * Travel risk rules. Deterministic and explainable, like the moving engine; scores reuse its
 * severity scale so both journeys read the same on screen.
 */
import type { Destination, TravelPurpose } from '../data/destinations';
import { levelForScore, overallScore, type Level } from './movingRisk';

export type TravelInput = {
  destination: Destination;
  startDate: string;
  endDate: string;
  purpose: TravelPurpose;
  withPet: boolean;
};

export type TravelRiskId = 'medical' | 'cancellation' | 'delay' | 'pet';

export type TravelRisk = {
  id: TravelRiskId;
  name: string;
  level: Level;
  why: string;
  tip: string;
};

const levels: Level[] = ['low', 'medium', 'high'];
const raise = (level: Level, steps = 1) =>
  levels[Math.min(levels.length - 1, levels.indexOf(level) + steps)];

const scoreFor: Record<Level, number> = { low: 25, medium: 55, high: 85 };

const dayMs = 86_400_000;
const toDate = (iso: string) => new Date(`${iso}T00:00:00`);

export function tripFacts(input: TravelInput, today = new Date()) {
  const start = toDate(input.startDate);
  const end = toDate(input.endDate);
  return {
    daysUntil: Math.ceil((start.getTime() - today.getTime()) / dayMs),
    length: Math.max(1, Math.round((end.getTime() - start.getTime()) / dayMs) + 1),
    winterDeparture: [10, 11, 0, 1, 2].includes(start.getMonth()),
  };
}

export function assessTravel(input: TravelInput, today = new Date()) {
  const { destination, purpose, withPet } = input;
  const { daysUntil, length, winterDeparture } = tripFacts(input, today);
  const risks: TravelRisk[] = [];

  // Medical
  const medicalLevel =
    purpose === 'active' ? raise(destination.medicalCost) : destination.medicalCost;
  risks.push({
    id: 'medical',
    name: 'Medical risk',
    level: medicalLevel,
    why:
      destination.medicalNote +
      (purpose === 'active' ? ' Sports like skiing and diving add injury risk.' : ''),
    tip: destination.ehic
      ? 'Pack your EHIC card. Travel insurance still pays what EHIC does not, like the flight home.'
      : 'If travel insurance pays medical costs abroad with no upper limit. Save the 24/7 assistance number.',
  });

  // Cancellation
  let cancellation: Level = destination.longHaul ? 'medium' : 'low';
  if (daysUntil > 60) cancellation = raise(cancellation);
  risks.push({
    id: 'cancellation',
    name: 'Trip cancellation',
    level: cancellation,
    why:
      daysUntil > 60
        ? `Departure is ${daysUntil} days away. The longer the wait, the more time for illness or other changes.`
        : destination.longHaul
          ? 'Long-haul tickets are expensive and often non-refundable.'
          : 'Short trip close to home, so less is at stake if plans change.',
    tip: 'Cancellation cover only applies if you buy travel insurance at least 3 days before you leave.',
  });

  // Transport delay
  let delay: Level = destination.longHaul ? 'medium' : 'low';
  if (winterDeparture) delay = raise(delay);
  risks.push({
    id: 'delay',
    name: 'Transport delay',
    level: delay,
    why:
      [
        destination.longHaul ? 'Long-haul routes usually have a connecting flight.' : '',
        winterDeparture ? 'Winter departures from Finland see more de-icing and snow delays.' : '',
      ]
        .filter(Boolean)
        .join(' ') || 'Direct, short route with few weather problems this time of year.',
    tip:
      destination.entryNote ??
      'Keep receipts for meals and hotels if you are delayed. Travel insurance covers delays, including missed connections.',
  });

  if (withPet) {
    const petLevel: Level =
      destination.pet === 'unlisted' ? 'high' : destination.pet === 'listed' ? 'medium' : 'medium';
    risks.push({
      id: 'pet',
      name: 'Pet entry rules',
      level: petLevel,
      why:
        destination.pet === 'eu'
          ? 'Your pet needs an EU pet passport, a microchip and a rabies vaccination at least 21 days old.'
          : destination.pet === 'listed'
            ? 'Outside the EU: check the country’s own import rules, and the EU rules for coming back.'
            : 'Coming back to the EU from here needs a rabies antibody test and a waiting period of months.',
      tip: 'Dogs coming back to Finland need tapeworm treatment 1–5 days before arrival.',
    });
  }

  const overall = overallScore(risks.map((risk) => scoreFor[risk.level]));
  return { risks, overall, overallLevel: levelForScore(overall), daysUntil, length };
}
