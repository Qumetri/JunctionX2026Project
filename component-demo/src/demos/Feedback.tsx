import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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

/* Toast: sonner. The <Toaster /> lives in App. */
export function Toasts() {
  return (
    <div className="row">
      <button className="btn" onClick={() => toast.success('Movers booked for 14 March')}>
        Success toast
      </button>
      <button
        className="btn"
        onClick={() =>
          toast('Electricity switch saved', {
            description: 'We will confirm the start date by email.',
            action: { label: 'Undo', onClick: () => toast.info('Undone') },
          })
        }
      >
        Toast with action
      </button>
      <button className="btn" onClick={() => toast.error('Could not reach the quote service')}>
        Error toast
      </button>
    </div>
  );
}

/* Skeleton: plain CSS shimmer (see .skeleton in index.css). */
export function Skeleton() {
  const [loading, setLoading] = useState(true);
  return (
    <>
      <div className="card" aria-busy={loading}>
        {loading ? (
          <>
            <div className="skeleton skeleton--title" />
            <div className="skeleton skeleton--line" />
            <div className="skeleton skeleton--line skeleton--short" />
          </>
        ) : (
          <>
            <strong>3-bedroom flat, Helsinki</strong>
            <span>Contents cover from 24 EUR a month. Ready to review.</span>
          </>
        )}
      </div>
      <button className="btn" onClick={() => setLoading((v) => !v)}>
        {loading ? 'Show loaded content' : 'Show skeleton'}
      </button>
    </>
  );
}

/* File drop: react-dropzone. */
export function FileDrop() {
  const [files, setFiles] = useState<string[]>([]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg'] },
    onDrop: (accepted) => setFiles((f) => [...f, ...accepted.map((x) => x.name)]),
  });
  return (
    <div>
      <div {...getRootProps({ className: `dropzone${isDragActive ? ' is-active' : ''}` })}>
        <input {...getInputProps()} />
        <p>{isDragActive ? 'Drop to upload' : 'Drag a lease or photo here, or click to choose'}</p>
        <small>PDF, PNG or JPG</small>
      </div>
      {files.length > 0 && (
        <ul className="file-list">
          {files.map((name, i) => (
            <li key={`${name}-${i}`}>{name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* Route / map preview: leaflet (BSD-2) used directly, no React wrapper. Tiles need network. */
const FROM: [number, number] = [60.1699, 24.9384]; // Helsinki
const TO: [number, number] = [60.2055, 24.6559]; // Espoo

export function RouteMap() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return undefined;
    const map = L.map(ref.current, { scrollWheelZoom: false }).fitBounds([FROM, TO], { padding: [30, 30] });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    L.polyline([FROM, [60.185, 24.8], TO], { color: '#1557e8', weight: 4 }).addTo(map);
    L.circleMarker(FROM, { radius: 7, color: '#1557e8', fillColor: '#fff', fillOpacity: 1 }).bindTooltip('From').addTo(map);
    L.circleMarker(TO, { radius: 7, color: '#e0402f', fillColor: '#fff', fillOpacity: 1 }).bindTooltip('To').addTo(map);
    return () => {
      map.remove();
    };
  }, []);
  return <div ref={ref} className="route-map" role="region" aria-label="Route preview" />;
}

/* Icon set: lucide-react, tree-shaken named imports. */
export function Icons() {
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
