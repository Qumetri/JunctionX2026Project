/**
 * Moving flag rules. Each rule reads the request and the collected signals and returns a flag
 * with its points breakdown, or nothing. Points add up to the risk bar (see score.ts and
 * context/backendMovingPlan.md §5).
 */
import { figures } from '../reference/figures';
import type { Action, Flag, Level, MovingRequest, PointLine, Signals } from '../types';

/** A flag's severity follows from its points, so the label always matches the bar. */
export function severityForPoints(points: number): Level {
  if (points >= 14) return 'high';
  if (points >= 7) return 'medium';
  return 'low';
}

/** Points for a local rate compared with the national one (same steps as relativeLevel). */
function ratioLine(ratio: number, steps: [number, number, number, number]): PointLine {
  const [below, about, above, wellAbove] = steps;
  const times = `${ratio.toFixed(1)}× the national rate`;
  if (ratio < 0.85) return { label: `Area rate below the national rate (${times})`, points: below };
  if (ratio < 1.15)
    return { label: `Area rate close to the national rate (${times})`, points: about };
  if (ratio < 1.5) return { label: `Area rate above the national rate (${times})`, points: above };
  return { label: `Area rate well above the national rate (${times})`, points: wellAbove };
}

const rate = (value: number) => value.toLocaleString('en-GB', { maximumFractionDigits: 2 });

export const actions: Record<string, Action> = {
  'leak-sensor': {
    id: 'leak-sensor',
    title: 'Fit leak sensors under the sink and dishwasher',
    partnerOffer: 'Leak sensor at member price',
  },
  'ask-pipes': {
    id: 'ask-pipes',
    title: 'Ask the housing company when the pipes were last renewed',
  },
  'moisture-check': {
    id: 'moisture-check',
    title: 'Book a moisture and condition check',
    partnerOffer: 'Anticimex check for IF customers',
  },
  'find-shutoff': { id: 'find-shutoff', title: 'Find the main water shut-off on day one' },
  'change-lock': {
    id: 'change-lock',
    title: 'Change the lock cylinder',
    partnerOffer: 'Locksmith at member price',
  },
  'count-keys': { id: 'count-keys', title: 'Count and sign for every key at handover' },
  'boxes-out-of-sight': {
    id: 'boxes-out-of-sight',
    title: 'Keep boxes and new electronics out of sight from the street',
  },
  'home-alarm': {
    id: 'home-alarm',
    title: 'Set up a home alarm',
    partnerOffer: 'Member discount on a home alarm',
  },
  'smoke-alarm': { id: 'smoke-alarm', title: 'Test or fit smoke alarms on the first evening' },
  'stove-guard': {
    id: 'stove-guard',
    title: 'Fit a stove guard and keep a fire blanket in the kitchen',
  },
  'chimney-sweep': { id: 'chimney-sweep', title: 'Have the chimney swept before the first fire' },
  'raise-storage': { id: 'raise-storage', title: 'Keep stored boxes off the floor' },
  'flood-alerts': {
    id: 'flood-alerts',
    title: 'Turn on flood and storm warnings for the new address',
  },
  'book-mover': {
    id: 'book-mover',
    title: 'Book a verified mover',
    partnerOffer: 'Member price with partner movers',
  },
  'rent-tools': {
    id: 'rent-tools',
    title: 'Rent a dolly and moving straps',
    partnerOffer: 'Free tool rental for annual members',
  },
  'wrap-fragile': {
    id: 'wrap-fragile',
    title: 'Wrap fragile items and photograph valuables before packing',
  },
  'cover-boxes': { id: 'cover-boxes', title: 'Pack plastic covers for rain or snow' },
  'avoid-rush': { id: 'avoid-rush', title: 'Drive the van outside rush hours' },
  'buffer-day': { id: 'buffer-day', title: 'Keep the day after the move free' },
  'book-early': { id: 'book-early', title: 'Book the mover and the lift now' },
  'route-check': { id: 'route-check', title: 'Check road works on the route the day before' },
  'home-insurance': { id: 'home-insurance', title: 'Arrange home insurance from moving day' },
  'pet-rules': { id: 'pet-rules', title: "Read the housing company's pet rules" },
};

