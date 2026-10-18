import { useState, type CSSProperties } from 'react';
import { partnerBenefits } from '../../shared/data/partners';
import { homePlans, type PlanId } from '../../shared/data/homePlans';
import heroPhoto from '../assets/seniors-banner.jpg';
import { Icon, type IconName } from '../components/Icon';
import { seniorsTopics } from '../data/seniorsTopics';
import { storageKeys, useStoredSet } from '../state/useStoredSet';
import './ElderlyPage.css';

/** Page text scale, picked by the reader and remembered on this device. */
const textSizes = [
  { id: 'normal', label: 'Normal', scale: 1 },
  { id: 'large', label: 'Large', scale: 1.15 },
  { id: 'larger', label: 'Larger', scale: 1.3 },
] as const;
type TextSize = (typeof textSizes)[number]['id'];

function loadTextSize(): TextSize {
  try {
    const saved = localStorage.getItem(storageKeys.seniorsTextSize);
    return textSizes.find((size) => size.id === saved)?.id ?? 'normal';
  } catch {
    return 'normal';
  }
}

function saveTextSize(size: TextSize) {
  try {
    localStorage.setItem(storageKeys.seniorsTextSize, size);
  } catch {
    // Storage blocked: the choice just lasts until the page is closed.
  }
}

const supportWays: { icon: IconName; title: string; text: string }[] = [
  { icon: 'phone', title: 'Phone support', text: 'A safety phone calls help with one press.' },
  { icon: 'video', title: 'Guides', text: 'Step-by-step help at your local library.' },
  { icon: 'person', title: 'Expert visit', text: 'A check of your home and its condition.' },
  { icon: 'shield', title: 'Safety check', text: 'Tick off the steps on this page.' },
];

const anticimex = partnerBenefits.find((benefit) => benefit.id === 'anticimex');
const planNames = (ids: PlanId[]) => ids.map((id) => homePlans[id].name).join(' or ');

/** Moves the reader to a section and its heading, so keyboard and screen reader users follow. */
function goToSection(id: string) {
  const heading = document.getElementById(`${id}-title`);
  if (!heading) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  heading.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  heading.focus({ preventScroll: true });
}

export function ElderlyPage() {
  const [textSize, setTextSize] = useState(loadTextSize);
  const [done, toggle] = useStoredSet(storageKeys.seniorsChecklist);
  const scale = textSizes.find((size) => size.id === textSize)?.scale ?? 1;

  const chooseTextSize = (size: TextSize) => {
    setTextSize(size);
    saveTextSize(size);
  };

  return (
    <div className="seniors" style={{ '--seniors-scale': scale } as CSSProperties}>
      <section className="seniors-hero" aria-labelledby="seniors-title">
        <img className="seniors-hero__photo" src={heroPhoto} alt="" />
        <div className="seniors-hero__inner">
          <h1 id="seniors-title">Life Moments for seniors</h1>
          <p className="seniors-hero__lead">
            Everyday home tasks and heavy chores can feel hard as the years go by. Here you find
            simple steps and trusted help to keep daily life safe and comfortable.
          </p>

          <fieldset className="text-size">
            <legend>Text size</legend>
            <div className="text-size__options">
              {textSizes.map((size) => (
                <label className="text-size__option" key={size.id}>
                  <input
                    type="radio"
                    name="seniors-text-size"
                    value={size.id}
                    checked={textSize === size.id}
                    onChange={() => chooseTextSize(size.id)}
                  />
                  <span>{size.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      <div className="seniors-body">
        <section aria-labelledby="seniors-help-title">
          <h2 id="seniors-help-title" className="seniors-section-title">
            What would you like help with?
          </h2>
          <ul className="seniors-cards">
            {seniorsTopics.map((topic) => {
              const steps = topic.groups.flatMap((group) => group.steps);
              const count = steps.filter((step) => done.has(step.id)).length;
              return (
                <li className="seniors-card" key={topic.id}>
                  <span className="seniors-card__icon" aria-hidden="true">
                    <Icon name={topic.icon} />
                  </span>
                  <h3>{topic.title}</h3>
                  <p>{topic.summary}</p>
                  <p className="seniors-card__progress">
                    {count} of {steps.length} steps done
                  </p>
                  <button
                    type="button"
                    className="seniors-button"
                    onClick={() => goToSection(topic.id)}
                  >
                    {topic.action}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="seniors-support" aria-labelledby="seniors-support-title">
          <h2 id="seniors-support-title" className="seniors-section-title">
            Help is always close
          </h2>
          <p>
            You do not have to work things out alone. Step-by-step guides and real people are there
            to walk you through.
          </p>
          <ul className="seniors-support__list">
            {supportWays.map((way) => (
              <li key={way.title}>
                <span className="seniors-support__icon" aria-hidden="true">
                  <Icon name={way.icon} />
                </span>
                <span>
                  <strong>{way.title}</strong>
                  <span className="seniors-support__text">{way.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {seniorsTopics.map((topic) => {
          const steps = topic.groups.flatMap((group) => group.steps);
          const count = steps.filter((step) => done.has(step.id)).length;
          return (
            <section
              className="seniors-topic"
              id={topic.id}
              key={topic.id}
              aria-labelledby={`${topic.id}-title`}
            >
              {/* Focusable so the card buttons can move keyboard focus here. */}
              <h2 id={`${topic.id}-title`} className="seniors-section-title" tabIndex={-1}>
                {topic.title}
              </h2>
              <p className="seniors-topic__intro">{topic.intro}</p>
              <p className="seniors-topic__progress" aria-live="polite">
                <Icon name="check" />
                {count} of {steps.length} steps done
              </p>

              <div className="seniors-topic__layout">
                <div>
                  {topic.groups.map((group) => (
                    <fieldset className="seniors-checklist" key={group.title}>
                      <legend>{group.title}</legend>
                      <ul>
                        {group.steps.map((step) => (
                          <li key={step.id}>
                            <label
                              className={
                                done.has(step.id)
                                  ? 'seniors-step seniors-step--done'
                                  : 'seniors-step'
                              }
                            >
                              <input
                                type="checkbox"
                                checked={done.has(step.id)}
                                onChange={() => toggle(step.id)}
                              />
                              <span>
                                <span className="seniors-step__title">{step.title}</span>
                                <span className="seniors-step__text">{step.text}</span>
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    </fieldset>
                  ))}
                </div>

                <aside className="seniors-help" aria-labelledby={`${topic.id}-help-title`}>
                  <h3 id={`${topic.id}-help-title`}>Who can help</h3>
                  <dl>
                    {topic.help.map((item) => (
                      <div key={item.title}>
                        <dt>{item.title}</dt>
                        <dd>{item.text}</dd>
                      </div>
                    ))}
                  </dl>
                  {topic.id === 'home-safety' && anticimex && (
                    <div className="seniors-partner">
                      <p className="seniors-partner__name">
                        {anticimex.partner}: {anticimex.headline.toLowerCase()}
                      </p>
                      <p>{anticimex.detail}</p>
                      <p>
                        For detached houses with IF home insurance {planNames(anticimex.plans)}.
                      </p>
                      <a href={anticimex.sourceUrl} target="_blank" rel="noreferrer">
                        Read about the plan on if.fi (opens in a new tab, in Finnish)
                      </a>
                    </div>
                  )}
                </aside>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
