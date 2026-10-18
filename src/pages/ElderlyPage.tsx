import { useState, type CSSProperties } from 'react';
import { partnerBenefits } from '../../shared/data/partners';
import { homePlans, type PlanId } from '../../shared/data/homePlans';
import heroPhoto from '../assets/seniors-banner.jpg';
import { Icon, type IconName } from '../components/Icon';
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

type Step = { id: string; title: string; text: string };
type StepGroup = { title: string; steps: Step[] };
type HelpTopic = {
  id: string;
  icon: IconName;
  title: string;
  /** Short line on the card at the top of the page. */
  summary: string;
  /** Says exactly where the card's button takes the reader. */
  action: string;
  intro: string;
  groups: StepGroup[];
  /** Who to turn to, in plain words. */
  help: { title: string; text: string }[];
};

const topics: HelpTopic[] = [
  {
    id: 'home-safety',
    icon: 'home',
    title: 'Stay safe at home',
    summary: 'Simple changes that prevent falls and fires, and keep your medicines in order.',
    action: 'Show home safety steps',
    intro:
      'Most falls happen at home, often at night or in the bathroom. A few small changes make every day safer.',
    groups: [
      {
        title: 'Prevent falls',
        steps: [
          {
            id: 'night-lights',
            title: 'Add night lights',
            text: 'Light the way from the bed to the toilet, so you never walk in the dark.',
          },
          {
            id: 'rugs-cables',
            title: 'Remove loose rugs and cables',
            text: 'Take away rugs that slide and tidy cables away from where you walk.',
          },
          {
            id: 'bathroom-grip',
            title: 'Make the bathroom less slippery',
            text: 'Put non-slip mats in the shower and grab bars next to the toilet and shower.',
          },
          {
            id: 'within-reach',
            title: 'Keep everyday things within reach',
            text: 'Move what you use often to shelves between waist and shoulder height. Avoid standing on chairs.',
          },
          {
            id: 'ice-grips',
            title: 'Get ice grips for winter shoes',
            text: 'Ice grips or studded soles help on icy pavements. Choose shoes that fit well indoors too.',
          },
          {
            id: 'balance',
            title: 'Keep up strength and balance',
            text: 'Regular exercise for legs and balance lowers the risk of falling. Ask about local groups for older people.',
          },
        ],
      },
      {
        title: 'Fire safety and emergencies',
        steps: [
          {
            id: 'smoke-alarms',
            title: 'Test your smoke alarms',
            text: 'Every home in Finland must have smoke alarms. Press the test button once a month.',
          },
          {
            id: 'stove-guard',
            title: 'Consider a stove guard',
            text: 'A stove guard switches the stove off if it is left on, before food starts to burn.',
          },
          {
            id: 'emergency-number',
            title: 'Know the emergency number 112',
            text: 'Write 112 next to your phone. Call it when life, health, property or the environment is in danger.',
          },
          {
            id: 'spare-key',
            title: 'Give a spare key to someone you trust',
            text: 'A relative or neighbour can then let help in if you cannot reach the door.',
          },
        ],
      },
      {
        title: 'Medicines',
        steps: [
          {
            id: 'pill-organiser',
            title: 'Use a weekly pill organiser',
            text: 'Fill it once a week, so you can see at a glance if you have taken today’s medicines.',
          },
          {
            id: 'medicine-review',
            title: 'Ask for a medicine review',
            text: 'Ask your doctor or pharmacist to check all your medicines together. Some cause dizziness.',
          },
          {
            id: 'medicine-list',
            title: 'Carry an up-to-date medicine list',
            text: 'Keep a list in your wallet. It helps doctors and paramedics in an emergency.',
          },
          {
            id: 'dose-dispensing',
            title: 'Ask your pharmacy about dose dispensing',
            text: 'Many pharmacies can pack your medicines into ready-made bags for each time of day.',
          },
          {
            id: 'old-medicines',
            title: 'Return old medicines to the pharmacy',
            text: 'Pharmacies take back old and unused medicines free of charge.',
          },
        ],
      },
    ],
    help: [
      {
        title: 'Safety phone',
        text: 'A safety phone (turvapuhelin) is a button you wear on your wrist or neck. One press connects you to help, day and night. Ask your wellbeing services county or a private provider.',
      },
      {
        title: 'Emergency',
        text: 'Call 112 when life, health or home is in danger.',
      },
    ],
  },
  {
    id: 'heavy-chores',
    icon: 'wrench',
    title: 'Help with heavy chores',
    summary: 'Trusted help with cleaning, garden work, snow and moving heavy things.',
    action: 'Show help with chores',
    intro:
      'You do not have to do the heavy work yourself. Public services and private companies can help, and part of the cost may come back as a tax credit.',
    groups: [
      {
        title: 'Plan the help you need',
        steps: [
          {
            id: 'list-chores',
            title: 'Write down the chores that feel hard',
            text: 'For example cleaning, shopping, carrying, garden work or clearing snow.',
          },
          {
            id: 'service-needs',
            title: 'Ask for a service needs assessment',
            text: 'Your wellbeing services county (in Helsinki, the city) can assess what help you need at home, including home care.',
          },
          {
            id: 'tax-credit',
            title: 'Check the household tax credit',
            text: 'When you buy cleaning, garden work, care or repairs from a company, you can claim part of the labour cost as a tax credit (kotitalousvähennys).',
          },
          {
            id: 'care-allowance',
            title: 'See if you can get Kela’s care allowance',
            text: 'Kela’s care allowance for pensioners helps people whose illness or disability makes daily life harder.',
          },
          {
            id: 'home-check',
            title: 'Book a check of the house',
            text: 'Have the roof, gutters, water pipes and heating checked before winter, so small faults stay small.',
          },
        ],
      },
    ],
    help: [
      {
        title: 'Home care',
        text: 'Ask your wellbeing services county about home care and support services. Relatives can make the first contact for you.',
      },
      {
        title: 'Private help',
        text: 'Cleaning, garden and repair companies can come regularly. Ask for a written price before work starts.',
      },
    ],
  },
  {
    id: 'technology',
    icon: 'phone',
    title: 'Technology and scams',
    summary: 'Step-by-step help with phones and online services, and how to spot scams.',
    action: 'Show technology tips',
    intro:
      'Scammers often call, text or email older people. They may pretend to be your bank, the police or a relative. These steps keep your money and details safe.',
    groups: [
      {
        title: 'Spot and stop scams',
        steps: [
          {
            id: 'never-share-codes',
            title: 'Never give your banking codes to anyone',
            text: 'Your bank and the police will never ask for your online banking codes by phone, text or email.',
          },
          {
            id: 'hang-up',
            title: 'Hang up and call back yourself',
            text: 'If a call feels strange, end it. Call your bank on the number printed on your bank card.',
          },
          {
            id: 'no-links',
            title: 'Do not open links in unexpected messages',
            text: 'Go to the service yourself instead, for example by typing your bank’s address.',
          },
          {
            id: 'ask-before-paying',
            title: 'Talk to someone before you pay',
            text: 'If someone pushes you to pay or act fast, stop and ask a relative or friend first.',
          },
          {
            id: 'check-visitors',
            title: 'Check who is at the door',
            text: 'Do not let in strangers who say they are from a company. Ask for ID and call the company to check.',
          },
        ],
      },
      {
        title: 'Get comfortable with digital services',
        steps: [
          {
            id: 'digital-help',
            title: 'Visit digital help at your library',
            text: 'Many public libraries offer free, patient help with phones, tablets and online services.',
          },
          {
            id: 'omakanta',
            title: 'Learn to use MyKanta',
            text: 'In MyKanta (Omakanta) you can see your prescriptions and ask for renewals online.',
          },
          {
            id: 'updates',
            title: 'Keep your phone up to date',
            text: 'Install updates when your phone asks. They fix security problems.',
          },
        ],
      },
    ],
    help: [
      {
        title: 'Lost money to a scam?',
        text: 'Call your bank at once to close your cards and codes, then report the crime to the police.',
      },
      {
        title: 'Someone to ask',
        text: 'Agree with a relative or friend that you can always call them before you pay or share details.',
      },
    ],
  },
];

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
            {topics.map((topic) => {
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

        {topics.map((topic) => {
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
