import { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { create } from 'zustand';
import { addDays, differenceInCalendarDays, format, isValid, parseISO, subWeeks } from 'date-fns';
import { fi } from 'date-fns/locale';
import { distance, point, buffer, area } from '@turf/turf';
import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import { ErrorBoundary } from 'react-error-boundary';
import { useDebounceValue, useLocalStorage, useMediaQuery } from 'usehooks-ts';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Demo } from '../components/Demo';
import { Unavailable } from '../components/NoteCard';

/* C94 TanStack Query (open-data weather with loading, error and retry) */
type Weather = { temperature: number; wind: number; precipitation: number };

async function fetchWeather(): Promise<Weather> {
  const url =
    'https://api.open-meteo.com/v1/forecast?latitude=60.1699&longitude=24.9384' +
    '&current=temperature_2m,wind_speed_10m,precipitation';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as {
    current: { temperature_2m: number; wind_speed_10m: number; precipitation: number };
  };
  return {
    temperature: json.current.temperature_2m,
    wind: json.current.wind_speed_10m,
    precipitation: json.current.precipitation,
  };
}

function WeatherCard() {
  const query = useQuery({
    queryKey: ['weather', 'helsinki'],
    queryFn: fetchWeather,
    staleTime: 60_000,
    retry: 1,
  });
  if (query.isPending) {
    return <div className="skeleton skeleton--line" aria-label="Loading weather" />;
  }
  if (query.isError) {
    return (
      <Unavailable>
        Weather is unavailable right now ({query.error.message}).{' '}
        <button type="button" className="btn" onClick={() => query.refetch()}>
          Retry
        </button>
      </Unavailable>
    );
  }
  const w = query.data;
  return (
    <div className="b3-stat-row">
      <div>
        <span className="b3-stat">{w.temperature.toFixed(1)} °C</span>
        <span className="b3-hint">Helsinki now</span>
      </div>
      <div>
        <span className="b3-stat">{w.wind.toFixed(0)} km/h</span>
        <span className="b3-hint">Wind (van loading)</span>
      </div>
      <div>
        <span className="b3-stat">{w.precipitation.toFixed(1)} mm</span>
        <span className="b3-hint">Precipitation</span>
      </div>
    </div>
  );
}

function QueryDemo() {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <WeatherCard />
    </QueryClientProvider>
  );
}

/* C95 Zustand (plan state shared by two components) */
type EventKind = 'moving' | 'pet' | 'travel';

type PlanState = {
  event: EventKind;
  tasksDone: number;
  setEvent: (event: EventKind) => void;
  completeTask: () => void;
};

const usePlanStore = create<PlanState>()((set) => ({
  event: 'moving',
  tasksDone: 3,
  setEvent: (event) => set({ event }),
  completeTask: () => set((s) => ({ tasksDone: Math.min(s.tasksDone + 1, 18) })),
}));

const EVENT_LABEL: Record<EventKind, string> = {
  moving: 'Moving',
  pet: 'New pet',
  travel: 'Trip abroad',
};

function EventPicker() {
  const event = usePlanStore((s) => s.event);
  const setEvent = usePlanStore((s) => s.setEvent);
  return (
    <div className="row" role="group" aria-label="Life event">
      {(Object.keys(EVENT_LABEL) as EventKind[]).map((key) => (
        <button
          key={key}
          type="button"
          className={event === key ? 'btn btn--primary' : 'btn'}
          aria-pressed={event === key}
          onClick={() => setEvent(key)}
        >
          {EVENT_LABEL[key]}
        </button>
      ))}
    </div>
  );
}

function PlanSummary() {
  const event = usePlanStore((s) => s.event);
  const tasksDone = usePlanStore((s) => s.tasksDone);
  const completeTask = usePlanStore((s) => s.completeTask);
  return (
    <div className="b3-stack">
      <p className="b3-hint" role="status">
        Plan: {EVENT_LABEL[event]}. Done {tasksDone} of 18 tasks.
      </p>
      <div className="bar-track" aria-hidden="true">
        <div className="bar-track__fill" style={{ width: `${(tasksDone / 18) * 100}%` }} />
      </div>
      <div className="row">
        <button type="button" className="btn" onClick={completeTask}>
          Mark next task done
        </button>
      </div>
    </div>
  );
}

function StoreDemo() {
  return (
    <div className="b3-stack">
      <EventPicker />
      <PlanSummary />
    </div>
  );
}

/* C96 date-fns (countdown and milestone dates, Finnish locale) */
const MILESTONES = [
  { label: 'Book movers', weeksBefore: 6 },
  { label: 'Notify landlord (written)', weeksBefore: 4 },
  { label: 'Transfer electricity and internet', weeksBefore: 2 },
  { label: 'Parking permit for the van', weeksBefore: 1 },
];

