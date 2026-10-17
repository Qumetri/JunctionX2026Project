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
  'geocode' | 'building' | 'flood' | 'crime' | 'accidents' | 'weather' | 'traffic';

/**
 * live: fetched now. cache: fetched earlier and still fresh. reference: built-in figure.
 * missing: the call failed or the address is outside the source's area. skipped: not relevant
 * (for example the forecast for a move more than 16 days away).
 */
export type SourceStatus = 'live' | 'cache' | 'reference' | 'missing' | 'skipped';

export type SourceRef = {
  id: SourceId;
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
};

export type Signals = {
  location?: GeoPoint;
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

export type Flag = {
  id: string;
  category: CategoryId;
  severity: Level;
  title: string;
  why: string;
  /** What triggered the flag, one item per line. */
  evidence: string[];
  source: 'answer' | 'open-data' | 'derived';
  /** The flag's points are the sum of these lines. */
  points: PointLine[];
  /** Which insurance cover pays if this happens. */
  coverageTags: CoverageTag[];
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
