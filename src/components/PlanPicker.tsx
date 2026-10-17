import { useState, type KeyboardEvent, type PointerEvent } from 'react';
import {
  homePlans,
  perks,
  planOrder,
  planSourceUrl,
  type PlanId,
} from '../../shared/data/homePlans';
import type { Match, PlanSuggestion } from '../../shared/engine/plans';
import { levelForScore, type ScoredFlag } from '../../shared/engine/score';
import { Icon } from './Icon';
import { LiquidMeter } from './LiquidMeter';
import './PlanPicker.css';

const matchLabel = { full: 'Covered', partial: 'Partly covered', none: 'Not covered' } as const;
const levelLabel = { low: 'Low', medium: 'Medium', high: 'High' } as const;

/** The level most customers pick; it is selected first. */
const popularPlan: PlanId = 'laaja';

/** How much of a flag's open points a level takes away. */
const matchShare: Record<Match, number> = { full: 1, partial: 0.5, none: 0 };

/** Moving risk left over once the level pays for what it covers, on the same 0–100 scale. */
function riskWithPlan(flags: ScoredFlag[], matches: { flagId: string; match: Match }[]) {
  const matchById = new Map(matches.map(({ flagId, match }) => [flagId, match]));
  const left = flags.reduce((sum, flag) => {
    const match = matchById.get(flag.id) ?? 'none';
    return sum + flag.open * (1 - matchShare[match]);
  }, 0);
  return Math.min(100, Math.round(left));
}

/** C42 spotlight: a soft glow follows the pointer over the levels you have not picked. */
function trackPointer(event: PointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
  event.currentTarget.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
}

/**
 * Perus / Laaja / LaajaPlus as header buttons. The popular level is selected first; each panel
 * lists the level's perks, which of the user's risks it pays for and the risk left over.
 */
export function PlanPicker({
  suggestion,
  flags,
  detached,
}: {
  suggestion: PlanSuggestion;
  flags: ScoredFlag[];
  detached: boolean;
}) {
  const [picked, setPicked] = useState<PlanId | undefined>();
  const selected = picked ?? popularPlan;
  const plan = homePlans[selected];
  const fit = suggestion.fits[selected];
  const index = planOrder.indexOf(selected);
  const previous = index > 0 ? planOrder[index - 1] : undefined;
  const shownPerks = perks.filter((perk) => detached || !perk.detachedOnly);
  const flagById = new Map(flags.map((flag) => [flag.id, flag]));
  const riskLeft = riskWithPlan(flags, fit.matches);

  // Arrow keys move between the header buttons, as in any tab list.
  const onKeyDown = (event: KeyboardEvent) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const next = planOrder[(index + step + planOrder.length) % planOrder.length];
    setPicked(next);
    document.getElementById(`plan-tab-${next}`)?.focus();
  };

  return (
    <section className="plans" aria-label="Home insurance levels for your new address">
      <div className="plans__tabs" role="tablist" aria-label="Home insurance levels">
        {planOrder.map((id) => {
          const isSelected = id === selected;
          const tabFit = suggestion.fits[id];
          return (
            <button
              key={id}
              id={`plan-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls="plan-panel"
              tabIndex={isSelected ? 0 : -1}
              className="plans__tab"
              onClick={() => setPicked(id)}
              onKeyDown={onKeyDown}
              onPointerMove={isSelected ? undefined : trackPointer}
            >
              <span className="plans__tab-name">{homePlans[id].name}</span>
              <span className="plans__tab-fit">
                Covers {tabFit.covered} of {tabFit.matches.length} risks
              </span>
              {id === popularPlan && <span className="plans__badge">Popular</span>}
            </button>
          );
        })}
      </div>

      <div
        className="plans__panel"
        id="plan-panel"
        role="tabpanel"
        aria-labelledby={`plan-tab-${selected}`}
        key={selected}
      >
        <div className="plans__summary">
          <p className="plans__tagline">{plan.tagline}</p>
          <p className="plans__fit">
            Fits your risks <strong>{fit.fit}%</strong>
          </p>
          <div className="plans__risk">
            <span>
              Moving risk with {plan.name}: <strong>{levelLabel[levelForScore(riskLeft)]}</strong>
            </span>
            <LiquidMeter value={riskLeft} label={`Moving risk left with ${plan.name}`} />
          </div>
        </div>

        <div className="plans__columns">
          <div>
            <h3 className="plans__subhead">What {plan.name} includes</h3>
            <ul className="perks">
              {shownPerks.map((perk) => {
                const value = perk.values[selected];
                const before = previous === undefined ? value : perk.values[previous];
                const isNew = value !== false && previous !== undefined && before !== value;
                return (
                  <li key={perk.id} className={value === false ? 'perk perk--missing' : 'perk'}>
                    <Icon name={value === false ? 'alert' : 'check'} className="perk__icon" />
                    <span className="perk__label">
                      {perk.label}
                      {perk.detachedOnly && <span className="perk__note">Detached houses</span>}
                    </span>
                    <span className="perk__value">
                      {value === false ? `Not in ${plan.name}` : value}
                      {isNew && (
                        <span className="perk__new">
                          {before === false
                            ? `Not in ${homePlans[previous].name}`
                            : `${homePlans[previous].name}: ${before}`}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h3 className="plans__subhead">Your moving risks</h3>
            {fit.matches.length === 0 ? (
              <p className="plans__empty">You have handled every risk. Any level will do.</p>
            ) : (
              <ul className="plan-risks">
                {fit.matches.map(({ flagId, match }) => (
                  <li key={flagId} className={`plan-risk plan-risk--${match}`}>
                    <span className="plan-risk__title">{flagById.get(flagId)?.title}</span>
                    <span className="plan-risk__status">{matchLabel[match]}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="plans__note">
              Some risks, like a late mover or a van accident, are not home insurance matters. The
              recommended actions in your plan lower them instead.
            </p>
          </div>
        </div>

        <div className="plans__footer">
          <a
            className="button button--primary"
            href={planSourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            Get a {plan.name} quote at if.fi
          </a>
          <p>Guidance based on IF's published terms, not a binding offer.</p>
        </div>
      </div>
    </section>
  );
}