type Rule = (request: MovingRequest, signals: Signals) => Flag | undefined;

/** Builds a flag from its point lines; returns nothing when no line applies. */
function flag(base: Omit<Flag, 'severity' | 'points'>, points: PointLine[]): Flag | undefined {
  const lines = points.filter((line) => line.points > 0);
  if (lines.length === 0) return undefined;
  const total = lines.reduce((sum, line) => sum + line.points, 0);
  return { ...base, severity: severityForPoints(total), points: lines };
}

const groundLevel = ({ answers }: MovingRequest) =>
  answers.housing !== 'flat' || answers.groundFloor;

const km = (value: number) => `${Math.round(value).toLocaleString('en-GB')} km`;

/** How the move's distance reads in evidence lines. */
function routeEvidence(signals: Signals) {
  const { route } = signals;
  if (!route) return undefined;
  return route.byRoad
    ? `${km(route.distanceKm)} by road from your current address (OSRM)`
    : `About ${km(route.distanceKm)} from your current address, in a straight line`;
}

/** More rooms, more to carry: points by home size. */
function sizeLine({ homeSizeM2 }: MovingRequest): PointLine {
  if (homeSizeM2 >= 140)
    return { label: `Large home (${homeSizeM2} m²): a lot to carry`, points: 5 };
  if (homeSizeM2 >= 90) return { label: `${homeSizeM2} m² home: more to carry`, points: 3 };
  return { label: '', points: 0 };
}

const oldPlumbing: Rule = (request, signals) => {
  const year = signals.building?.year;
  const detached = request.answers.housing === 'detached';
  const lines: PointLine[] = [];
  let why: string;

  if (year === undefined) {
    lines.push({ label: 'Building year not found in the HSY register', points: 5 });
    why =
      'We could not look up when the building was finished. Pipes older than 40 years are the most common source of leaks.';
  } else if (year >= 2005) {
    return undefined;
  } else if (year >= 1960 && year < 1990) {
    lines.push({ label: `Built in ${year}: pipes at renewal age`, points: 14 });
    why =
      'Pipes in buildings from the 1960s to the 1980s are usually due for renewal. Until that is done, leaks are more likely.';
  } else if (year < 1960) {
    lines.push({ label: `Built in ${year}: pipes probably renewed once`, points: 8 });
    why =
      'Buildings this old have usually had a pipe renewal, but not always. The housing company knows when it was done.';
  } else {
    lines.push({ label: `Built in ${year}: pipes 20 to 35 years old`, points: 4 });
    why = 'The pipes are not old yet, but joints and appliance hoses start to wear at this age.';
  }
  if (detached)
    lines.push({ label: 'Detached house: leaks into the structure are yours', points: 4 });

  return flag(
    {
      id: 'old-plumbing',
      category: 'property',
      title: year === undefined ? 'Pipe age unknown' : `Pipes in a ${year} building`,
      why,
      evidence: [
        year === undefined ? 'Not in the HSY building register' : `Completed in ${year} (HSY)`,
      ],
      source: year === undefined ? 'derived' : 'open-data',
      coverageTags: detached ? ['water-damage', 'structure-moisture'] : ['water-damage'],
      actionIds: detached
        ? ['moisture-check', 'leak-sensor', 'find-shutoff']
        : ['ask-pipes', 'leak-sensor', 'find-shutoff'],
      estimateEur: figures.waterClaimEur.value,
    },
    lines,
  );
};

