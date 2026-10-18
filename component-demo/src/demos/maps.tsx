import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, useScroll, useSpring, useTransform } from 'motion/react';
import { Tab, TabList, TabPanel, Tabs } from 'react-aria-components';
import {
  Armchair,
  Car,
  CircleCheck,
  Home,
  Package,
  ShieldCheck,
  Truck,
  Wifi,
  Zap,
} from 'lucide-react';
import { Demo } from '../components/Demo';

/* C55 Route / map preview (leaflet used directly). OSM tiles need network. */
const FROM: [number, number] = [60.1699, 24.9384];
const TO: [number, number] = [60.2055, 24.6559];

function RouteMapDemo() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return undefined;
    const map = L.map(ref.current, { scrollWheelZoom: false }).fitBounds([FROM, TO], { padding: [30, 30] });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    L.polyline([FROM, [60.185, 24.8], TO], { color: '#1557e8', weight: 4 }).addTo(map);
    L.circleMarker(FROM, { radius: 7, color: '#1557e8', fillColor: '#fff', fillOpacity: 1 }).bindTooltip('From').addTo(map);
    L.circleMarker(TO, { radius: 7, color: '#e0402f', fillColor: '#fff', fillOpacity: 1 }).bindTooltip('To').addTo(map);
    return () => {
      map.remove();
    };
  }, []);
  return <div ref={ref} className="route-map" role="region" aria-label="Route preview" />;
}

/* C56 Icon set (lucide-react) */
function IconsDemo() {
  const items = [
    { Icon: Truck, label: 'Movers' },
    { Icon: Home, label: 'Home' },
    { Icon: ShieldCheck, label: 'Cover' },
    { Icon: Package, label: 'Boxes' },
    { Icon: Zap, label: 'Electricity' },
    { Icon: Wifi, label: 'Internet' },
    { Icon: Car, label: 'Parking' },
    { Icon: Armchair, label: 'Furniture' },
    { Icon: CircleCheck, label: 'Done' },
  ];
  return (
    <ul className="icon-grid">
      {items.map(({ Icon, label }) => (
        <li key={label}>
          <Icon size={24} aria-hidden="true" />
          <span>{label}</span>
        </li>
      ))}
    </ul>
  );
}

/* C57 Animated tabs (react-aria Tabs + motion layoutId pill) */
const TABS = ['Overview', 'Checklist', 'Coverage'];

function TabsDemo() {
  return (
    <Tabs className="tabs">
      <TabList aria-label="Plan views" className="tabs__list">
        {TABS.map((name) => (
          <Tab key={name} id={name} className="tabs__tab">
            {({ isSelected }) => (
              <>
                {isSelected && <motion.span layoutId="tab-pill" className="tabs__pill" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
                <span className="tabs__label">{name}</span>
              </>
            )}
          </Tab>
        ))}
      </TabList>
      {TABS.map((name) => (
        <TabPanel key={name} id={name} className="tabs__panel">
          {name} content goes here.
        </TabPanel>
      ))}
    </Tabs>
  );
}

/* C58 Page transition */
function PageTransitionDemo() {
  const [view, setView] = useState<'a' | 'b'>('a');
  return (
    <>
      <div className="row" style={{ overflow: 'hidden' }}>
        <motion.div
          key={view}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="card"
          style={{ flex: 1 }}
        >
          <strong>{view === 'a' ? 'Step A: pick a home' : 'Step B: book movers'}</strong>
          <span>Slides in on each change.</span>
        </motion.div>
      </div>
      <button className="btn" onClick={() => setView((v) => (v === 'a' ? 'b' : 'a'))}>Switch view</button>
    </>
  );
}

/* C59 Scroll-driven effects: progress bar and parallax tied to a scroll container */
function ScrollDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: ref });
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  const shift = useTransform(scrollYProgress, [0, 1], [0, -60]);
  return (
    <div className="scroll-box" ref={ref}>
      <motion.div className="scroll-box__bar" style={{ scaleX, transformOrigin: '0 50%' }} />
      <motion.div className="scroll-box__hero" style={{ y: shift }}>
        Scroll inside this box
      </motion.div>
      {Array.from({ length: 8 }, (_, i) => (
        <p key={i} className="scroll-box__para">
          Paragraph {i + 1}. The bar and hero respond to scroll position.
        </p>
      ))}
    </div>
  );
}

export function MapsGroup() {
  return (
    <>
      <Demo id="C55" title="Route / map preview" lib="leaflet (BSD-2), OSM tiles need network">
        <RouteMapDemo />
      </Demo>
      <Demo id="C56" title="Icon set" lib="lucide-react">
        <IconsDemo />
      </Demo>
      <Demo id="C57" title="Animated tabs" lib="react-aria-components Tabs + motion layoutId">
        <TabsDemo />
      </Demo>
      <Demo id="C58" title="Page transition" lib="motion">
        <PageTransitionDemo />
      </Demo>
      <Demo id="C59" title="Scroll-driven effects" lib="motion useScroll + useTransform">
        <ScrollDemo />
      </Demo>
    </>
  );
}
