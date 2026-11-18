import { useEffect, useRef, useState } from 'react';
import { Map, Marker, NavigationControl, setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { VenueMapItem } from '../services/map.service';

setWorkerUrl(workerUrl);

type Props = {
  lat: number;
  lng: number;
  venues: VenueMapItem[];
  selectedId: string | null;
  onCenterChange: (lat: number, lng: number) => void;
  onSelect: (id: string) => void;
};

export function VenueMap({ lat, lng, venues, selectedId, onCenterChange, onSelect }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const markers = useRef<Marker[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const onCenterChangeRef = useRef(onCenterChange);
  onCenterChangeRef.current = onCenterChange;

  useEffect(() => {
    if (!container.current) return;
    const instance = new Map({
      container: container.current,
      style: import.meta.env.VITE_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty',
      center: [lng, lat], zoom: 13,
    });
    instance.on('error', (event) => {
      setMapError(event.error instanceof Error ? event.error.message : 'Không tải được bản đồ nền.');
    });
    instance.on('load', () => setMapError(null));
    instance.addControl(new NavigationControl(), 'top-right');
    instance.on('moveend', () => {
      const center = instance.getCenter();
      onCenterChangeRef.current(Number(center.lat.toFixed(5)), Number(center.lng.toFixed(5)));
    });
    map.current = instance;
    return () => { markers.current.forEach((marker) => marker.remove()); markers.current = []; instance.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    if (!map.current) return;
    const center = map.current.getCenter();
    if (Math.abs(center.lat - lat) > 0.0002 || Math.abs(center.lng - lng) > 0.0002) map.current.flyTo({ center: [lng, lat] });
  }, [lat, lng]);

  useEffect(() => {
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];
    if (!map.current) return;
    for (const venue of venues) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `venue-pin${venue.id === selectedId ? ' selected' : ''}`;
      button.textContent = venue.category === 'CAFE' ? '☕' : venue.category === 'CINEMA' ? '🎬' : '🍽';
      button.setAttribute('aria-label', venue.name);
      button.addEventListener('click', () => onSelect(venue.id));
      markers.current.push(new Marker({ element: button }).setLngLat(venue.location.coordinates).addTo(map.current));
    }
  }, [venues, selectedId, onSelect]);

  return <>
    <div ref={container} className="venue-map" aria-label="Bản đồ địa điểm" />
    {mapError && <div className="map-error" role="alert">Bản đồ nền chưa tải được. Danh sách địa điểm vẫn dùng được. <small>{mapError}</small></div>}
  </>;
}
