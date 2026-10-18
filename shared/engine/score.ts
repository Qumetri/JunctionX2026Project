/**
 * The points system behind the risk bar.
 *
 *   flag points    = sum of the flag's point lines (rules.ts)
 *   open points    = flag points × share of the flag's actions not done yet
 *   risk bar       = sum of open points over all flags, capped at 100
 *   risk level     = bar ≥ 70 → high · ≥ 40 → medium · else low
 *   category meter = open points in the category ÷ 30, capped at 100
 *   readiness      = share of all flag points removed by done actions
 *
 * Context: context/backendMovingPlan.md §5.
 */
import type { CategoryId, Flag, Level } from '../types';

export const categoryNames: Record<CategoryId, string> = {
  transport: 'Transport damage',
  schedule: 'Schedule delay',
  keys: 'Break-in and keys',
  property: 'New home',
};

/** Points that fill one category meter. */
const categoryFullAt = 30;

export function levelForScore(score: number): Level {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/** Any journey's flag: Moving's (the default) or Travel's. */
type AnyFlag = Flag<string, string>;

export const flagPoints = (flag: AnyFlag) =>
  flag.points.reduce((sum, line) => sum + line.points, 0);

export type ScoredFlag<F extends AnyFlag = Flag> = F & {
  total: number;
  open: number;
  doneActions: number;
  status: 'open' | 'reduced' | 'handled';
};

export function scoreFlag<F extends AnyFlag>(flag: F, done: ReadonlySet<string>): ScoredFlag<F> {
  const total = flagPoints(flag);
  const doneActions = flag.actionIds.filter((id) => done.has(id)).length;
  const share = flag.actionIds.length === 0 ? 0 : doneActions / flag.actionIds.length;
  const open = Math.round(total * (1 - share));
  const status = open === 0 ? 'handled' : doneActions > 0 ? 'reduced' : 'open';
  return { ...flag, total, open, doneActions, status };
}

export type Assessment<F extends AnyFlag = Flag> = {
  flags: ScoredFlag<F>[];
  score: number;
  level: Level;
  readiness: number;
  categories: {
    id: F['category'];
    name: string;
    points: number;
    score: number;
    level: Level;
    flags: ScoredFlag<F>[];
  }[];
};

/** Moving: everything the preview card, the report and the plan picker need. */
export function assess(flags: Flag[], done: ReadonlySet<string>): Assessment {
  return assessFlags(flags, done, categoryNames);
}

/** Any journey; categories are listed in the order they appear in `names`. */
export function assessFlags<F extends AnyFlag>(
  flags: F[],
  done: ReadonlySet<string>,
  names: Record<F['category'], string>,
): Assessment<F> {
  const scored = flags.map((flag) => scoreFlag(flag, done)).sort((a, b) => b.open - a.open);
  const totalPoints = scored.reduce((sum, flag) => sum + flag.total, 0);
  const openPoints = scored.reduce((sum, flag) => sum + flag.open, 0);
  const score = Math.min(100, openPoints);

  const categories = (Object.keys(names) as F['category'][]).map((id) => {
    const inCategory = scored.filter((flag) => flag.category === id);
    const points = inCategory.reduce((sum, flag) => sum + flag.open, 0);
    const categoryScore = Math.min(100, Math.round((points / categoryFullAt) * 100));
    return {
      id,
      name: names[id],
      points,
      score: categoryScore,
      level: levelForScore(categoryScore),
      flags: inCategory,
    };
  });

  return {
    flags: scored,
    score,
    level: levelForScore(score),
    readiness: totalPoints === 0 ? 100 : Math.round(100 * (1 - openPoints / totalPoints)),
    categories,
  };
}
