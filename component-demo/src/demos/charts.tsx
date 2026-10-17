import { useEffect, useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { Calendar, dateFnsLocalizer, Views, type Event as CalendarEvent } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, getDay, parse, startOfWeek } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { Pie } from '@visx/shape';
import { Group } from '@visx/group';
import { ResponsiveSankey } from '@nivo/sankey';
import { ResponsiveTreeMap } from '@nivo/treemap';
import { Demo } from '../components/Demo';
import { Unavailable } from '../components/NoteCard';

/* C108 React Simple Maps (choropleth of Finnish municipalities) */
const GEO_URL =
  'https://geo.stat.fi/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature' +
  '&typeName=tilastointialueet:kunta4500k&outputFormat=application/json&srsName=EPSG:4326';

type MunicipalityFeature = {
  type: 'Feature';
  id?: string | number;
  properties: { nimi: string };
  geometry: unknown;
};

/** Mock risk scores for the Helsinki region (0 to 100). Not real risk data. */
const MOCK_SCORES: Record<string, number> = {
  Helsinki: 72,
  Espoo: 61,
  Vantaa: 68,
  Kauniainen: 44,
  Kerava: 39,
  Järvenpää: 41,
  Tuusula: 37,
  Sipoo: 33,
  Kirkkonummi: 35,
  Vihti: 28,
  Nurmijärvi: 30,
  Porvoo: 40,
  Lohja: 36,
  Hyvinkää: 42,
};

function riskColor(score: number): string {
  // Linear blend from pale blue (low) to red (high).
  const t = Math.max(0, Math.min(100, score)) / 100;
  const from = [219, 231, 255];
  const to = [224, 64, 47];
  const [r, g, b] = from.map((v, i) => Math.round(v + (to[i] - v) * t));
  return `rgb(${r}, ${g}, ${b})`;
}

function MunicipalityMap() {
  const [features, setFeatures] = useState<MunicipalityFeature[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(GEO_URL, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ features: MunicipalityFeature[] }>;
      })
      .then((json) => setFeatures(json.features))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'unknown error');
      });
    return () => controller.abort();
  }, []);

  if (error) {
    return (
      <Unavailable>
        Map data could not load ({error}). Statistics Finland is needed for the outlines. The scores
        below are the same.
      </Unavailable>
    );
  }
  if (!features) {
    return <div className="skeleton skeleton--line" aria-label="Loading map" />;
  }

  return (
    <div className="b3-map">
      <ComposableMap
        width={320}
        height={380}
        projection="geoMercator"
        projectionConfig={{ center: [25.53, 64.95], scale: 1080 }}
        className="b3-map__svg"
      >
        <ZoomableGroup center={[25.2, 60.7]} zoom={2.4} minZoom={1} maxZoom={8}>
          <Geographies geography={features}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const name = (geo.properties as { nimi?: string }).nimi ?? '';
                const score = MOCK_SCORES[name];
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    className="b3-map__geo"
                    fill={score === undefined ? 'var(--track)' : riskColor(score)}
                    stroke="var(--surface)"
                    strokeWidth={0.3}
                    onMouseEnter={() => setHovered(name)}
                    onMouseLeave={() => setHovered(null)}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      <p className="b3-hint" role="status">
        {hovered
          ? `${hovered}: ${MOCK_SCORES[hovered] !== undefined ? `risk score ${MOCK_SCORES[hovered]}` : 'no demo score'}`
          : 'Hover a municipality. Colour shows the demo risk score (blue low, red high).'}
      </p>
    </div>
  );
}

/* C109 React Big Calendar (week view of move tasks) */
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales: { 'en-US': enUS },
});

const MOVE_EVENTS: CalendarEvent[] = [
  {
    title: 'Clean old flat',
    start: new Date(2026, 10, 13, 9, 0),
    end: new Date(2026, 10, 13, 13, 0),
  },
  {
    title: 'Pet passport check (vet)',
    start: new Date(2026, 10, 11, 10, 0),
    end: new Date(2026, 10, 11, 10, 45),
  },
  {
    title: 'Parking permit for the van',
    start: new Date(2026, 10, 10),
    end: new Date(2026, 10, 10),
    allDay: true,
  },
  {
    title: 'Electricity transfer',
    start: new Date(2026, 10, 9),
    end: new Date(2026, 10, 9),
    allDay: true,
  },
  {
    title: 'Movers arrive',
    start: new Date(2026, 10, 14, 8, 0),
    end: new Date(2026, 10, 14, 12, 0),
  },
  {
    title: 'Meter photos at handover',
    start: new Date(2026, 10, 14, 15, 0),
    end: new Date(2026, 10, 14, 15, 30),
  },
];

function CalendarDemo() {
  return (
    <div className="b3-calendar">
      <Calendar
        localizer={localizer}
        events={MOVE_EVENTS}
        startAccessor="start"
        endAccessor="end"
        views={[Views.WEEK, Views.MONTH]}
        defaultView={Views.WEEK}
        defaultDate={new Date(2026, 10, 9)}
        scrollToTime={new Date(2026, 10, 14, 7, 0)}
        style={{ height: 440 }}
      />
    </div>
  );
}

