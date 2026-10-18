import { localIsoDate } from '../../shared/engine/travelRules';

/** Today as yyyy-mm-dd in the user's time zone, the same form as date input values. */
export const todayIso = () => localIsoDate();

/** True when a date input holds a day before today. An empty field is not in the past. */
export function isPastDate(iso: string) {
  return iso !== '' && iso < todayIso();
}
