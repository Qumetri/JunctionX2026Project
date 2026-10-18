import { useEffect, useRef, useState } from 'react';
import { reportService, type PetPlace } from '../api/report';
import petAvatar from '../assets/pet-avatar.jpg';
import bannerPoster from '../assets/pet-banner-poster.jpg';
import bannerVideo from '../assets/pet-banner.mp4';
import { Icon } from '../components/Icon';
import { LiquidMeter } from '../components/LiquidMeter';
import { PetMap } from '../components/PetMap';
import { pet, petChecklist, relativeDays, usePetCare } from '../state/petCare';
import { loadMovingReport } from '../state/movingPlan';
import './PetCarePage.css';

const ENTRY_RULES_URL = 'https://www.ruokavirasto.fi/en/animals/travellers/pets/';

const monthYear = (date: Date) =>
  date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The walk video behind the health record. Still for reduced motion until the user plays it. */
function BannerVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(() => !prefersReducedMotion());

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (playing) video.play().catch(() => setPlaying(false));
    else video.pause();
  }, [playing]);

  return (
    <>
      <video
        ref={ref}
        className="pet-banner__video"
        src={bannerVideo}
        poster={bannerPoster}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      />
      <button
        type="button"
        className="pet-banner__toggle"
        onClick={() => setPlaying((value) => !value)}
        aria-label={playing ? 'Pause the background video' : 'Play the background video'}
      >
        <Icon name={playing ? 'pause' : 'play'} />
      </button>
    </>
  );
}

type Origin = { lat: number; lon: number; label: string };

const helsinki: Origin = { lat: 60.1699, lon: 24.9384, label: 'Helsinki city centre' };

/** Near the new home when there is a moving report, else central Helsinki. */
function startOrigin(): Origin {
  const location = loadMovingReport()?.signals.location;
  return location ? { lat: location.lat, lon: location.lon, label: 'your new home' } : helsinki;
}

type PlacesState =
  | { phase: 'loading' }
  | { phase: 'ready'; places: PetPlace[]; saved: boolean }
  | { phase: 'failed' };

/** The answer for one search; a different key means a newer search is still loading. */
type PlacesResult = { key: string; places: PetPlace[] | undefined; saved: boolean };

const noPlaces: PetPlace[] = [];