/* C110 visx Shape (donut of the moving budget) */
type Slice = { label: string; value: number; color: string };

const BUDGET_SLICES: Slice[] = [
  { label: 'Movers', value: 1800, color: '#1557e8' },
  { label: 'Van and fuel', value: 420, color: '#6d97ff' },
  { label: 'Cleaning', value: 380, color: '#2e7d32' },
  { label: 'Deposit buffer', value: 1000, color: '#b26a00' },
  { label: 'Pet transport', value: 200, color: '#7b1fa2' },
];

function VisxDonutDemo() {
  const total = BUDGET_SLICES.reduce((sum, s) => sum + s.value, 0);
  const size = 240;
  const radius = size / 2;
  return (
    <div className="b3-donut-row">
      <svg width={size} height={size} role="img" aria-label="Moving budget by category">
        <Group top={radius} left={radius}>
          <Pie
            data={BUDGET_SLICES}
            pieValue={(d) => d.value}
            outerRadius={radius - 8}
            innerRadius={radius - 40}
            padAngle={0.02}
          >
            {(pie) =>
              pie.arcs.map((arc) => (
                <path key={arc.data.label} d={pie.path(arc) ?? undefined} fill={arc.data.color} />
              ))
            }
          </Pie>
        </Group>
        <text
          x={radius}
          y={radius}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="currentColor"
          fontSize="16"
        >
          {total.toLocaleString('fi-FI')} €
        </text>
      </svg>
      <ul className="plain-list b3-legend-list">
        {BUDGET_SLICES.map((s) => (
          <li key={s.label}>
            <span className="b3-dot" style={{ background: s.color }} /> {s.label}{' '}
            <span className="b3-hint">{s.value.toLocaleString('fi-FI')} €</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* C111 Nivo Sankey (budget flow) */
const SANKEY = {
  nodes: [
    { id: 'Moving budget' },
    { id: 'Movers' },
    { id: 'Van and fuel' },
    { id: 'Cleaning' },
    { id: 'Deposit buffer' },
    { id: 'Pet transport' },
    { id: 'Paid by savings' },
    { id: 'Paid by loan' },
  ],
  links: [
    { source: 'Moving budget', target: 'Movers', value: 1800 },
    { source: 'Moving budget', target: 'Van and fuel', value: 420 },
    { source: 'Moving budget', target: 'Cleaning', value: 380 },
    { source: 'Moving budget', target: 'Deposit buffer', value: 1000 },
    { source: 'Moving budget', target: 'Pet transport', value: 200 },
    { source: 'Movers', target: 'Paid by savings', value: 1200 },
    { source: 'Movers', target: 'Paid by loan', value: 600 },
    { source: 'Van and fuel', target: 'Paid by savings', value: 420 },
    { source: 'Cleaning', target: 'Paid by savings', value: 380 },
    { source: 'Deposit buffer', target: 'Paid by savings', value: 1000 },
    { source: 'Pet transport', target: 'Paid by loan', value: 200 },
  ],
};

function SankeyDemo() {
  return (
    <div className="b3-chart-box">
      <ResponsiveSankey
        data={SANKEY}
        margin={{ top: 8, right: 120, bottom: 8, left: 8 }}
        align="justify"
        colors={{ scheme: 'category10' }}
        nodeOpacity={1}
        nodeThickness={14}
        nodeInnerPadding={3}
        linkOpacity={0.4}
        enableLinkGradient
        labelTextColor="currentColor"
      />
    </div>
  );
}

/* C112 Nivo Treemap (cost categories in the risk report) */
const COST_TREE = {
  name: 'Move costs',
  children: [
    { name: 'Movers', value: 1800 },
    { name: 'Van and fuel', value: 420 },
    { name: 'Cleaning', value: 380 },
    { name: 'Deposit buffer', value: 1000 },
    { name: 'Pet transport', value: 200 },
    { name: 'Parking permit', value: 90 },
  ],
};

function TreemapDemo() {
  return (
    <div className="b3-chart-box">
      <ResponsiveTreeMap
        data={COST_TREE}
        identity="name"
        value="value"
        valueFormat={(v) => `${Number(v).toLocaleString('fi-FI')} €`}
        margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
        labelSkipSize={36}
        colors={{ scheme: 'blues' }}
        parentLabelPosition="left"
        borderWidth={2}
        borderColor="var(--surface)"
        labelTextColor="#ffffff"
      />
    </div>
  );
}

export function ChartsGroup() {
  return (
    <>
      <Demo id="C108" title="Risk choropleth by municipality" lib="react-simple-maps">
        <MunicipalityMap />
      </Demo>
      <Demo id="C109" title="Week view of move tasks" lib="react-big-calendar">
        <CalendarDemo />
      </Demo>
      <Demo id="C110" title="Moving budget donut" lib="@visx/shape">
        <VisxDonutDemo />
      </Demo>
      <Demo id="C111" title="Budget flow" lib="@nivo/sankey">
        <SankeyDemo />
      </Demo>
      <Demo id="C112" title="Cost categories treemap" lib="@nivo/treemap">
        <TreemapDemo />
      </Demo>
    </>
  );
}