const burglary: Rule = (request, signals) => {
  const { crime } = signals;
  const lines: PointLine[] = [];
  const evidence: string[] = [];

  if (crime) {
    lines.push(ratioLine(crime.burglaryRate / crime.nationalBurglaryRate, [2, 4, 8, 12]));
    evidence.push(
      `${crime.municipality}: ${rate(crime.burglaryRate)} home burglaries per 10,000 residents vs ${rate(crime.nationalBurglaryRate)} in Finland (${crime.year})`,
    );
  } else {
    lines.push({ label: 'Area burglary rate not available', points: 5 });
  }
  if (request.answers.housing === 'detached') {
    lines.push({ label: 'Detached house: every door and window is at ground level', points: 4 });
  } else if (groundLevel(request)) {
    lines.push({ label: 'Windows and doors at street level', points: 4 });
  }
  evidence.push('Boxes outside show that a home is changing hands');

  return flag(
    {
      id: 'burglary',
      category: 'keys',
      title: 'Break-in at the new home',
      why: 'A move is when homes are easiest to read from the street: boxes, open doors and new electronics.',
      evidence,
      source: crime ? 'open-data' : 'derived',
      coverageTags: ['theft'],
      actionIds: ['change-lock', 'boxes-out-of-sight', 'home-alarm'],
      estimateEur: figures.burglaryClaimEur.value,
    },
    lines,
  );
};

const keyHandover: Rule = (request) =>
  flag(
    {
      id: 'key-handover',
      category: 'keys',
      title: request.answers.renting ? "Previous tenants' keys" : "Previous owner's keys",
      why: 'You cannot know how many copies are still out there. A new lock cylinder costs far less than a break-in.',
      evidence: [request.answers.renting ? 'Your answer: renting' : 'Your answer: buying'],
      source: 'answer',
      coverageTags: ['theft'],
      actionIds: ['change-lock', 'count-keys'],
    },
    [
      request.answers.renting
        ? { label: 'Rented home: earlier tenants may still have copies', points: 6 }
        : { label: "Bought home: the previous owner's spare keys", points: 4 },
    ],
  );

const fireSafety: Rule = (request, signals) => {
  const heating = signals.building?.heating ?? '';
  const woodHeating = /puu|pelletti|turve/i.test(heating);
  const { crime } = signals;
  const arsonRatio = crime ? crime.arsonRate / crime.nationalArsonRate : 0;
  const lines: PointLine[] = [{ label: 'New home: smoke alarms not checked yet', points: 4 }];
  const evidence = [
    `${figures.firesWithoutDetector.value} home fires in ${figures.firesWithoutDetector.year} had no smoke detector (PRONTO)`,
  ];

  if (woodHeating) {
    lines.push({ label: `Heated with ${heating.toLowerCase()} (HSY)`, points: 6 });
    evidence.push(`Heating: ${heating} (HSY)`);
  } else if (request.answers.housing === 'detached') {
    lines.push({ label: 'Detached house: fireplace or sauna stove likely', points: 3 });
  }
  if (crime && arsonRatio >= 1.15) {
    lines.push({ label: 'Police-recorded arson above the national rate', points: 3 });
    evidence.push(
      `${crime.municipality}: ${rate(crime.arsonRate)} arson offences per 10,000 residents vs ${rate(crime.nationalArsonRate)} in Finland (${crime.year})`,
    );
  }

  return flag(
    {
      id: 'fire-safety',
      category: 'property',
      title: 'Fire safety at the new address',
      why: 'Residents are responsible for a working smoke alarm. Most home fires start in the kitchen or from a fireplace.',
      evidence,
      source: 'derived',
      coverageTags: ['fire'],
      actionIds: woodHeating
        ? ['smoke-alarm', 'stove-guard', 'chimney-sweep']
        : ['smoke-alarm', 'stove-guard'],
      estimateEur: figures.buildingFireDamageEur.value,
    },
    lines,
  );
};

const flood: Rule = (request, signals) => {
  if (!signals.flood) return undefined;
  const sea = signals.flood.type.toLowerCase().includes('meri');
  return flag(
    {
      id: 'flood',
      category: 'property',
      title: sea ? 'Inside a coastal flood area' : 'Inside a flood risk area',
      why: 'The address is in an area the Finnish Environment Institute marks for significant flood risk. Storage rooms and ground floors get wet first.',
      evidence: [`${signals.flood.name} flood risk area (SYKE)`],
      source: 'open-data',
      coverageTags: ['natural-hazard'],
      actionIds: ['raise-storage', 'flood-alerts'],
    },
    [
      { label: `In a SYKE flood risk area (${signals.flood.name})`, points: 10 },
      { label: 'Home at ground level', points: groundLevel(request) ? 6 : 0 },
    ],
  );
};

