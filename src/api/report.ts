/**
 * The one seam between the UI and the data code. The `local` service runs shared/ in the
 * browser; a `remote` one can later send the same request to the optional server
 * (context/backendMovingPlan.md §3, §9) without touching pages or the engine.
 */
import { createBrowserCache } from '../../shared/cache/store';
import {
  buildMovingReport,
  type MovingReport,
  type Progress,
} from '../../shared/services/movingReport';
import type { MovingRequest } from '../../shared/types';

export interface ReportService {
  movingReport(request: MovingRequest, onProgress?: Progress): Promise<MovingReport>;
}

const cache = createBrowserCache();

const localService: ReportService = {
  movingReport: (request, onProgress) => buildMovingReport(request, cache, onProgress),
};

export const reportService: ReportService = localService;

export type { MovingReport };
