/**
 * Moving risk scoring. Pure functions, no React, so the server can reuse them later.
 * Formulas follow context/backendMovingPlan.md §5 ("Category and overall scores").
 */

export type Level = 'low' | 'medium' | 'high';

export type CategoryId = 'transport' | 'schedule' | 'keys' | 'property';

export type Flag = {
  id: string;
  category: CategoryId;
  severity: Level;
  title: string;
  why: string;
  /** What triggered the flag, shown under the explanation. */
  evidence: string;
  /** Average claim size, when published figures exist. */
  estimateEur?: number;
};

export type Action = {
  id: string;
  title: string;
  /** Flag ids that count as mitigated once this action is done. */
  resolves: string[];
  partnerOffer?: string;
};

export type GapStatus = 'covered' | 'partial' | 'gap';

export type ProtectionGap = {
  id: string;
  status: GapStatus;
  title: string;
  detail: string;
  suggestion?: string;
};

export type MovingReport = {
  summary: { moveDate: string; fromAddress: string; toAddress: string; homeLabel: string };
  categories: { id: CategoryId; name: string }[];
  flags: Flag[];
  actions: Action[];
  protectionGaps: ProtectionGap[];
  sources: string[];
};

const flagScore: Record<Level, number> = { high: 85, medium: 55, low: 25 };
const flagWeight: Record<Level, number> = { high: 3, medium: 2, low: 1 };

export function levelForScore(score: number): Level {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/** Flags that at least one completed action resolves. */
export function mitigatedFlagIds(actions: Action[], doneActionIds: ReadonlySet<string>) {
  const ids = new Set<string>();
  for (const action of actions) {
    if (doneActionIds.has(action.id)) action.resolves.forEach((id) => ids.add(id));
  }
  return ids;
}

export function categoryScore(flags: Flag[], mitigated: ReadonlySet<string>) {
  const open = flags.filter((flag) => !mitigated.has(flag.id));
  if (open.length === 0) return 0;
  const top = Math.max(...open.map((flag) => flagScore[flag.severity]));
  return Math.min(100, top + 5 * (open.length - 1));
}

/** Mean of the three highest category scores. */
export function overallScore(categoryScores: number[]) {
  const top = [...categoryScores].sort((a, b) => b - a).slice(0, 3);
  if (top.length === 0) return 0;
  return Math.round(top.reduce((sum, score) => sum + score, 0) / top.length);
}

/** Everything the report and the preview card need, given the completed action ids. */
export function scoreReport(report: MovingReport, doneActionIds: ReadonlySet<string>) {
  const mitigated = mitigatedFlagIds(report.actions, doneActionIds);
  const categories = report.categories.map((category) => {
    const flags = report.flags.filter((flag) => flag.category === category.id);
    const score = categoryScore(flags, mitigated);
    return { ...category, flags, score, level: levelForScore(score) };
  });
  return {
    mitigated,
    categories,
    overall: overallScore(categories.map((category) => category.score)),
    readiness: readiness(report.flags, mitigated),
  };
}

/** 100 minus the severity-weighted share of flags that are still open. */
export function readiness(flags: Flag[], mitigated: ReadonlySet<string>) {
  const total = flags.reduce((sum, flag) => sum + flagWeight[flag.severity], 0);
  if (total === 0) return 100;
  const open = flags
    .filter((flag) => !mitigated.has(flag.id))
    .reduce((sum, flag) => sum + flagWeight[flag.severity], 0);
  return Math.round(100 * (1 - open / total));
}
