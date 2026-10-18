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

export const stepColumns = ['todo', 'done'] as const;
export type StepColumn = (typeof stepColumns)[number];
/** Ids of the steps in each column, in order. Steps missing from every column count as to do. */
export type StepBoard = Record<StepColumn, string[]>;

const emptyBoard: StepBoard = { todo: [], done: [] };

function loadBoard(key: string): StepBoard {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (!saved || typeof saved !== 'object') return emptyBoard;
    const column = (name: string) => {
      const ids = (saved as Partial<Record<string, unknown>>)[name];
      return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
    };
    // Booked was merged into To do; its saved steps keep their place after the to-do ones.
    return { todo: [...column('todo'), ...column('booked')], done: column('done') };
  } catch {
    return emptyBoard;
  }
}

/** Kanban-style step columns kept in localStorage under `key`. */
export function useStoredBoard(key: string) {
  const [board, setBoard] = useState(() => loadBoard(key));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(board));
    } catch {
      // Private mode or blocked storage: the board just won't survive a reload.
    }
  }, [key, board]);

  return [board, setBoard] as const;
}

export const storageKeys = {
  journeyDone: 'lifeMoments.moving.journeyDone',
  journeySkipped: 'lifeMoments.moving.journeySkipped',
  movingBooked: 'lifeMoments.moving.booked',
  movingActions: 'lifeMoments.moving.doneActions.v2',
  movingChecklist: 'lifeMoments.moving.checklist',
  movingPlan: 'lifeMoments.moving.plan.v2',
  movingReport: 'lifeMoments.moving.report',
  petChecklist: 'lifeMoments.pet.checklist',
  petDewormed: 'lifeMoments.pet.dewormedOn',
  seniorsChecklist: 'lifeMoments.seniors.checklist',
  seniorsTextSize: 'lifeMoments.seniors.textSize',
  travelBoard: 'lifeMoments.travel.board.v1',
  travelPlan: 'lifeMoments.travel.plan',
  travelReport: 'lifeMoments.travel.report',
};
