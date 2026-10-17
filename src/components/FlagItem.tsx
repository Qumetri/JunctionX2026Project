import type { Level, PointLine } from '../../shared/types';
import './FlagItem.css';

export type FlagView = {
  title: string;
  severity: Level;
  open: number;
  status: 'open' | 'reduced' | 'handled';
  why: string;
  points: PointLine[];
  evidence: string[];
  estimateEur?: number;
};

const euro = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

/** One risk flag: title and points, opening to where the points come from. */
export function FlagItem({ flag }: { flag: FlagView }) {
  const handled = flag.status === 'handled';
  return (
    <details className={handled ? 'flag flag--resolved' : 'flag'}>
      <summary>
        <span
          className={`flag__dot flag__dot--${handled ? 'resolved' : flag.severity}`}
          aria-hidden="true"
        />
        <span className="flag__title">{flag.title}</span>
        <span className="flag__points">{handled ? '0' : `+${flag.open}`}</span>
        <span className="visually-hidden">{handled ? ', handled' : `, ${flag.severity} risk`}</span>
      </summary>
      <div className="flag__body">
        <p>{flag.why}</p>
        <ul className="flag__lines" aria-label="Where the points come from">
          {flag.points.map((line) => (
            <li key={line.label}>
              <span>+{line.points}</span>
              {line.label}
            </li>
          ))}
        </ul>
        {flag.estimateEur !== undefined && (
          <p className="flag__estimate">
            Average claim in Finland: {euro.format(flag.estimateEur)}
          </p>
        )}
        {flag.evidence.map((line) => (
          <p className="flag__evidence" key={line}>
            {line}
          </p>
        ))}
      </div>
    </details>
  );
}
