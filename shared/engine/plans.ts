/**
 * Plan fit and the suggested home insurance level (context/application.md §6).
 *
 *   weight(flag) = high 3 · medium 2 · low 1           (open flags only)
 *   match(p, f)  = 1 if p fully covers all of f's tags · 0.5 if it covers some · 0 if none
 *   fit(p)       = 100 × Σ weight × match / Σ weight
 *
 * Suggested level = the higher of
 *   - the level for the risk bar (low → Perus, medium → Laaja, high → LaajaPlus), and
 *   - the cheapest level that fully covers every open high flag any level can cover.
 */
import { homePlans, planOrder, type PlanId } from '../data/homePlans';
import type { Flag, Level } from '../types';
import type { ScoredFlag } from './score';

const weight: Record<Level, number> = { high: 3, medium: 2, low: 1 };

export type Match = 'full' | 'partial' | 'none';

export function planMatch(planId: PlanId, flag: Flag): Match {
  const covers = homePlans[planId].covers;
  const levels = flag.coverageTags.map((tag) => covers[tag]);
  if (levels.length > 0 && levels.every((level) => level === 'full')) return 'full';
  if (levels.some((level) => level !== undefined)) return 'partial';
  return 'none';
}

export type PlanFit = {
  planId: PlanId;
  fit: number;
  covered: number;
  partial: number;
  matches: { flagId: string; match: Match }[];
};

export function planFit(planId: PlanId, flags: ScoredFlag[]): PlanFit {
  const open = flags.filter((flag) => flag.status !== 'handled');
  const matches = open.map((flag) => ({ flagId: flag.id, match: planMatch(planId, flag) }));
  const total = open.reduce((sum, flag) => sum + weight[flag.severity], 0);
  const scored = open.reduce((sum, flag, index) => {
    const match = matches[index].match;
    return sum + weight[flag.severity] * (match === 'full' ? 1 : match === 'partial' ? 0.5 : 0);
  }, 0);
  return {
    planId,
    fit: total === 0 ? 100 : Math.round((100 * scored) / total),
    covered: matches.filter((m) => m.match === 'full').length,
    partial: matches.filter((m) => m.match === 'partial').length,
    matches,
  };
}

const planForLevel: Record<Level, PlanId> = { low: 'perus', medium: 'laaja', high: 'laajaplus' };

export type PlanSuggestion = {
  suggested: PlanId;
  reason: string;
  fits: Record<PlanId, PlanFit>;
};

export function suggestPlan(flags: ScoredFlag[], level: Level): PlanSuggestion {
  const fits = Object.fromEntries(planOrder.map((id) => [id, planFit(id, flags)])) as Record<
    PlanId,
    PlanFit
  >;
  const byLevel = planForLevel[level];

  // Open high flags that at least one level fully covers.
  const coverableHigh = flags.filter(
    (flag) =>
      flag.status !== 'handled' &&
      flag.severity === 'high' &&
      planOrder.some((id) => planMatch(id, flag) === 'full'),
  );
  const byCover =
    planOrder.find((id) => coverableHigh.every((flag) => planMatch(id, flag) === 'full')) ??
    'laajaplus';

  const suggested = planOrder[Math.max(planOrder.indexOf(byLevel), planOrder.indexOf(byCover))];
  const name = homePlans[suggested].name;
  const levelText = { low: 'low', medium: 'medium', high: 'high' }[level];
  const reason =
    suggested === byLevel
      ? `Your moving risk is ${levelText}, so we suggest ${name}.`
      : `Your moving risk is ${levelText}, but ${name} is the first level that covers all of your high risks.`;

  return { suggested, reason, fits };
}
