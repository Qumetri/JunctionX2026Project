/**
 * The one seam between the UI and the data code. The `local` service runs shared/ in the
 * browser; a `remote` one can later send the same request to the optional server
 * (context/backendMovingPlan.md §3, §9) without touching pages or the engine.
 */
import { createBrowserCache } from '../../shared/cache/store';
import type { Summary, SummaryInput } from '../../shared/engine/summary';
import { aiSummary } from '../../shared/services/aiSummary';
import {
  buildMovingReport,
  type MovingReport,
  type Progress,
} from '../../shared/services/movingReport';
import type { MovingRequest } from '../../shared/types';

export interface ReportService {
  movingReport(request: MovingRequest, onProgress?: Progress): Promise<MovingReport>;
  /** Never rejects: falls back to the template summary when the model is unavailable. */
  summary(input: SummaryInput, signal?: AbortSignal): Promise<Summary>;
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
};

export const reportService: ReportService = localService;

export type { MovingReport, Summary };
