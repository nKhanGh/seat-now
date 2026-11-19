import { useEffect, useRef, useState } from 'react';
import { Map, Marker, NavigationControl, setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { VenueMapItem } from '../services/map.service';
import { ParkingFacilityItem } from '../../parking/services/parking.service';

setWorkerUrl(workerUrl);

type Props = {
  lat: number;
  lng: number;
  venues: VenueMapItem[];
  userLocation: { lat: number; lng: number; accuracyM: number } | null;
  selectedId: string | null;
  selectionSerial: number;
  parkingFacilities: ParkingFacilityItem[];
  selectedParkingSlug: string | null;
  onCenterChange: (lat: number, lng: number) => void;
  onSelect: (id: string) => void;
  onSelectParking: (slug: string) => void;
};

export function VenueMap({
  lat,
  lng,
  venues,
  userLocation,
  selectedId,
  selectionSerial,
  parkingFacilities,
  selectedParkingSlug,
  onCenterChange,
  onSelect,
  onSelectParking,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const markers = useRef<Marker[]>([]);
  const locationMarker = useRef<Marker | null>(null);
  const lastSelectionSerial = useRef(0);
  const [mapError, setMapError] = useState<string | null>(null);
  const onCenterChangeRef = useRef(onCenterChange);
  onCenterChangeRef.current = onCenterChange;

  useEffect(() => {
    if (!container.current) return;
    const configuredStyle: unknown = import.meta.env.VITE_MAP_STYLE_URL as unknown;
    const instance = new Map({
      container: container.current,
      style:
        typeof configuredStyle === 'string' && configuredStyle
          ? configuredStyle
          : 'https://tiles.openfreemap.org/styles/liberty',
      center: [lng, lat],
      zoom: 13,
    });
    instance.on('error', (event) => {
      const mapError: unknown = event.error;
      setMapError(mapError instanceof Error ? mapError.message : 'Không tải được bản đồ nền.');
    });
    instance.on('load', () => setMapError(null));
    instance.addControl(new NavigationControl(), 'top-right');
    instance.on('moveend', () => {
      const center = instance.getCenter();
      onCenterChangeRef.current(Number(center.lat.toFixed(5)), Number(center.lng.toFixed(5)));
    });
    map.current = instance;
    return () => {
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];
      locationMarker.current?.remove();
      instance.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;
    const center = map.current.getCenter();
    if (Math.abs(center.lat - lat) > 0.0002 || Math.abs(center.lng - lng) > 0.0002)
      map.current.flyTo({ center: [lng, lat] });
  }, [lat, lng]);

  useEffect(() => {
    if (selectionSerial === lastSelectionSerial.current) return;
    lastSelectionSerial.current = selectionSerial;
    const selected = venues.find((venue) => venue.id === selectedId);
    if (!selected || !map.current) return;
    const [selectedLng, selectedLat] = selected.location.coordinates;
    const center = map.current.getCenter();
    if (Math.abs(center.lat - selectedLat) > 0.0005 || Math.abs(center.lng - selectedLng) > 0.0005) {
      map.current.flyTo({ center: [selectedLng, selectedLat], zoom: Math.max(map.current.getZoom(), 14) });
    }
  }, [selectedId, selectionSerial, venues]);

  useEffect(() => {
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];
    if (!map.current) return;
    for (const venue of venues) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `venue-pin${venue.id === selectedId ? ' selected' : ''}${venue.promotion?.sponsored ? ' sponsored' : ''}`;
      if (venue.logoUrl) {
        const logo = document.createElement('img');
        logo.src = venue.logoUrl;
        logo.alt = '';
        logo.className = 'venue-pin-logo';
        button.appendChild(logo);
      } else button.textContent = venue.category === 'CAFE' ? '☕' : venue.category === 'CINEMA' ? '🎬' : '🍽';
      button.setAttribute('aria-label', venue.name);
      button.addEventListener('click', () => onSelect(venue.id));
      markers.current.push(
        new Marker({ element: button }).setLngLat(venue.location.coordinates).addTo(map.current),
      );
    }
    for (const facility of parkingFacilities) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `parking-pin${facility.slug === selectedParkingSlug ? ' selected' : ''}`;
      button.textContent = 'P';
      button.setAttribute('aria-label', `Bãi đỗ xe ${facility.name}`);
      button.addEventListener('click', () => onSelectParking(facility.slug));
      markers.current.push(
        new Marker({ element: button }).setLngLat(facility.location.coordinates).addTo(map.current),
      );
    }
  }, [venues, selectedId, onSelect, parkingFacilities, selectedParkingSlug, onSelectParking]);

  useEffect(() => {
    locationMarker.current?.remove();
    locationMarker.current = null;
    if (!map.current || !userLocation) return;
    const dot = document.createElement('div');
    dot.className = 'user-location-dot';
    dot.setAttribute('role', 'img');
    dot.setAttribute('aria-label', 'Vị trí của tôi');
    dot.title = `Vị trí của tôi · chính xác khoảng ${Math.round(userLocation.accuracyM)} m`;
    locationMarker.current = new Marker({ element: dot, anchor: 'center' })
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map.current);
    return () => {
      locationMarker.current?.remove();
      locationMarker.current = null;
    };
  }, [userLocation]);

  return (
    <>
      <div ref={container} className="venue-map" aria-label="Bản đồ địa điểm" />
      {mapError && (
        <div className="map-error" role="alert">
          Bản đồ nền chưa tải được. Danh sách địa điểm vẫn dùng được. <small>{mapError}</small>
        </div>
      )}
    </>
  );
}
