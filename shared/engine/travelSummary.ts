/**
 * Input for the travel summary and tips, and their template versions. The template needs no
 * model, so the trip always has both; a local model may rewrite them (aiTravelSummary.ts), but
 * only from this input. The score and cover sentences are always computed.
 */
import { coveredByTravelInsurance, type CoverSuggestion } from '../data/travelCover';
import type { Level, TravelFlag } from '../types';
import type { FallbackReason } from './summary';
import type { Assessment } from './score';
import { travelActions, type TripFacts } from './travelRules';

export type TravelSummaryInput = {
  destination: string;
  /** "18 December 2026 to 3 January 2027" */
  dates: string;
  days: number;
  daysUntil: number;
  /** Holiday peak the trip falls in, if any. */
  season?: string;
  score: number;
  level: Level;
  risks: { title: string; level: Level; points: number; why: string; evidence: string[] }[];
  /** Expert tips for the biggest risks, most important first. */
  tips: string[];
  cover: { name: string; covers: string[]; doesNotCover: string[] };
};

export type TravelSummary = {
  overview: string;
  cover: string;
  tips: string[];
  source: 'ai' | 'template';
  tipsSource: 'ai' | 'template';
  model?: string;
  /** Why the template overview is shown: no model answered, or its answers failed the checks. */
  reason?: FallbackReason;
};

const maxRisks = 5;
const maxTips = 5;

const longDate = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

export function travelSummaryInput(
  assessment: Assessment<TravelFlag>,
  facts: TripFacts,
  cover: CoverSuggestion,
  trip: { destination: string; startDate: string; endDate: string },
): TravelSummaryInput {
  const top = assessment.flags.filter((flag) => flag.status !== 'handled').slice(0, maxRisks);
  // One tip per risk first, so the biggest risks each get one, then the rest in order.
  const ordered = [
    ...top.map((flag) => flag.actionIds[0]),
    ...top.flatMap((flag) => flag.actionIds.slice(1)),
  ];
  const tips = [...new Set(ordered)]
    .map((id) => travelActions[id]?.tip)
    .filter((tip): tip is string => Boolean(tip))
    .slice(0, maxTips);

  return {
    destination: trip.destination,
    dates: `${longDate(trip.startDate)} to ${longDate(trip.endDate)}`,
    days: facts.length,
    daysUntil: facts.daysUntil,
    season: facts.peak,
    score: assessment.score,
    level: assessment.level,
    risks: top.map((flag) => ({
      title: flag.title,
      level: flag.severity,
      points: flag.open,
      why: flag.why,
      evidence: flag.evidence,
    })),
    tips,
    cover: {
      name: cover.name,
      covers: top.filter(coveredByTravelInsurance).map((flag) => flag.title),
      doesNotCover: top.filter((flag) => !coveredByTravelInsurance(flag)).map((flag) => flag.title),
    },
  };
}

const quote = (text: string) => `“${text}”`;

function list(items: string[]) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export function travelScoreSentence(input: TravelSummaryInput) {
  return `Your ${input.days}-day trip to ${input.destination} scores ${input.score} of 100, a ${input.level} risk.`;
}

export function templateCover(input: TravelSummaryInput) {
  const { covers, doesNotCover } = input.cover;
  const total = covers.length + doesNotCover.length;
  if (total === 0) return '';
  let text =
    doesNotCover.length === 0
      ? `Travel insurance pays for all of your ${total} main risks.`
      : `Travel insurance pays for ${covers.length} of your ${total} main risks.`;
  if (doesNotCover.length > 0) {
    const one = doesNotCover.length === 1;
    text += ` ${list(doesNotCover.map(quote))} ${one ? 'is' : 'are'} about preparing, not insurance; the steps below lower ${one ? 'it' : 'them'}.`;
  }
  return text;
}

export function templateTravelSummary(input: TravelSummaryInput): TravelSummary {
  const [first, second] = input.risks;
  const rest = input.risks.length - 2;
  let overview = travelScoreSentence(input);
  if (!first) {
    overview += ' We found no notable risks for this trip.';
  } else {
    overview += second
      ? ` The risks that add the most points are ${quote(first.title)} and ${quote(second.title)}.`
      : ` The risk that adds the most points is ${quote(first.title)}.`;
    if (rest > 0)
      overview += ` ${rest} smaller ${rest === 1 ? 'risk is' : 'risks are'} listed below.`;
  }
  return {
    overview,
    cover: templateCover(input),
    tips: input.tips,
    source: 'template',
    tipsSource: 'template',
  };
}