function wetWeather(signals: Signals) {
  const weather = signals.weather;
  if (!weather) return undefined;
  if (weather.snowfallCm > 0) return `Snow forecast on moving day (${weather.snowfallCm} cm)`;
  if (weather.precipitationMm >= 2) {
    return `Rain forecast on moving day (${weather.precipitationMm} mm)`;
  }
  return undefined;
}

const transitDamage: Rule = (request, signals) => {
  const { selfMove, valuables } = request.answers;
  const wet = wetWeather(signals);
  const distance = signals.route?.distanceKm ?? 0;
  const size = sizeLine(request);
  const evidence = [selfMove ? 'Your answer: moving yourself' : 'Your answer: using movers'];
  if (size.points > 0) evidence.push(`Your answer: ${request.homeSizeM2} m² home`);
  if (wet) evidence.push(`${wet} (Open-Meteo)`);
  const routeLine = routeEvidence(signals);
  if (routeLine && distance >= 150) evidence.push(routeLine);

  return flag(
    {
      id: 'transit-damage',
      category: 'transport',
      title: selfMove ? 'Damage while you carry and drive' : 'Damage in the movers’ hands',
      why: selfMove
        ? 'Stairwells, doorways and van loading are where knocks and drops happen.'
        : 'Movers carry liability for what they break, but their limits are often lower than what your things are worth.',
      evidence,
      source: wet ? 'open-data' : 'answer',
      coverageTags: valuables ? ['transit', 'valuables'] : ['transit'],
      actionIds: selfMove
        ? ['book-mover', 'rent-tools', 'wrap-fragile', ...(wet ? ['cover-boxes'] : [])]
        : ['wrap-fragile', ...(wet ? ['cover-boxes'] : [])],
    },
    [
      selfMove
        ? { label: 'Moving it yourself', points: 8 }
        : { label: 'Movers carry your things', points: 3 },
      { label: 'Fragile or valuable items', points: valuables ? 5 : 0 },
      size,
      { label: wet ?? '', points: wet ? 4 : 0 },
      {
        label: `Long haul (${km(distance)}): loads shift on the way`,
        points: distance >= 150 ? 3 : 0,
      },
    ],
  );
};

const winterMonths = new Set([11, 12, 1, 2, 3]);

const roadAccident: Rule = (request, signals) => {
  if (!request.answers.selfMove) return undefined;
  const { accidents, weather } = signals;
  const month = Number(request.moveDate.slice(5, 7));
  const icy = winterMonths.has(month) || (weather !== undefined && weather.tempMinC < 0);
  const distance = signals.route?.distanceKm;
  const evidence = ['Your answer: driving the van yourself'];
  const routeLine = routeEvidence(signals);
  if (routeLine) evidence.push(routeLine);
  if (accidents) {
    evidence.push(
      `${accidents.municipality}: ${accidents.count} road accidents with injuries (${accidents.year}), ${rate(accidents.rate)} per 10,000 residents vs ${rate(accidents.nationalRate)} in Finland`,
    );
  }

  return flag(
    {
      id: 'road-accident',
      category: 'transport',
      title: 'Driving a loaded van',
      why: 'A heavy van needs more room to stop and turn, and most people drive one only on moving day.',
      evidence,
      source: accidents ? 'open-data' : 'answer',
      coverageTags: ['vehicle'],
      actionIds: ['book-mover', 'avoid-rush'],
    },
    [
      accidents
        ? ratioLine(accidents.rate / accidents.nationalRate, [1, 2, 4, 6])
        : { label: 'Driving a van yourself', points: 3 },
      { label: 'Winter roads on moving day', points: icy ? 3 : 0 },
      distance === undefined
        ? { label: '', points: 0 }
        : distance >= 150
          ? { label: `${km(distance)} with a loaded van`, points: 6 }
          : distance >= 40
            ? { label: `${km(distance)} with a loaded van`, points: 3 }
            : { label: '', points: 0 },
    ],
  );
};

function daysUntil(isoDate: string, today: Date) {
  const target = new Date(`${isoDate}T00:00:00`);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target.getTime() - start.getTime()) / 86_400_000);
}

