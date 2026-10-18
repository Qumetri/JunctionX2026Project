import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import type { PetPlace } from '../api/report';
import './RouteMap.css';

type PetMapProps = {
  center: { lat: number; lon: number; label: string };
  places: PetPlace[];
  /** The place picked in the list: the map pans to it and shows its name. */
  selectedId?: string;
  label: string;
};

const style = {
  'dog-park': { color: '#1557e8', fillColor: '#1557e8', fillOpacity: 1, radius: 7 },
  vet: { color: '#1557e8', fillColor: '#ffffff', fillOpacity: 1, radius: 7 },
};

/** Dog parks (filled dots) and vets (rings) around the search point on an OpenStreetMap map. */
export function PetMap({ center, places, selectedId, label }: PetMapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef(new Map<string, L.CircleMarker>());

  useEffect(() => {
    if (!ref.current) return undefined;
    const map = L.map(ref.current, { scrollWheelZoom: false });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;
    const layer = L.layerGroup().addTo(map);
    const markers = markersRef.current;
    markers.clear();

    const home = L.circleMarker([center.lat, center.lon], {
      radius: 9,
      color: '#0a1e4a',
      weight: 3,
      fillColor: '#0a1e4a',
      fillOpacity: 1,
    })
      .bindTooltip(center.label)
      .addTo(layer);

    for (const place of places) {
      const marker = L.circleMarker([place.lat, place.lon], { weight: 3, ...style[place.kind] })
        .bindTooltip(place.name)
        .addTo(layer);
      markers.set(place.id, marker);
    }

    const points = [home.getLatLng(), ...places.map((place) => L.latLng(place.lat, place.lon))];
    if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [32, 32] });
    else map.setView(home.getLatLng(), 14);

    return () => {
      layer.remove();
    };
  }, [center.lat, center.lon, center.label, places]);

  useEffect(() => {
    const marker = selectedId ? markersRef.current.get(selectedId) : undefined;
    if (!marker || !mapRef.current) return;
    mapRef.current.panTo(marker.getLatLng());
    marker.openTooltip();
  }, [selectedId, places]);

  return <div ref={ref} className="route-map pet-map" role="img" aria-label={label} />;
}
