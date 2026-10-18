/**
 * Types shared by the adapters, the engine and the UI. Plain TS, no React or DOM imports,
 * so a future server or mobile app can import them unchanged.
 */

export type Level = 'low' | 'medium' | 'high';

export type CategoryId = 'transport' | 'schedule' | 'keys' | 'property';

export type HousingType = 'flat' | 'terraced' | 'detached';

/** What the user tells us. Only `to` is needed to calculate risk; the rest refines it. */
export type MovingAnswers = {
  housing: HousingType;
  groundFloor: boolean;
  renting: boolean;
  selfMove: boolean;
  valuables: boolean;
  dog: boolean;
  hasHomeInsurance: boolean;
};

export type MovingRequest = {
  to: string;
  from: string;
  /** ISO date, YYYY-MM-DD. */
  moveDate: string;
  homeSizeM2: number;
  answers: MovingAnswers;
};

export type SourceId =
  'geocode' | 'route' | 'building' | 'flood' | 'crime' | 'accidents' | 'weather' | 'traffic';

/**
 * live: fetched now. cache: fetched earlier and still fresh. reference: built-in figure.
 * missing: the call failed or the address is outside the source's area. skipped: not relevant
 * (for example the forecast for a move more than 16 days away).
 */
export type SourceStatus = 'live' | 'cache' | 'reference' | 'missing' | 'skipped';

export type SourceRef<I extends string = SourceId> = {
  id: I;
  provider: string;
  dataset: string;
  status: SourceStatus;
  url?: string;
};

export type GeoPoint = {
  lat: number;
  lon: number;
  label: string;
  postcode?: string;
  municipality?: string;
  /** False when the geocoder matched only the street, not the house number. */
  exact?: boolean;
};

/** The drive from the old address to the new one. */
export type MoveRoute = {
  distanceKm: number;
  durationMin?: number;
  /** [lat, lon] points along the road, or just the two ends when `byRoad` is false. */
  path: [number, number][];
  /** False when the router was unreachable and the distance is a straight line. */
  byRoad: boolean;
};

export type Signals = {
  location?: GeoPoint;
  /** The address the user moves from, when given. */
  origin?: GeoPoint;
  route?: MoveRoute;
  building?: { year?: number; floors?: number; use?: string; heating?: string };
  /** null = checked and the point is outside every flood risk area. */
  flood?: { name: string; type: string } | null;
  crime?: {
    municipality: string;
    year: string;
    burglaryRate: number;
    arsonRate: number;
    nationalBurglaryRate: number;
    nationalArsonRate: number;
  };
  accidents?: {
    municipality: string;
    year: string;
    count: number;
    rate: number;
    nationalRate: number;
  };
  weather?: {
    date: string;
    precipitationMm: number;
    snowfallCm: number;
    tempMinC: number;
    gustMaxMs: number;
  };
  traffic?: { title: string; distanceKm: number }[];
  sources: SourceRef[];
  /** When the signals were collected (ISO timestamp). */
  collectedAt: string;
};

/** One line of the points breakdown: "+6 Ground-floor flat". */
export type PointLine = { label: string; points: number };

/** Generic over the journey's categories and coverage tags; the defaults are Moving's. */
export type Flag<C extends string = CategoryId, T extends string = CoverageTag> = {
  id: string;
  category: C;
  severity: Level;
  title: string;
  why: string;
  /** What triggered the flag, one item per line. */
  evidence: string[];
  source: 'answer' | 'open-data' | 'derived';
  /** The flag's points are the sum of these lines. */
  points: PointLine[];
  /** Which insurance cover pays if this happens. */
  coverageTags: T[];
  actionIds: string[];
  /** Average claim size in Finland, when published figures exist. */
  estimateEur?: number;
};

export type CoverageTag =
  | 'water-damage'
  | 'structure-moisture'
  | 'theft'
  | 'fire'
  | 'natural-hazard'
  | 'transit'
  | 'valuables'
  | 'liability'
  | 'home-contents'
  | 'vehicle'
  | 'delay';

export type Action = {
  id: string;
  title: string;
  partnerOffer?: string;
};

/* Travel */

export type TravelPurpose = 'holiday' | 'active' | 'business' | 'family';

export type TravelCategoryId = 'health' | 'trip' | 'destination' | 'belongings';

/** What travel insurance pays for; `pet` is pet insurance, not travel insurance. */
export type TravelCoverageTag =
  'medical-abroad' | 'trip-cancellation' | 'travel-delay' | 'baggage' | 'pet';

export type TravelAnswers = {
  purpose: TravelPurpose;
  withPet: boolean;
  hasTravelInsurance: boolean;
};

export type TravelRequest = {
  /** Id from shared/data/destinations.ts. */
  destinationId: string;
  /** ISO dates, YYYY-MM-DD. */
  startDate: string;
  endDate: string;
  answers: TravelAnswers;
};

export type TravelSourceId = 'advisory' | 'weather' | 'departure' | 'hazards';

export type TripWeather = {
  /** forecast: the trip is within 16 days. last-year: the same dates a year earlier. */
  basis: 'forecast' | 'last-year';
  from: string;
  to: string;
  days: number;
  hotDays: number;
  heavyRainDays: number;
  stormDays: number;
  snowDays: number;
  coldDays: number;
  maxTempC: number;
  minTempC: number;
};

export type TravelSignals = {
  /** UK FCDO advice. Empty `alerts` = no warning for the country. */
  advisory?: { alerts: string[]; change: string; updated: string };
  weather?: TripWeather;
  /** Helsinki Airport on departure day, when it is within 16 days. */
  departure?: NonNullable<Signals['weather']>;
  /** Current orange or red GDACS events in or near the destination country. */
  hazards?: { type: string; name: string; alert: 'Orange' | 'Red'; distanceKm: number }[];
  sources: SourceRef<TravelSourceId>[];
  collectedAt: string;
};

export type TravelFlag = Flag<TravelCategoryId, TravelCoverageTag>;

/** A preparation step, with when to do it relative to departure. */
export type TravelAction = {
  id: string;
  title: string;
  /** Do it at least this many days before departure; 0 = on the day or during the trip. */
  dueDays: number;
  /** A practical tip shown in "Tips for this trip" and given to the AI model. */
  tip: string;
};
