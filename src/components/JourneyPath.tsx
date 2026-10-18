import { useId, type CSSProperties } from 'react';
import { Icon } from './Icon';
import './JourneyPath.css';

export type StepState = 'done' | 'skipped' | 'open';

type JourneyStep = { id: string; title: string; state: StepState };

type JourneyPathProps = {
  steps: JourneyStep[];
  /** The step whose details are shown below the path. */
  selectedId: string;
  onSelect: (id: string) => void;
  label: string;
};

/** Heights of the milestones, in % of the track; the path winds between them. */
const heights = [62, 32, 58, 28, 54, 30, 60];

/**
 * A winding path through the steps (C37 in the component demo). The coloured part is drawn up to
 * the first open step, so skipping a step moves it on just like finishing one.
 */
export function JourneyPath({ steps, selectedId, onSelect, label }: JourneyPathProps) {
  const count = steps.length;
  const clipId = `journey-${useId().replace(/[^\w-]/g, '')}`;
  const points = steps.map((_, index) => ({
    x: (index + 0.5) * 100,
    y: heights[index % heights.length],
  }));

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let index = 1; index < count; index += 1) {
    const from = points[index - 1];
    const to = points[index];
    d += ` C ${from.x + 50} ${from.y} ${to.x - 50} ${to.y} ${to.x} ${to.y}`;
  }

  const firstOpen = steps.findIndex((step) => step.state === 'open');
  const reached = firstOpen === -1 ? count - 1 : firstOpen;
  // The path only ever runs left to right, so clipping at the reached step's x draws it that far.
  const drawnTo = points[reached].x;

  return (
    <nav className="journey" aria-label={label} style={{ '--count': count } as CSSProperties}>
      <div className="journey__track">
        <svg viewBox={`0 0 ${count * 100} 100`} preserveAspectRatio="none" aria-hidden="true">
          <path className="journey__line" d={d} vectorEffect="non-scaling-stroke" />
          <defs>
            <clipPath id={clipId}>
              <rect
                className="journey__reveal"
                x={-20}
                y={-20}
                height={140}
                style={{ width: drawnTo + 20 }}
              />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            <path
              className="journey__line journey__line--drawn"
              d={d}
              vectorEffect="non-scaling-stroke"
            />
            {/* The same bubbles as the liquid meters, flowing along the finished part. */}
            <path className="journey__bubbles" d={d} vectorEffect="non-scaling-stroke" />
          </g>
        </svg>
      </div>
      <ol className="journey__steps">
        {steps.map((step, index) => {
          const isCurrent = index === firstOpen;
          const status =
            step.state === 'done' ? 'done' : step.state === 'skipped' ? 'skipped' : 'to do';
          return (
            <li key={step.id} style={{ '--y': points[index].y } as CSSProperties}>
              <button
                type="button"
                className={[
                  'journey__step',
                  `is-${step.state}`,
                  isCurrent && 'is-current',
                  step.id === selectedId && 'is-selected',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-pressed={step.id === selectedId}
                aria-current={isCurrent ? 'step' : undefined}
                onClick={() => onSelect(step.id)}
              >
                <span className="journey__dot" aria-hidden="true">
                  {step.state === 'done' ? <Icon name="check" /> : index + 1}
                </span>
                <span className="journey__title">
                  {step.title}
                  <span className="visually-hidden">
                    , step {index + 1}, {status}
                  </span>
                </span>
                {step.state === 'skipped' && (
                  <span className="journey__note" aria-hidden="true">
                    Skipped
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