const scheduleDelay: Rule = (request, signals) => {
  const day = Number(request.moveDate.slice(8, 10));
  const days = daysUntil(request.moveDate, new Date());
  const { weather } = signals;
  const stormy = weather !== undefined && (weather.gustMaxMs >= 15 || weather.snowfallCm >= 2);
  const nearby = (signals.traffic ?? []).filter((work) => work.distanceKm <= 1.5).slice(0, 2);
  const evidence: string[] = [];
  if (weather && stormy) {
    evidence.push(
      `Forecast for moving day: gusts up to ${weather.gustMaxMs} m/s, ${weather.snowfallCm} cm of snow (Open-Meteo)`,
    );
  }
  for (const work of nearby) {
    evidence.push(`${work.title}, ${work.distanceKm.toFixed(1)} km away (Digitraffic)`);
  }
  if (day >= 28 || day === 1) evidence.push('End or start of the month');
  const distance = signals.route?.distanceKm ?? 0;
  const routeLine = routeEvidence(signals);
  if (routeLine && distance >= 100) evidence.push(routeLine);
  const bigSelfMove = request.answers.selfMove && request.homeSizeM2 >= 90;
  if (bigSelfMove) evidence.push(`Your answers: moving a ${request.homeSizeM2} m² home yourself`);

  return flag(
    {
      id: 'schedule-delay',
      category: 'schedule',
      title: 'Moving day running late',
      why: 'A late mover or a blocked street pushes everything back, including the key handover and the lift booking.',
      evidence,
      source: stormy || nearby.length > 0 || distance >= 100 ? 'open-data' : 'derived',
      coverageTags: ['delay'],
      actionIds: ['book-early', 'buffer-day', 'route-check'],
    },
    [
      {
        label: 'End of the month: the busiest moving days',
        points: day >= 28 || day === 1 ? 5 : 0,
      },
      {
        label: 'Less than two weeks to book movers and the lift',
        points: days >= 0 && days <= 14 ? 4 : 0,
      },
      { label: 'Wind or snow forecast on moving day', points: stormy ? 5 : 0 },
      {
        label: `Long move (${km(distance)}): keys and unloading wait for the drive`,
        points: distance >= 100 ? 4 : 0,
      },
      { label: 'A big home is hard to move yourself in one day', points: bigSelfMove ? 3 : 0 },
      ...nearby.map((work) => ({
        label: `Traffic announcement ${work.distanceKm.toFixed(1)} km away`,
        points: 3,
      })),
    ],
  );
};

const uninsuredContents: Rule = (request) => {
  if (request.answers.hasHomeInsurance) return undefined;
  return flag(
    {
      id: 'uninsured-contents',
      category: 'property',
      title: 'No home insurance yet',
      why: 'Without home insurance, nothing pays for a leak, fire or break-in, or for damage you cause to the neighbours.',
      evidence: ['Your answer: no home insurance for the new address'],
      source: 'answer',
      coverageTags: ['home-contents', 'liability'],
      actionIds: ['home-insurance'],
    },
    [{ label: 'Belongings not insured on moving day', points: 20 }],
  );
};

const petLiability: Rule = (request) => {
  if (!request.answers.dog) return undefined;
  return flag(
    {
      id: 'pet-liability',
      category: 'property',
      title: 'Your dog in a new building',
      why: 'New stairwells, neighbours and a yard. A bite or a scratched door becomes a liability claim.',
      evidence: ['Your answer: you have a dog'],
      source: 'answer',
      coverageTags: ['liability'],
      actionIds: ['pet-rules'],
    },
    [{ label: 'Dog meeting new neighbours', points: 6 }],
  );
};

export const rules: Rule[] = [
  oldPlumbing,
  burglary,
  keyHandover,
  fireSafety,
  flood,
  transitDamage,
  roadAccident,
  scheduleDelay,
  uninsuredContents,
  petLiability,
];

export function evaluateRules(request: MovingRequest, signals: Signals): Flag[] {
  return rules.flatMap((rule) => rule(request, signals) ?? []);
}