function formatKm(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function PetPlaces() {
  const [origin, setOrigin] = useState(startOrigin);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<PlacesResult>();
  const [selectedId, setSelectedId] = useState<string>();
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string>();

  const searchKey = `${origin.lat},${origin.lon}#${attempt}`;
  useEffect(() => {
    const controller = new AbortController();
    reportService.petPlaces(origin.lat, origin.lon, controller.signal).then(({ value, status }) => {
      if (controller.signal.aborted) return;
      setResult({ key: searchKey, places: value, saved: status === 'reference' });
    });
    return () => controller.abort();
  }, [origin, searchKey]);

  const state: PlacesState =
    result?.key !== searchKey
      ? { phase: 'loading' }
      : result.places
        ? { phase: 'ready', places: result.places, saved: result.saved }
        : { phase: 'failed' };

  const locate = () => {
    if (!('geolocation' in navigator)) {
      setLocateError('This browser can’t share your location.');
      return;
    }
    setLocating(true);
    setLocateError(undefined);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        setSelectedId(undefined);
        setOrigin({ lat: coords.latitude, lon: coords.longitude, label: 'your location' });
      },
      (error) => {
        setLocating(false);
        setLocateError(
          (error.code === error.PERMISSION_DENIED
            ? 'Location is off for this site.'
            : 'Your location couldn’t be found.') + ` Showing places near ${origin.label}.`,
        );
      },
      { timeout: 10_000, maximumAge: 300_000 },
    );
  };

  // A stable empty list, so the map doesn't re-fit on every render while loading.
  const places = state.phase === 'ready' ? state.places : noPlaces;

  return (
    <section className="pet-section" aria-labelledby="pet-places-title">
      <div className="pet-places__head">
        <div>
          <h2 id="pet-places-title" className="pet-section__title">
            Pet-friendly places near you
          </h2>
          <p className="pet-section__lead">Dog parks and vets within 3 km of {origin.label}.</p>
        </div>
        {origin.label !== 'your location' && (
          <button
            type="button"
            className="button button--soft pet-places__locate"
            onClick={locate}
            disabled={locating}
          >
            <Icon name="locate" />
            {locating ? 'Finding you…' : 'Use my location'}
          </button>
        )}
      </div>
      {locateError && (
        <p className="pet-places__note" role="status">
          {locateError}
        </p>
      )}

      <div className="pet-places">
        <div className="pet-places__map">
          <PetMap
            center={origin}
            places={places}
            selectedId={selectedId}
            label={`Map of dog parks and vets near ${origin.label}`}
          />
        </div>

        <div className="pet-places__list">
          <h3>Recommended places</h3>
          {state.phase === 'loading' && <p className="pet-places__empty">Finding places…</p>}
          {state.phase === 'failed' && (
            <div className="pet-places__empty">
              <p>OpenStreetMap didn’t answer, so no places are shown.</p>
              <button
                type="button"
                className="button button--soft button--small"
                onClick={() => setAttempt((n) => n + 1)}
              >
                Try again
              </button>
            </div>
          )}
          {state.phase === 'ready' && places.length === 0 && (
            <p className="pet-places__empty">No dog parks or vets are mapped within 3 km.</p>
          )}
          {places.length > 0 && (
            <ul>
              {places.map((place) => (
                <li key={place.id}>
                  <button
                    type="button"
                    className="pet-place"
                    aria-pressed={place.id === selectedId}
                    onClick={() => setSelectedId(place.id)}
                  >
                    <span className="icon-tile icon-tile--small">
                      <Icon name={place.kind === 'vet' ? 'stethoscope' : 'paw'} />
                    </span>
                    <span className="pet-place__text">
                      <span className="pet-place__name">{place.name}</span>
                      <span className="pet-place__kind">
                        {place.kind === 'vet' ? 'Vet clinic' : 'Dog park'}
                      </span>
                    </span>
                    <span className="pet-place__km">
                      <Icon name="pin" />
                      {formatKm(place.km)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="pet-places__source">
            {state.phase === 'ready' && state.saved
              ? 'Places from a saved OpenStreetMap copy (October 2026); the live service didn’t answer.'
              : 'Places and map from OpenStreetMap.'}
          </p>
        </div>
      </div>
    </section>
  );
}

export function PetCarePage() {
  const care = usePetCare();
  const dewormingSoon = care.deworming.days <= 14;

  return (
    <>
      <div className="pet-top">
        <section className="pet-banner" aria-label={`${pet.name}’s health record`}>
          <BannerVideo />
          <div className="pet-banner__inner">
            <aside className="pet-record">
              <div className="pet-record__head">
                <img src={petAvatar} alt="" width="56" height="56" />
                <div>
                  <h2>Pet health record</h2>
                  <p>
                    <span className="pet-record__name">{pet.name}</span>, {pet.breed}, {pet.age}{' '}
                    years
                  </p>
                </div>
                <span className="pet-record__badge" aria-hidden="true">
                  <Icon name="clipboard" />
                </span>
              </div>
              <dl className="pet-record__rows">
                <div className="pet-record__row pet-record__row--half">
                  <dt>Vaccine history</dt>
                  <dd>
                    Rabies until {monthYear(care.rabies.until)}
                    <span className="pet-record__bar" aria-hidden="true">
                      <span style={{ width: `${care.rabies.left}%` }} />
                    </span>
                  </dd>
                </div>
                <div className="pet-record__row pet-record__row--half">
                  <dt>Deworming log</dt>
                  <dd>
                    {care.deworming.days < 0 ? 'Was due' : 'Next one'}{' '}
                    {relativeDays(care.deworming.days)}
                    <span
                      className={
                        dewormingSoon ? 'pet-record__bar pet-record__bar--due' : 'pet-record__bar'
                      }
                      aria-hidden="true"
                    >
                      <span style={{ width: `${Math.max(care.deworming.left, 4)}%` }} />
                    </span>
                  </dd>
                </div>
                <div className="pet-record__row">
                  <dt>Weight notes</dt>
                  <dd>
                    {care.weight.kg} kg, {care.weight.trend}
                  </dd>
                </div>
                <div className="pet-record__row">
                  <dt>Allergies</dt>
                  <dd>{pet.allergies.join(', ')}</dd>
                </div>
                <div className="pet-record__row">
                  <dt>Travel status</dt>
                  <dd>
                    {care.doneCount} of {care.total} ready
                  </dd>
                </div>
              </dl>
            </aside>
          </div>
        </section>

        <section className="pet-intro" aria-labelledby="pet-title">
          <div className="pet-intro__inner">
            <div className="pet-intro__copy">
              <h1 id="pet-title">Pet Care — Health support before and during your trip</h1>
              <p className="pet-intro__lead">
                Keep {pet.name} ready to travel with a health record, a travel checklist and dog
                parks and vets nearby.
              </p>
            </div>

            <article className="pet-overview">
              <div className="pet-overview__head">
                <h2>Pet health overview</h2>
                <span className="icon-tile icon-tile--small" aria-hidden="true">
                  <Icon name="paw" />
                </span>
              </div>
              <dl className="pet-overview__facts">
                <div>
                  <dt>Species</dt>
                  <dd>{pet.species}</dd>
                </div>
                <div>
                  <dt>Breed</dt>
                  <dd>{pet.breed}</dd>
                </div>
                <div>
                  <dt>Deworming</dt>
                  <dd className={dewormingSoon ? 'pet-overview__due' : undefined}>
                    {care.deworming.days < 0
                      ? 'Overdue'
                      : dewormingSoon
                        ? 'Due soon'
                        : 'Up to date'}
                  </dd>
                </div>
                <div>
                  <dt>Last vet visit</dt>
                  <dd>{Math.round(care.lastVetDays / 7)} weeks ago</dd>
                </div>
                <div>
                  <dt>Rabies vaccine</dt>
                  <dd>Until {monthYear(care.rabies.until)}</dd>
                </div>
                <div>
                  <dt>Travel readiness</dt>
                  <dd>{care.readinessLevel}</dd>
                </div>
              </dl>
              <LiquidMeter value={care.readiness} variant="progress" label="Travel readiness" />
              <div className="pet-overview__actions">
                {dewormingSoon && (
                  <button
                    type="button"
                    className="button button--primary button--small"
                    onClick={care.deworming.log}
                  >
                    Log deworming today
                  </button>
                )}
                <a className="button button--soft button--small" href="#travel">
                  Check a trip with {pet.name}
                </a>
              </div>
            </article>
          </div>
        </section>
      </div>

      <div className="pet-body">
        <section className="pet-section" aria-labelledby="pet-checklist-title">
          <h2 id="pet-checklist-title" className="pet-section__title pet-section__title--ruled">
            Pet travel checklist
          </h2>
          <div className="pet-checks">
            {petChecklist.map((group) => {
              const groupDone = group.items.filter((item) => care.done.has(item.id)).length;
              const percent = Math.round((groupDone / group.items.length) * 100);
              return (
                <section
                  className="pet-check"
                  key={group.id}
                  aria-labelledby={`pet-check-${group.id}`}
                >
                  <h3 id={`pet-check-${group.id}`}>
                    <Icon name="check" />
                    {group.title}
                  </h3>
                  <ul>
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <label className="pet-check__item">
                          <input
                            type="checkbox"
                            checked={care.done.has(item.id)}
                            onChange={() => care.toggle(item.id)}
                          />
                          <span>
                            {item.label}
                            {item.hint && <span className="pet-check__hint">{item.hint}</span>}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  <div className="pet-check__progress">
                    <span>
                      {groupDone} of {group.items.length}
                    </span>
                    <LiquidMeter
                      className="liquid--compact"
                      value={percent}
                      variant="progress"
                      label={`${group.title} progress`}
                    />
                  </div>
                </section>
              );
            })}
          </div>
          <p className="pet-section__note">
            Entry rules differ by country. The Finnish Food Authority lists them for{' '}
            <a href={ENTRY_RULES_URL} target="_blank" rel="noreferrer">
              travelling with a pet
            </a>
            .
          </p>
        </section>

        <PetPlaces />
      </div>
    </>
  );
}
