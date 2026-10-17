/**
 * Severity scale shared by the travel engine. The moving engine itself lives in shared/engine/
 * (rules.ts, score.ts, plans.ts).
 */
import type { Level } from '../../shared/types';

export type { Level };

export { levelForScore } from '../../shared/engine/score';

/** Mean of the three highest category scores. */
export function overallScore(categoryScores: number[]) {
  const top = [...categoryScores].sort((a, b) => b - a).slice(0, 3);
  if (top.length === 0) return 0;
  return Math.round(top.reduce((sum, score) => sum + score, 0) / top.length);
}
