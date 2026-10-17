/**
 * Input for the short report summary, and the template version of it. The template needs no
 * model, so the report always has a summary; a local model may rewrite it in friendlier words
 * (shared/services/aiSummary.ts) but only from this input (context/application.md §7).
 */
import { homePlans } from '../data/homePlans';
import type { Level } from '../types';
import { planMatch, type PlanSuggestion } from './plans';
import type { Assessment } from './score';

export type SummaryInput = {
  address: string;
  moveDate: string;
  score: number;
  level: Level;
  risks: { title: string; level: Level; points: number; why: string; evidence: string[] }[];
  plan: { name: string; tagline: string; covers: string[]; doesNotCover: string[] };
};

export type Summary = {
  /** 2–3 sentences about the move's overall risk. The only part a model may write. */
  overview: string;
  /** What the suggested plan pays for. Always computed: coverage claims must be exact. */
  plan: string;
  source: 'ai' | 'template';
  model?: string;
};

/** The most relevant open risks; the model sees nothing else. */
const maxRisks = 5;

export function summaryInput(
  assessment: Assessment,
  suggestion: PlanSuggestion,
  address: string,
  moveDate: string,
): SummaryInput {
  const top = assessment.flags.filter((flag) => flag.status !== 'handled').slice(0, maxRisks);
  const plan = homePlans[suggestion.suggested];
  return {
    address,
    moveDate,
    score: assessment.score,
    level: assessment.level,
    risks: top.map((flag) => ({
      title: flag.title,
      level: flag.severity,
      points: flag.open,
      why: flag.why,
      evidence: flag.evidence,
    })),
    plan: {
      name: plan.name,
      tagline: plan.tagline,
      covers: top.filter((flag) => planMatch(plan.id, flag) === 'full').map((flag) => flag.title),
      doesNotCover: top
        .filter((flag) => planMatch(plan.id, flag) !== 'full')
        .map((flag) => flag.title),
    },
  };
}

const quote = (text: string) => `“${text}”`;

function list(items: string[]) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export function templatePlan(input: SummaryInput) {
  const { plan } = input;
  const total = input.risks.length;
  let text =
    plan.doesNotCover.length === 0
      ? `${plan.name} pays for all of your ${total} main risks.`
      : `${plan.name} pays for ${plan.covers.length} of your ${total} main risks.`;
  if (plan.doesNotCover.length > 0) {
    const one = plan.doesNotCover.length === 1;
    text += ` ${list(plan.doesNotCover.map(quote))} ${one ? 'is' : 'are'} not a home insurance matter at this level; the actions in your moving plan lower ${one ? 'it' : 'them'}.`;
  }
  return text;
}

/** The opening sentence is always computed, so the score and level are never misquoted. */
export function scoreSentence(input: SummaryInput) {
  return `Your move to ${input.address} scores ${input.score} of 100, a ${input.level} risk.`;
}

export function templateSummary(input: SummaryInput): Summary {
  const [first, second] = input.risks;
  const rest = input.risks.length - 2;
  let overview = scoreSentence(input);
  if (!first) {
    overview += ' Every risk we found is handled.';
  } else {
    overview += second
      ? ` The risks that add the most points are ${quote(first.title)} and ${quote(second.title)}.`
      : ` The risk that adds the most points is ${quote(first.title)}.`;
    if (rest > 0) {
      overview += ` ${rest} smaller ${rest === 1 ? 'risk is' : 'risks are'} listed below.`;
    }
  }
  return { overview, plan: templatePlan(input), source: 'template' };
}
