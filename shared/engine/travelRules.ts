/**
 * Travel flag rules, built like the Moving ones (rules.ts): each rule reads the trip and the
 * collected signals and returns a flag with its points breakdown, or nothing. Three things move
 * the points most: the season (winter at Helsinki Airport, flu season, holiday peaks, weather on
 * the dates), how far away departure is, and how long the trip is.
 */
import { destinationById, type Destination } from '../data/destinations';
import { travelCover } from '../data/travelCover';
import { figures } from '../reference/figures';
import type { PointLine, TravelAction, TravelFlag, TravelRequest, TravelSignals } from '../types';
import { severityForPoints } from './rules';

export const travelActions: Record<string, TravelAction> = {
  'save-assistance': {
    id: 'save-assistance',
    title: 'Save the IF 24/7 assistance number',
    dueDays: 1,
    tip: 'Save the 24/7 assistance number in your phone and on paper, so you can call it from the clinic if you fall ill.',
  },
  ehic: {
    id: 'ehic',
    title: 'Pack your EHIC card from Kela',
    dueDays: 14,
    tip: "Order the free EHIC card from Kela if you don't have one, and carry it with your passport.",
  },
  'pack-meds': {
    id: 'pack-meds',
    title: 'Pack medicines in hand luggage with the prescription',
    dueDays: 1,
    tip: 'Keep your medicines in hand luggage in their original boxes, with a copy of the prescription.',
  },
  'vaccine-advice': {
    id: 'vaccine-advice',
    title: 'Book travel vaccine advice',
    dueDays: 30,
    tip: 'Book a travel health appointment about a month ahead: some vaccines need more than one dose.',
  },
  'buy-cover-early': {
    id: 'buy-cover-early',
    title: `Buy travel insurance at least ${travelCover.buyDaysBefore} days before you leave`,
    dueDays: travelCover.buyDaysBefore,
    tip: `Get travel insurance when you book, not when you pack: cancellation cover only counts if it was bought at least ${travelCover.buyDaysBefore} days before departure.`,
  },
  'check-cover': {
    id: 'check-cover',
    title: 'Check that your travel insurance covers the whole trip',
    dueDays: 7,
    tip: 'Check your travel insurance card or policy: is the whole trip covered, and is cancellation cover included?',
  },
  'flexible-bookings': {
    id: 'flexible-bookings',
    title: 'Check the cancellation rules of your flights and hotel',
    dueDays: 30,
    tip: 'Pick hotel rates you can cancel for free, and keep every booking confirmation in one folder.',
  },
  'one-ticket': {
    id: 'one-ticket',
    title: 'Keep connecting flights on one ticket',
    dueDays: 30,
    tip: 'Book connections on one ticket: if the first flight is late, the airline has to get you to your destination.',
  },
  'keep-receipts': {
    id: 'keep-receipts',
    title: 'Get a delay confirmation and keep receipts',
    dueDays: 0,
    tip: 'If your flight is late, ask the airline for a written delay confirmation and keep receipts for meals and hotels.',
  },
  'check-flight': {
    id: 'check-flight',
    title: 'Check your flight status before you leave home',
    dueDays: 0,
    tip: 'In winter, check your flight before leaving home and set off early: snow slows the roads to the airport.',
  },
  'read-advice': {
    id: 'read-advice',
    title: 'Read the travel advice on um.fi',
    dueDays: 7,
    tip: 'Read the travel advice for your destination on um.fi a week before you go, and again the day before.',
  },
  'travel-notification': {
    id: 'travel-notification',
    title: 'Make a travel notification at um.fi',
    dueDays: 3,
    tip: 'Make a free travel notification at um.fi, so Finnish officials can reach you if something happens where you are.',
  },
  'weather-alerts': {
    id: 'weather-alerts',
    title: 'Turn on weather alerts for your destination',
    dueDays: 1,
    tip: 'Turn on weather alerts for your destination and check them each morning; rebook early if a storm is coming.',
  },
  'heat-plan': {
    id: 'heat-plan',
    title: 'Plan your days around the heat',
    dueDays: 0,
    tip: 'On hot days, do sightseeing in the morning and evening, drink often and rest in the shade at midday.',
  },
  'pack-warm': {
    id: 'pack-warm',
    title: 'Pack for snow and hard frost',
    dueDays: 1,
    tip: 'Pack layers, gloves and warm shoes with grip; transfers can be cold if you are delayed.',
  },
  'photo-bags': {
    id: 'photo-bags',
    title: 'Photograph your bags and what is in them',
    dueDays: 1,
    tip: 'Photograph your packed bag and put your name and phone number inside it too; a lost-bag report goes faster.',
  },
  'valuables-hand-luggage': {
    id: 'valuables-hand-luggage',
    title: 'Keep valuables, medicines and chargers in hand luggage',
    dueDays: 1,
    tip: 'Keep valuables, chargers and one change of clothes in hand luggage in case your bag arrives late.',
  },
  'pet-passport': {
    id: 'pet-passport',
    title: "Check your pet's passport, microchip and rabies vaccine",
    dueDays: 30,
    tip: "Check your pet's passport now: the rabies vaccine must be at least 21 days old on the day you travel.",
  },
  'pet-antibody-test': {
    id: 'pet-antibody-test',
    title: "Book your pet's rabies antibody test",
    dueDays: 60,
    tip: 'Book the rabies antibody test before you leave: the sample is taken at least 30 days after the vaccine, and it saves a 3-month wait on the way back.',
  },
  'pet-tapeworm': {
    id: 'pet-tapeworm',
    title: 'Book tapeworm treatment for a dog before coming home',
    dueDays: 0,
    tip: 'Dogs coming back to Finland need tapeworm treatment 1–5 days before arrival; book a local vet in advance.',
  },
  'apply-esta': {
    id: 'apply-esta',
    title: 'Apply for an ESTA',
    dueDays: 3,
    tip: 'Apply for the ESTA only on the official US government site, at least 72 hours before you fly; look-alike sites charge extra.',
  },
  'arrival-card': {
    id: 'arrival-card',
    title: 'Fill in the Thailand Digital Arrival Card',
    dueDays: 3,
    tip: "Fill in the Thailand Digital Arrival Card online in the 3 days before you land; it's free on the official site.",
  },
  'passport-valid': {
    id: 'passport-valid',
    title: "Check your passport's expiry date",
    dueDays: 30,
    tip: "Check your passport's expiry date now: a new one takes time, and some countries want months of validity left.",
  },
  'extend-cover': {
    id: 'extend-cover',
    title: `Arrange cover for the days beyond ${travelCover.continuousMaxDays}`,
    dueDays: 3,
    tip: `Continuous travel insurance covers trips up to ${travelCover.continuousMaxDays} days; ask IF about cover for the rest of a longer trip.`,
  },
};

