import { useState, type KeyboardEvent } from 'react';
import {
  homePlans,
  perks,
  planOrder,
  planSourceUrl,
  type PlanId,
} from '../../shared/data/homePlans';
import type { PlanSuggestion } from '../../shared/engine/plans';
import type { ScoredFlag } from '../../shared/engine/score';
import { Icon } from './Icon';
import { LiquidMeter } from './LiquidMeter';
import './PlanPicker.css';

const matchLabel = { full: 'Covered', partial: 'Partly covered', none: 'Not covered' } as const;

/**
 * Perus / Laaja / LaajaPlus as header buttons. The suggested level is selected first; each panel
 * lists the level's perks and which of the user's risks it pays for.
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
  const selected = picked ?? suggestion.suggested;
  const plan = homePlans[selected];
  const fit = suggestion.fits[selected];
  const index = planOrder.indexOf(selected);
  const previous = index > 0 ? planOrder[index - 1] : undefined;
  const shownPerks = perks.filter((perk) => detached || !perk.detachedOnly);
  const flagById = new Map(flags.map((flag) => [flag.id, flag]));

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
    <section className="plans" aria-labelledby="plans-title">
      <div className="plans__head">
        <h2 id="plans-title">Home insurance for your new address</h2>
        <p>{suggestion.reason}</p>
      </div>

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
            >
              <span className="plans__tab-name">{homePlans[id].name}</span>
              <span className="plans__tab-fit">
                Covers {tabFit.covered} of {tabFit.matches.length} risks
              </span>
              {id === suggestion.suggested && <span className="plans__badge">Suggested</span>}
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
          <div className="plans__fit">
            <span>Fits your risks: {fit.fit}%</span>
            <LiquidMeter value={fit.fit} variant="progress" label={`${plan.name} fit`} />
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
              actions in your report lower them instead.
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
          <p>Guidance based on If's published terms, not a binding offer.</p>
        </div>
      </div>
    </section>
  );
}
