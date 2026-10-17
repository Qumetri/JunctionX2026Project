/**
 * The one seam between the UI and the data code. The `local` service runs shared/ in the
 * browser; a `remote` one can later send the same request to the optional server
 * (context/backendMovingPlan.md §3, §9) without touching pages or the engine.
 */
import { createBrowserCache } from '../../shared/cache/store';
import type { Summary, SummaryInput } from '../../shared/engine/summary';
import type { TravelSummary, TravelSummaryInput } from '../../shared/engine/travelSummary';
import type { AdapterResult } from '../../shared/opendata/http';
import { nearbyPetPlaces, type PetPlace } from '../../shared/opendata/overpass';
import { aiSummary } from '../../shared/services/aiSummary';
import { aiTravelSummary } from '../../shared/services/aiTravelSummary';
import {
  buildMovingReport,
  type MovingReport,
  type Progress,
} from '../../shared/services/movingReport';
import {
  buildTravelReport,
  type TravelProgress,
  type TravelReport,
} from '../../shared/services/travelReport';
import type { MovingRequest, TravelRequest } from '../../shared/types';

export interface ReportService {
  movingReport(request: MovingRequest, onProgress?: Progress): Promise<MovingReport>;
  /** Never rejects: falls back to the template summary when the model is unavailable. */
  summary(input: SummaryInput, signal?: AbortSignal): Promise<Summary>;
  /** Never rejects: a source that fails is marked missing. */
  travelReport(request: TravelRequest, onProgress?: TravelProgress): Promise<TravelReport>;
  /** Never rejects: falls back to the template summary and tips. */
  travelSummary(input: TravelSummaryInput, signal?: AbortSignal): Promise<TravelSummary>;
  /** Dog parks and vets near a point. Never rejects: `reference` is the saved copy. */
  petPlaces(lat: number, lon: number, signal?: AbortSignal): Promise<AdapterResult<PetPlace[]>>;
}

const cache = createBrowserCache();

/** Local Ollama, reached through the Vite proxy in dev (vite.config.ts). */
const ollama = {
  baseUrl: import.meta.env.VITE_OLLAMA_URL ?? '/proxy/ollama',
  model: import.meta.env.VITE_OLLAMA_MODEL ?? 'qwen2.5:3b',
};

const localService: ReportService = {
  movingReport: (request, onProgress) => buildMovingReport(request, cache, onProgress),
  summary: (input, signal) => aiSummary(input, ollama, cache, signal),
  travelReport: (request, onProgress) => buildTravelReport(request, cache, onProgress),
  travelSummary: (input, signal) => aiTravelSummary(input, ollama, cache, signal),
  petPlaces: (lat, lon, signal) => nearbyPetPlaces(lat, lon, { cache, signal }),
};

export const reportService: ReportService = localService;

export type { MovingReport, PetPlace, Summary, TravelReport, TravelSummary };
