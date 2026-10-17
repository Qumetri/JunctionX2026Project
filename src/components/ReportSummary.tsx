import { useEffect, useMemo, useState } from 'react';
import { templateSummary, type SummaryInput } from '../../shared/engine/summary';
import { reportService, type Summary } from '../api/report';
import './ReportSummary.css';

/**
 * "In short": the template summary shows at once; a local model's version replaces it when it
 * arrives. The label always says which one the reader is looking at.
 */
export function ReportSummary({ input }: { input: SummaryInput }) {
  const key = JSON.stringify(input);
  const stable = useMemo(() => JSON.parse(key) as SummaryInput, [key]);
  const [result, setResult] = useState<{ key: string; summary: Summary }>();

  useEffect(() => {
    const controller = new AbortController();
    void reportService.summary(stable, controller.signal).then((summary) => {
      if (!controller.signal.aborted) setResult({ key, summary });
    });
    return () => controller.abort();
  }, [key, stable]);

  const writing = result?.key !== key;
  const summary = writing ? templateSummary(stable) : result.summary;

  return (
    <section className="report-summary" aria-labelledby="summary-title" aria-busy={writing}>
      <h2 id="summary-title">In short</h2>
      <div className="report-summary__text" key={summary.source} aria-live="polite">
        <p>{summary.overview}</p>
        <p>{summary.plan}</p>
      </div>
      <p className="report-summary__source">
        {writing
          ? 'Writing a summary with the local AI model…'
          : summary.source === 'ai'
            ? `Written by a local AI model (${summary.model}) from the results below. It runs on this computer.`
            : summary.reason === 'rejected'
              ? "Built from the results below. The local AI model's answer didn't pass our checks."
              : 'Built from the results below. The local AI model was not available.'}
      </p>
    </section>
  );
}
