import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import './RouteMap.css';

type Point = [number, number];

type RouteMapProps = {
  /** [lat, lon] of the new address. */
  to: Point;
  /** [lat, lon] of the old address, when known. */
  from?: Point;
  /** The road between them; a straight line when left out. */
  path?: Point[];
  label: string;
};

/** C55: the move on an OpenStreetMap map, from the old address to the new one. */
export function RouteMap({ to, from, path, label }: RouteMapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const key = JSON.stringify([to, from, path]);

  useEffect(() => {
    if (!ref.current) return undefined;
    const [toPoint, fromPoint, line] = JSON.parse(key) as [Point, Point?, Point[]?];
    const map = L.map(ref.current, { scrollWheelZoom: false, attributionControl: true });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const end = L.circleMarker(toPoint, {
      radius: 8,
      color: '#1557e8',
      weight: 3,
      fillColor: '#1557e8',
      fillOpacity: 1,
    })
      .bindTooltip('New home')
      .addTo(map);

    if (fromPoint) {
      const route = L.polyline(line && line.length > 1 ? line : [fromPoint, toPoint], {
        color: '#1557e8',
        weight: 4,
        opacity: 0.85,
        dashArray: line && line.length > 2 ? undefined : '6 8',
      }).addTo(map);
      L.circleMarker(fromPoint, {
        radius: 7,
        color: '#1557e8',
        weight: 3,
        fillColor: '#ffffff',
        fillOpacity: 1,
      })
        .bindTooltip('Current home')
        .addTo(map);
      map.fitBounds(route.getBounds(), { padding: [28, 28] });
    } else {
      map.setView(end.getLatLng(), 14);
    }

    return () => {
      map.remove();
    };
  }, [key]);

  return <div ref={ref} className="route-map" role="img" aria-label={label} />;
}
