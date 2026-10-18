import { useEffect, useMemo, useState } from 'react';
import {
  templateCover,
  templateTravelSummary,
  travelScoreSentence,
  type TravelSummaryInput,
} from '../../shared/engine/travelSummary';
import { reportService, type TravelSummary } from '../api/report';

/**
 * The template summary and tips at once; the local model's version replaces them when it
 * arrives. While the model writes again after a change, the last text stays on screen with its
 * score line and cover line brought up to date. `writing` is true until the new version arrives,
 * so the page can say which version is on screen.
 */
export function useTravelSummary(input: TravelSummaryInput | undefined) {
  const key = input ? JSON.stringify(input) : '';
  const stable = useMemo(() => (key ? (JSON.parse(key) as TravelSummaryInput) : undefined), [key]);
  const [result, setResult] = useState<{
    key: string;
    input: TravelSummaryInput;
    summary: TravelSummary;
  }>();

  useEffect(() => {
    if (!stable) return;
    const controller = new AbortController();
    void reportService.travelSummary(stable, controller.signal).then((summary) => {
      if (!controller.signal.aborted) setResult({ key, input: stable, summary });
    });
    return () => controller.abort();
  }, [key, stable]);

  if (!stable) return undefined;
  if (result?.key === key) return { summary: result.summary, writing: false };
  if (!result) return { summary: templateTravelSummary(stable), writing: true };

  const previous = result.summary;
  return {
    summary: {
      ...previous,
      overview: previous.overview.replace(
        travelScoreSentence(result.input),
        travelScoreSentence(stable),
      ),
      cover: templateCover(stable),
    },
    writing: true,
  };
}
