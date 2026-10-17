import { useRef, useState, type FormEvent } from 'react';
import { Checklist, Field, RiskRows, ServiceCard, Toggle } from '../components/blocks';
import { Icon, type IconName } from '../components/Icon';
import { LiquidMeter } from '../components/LiquidMeter';
import { LiquidRing } from '../components/LiquidRing';
import { destinations, travelPurposes, type TravelPurpose } from '../data/destinations';
import { assessTravel, type TravelRiskId } from '../engine/travelRisk';
import { storageKeys, useStoredSet } from '../state/useStoredSet';
import './EventPage.css';
import './TravelPage.css';

const levelLabel = { low: 'Low', medium: 'Medium', high: 'High' } as const;

const riskIcons: Record<TravelRiskId, IconName> = {
  medical: 'heart',
  cancellation: 'ticket',
  delay: 'plane',
  pet: 'paw',
};

export function TravelPage() {
  const [destinationId, setDestinationId] = useState('bangkok');
  const [startDate, setStartDate] = useState('2026-12-18');
  const [endDate, setEndDate] = useState('2027-01-03');
  const [purpose, setPurpose] = useState<TravelPurpose>('holiday');
  const [withPet, setWithPet] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [checked, toggleChecked] = useStoredSet(storageKeys.travelChecklist);
  const detailsRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const destination = destinations.find((item) => item.id === destinationId) ?? destinations[0];
  const assessment = assessTravel({ destination, startDate, endDate, purpose, withPet });

  const checklistItems = [
    { id: 'health', label: 'Check health requirements', hint: 'Vaccines and medicines' },
    { id: 'contacts', label: 'Save emergency contacts', hint: 'If 24/7 assistance line' },
    {
      id: 'cancellation',
      label: 'Verify cancellation rules',
      hint: 'Buy cover at least 3 days before',
    },
    ...(withPet
      ? [{ id: 'pet-docs', label: 'Prepare pet documentation', hint: 'Passport and vaccines' }]
      : []),
    { id: 'cover', label: 'Add appropriate cover', hint: 'Fixed-term or continuous' },
  ];
  const doneCount = checklistItems.filter((item) => checked.has(item.id)).length;
  const readiness = Math.round((doneCount / checklistItems.length) * 100);

  const revealDetails = () => {
    setShowDetails(true);
    requestAnimationFrame(() => detailsRef.current?.scrollIntoView({ block: 'start' }));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    revealDetails();
  };

  const tripLabel = `${assessment.length} days, ${
    assessment.daysUntil > 0 ? `leaving in ${assessment.daysUntil} days` : 'already started'
  }`;

  return (
    <>
      <section className="event-hero" aria-labelledby="travel-title">
        <div className="event-hero__inner">
          <h1 id="travel-title">Travel — Check risks before you go</h1>
          <p className="event-hero__lead">
            Get travel risk insights, medical support guidance, trip cancellation support and
            flexible cover by If.
          </p>

          <div className="event-top">
            <form className="event-card" onSubmit={submit} ref={formRef}>
              <h2>Travel risk check</h2>
              <div className="event-form__grid">
                <Field icon="globe" label="Destination">
                  <select
                    value={destinationId}
                    onChange={(event) => setDestinationId(event.target.value)}
                  >
                    {destinations.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field icon="compass" label="Purpose of travel">
                  <select
                    value={purpose}
                    onChange={(event) => setPurpose(event.target.value as TravelPurpose)}
                  >
                    {travelPurposes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field icon="calendar" label="Leaving">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    required
                  />
                </Field>
                <Field icon="calendar" label="Coming back">
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    required
                  />
                </Field>
              </div>
              <div className="travel-form__footer">
                <Toggle label="Travelling with a pet" checked={withPet} onChange={setWithPet} />
                <span className="event-form__note">{tripLabel}</span>
              </div>
              <button className="button button--primary event-form__submit" type="submit">
                Check travel risks
              </button>
            </form>

            <article className="event-card" aria-live="polite">
              <h2>Risk snapshot</h2>
              <div className="preview">
                <RiskRows
                  rows={assessment.risks.map((risk) => ({
                    id: risk.id,
                    name: risk.name,
                    level: risk.level,
                    icon: riskIcons[risk.id],
                  }))}
                />
                <LiquidRing
                  value={assessment.overall}
                  label={`Overall travel risk ${assessment.overall} of 100`}
                >
                  <span className="preview__caption-level">
                    {levelLabel[assessment.overallLevel]} risk
                  </span>
                  <span className="preview__caption-sub">{destination.name}</span>
                </LiquidRing>
              </div>
              <div className="preview__progress">
                <span>{readiness}% of your preparation done</span>
                <LiquidMeter value={readiness} variant="progress" label="Travel readiness" />
              </div>
            </article>
          </div>
        </div>
      </section>

      <div className="event-body">
        {showDetails && (
          <section
            className="travel-details"
            ref={detailsRef}
            aria-labelledby="travel-details-title"
          >
            <h2 id="travel-details-title">Your trip to {destination.name}</h2>
            <ul className="travel-details__list">
              {assessment.risks.map((risk) => (
                <li className="travel-risk" key={risk.id}>
                  <div className="travel-risk__head">
                    <span className="icon-tile icon-tile--small">
                      <Icon name={riskIcons[risk.id]} />
                    </span>
                    <h3>
                      {risk.name}
                      <span className={`level-text level-text--${risk.level}`}>
                        {levelLabel[risk.level]}
                      </span>
                    </h3>
                  </div>
                  <p>{risk.why}</p>
                  <p className="travel-risk__tip">{risk.tip}</p>
                  <LiquidMeter
                    value={{ low: 25, medium: 55, high: 85 }[risk.level]}
                    label={`${risk.name} score`}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="event-services" aria-label="Travel services">
          <ServiceCard
            icon="globe"
            title="Travel risk checks"
            action={
              <button
                type="button"
                className="button button--primary button--small"
                onClick={() => formRef.current?.scrollIntoView({ block: 'center' })}
              >
                Run risk check
              </button>
            }
          >
            <p>Health, weather and entry rules for where you are going.</p>
          </ServiceCard>
          <ServiceCard
            icon="heart"
            title="Medical support guidance"
            action={
              <button
                type="button"
                className="button button--primary button--small"
                onClick={revealDetails}
              >
                View guide
              </button>
            }
          >
            <p>What to do if you get ill abroad, and what your cover pays.</p>
          </ServiceCard>
          <ServiceCard
            icon="paw"
            title="Single-trip pet cover by If"
            action={
              <button
                type="button"
                className="button button--primary button--small"
                onClick={() => {
                  setWithPet(true);
                  revealDetails();
                }}
              >
                Get a quote
              </button>
            }
          >
            <p>Vet costs abroad for the length of one trip.</p>
          </ServiceCard>
        </section>

        <Checklist
          id="travel-checklist"
          title="Travel preparation checklist"
          items={checklistItems}
          done={checked}
          onToggle={toggleChecked}
        />
      </div>
    </>
  );
}