function DateFnsDemo() {
  const [value, setValue] = useState('2026-11-14');
  const moveDate = parseISO(value);
  const valid = isValid(moveDate);
  return (
    <div className="b3-stack">
      <label className="field">
        <span className="field__label">Move date</span>
        <input
          className="b3-input"
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </label>
      {valid ? (
        <>
          <p className="b3-hint" role="status">
            {differenceInCalendarDays(moveDate, new Date())} days until the move (
            {format(moveDate, 'EEEE d.M.yyyy', { locale: fi })}).
          </p>
          <ul className="plain-list b3-steps">
            {MILESTONES.map((m) => (
              <li key={m.label}>
                <strong>
                  {format(subWeeks(moveDate, m.weeksBefore), 'd.M.yyyy', { locale: fi })}
                </strong>{' '}
                {m.label}
              </li>
            ))}
            <li>
              <strong>{format(addDays(moveDate, 1), 'd.M.yyyy', { locale: fi })}</strong> Check the
              meter readings and keys
            </li>
          </ul>
        </>
      ) : (
        <p className="field__error">Pick a valid date.</p>
      )}
    </div>
  );
}

/* C97 Turf.js (distance and service area from an address) */
const ADDRESSES: Record<string, number[]> = {
  'Kallio, Helsinki': [24.9469, 60.1846],
  'Tapiola, Espoo': [24.8041, 60.1757],
  'Tikkurila, Vantaa': [25.0432, 60.2926],
  'Porvoo old town': [25.6651, 60.3931],
};

const PARTNER_SITES = [
  { name: 'Quick Movers, Pasila depot', lon: 24.9344, lat: 60.1995, radiusKm: 25 },
  { name: 'Van rental, Ruskeasuo', lon: 24.9101, lat: 60.2099, radiusKm: 15 },
  { name: 'FirstVet, Espoo clinic', lon: 24.7999, lat: 60.2064, radiusKm: 20 },
];

function TurfDemo() {
  const [from, setFrom] = useState<keyof typeof ADDRESSES>('Kallio, Helsinki');
  const origin = point(ADDRESSES[from]);
  const ranked = PARTNER_SITES.map((site) => ({
    ...site,
    km: distance(origin, point([site.lon, site.lat]), { units: 'kilometers' }),
  })).sort((a, b) => a.km - b.km);
  const serviceArea = buffer(origin, 15, { units: 'kilometers' });
  const areaKm2 = serviceArea ? area(serviceArea) / 1_000_000 : 0;

  return (
    <div className="b3-stack">
      <label className="field">
        <span className="field__label">Current address</span>
        <select
          className="b3-input"
          value={from}
          onChange={(e) => setFrom(e.target.value as keyof typeof ADDRESSES)}
        >
          {Object.keys(ADDRESSES).map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <ul className="plain-list b3-steps">
        {ranked.map((site) => (
          <li key={site.name}>
            <strong>{site.km.toFixed(1)} km</strong> {site.name}{' '}
            <span className="b3-hint">
              {site.km <= site.radiusKm ? '(inside service radius)' : '(outside)'}
            </span>
          </li>
        ))}
      </ul>
      <p className="b3-hint">
        15 km buffer around the address covers about {areaKm2.toFixed(0)} km².
      </p>
    </div>
  );
}

/* C98 react-i18next (Finnish, Swedish and English copy) */
const resources = {
  en: {
    translation: {
      title: 'Get ready for your move',
      subtitle: 'We build your checklist from the date you choose.',
      cta: 'Start my plan',
    },
  },
  fi: {
    translation: {
      title: 'Valmistaudu muuttoon',
      subtitle: 'Rakennamme tarkistuslistan valitsemasi päivän mukaan.',
      cta: 'Aloita suunnitelma',
    },
  },
  sv: {
    translation: {
      title: 'Gör dig redo för flytten',
      subtitle: 'Vi bygger din checklista utifrån datumet du väljer.',
      cta: 'Starta min plan',
    },
  },
};

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
}

function I18nCopy() {
  const { t, i18n: inst } = useTranslation();
  return (
    <div className="b3-stack">
      <div className="row" role="group" aria-label="Language">
        {(['en', 'fi', 'sv'] as const).map((lng) => (
          <button
            key={lng}
            type="button"
            className={inst.language === lng ? 'btn btn--primary' : 'btn'}
            onClick={() => void inst.changeLanguage(lng)}
          >
            {lng.toUpperCase()}
          </button>
        ))}
      </div>
      <p className="b3-hero">{t('title')}</p>
      <p className="b3-hint">{t('subtitle')}</p>
      <button type="button" className="btn btn--primary">
        {t('cta')}
      </button>
    </div>
  );
}

/* C99 react-error-boundary (partner widget fails, the rest of the page keeps working) */
function PartnerWidget({ broken }: { broken: boolean }) {
  if (broken) throw new Error('Partner quote service timed out (demo)');
  return <p className="b3-hint">Partner quotes: 3 movers available for your date.</p>;
}

