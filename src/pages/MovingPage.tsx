import { useState, type FormEvent } from 'react';
import { Checklist, Field, RiskRows, ServiceCard } from '../components/blocks';
import type { IconName } from '../components/Icon';
import { LiquidMeter } from '../components/LiquidMeter';
import { LiquidRing } from '../components/LiquidRing';
import { demoMovingReport } from '../data/movingReport';
import { levelForScore, scoreReport, type CategoryId } from '../engine/movingRisk';
import { loadMovingPlan, saveMovingPlan } from '../state/movingPlan';
import { storageKeys, useStoredSet } from '../state/useStoredSet';
import './EventPage.css';

const levelLabel = { low: 'Low', medium: 'Medium', high: 'High' } as const;

const categoryIcons: Record<CategoryId, IconName> = {
  transport: 'truck',
  schedule: 'clock',
  keys: 'key',
  property: 'building',
};

const checklistItems = [
  { id: 'pack-essentials', label: 'Pack essentials early', hint: 'Documents, chargers, medicine' },
  { id: 'address-keys', label: 'Confirm address and keys', hint: 'Count keys at handover' },
  {
    id: 'transport-cover',
    label: 'Check transport coverage',
    hint: 'Perus level does not cover moving damage',
  },
  { id: 'emergency-contacts', label: 'Save emergency contacts', hint: 'Landlord, housing company' },
  { id: 'smoke-alarms', label: 'Test smoke alarms', hint: 'On your first evening' },
];

export function MovingPage() {
  const [plan, setPlan] = useState(loadMovingPlan);
  const [doneActions] = useStoredSet(storageKeys.movingActions);
  const [checked, toggleChecked] = useStoredSet(storageKeys.movingChecklist);
  const { categories, overall, readiness } = scoreReport(demoMovingReport, doneActions);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    saveMovingPlan(plan);
    window.location.hash = '#risk-report';
  };

  return (
    <>
      <section className="event-hero" aria-labelledby="moving-title">
        <div className="event-hero__inner">
          <h1 id="moving-title">Moving — Prepare better, stay protected</h1>
          <p className="event-hero__lead">
            Compare verified movers, rent a van or tools, get practical checklists and add
            single-trip insurance by If.
          </p>

          <div className="event-top">
            <form className="event-card" onSubmit={submit}>
              <h2>Plan your move</h2>
              <div className="event-form__grid">
                <Field icon="pin" label="Moving from">
                  <input
                    value={plan.from}
                    onChange={(event) => setPlan({ ...plan, from: event.target.value })}
                    required
                  />
                </Field>
                <Field icon="pin" label="Moving to">
                  <input
                    value={plan.to}
                    onChange={(event) => setPlan({ ...plan, to: event.target.value })}
                    required
                  />
                </Field>
                <Field icon="calendar" label="Moving date">
                  <input
                    type="date"
                    value={plan.moveDate}
                    onChange={(event) => setPlan({ ...plan, moveDate: event.target.value })}
                    required
                  />
                </Field>
                <Field icon="ruler" label="Home size, m²">
                  <input
                    type="number"
                    min={10}
                    max={500}
                    inputMode="numeric"
                    value={plan.homeSizeM2}
                    onChange={(event) =>
                      setPlan({ ...plan, homeSizeM2: Number(event.target.value) })
                    }
                    required
                  />
                </Field>
              </div>
              <button className="button button--primary event-form__submit" type="submit">
                Create moving plan
              </button>
              <p className="event-form__note">
                We check the building and area against public data, then build your risk report.
                Nothing is sent to If until you ask for a quote.
              </p>
            </form>

            <article className="event-card">
              <h2>Moving risk preview</h2>
              <div className="preview">
                <RiskRows
                  rows={categories.map((category) => ({
                    id: category.id,
                    name: category.name,
                    level: category.level,
                    icon: categoryIcons[category.id],
                    handled: category.score === 0,
                  }))}
                />
                <LiquidRing value={overall} label={`Overall moving risk ${overall} of 100`}>
                  <span className="preview__caption-level">
                    {levelLabel[levelForScore(overall)]} risk
                  </span>
                  <span className="preview__caption-sub">Overall {overall} of 100</span>
                </LiquidRing>
              </div>
              <div className="preview__progress">
                <span>{readiness}% ready for moving day</span>
                <LiquidMeter value={readiness} variant="progress" label="Moving readiness" />
              </div>
            </article>
          </div>
        </div>
      </section>

      <div className="event-body">
        <section className="event-services" aria-label="Moving services">
          <ServiceCard
            icon="tag"
            title="Verified mover discounts"
            action={
              <a className="button button--primary button--small" href="#risk-report">
                View discounts
              </a>
            }
          >
            <p>Movers who carry their own liability cover, at a member price.</p>
          </ServiceCard>
          <ServiceCard
            icon="wrench"
            title="Van and tool rental"
            action={
              <a className="button button--primary button--small" href="#risk-report">
                Book rental
              </a>
            }
          >
            <p>Dollies, straps and a van for the day. Free tool rental for annual members.</p>
          </ServiceCard>
          <ServiceCard
            icon="shield"
            title="Single-trip insurance by If"
            action={
              <a className="button button--primary button--small" href="#risk-report">
                Get a quote
              </a>
            }
          >
            <p>Cover for things that break on moving day, if your home insurance leaves it out.</p>
          </ServiceCard>
        </section>

        <Checklist
          id="moving-checklist"
          title="Moving checklist"
          items={checklistItems}
          done={checked}
          onToggle={toggleChecked}
        />
      </div>
    </>
  );
}
