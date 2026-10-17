import { useEffect, useState } from 'react';

function load(key: string) {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
    return new Set(Array.isArray(saved) ? saved.filter((id) => typeof id === 'string') : []);
  } catch {
    return new Set<string>();
  }
}

/** A set of ids (done tasks, ticked items) kept in localStorage under `key`. */
export function useStoredSet(key: string) {
  const [ids, setIds] = useState(() => load(key));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify([...ids]));
    } catch {
      // Private mode or blocked storage: progress just won't survive a reload.
    }
  }, [key, ids]);

  const toggle = (id: string) =>
    setIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return [ids as ReadonlySet<string>, toggle] as const;
}

export const storageKeys = {
  journeyDone: 'lifeMoments.moving.journeyDone',
  journeySkipped: 'lifeMoments.moving.journeySkipped',
  movingActions: 'lifeMoments.moving.doneActions.v2',
  movingChecklist: 'lifeMoments.moving.checklist',
  movingPlan: 'lifeMoments.moving.plan.v2',
  movingReport: 'lifeMoments.moving.report',
  travelChecklist: 'lifeMoments.travel.checklist',
};
