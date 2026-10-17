import { useCallback, useState } from 'react';
import { localIsoDate } from '../../shared/engine/travelRules';
import { storageKeys, useStoredSet } from './useStoredSet';

const DAY_MS = 86_400_000;

const daysAgo = (n: number) => new Date(Date.now() - n * DAY_MS);

/**
 * The demo pet: Fufu, the Shiba Inu from the banner video. Dates are relative to today, so the record
 * always shows the same situation: vaccines fine, deworming due in a few days.
 */
export const pet = {
  name: 'Fufu',
  species: 'Dog',
  breed: 'Shiba Inu',
  age: 4,
  allergies: ['Chicken'],
  lastVetVisit: daysAgo(28),
  /** Rabies vaccines in Finland are given every 1–3 years, as the vaccine's maker sets. */
  rabies: { given: daysAgo(560), validYears: 3 },
  weights: [
    { kg: 10.1, on: daysAgo(180) },
    { kg: 10.3, on: daysAgo(90) },
    { kg: 10.4, on: daysAgo(28) },
  ],
};

/** Routine deworming every three months, as vets commonly advise for adult dogs. */
const DEWORMING_EVERY_DAYS = 90;
const defaultDewormedOn = () => localIsoDate(daysAgo(86));

export type PetCheckItem = { id: string; label: string; hint?: string };
export type PetCheckGroup = { id: string; title: string; items: PetCheckItem[] };

export const petChecklist: PetCheckGroup[] = [
  {
    id: 'papers',
    title: 'Vaccines and papers',
    items: [
      { id: 'chip', label: 'Microchip read by the vet' },
      {
        id: 'rabies',
        label: 'Rabies vaccine at least 21 days before you leave',
        hint: 'A first vaccine only counts for travel after 21 days.',
      },
      { id: 'passport', label: 'EU pet passport packed' },
      { id: 'rules', label: 'Entry rules of the destination checked' },
    ],
  },
  {
    id: 'parasites',
    title: 'Deworming and parasites',
    items: [
      {
        id: 'tapeworm',
        label: 'Tapeworm treatment 1–5 days before coming home',
        hint: 'Dogs entering Finland need it from a vet, written in the pet passport.',
      },
      { id: 'ticks', label: 'Tick and flea protection for the destination' },
      { id: 'routine', label: 'Routine deworming up to date' },
    ],
  },
  {
    id: 'feeding',
    title: 'Feeding',
    items: [
      {
        id: 'food',
        label: 'The usual food for the whole trip',
        hint: 'Fufu is allergic to chicken, so pack chicken-free food and treats.',
      },
      { id: 'times', label: 'Feeding times kept the same' },
      { id: 'water', label: 'Water and a bowl for the journey' },
    ],
  },
  {
    id: 'walking',
    title: 'Walks and the journey',
    items: [
      { id: 'stops', label: 'Rest stops every 2–3 hours on long drives' },
      { id: 'carrier', label: 'A safe carrier or car harness' },
      {
        id: 'leash',
        label: 'Leash on in new places',
        hint: 'In Finland, dogs go on a leash in built-up areas all year and everywhere from 1 March to 19 August.',
      },
    ],
  },
];

const allItems = petChecklist.flatMap((group) => group.items.map((item) => item.id));

export type Readiness = 'Low' | 'Medium' | 'High';

export function readinessLevel(percent: number): Readiness {
  if (percent >= 80) return 'High';
  if (percent >= 40) return 'Medium';
  return 'Low';
}

function loadDewormedOn() {
  try {
    return localStorage.getItem(storageKeys.petDewormed) ?? defaultDewormedOn();
  } catch {
    return defaultDewormedOn();
  }
}

/** Whole days from today to `date` (negative when it has passed). */
function daysUntil(date: Date) {
  const today = new Date(localIsoDate(new Date()));
  return Math.round((date.getTime() - today.getTime()) / DAY_MS);
}

/** "in 4 days", "today", "3 days ago". */
export function relativeDays(days: number) {
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}

/** The travel checklist, deworming log and everything shown about the pet's health. */
export function usePetCare() {
  const [done, toggle] = useStoredSet(storageKeys.petChecklist);
  const [dewormedOn, setDewormedOn] = useState(loadDewormedOn);

  const logDeworming = useCallback(() => {
    const today = localIsoDate(new Date());
    setDewormedOn(today);
    try {
      localStorage.setItem(storageKeys.petDewormed, today);
    } catch {
      // Storage blocked: the new date only lasts for this visit.
    }
  }, []);

  const doneCount = allItems.filter((id) => done.has(id)).length;
  const readiness = Math.round((doneCount / allItems.length) * 100);

  const dewormingDue = new Date(dewormedOn);
  dewormingDue.setDate(dewormingDue.getDate() + DEWORMING_EVERY_DAYS);
  const dewormingDays = daysUntil(dewormingDue);

  const rabiesUntil = new Date(pet.rabies.given);
  rabiesUntil.setFullYear(rabiesUntil.getFullYear() + pet.rabies.validYears);
  const rabiesTotalDays = pet.rabies.validYears * 365;

  const [previous, latest] = pet.weights.slice(-2);
  const weightChange = latest.kg - previous.kg;

  return {
    done,
    toggle,
    doneCount,
    total: allItems.length,
    readiness,
    readinessLevel: readinessLevel(readiness),
    deworming: {
      lastOn: dewormedOn,
      due: dewormingDue,
      days: dewormingDays,
      /** Share of the interval still left, 0–100. */
      left: Math.max(0, Math.min(100, Math.round((dewormingDays / DEWORMING_EVERY_DAYS) * 100))),
      log: logDeworming,
    },
    rabies: {
      until: rabiesUntil,
      left: Math.max(0, Math.round((daysUntil(rabiesUntil) / rabiesTotalDays) * 100)),
    },
    weight: {
      kg: latest.kg,
      trend: Math.abs(weightChange) < 0.3 ? 'steady' : weightChange > 0 ? 'up' : 'down',
    },
    lastVetDays: -daysUntil(pet.lastVetVisit),
  };
}