function ErrorDemo() {
  const [broken, setBroken] = useState(false);
  return (
    <div className="b3-stack">
      <ErrorBoundary
        resetKeys={[broken]}
        onReset={() => setBroken(false)}
        fallbackRender={({ error, resetErrorBoundary }) => (
          <Unavailable>
            <strong>This widget is unavailable.</strong>{' '}
            {error instanceof Error ? error.message : 'Unknown error'}{' '}
            <button type="button" className="btn" onClick={resetErrorBoundary}>
              Try again
            </button>
          </Unavailable>
        )}
      >
        <PartnerWidget broken={broken} />
      </ErrorBoundary>
      <div className="row">
        <button type="button" className="btn" onClick={() => setBroken(true)}>
          Simulate partner outage
        </button>
      </div>
      <p className="b3-hint">The rest of the page keeps working when one widget fails.</p>
    </div>
  );
}

/* C100 usehooks-ts (media query, local storage and a debounced search) */
const ADDRESS_DB = [
  'Mannerheimintie 1, Helsinki',
  'Kaivopuistonkatu 5, Helsinki',
  'Kallio, Hämeentie 60, Helsinki',
  'Tapiolan keskus, Espoo',
  'Tikkurilantie 90, Vantaa',
];

function HooksDemo() {
  const isWide = useMediaQuery('(min-width: 600px)');
  const [tip, setTip] = useLocalStorage('b3-demo-tip', 'Pack the essentials first');
  const [query, setQuery] = useState('');
  const [debounced] = useDebounceValue(query, 400);
  const matches = ADDRESS_DB.filter((a) =>
    a.toLowerCase().includes(debounced.trim().toLowerCase()),
  );

  return (
    <div className="b3-stack">
      <p className="b3-hint">
        Layout: {isWide ? 'wide' : 'narrow'} screen. Tip saved in this browser:
      </p>
      <label className="field">
        <span className="field__label">Your tip (kept after reload)</span>
        <input className="b3-input" value={tip} onChange={(e) => setTip(e.target.value)} />
      </label>
      <label className="field">
        <span className="field__label">Search your address</span>
        <input
          className="b3-input"
          value={query}
          placeholder="Try 'kallio' or 'espoo'"
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <p className="b3-hint" role="status">
        {query !== debounced
          ? 'Waiting for you to finish typing...'
          : matches.length
            ? matches.join(' · ')
            : 'No address match'}
      </p>
    </div>
  );
}

/* C101 react-infinite-scroll-component (tips that load as you scroll) */
const ALL_TIPS = Array.from({ length: 40 }, (_, i) => {
  const pool = [
    'Book the elevator for moving day.',
    'Keep pet food and water bowl in the car.',
    'Take photos of the flat before the keys go back.',
    'Check the travel cover for your destination.',
    'Label each box with the room it goes to.',
  ];
  return `Tip ${i + 1}: ${pool[i % pool.length]}`;
});

function InfiniteDemo() {
  const [items, setItems] = useState(ALL_TIPS.slice(0, 10));
  const loadMore = () => {
    window.setTimeout(() => {
      setItems((prev) => [...prev, ...ALL_TIPS.slice(prev.length, prev.length + 10)]);
    }, 500);
  };
  return (
    <InfiniteScroll
      dataLength={items.length}
      next={loadMore}
      hasMore={items.length < ALL_TIPS.length}
      loader={<p className="b3-hint">Loading more tips...</p>}
      endMessage={<p className="b3-hint">All {ALL_TIPS.length} tips shown.</p>}
      height={240}
    >
      <ul className="plain-list b3-steps">
        {items.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </InfiniteScroll>
  );
}

export function DataGroup() {
  return (
    <>
      <Demo id="C94" title="Open-data weather with retry" lib="@tanstack/react-query">
        <QueryDemo />
      </Demo>
      <Demo id="C95" title="Plan state shared across components" lib="zustand">
        <StoreDemo />
      </Demo>
      <Demo id="C96" title="Countdown and milestone dates" lib="date-fns">
        <DateFnsDemo />
      </Demo>
      <Demo id="C97" title="Distance and service area" lib="@turf/turf">
        <TurfDemo />
      </Demo>
      <Demo id="C98" title="Finnish, Swedish and English copy" lib="react-i18next + i18next">
        <I18nCopy />
      </Demo>
      <Demo id="C99" title="Widget error boundary" lib="react-error-boundary">
        <ErrorDemo />
      </Demo>
      <Demo id="C100" title="Media query, storage and debounced search" lib="usehooks-ts">
        <HooksDemo />
      </Demo>
      <Demo id="C101" title="Infinite tips list" lib="react-infinite-scroll-component">
        <InfiniteDemo />
      </Demo>
    </>
  );
}