/* Trip facts */

const dayMs = 86_400_000;
const utc = (isoDate: string) => new Date(`${isoDate}T00:00:00Z`);

/** Today's date where the user is, as YYYY-MM-DD. */
export function localIsoDate(now = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Finnish school holidays and peak travel weeks (approximate; month and day, inclusive). */
const peaks: { label: string; from: [number, number]; to: [number, number] }[] = [
  { label: 'Christmas and New Year', from: [12, 20], to: [1, 6] },
  { label: 'Winter holiday weeks', from: [2, 16], to: [3, 8] },
  { label: 'Summer holidays', from: [6, 15], to: [8, 10] },
  { label: 'Autumn holiday week', from: [10, 12], to: [10, 25] },
];

function peakFor(start: Date, end: Date) {
  for (let year = start.getUTCFullYear() - 1; year <= end.getUTCFullYear(); year++) {
    for (const peak of peaks) {
      const from = Date.UTC(year, peak.from[0] - 1, peak.from[1]);
      const toYear = peak.to[0] < peak.from[0] ? year + 1 : year;
      const to = Date.UTC(toYear, peak.to[0] - 1, peak.to[1]);
      if (start.getTime() <= to && end.getTime() >= from) return peak.label;
    }
  }
  return undefined;
}

export type TripFacts = {
  daysUntil: number;
  length: number;
  /** Months (1–12) the trip touches, first two months at most. */
  months: number[];
  winterDeparture: boolean;
  fluSeason: boolean;
  peak?: string;
};

export function tripFacts(request: TravelRequest, today = localIsoDate()): TripFacts {
  const start = utc(request.startDate);
  const end = utc(request.endDate < request.startDate ? request.startDate : request.endDate);
  const month = start.getUTCMonth() + 1;
  const months = new Set<number>();
  for (
    let t = start.getTime();
    t <= Math.min(end.getTime(), start.getTime() + 60 * dayMs);
    t += dayMs
  ) {
    months.add(new Date(t).getUTCMonth() + 1);
  }
  return {
    daysUntil: Math.round((start.getTime() - utc(today).getTime()) / dayMs),
    length: Math.round((end.getTime() - start.getTime()) / dayMs) + 1,
    months: [...months],
    winterDeparture: [11, 12, 1, 2, 3].includes(month),
    fluSeason: [12, 1, 2, 3].includes(month),
    peak: peakFor(start, end),
  };
}

/* Rules */

type Context = {
  request: TravelRequest;
  signals: TravelSignals;
  place: Destination;
  facts: TripFacts;
};

type Rule = (ctx: Context) => TravelFlag | undefined;

function flag(
  base: Omit<TravelFlag, 'severity' | 'points'>,
  points: PointLine[],
): TravelFlag | undefined {
  const lines = points.filter((line) => line.points > 0);
  if (lines.length === 0) return undefined;
  const total = lines.reduce((sum, line) => sum + line.points, 0);
  return { ...base, severity: severityForPoints(total), points: lines };
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function lengthLine(length: number): PointLine | undefined {
  if (length > 45) return { label: `${length} days abroad`, points: 6 };
  if (length > 21) return { label: `${length} days abroad`, points: 4 };
  if (length > 7) return { label: `${length} days abroad`, points: 2 };
  return undefined;
}

const medicalCosts: Rule = ({ request, place, facts }) => {
  const active = request.answers.purpose === 'active';
  const cost: PointLine =
    place.medicalCost === 'high'
      ? { label: 'Hospital bills among the highest in the world', points: 12 }
      : place.medicalCost === 'medium'
        ? {
            label: place.ehic
              ? 'EHIC covers public care only'
              : 'You pay for care in full as a visitor',
            points: 6,
          }
        : { label: 'Public care at local prices with the EHIC card', points: 2 };
  const lines = [cost];
  const length = lengthLine(facts.length);
  if (length) lines.push(length);
  if (active) lines.push({ label: 'Skiing, diving or other sports', points: 6 });

  return flag(
    {
      id: 'medical-costs',
      category: 'health',
      title: 'Medical costs abroad',
      why: place.medicalNote + (active ? ' Sports add the risk of injury.' : ''),
      evidence: [place.ehic ? 'The EHIC card applies here.' : 'The EHIC card does not apply here.'],
      source: 'derived',
      coverageTags: ['medical-abroad'],
      actionIds: [...(place.ehic ? ['ehic'] : []), 'save-assistance', 'pack-meds'],
    },
    lines,
  );
};

const vaccines: Rule = ({ place, facts }) => {
  if (!place.vaccines) return undefined;
  const lines: PointLine[] = [
    { label: `Travel vaccines recommended for ${place.country}`, points: 3 },
  ];
  if (facts.daysUntil >= 0 && facts.daysUntil < 30)
    lines.push({
      label: `Leaving in ${plural(facts.daysUntil, 'day')}: some vaccines need more than one dose`,
      points: 6,
    });
  return flag(
    {
      id: 'vaccines',
      category: 'health',
      title: 'Travel vaccines',
      why: 'Some travel vaccines need several doses weeks apart, so the earlier you ask, the better.',
      evidence: [],
      source: 'derived',
      coverageTags: [],
      actionIds: ['vaccine-advice'],
    },
    lines,
  );
};

const cancellation: Rule = ({ request, place, facts }) => {
  const lines: PointLine[] = [
    place.longHaul
      ? { label: 'Long-haul flights cost more and are rarely refundable', points: 5 }
      : { label: 'Flight within Europe, so less money at stake', points: 2 },
  ];
  if (facts.daysUntil > 90)
    lines.push({
      label: `Booked ${facts.daysUntil} days ahead: more time for plans to change`,
      points: 5,
    });
  else if (facts.daysUntil > 30)
    lines.push({
      label: `Booked ${facts.daysUntil} days ahead: more time for plans to change`,
      points: 3,
    });
  if (facts.fluSeason) lines.push({ label: 'Flu season in Finland (December–March)', points: 2 });
  if (facts.peak)
    lines.push({ label: `${facts.peak}: peak prices, so more money is at stake`, points: 3 });

  return flag(
    {
      id: 'cancellation',
      category: 'trip',
      title: 'Trip cancellation',
      why: 'If you fall ill or something happens at home before you go, prepaid flights and hotels can be lost.',
      evidence: [],
      source: 'derived',
      coverageTags: ['trip-cancellation'],
      actionIds: [
        request.answers.hasTravelInsurance ? 'check-cover' : 'buy-cover-early',
        'flexible-bookings',
      ],
    },
    lines,
  );
};

const travelDelay: Rule = ({ signals, place, facts }) => {
  const lines: PointLine[] = [
    place.longHaul
      ? { label: 'Usually a connecting flight', points: 4 }
      : { label: 'Direct short flight or ferry', points: 1 },
  ];
  const evidence: string[] = [];
  if (facts.winterDeparture) {
    const share = figures.helsinkiWeatherDelayShare;
    lines.push({
      label: `Winter departure: ${share.value}% of Helsinki Airport's flow delay in ${share.year} was weather`,
      points: 4,
    });
    evidence.push(`Source: ${share.source} airport delay data, ${share.year}.`);
  }
  if (facts.peak) lines.push({ label: `Busy airports (${facts.peak})`, points: 2 });
  if (facts.length <= 4)
    lines.push({ label: `A one-day delay is a big part of a ${facts.length}-day trip`, points: 3 });
  const departure = signals.departure;
  if (departure && departure.snowfallCm >= 5)
    lines.push({
      label: `Forecast for departure day at Helsinki Airport: ${Math.round(departure.snowfallCm)} cm of snow`,
      points: 5,
    });
  if (departure && departure.gustMaxMs >= 15)
    lines.push({
      label: `Forecast for departure day at Helsinki Airport: gusts up to ${departure.gustMaxMs} m/s`,
      points: 4,
    });

  return flag(
    {
      id: 'travel-delay',
      category: 'trip',
      title: 'Delays and missed connections',
      why: 'A delay or a missed connection can cost an extra night and meals, and it eats into your time there.',
      evidence,
      source: departure ? 'open-data' : 'derived',
      coverageTags: ['travel-delay'],
      actionIds: [
        ...(place.longHaul ? ['one-ticket'] : []),
        ...(facts.winterDeparture ? ['check-flight'] : []),
        'keep-receipts',
      ],
    },
    lines,
  );
};

const weather: Rule = ({ signals, place, facts }) => {
  const w = signals.weather;
  const lines: PointLine[] = [];
  const actionIds = new Set<string>();
  if (w) {
    if (w.hotDays > 0) {
      lines.push({
        label: `${plural(w.hotDays, 'day')} above 35 °C`,
        points: w.hotDays * 3 >= w.days ? 6 : 3,
      });
      actionIds.add('heat-plan');
    }
    if (w.heavyRainDays > 0) {
      lines.push({
        label: `${plural(w.heavyRainDays, 'day')} of heavy rain (20 mm or more)`,
        points: w.heavyRainDays >= 3 ? 5 : 2,
      });
      actionIds.add('weather-alerts');
    }
    if (w.stormDays > 0) {
      lines.push({
        label: `${plural(w.stormDays, 'day')} with storm gusts (20 m/s or more)`,
        points: 4,
      });
      actionIds.add('weather-alerts');
    }
    if (w.snowDays > 0) {
      lines.push({ label: `${plural(w.snowDays, 'day')} with 5 cm of snow or more`, points: 3 });
      actionIds.add('pack-warm');
    }
    if (w.coldDays > 0) {
      lines.push({ label: `${plural(w.coldDays, 'night')} below −15 °C`, points: 3 });
      actionIds.add('pack-warm');
    }
  }
  for (const season of place.seasons ?? []) {
    if (season.months.some((month) => facts.months.includes(month))) {
      lines.push({ label: season.label, points: season.points });
      actionIds.add('weather-alerts');
    }
  }
  const basis =
    w?.basis === 'forecast'
      ? 'Forecast for your dates'
      : w && `Same dates last year (${w.from} to ${w.to})`;

  return flag(
    {
      id: 'weather',
      category: 'destination',
      title: 'Weather on your dates',
      why:
        w?.basis === 'forecast'
          ? 'The forecast for your trip shows weather that can change plans or strain your health.'
          : 'The weather on the same dates last year shows what to expect. It can change plans or strain your health.',
      evidence: w ? [`${basis}: ${w.minTempC} to ${w.maxTempC} °C.`] : [],
      source: w ? 'open-data' : 'derived',
      coverageTags: ['travel-delay'],
      actionIds: [...actionIds],
    },
    lines,
  );
};

const advisoryLevels: Record<string, PointLine> = {
  avoid_all_travel_to_whole_country: {
    label: 'UK advice: avoid all travel to the country',
    points: 25,
  },
  avoid_all_but_essential_travel_to_whole_country: {
    label: 'UK advice: essential travel only, whole country',
    points: 12,
  },
  avoid_all_travel_to_parts: {
    label: 'UK advice: avoid all travel to parts of the country',
    points: 12,
  },
  avoid_all_but_essential_travel_to_parts: {
    label: 'UK advice: essential travel only to parts of the country',
    points: 5,
  },
};

const advisory: Rule = ({ signals, place }) => {
  const advice = signals.advisory;
  if (!advice) return undefined;
  const worst = advice.alerts
    .map((alert) => advisoryLevels[alert])
    .filter(Boolean)
    .sort((a, b) => b.points - a.points)[0];
  if (!worst) return undefined;
  const change = advice.change.length > 160 ? `${advice.change.slice(0, 157)}…` : advice.change;
  return flag(
    {
      id: 'advisory',
      category: 'destination',
      title: advice.alerts.some((alert) => alert.endsWith('whole_country'))
        ? `Travel warning for ${place.country}`
        : 'Travel warning for parts of the country',
      why: `The UK Foreign Office warns against some travel in ${place.country}. Check which areas, and read Finland's own advice on um.fi.`,
      evidence: change ? [`Latest UK update (${advice.updated}): ${change}`] : [],
      source: 'open-data',
      coverageTags: [],
      actionIds: ['read-advice', 'travel-notification'],
    },
    [worst],
  );
};

const hazards: Rule = ({ signals }) => {
  const events = signals.hazards ?? [];
  if (events.length === 0) return undefined;
  const lines = events
    .slice()
    .sort((a, b) =>
      a.alert === b.alert ? a.distanceKm - b.distanceKm : a.alert === 'Red' ? -1 : 1,
    )
    .slice(0, 2)
    .map((event) => ({
      label: `${event.type} ${event.name} (${event.alert.toLowerCase()} alert${event.distanceKm ? `, ${event.distanceKm} km away` : ''})`,
      points: event.alert === 'Red' ? 18 : 10,
    }));
  return flag(
    {
      id: 'hazards',
      category: 'destination',
      title: 'Natural hazard alert nearby',
      why: 'GDACS lists a current disaster alert in or near your destination. Check whether flights and hotels are affected before you go.',
      evidence: ['Source: GDACS current events, orange and red alerts.'],
      source: 'open-data',
      coverageTags: ['trip-cancellation', 'travel-delay'],
      actionIds: ['weather-alerts', 'travel-notification'],
    },
    lines,
  );
};

const belongings: Rule = ({ request, place, facts }) => {
  const lines: PointLine[] = [{ label: 'Bags can be lost, late or stolen on any trip', points: 2 }];
  if (place.longHaul) lines.push({ label: 'Bags change planes at the connection', points: 3 });
  if (facts.length > 14) lines.push({ label: 'More luggage on a long trip', points: 2 });
  if (request.answers.purpose === 'active')
    lines.push({ label: 'Sports gear travels as special baggage', points: 2 });
  return flag(
    {
      id: 'belongings',
      category: 'belongings',
      title: 'Lost or stolen luggage',
      why: 'If home insurance covers your luggage on trips at every level, so check yours before buying extra baggage cover.',
      evidence: [],
      source: 'derived',
      coverageTags: ['baggage'],
      actionIds: ['photo-bags', 'valuables-hand-luggage'],
    },
    lines,
  );
};

const petEntry: Rule = ({ request, place, facts }) => {
  if (!request.answers.withPet) return undefined;
  const lines: PointLine[] = [
    place.pet === 'eu'
      ? { label: 'EU pet passport, microchip and rabies vaccine', points: 4 }
      : place.pet === 'listed'
        ? { label: "The country's own import rules, and EU rules to come back", points: 8 }
        : { label: 'Rabies antibody test needed to come back to the EU', points: 14 },
  ];
  if (facts.daysUntil >= 0 && facts.daysUntil < 21)
    lines.push({
      label: `Leaving in ${plural(facts.daysUntil, 'day')}: a new rabies vaccine must be 21 days old`,
      points: 8,
    });
  if (place.pet === 'unlisted' && facts.daysUntil >= 0 && facts.daysUntil < 30)
    lines.push({
      label: 'Little time for the antibody test: without it your pet waits 3 months to come back',
      points: 6,
    });
  return flag(
    {
      id: 'pet-entry',
      category: 'belongings',
      title: 'Pet travel rules',
      why:
        place.pet === 'eu'
          ? 'Your pet needs an EU pet passport, a microchip and a rabies vaccination at least 21 days old.'
          : place.pet === 'listed'
            ? 'Outside the EU, check the country’s own import rules, and the EU rules for coming back.'
            : 'Coming back to the EU from here needs a rabies antibody test, or your pet waits months.',
      evidence: ['Dogs coming back to Finland need tapeworm treatment 1–5 days before arrival.'],
      source: 'answer',
      coverageTags: ['pet'],
      actionIds: [
        'pet-passport',
        ...(place.pet === 'unlisted' ? ['pet-antibody-test'] : []),
        'pet-tapeworm',
      ],
    },
    lines,
  );
};

const entryRules: Rule = ({ place, facts }) => {
  const entry = place.entry;
  if (!entry) return undefined;
  const lines: PointLine[] = [{ label: `${entry.title} needed`, points: 3 }];
  if (facts.daysUntil >= 0 && facts.daysUntil <= 3)
    lines.push({ label: `Leaving in ${plural(facts.daysUntil, 'day')}: do it now`, points: 6 });
  return flag(
    {
      id: 'entry-rules',
      category: 'destination',
      title: entry.title,
      why: entry.detail,
      evidence: [],
      source: 'derived',
      coverageTags: [],
      actionIds: [entry.actionId, 'passport-valid'],
    },
    lines,
  );
};

const uninsured: Rule = ({ request, place, facts }) => {
  if (request.answers.hasTravelInsurance) return undefined;
  const lines: PointLine[] = [{ label: 'No travel insurance yet', points: 12 }];
  if (!place.ehic) lines.push({ label: 'No EHIC here: you pay for care yourself', points: 3 });
  if (place.medicalCost === 'high')
    lines.push({ label: 'Care is billed at full price', points: 4 });
  const lateForCancellation = facts.daysUntil < travelCover.buyDaysBefore;
  if (lateForCancellation)
    lines.push({
      label: `Too late for cancellation cover: it must be bought ${travelCover.buyDaysBefore} days before you leave`,
      points: 6,
    });
  const buyBy = new Date(utc(request.startDate).getTime() - travelCover.buyDaysBefore * dayMs);
  return flag(
    {
      id: 'uninsured',
      category: 'trip',
      title: 'No travel insurance yet',
      why: 'Without travel insurance you pay yourself for care abroad, a cancelled trip and delays.',
      evidence: lateForCancellation
        ? []
        : [
            `Buy by ${buyBy.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' })} to include cancellation cover.`,
          ],
      source: 'answer',
      coverageTags: ['medical-abroad', 'trip-cancellation', 'travel-delay'],
      actionIds: ['buy-cover-early'],
    },
    lines,
  );
};

const longTrip: Rule = ({ request, facts }) => {
  if (!request.answers.hasTravelInsurance || facts.length <= travelCover.continuousMaxDays)
    return undefined;
  return flag(
    {
      id: 'long-trip',
      category: 'trip',
      title: 'Trip longer than continuous cover',
      why: `Continuous travel insurance covers each trip for up to ${travelCover.continuousMaxDays} days. The days after that need their own cover.`,
      evidence: [],
      source: 'answer',
      coverageTags: [],
      actionIds: ['extend-cover'],
    },
    [{ label: `${facts.length}-day trip`, points: 10 }],
  );
};

const rules: Rule[] = [
  medicalCosts,
  vaccines,
  cancellation,
  uninsured,
  longTrip,
  travelDelay,
  weather,
  advisory,
  hazards,
  entryRules,
  belongings,
  petEntry,
];

export function evaluateTravelRules(
  request: TravelRequest,
  signals: TravelSignals,
  today = localIsoDate(),
): TravelFlag[] {
  const ctx: Context = {
    request,
    signals,
    place: destinationById(request.destinationId),
    facts: tripFacts(request, today),
  };
  return rules.flatMap((rule) => rule(ctx) ?? []);
}
