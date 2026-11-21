import { useEffect, useRef, useState } from 'react';
import { GeoJSONSource, Map, Marker, NavigationControl, setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { VenueMapItem } from '../services/map.service';
import { ParkingFacilityItem } from '../../parking/services/parking.service';

setWorkerUrl(workerUrl);

const venueSource = 'seatnow-venue-points';
const clusterLayer = 'seatnow-venue-clusters';
const singleLayer = 'seatnow-venue-singles';

function venueFeatures(venues: VenueMapItem[]) {
  return {
    type: 'FeatureCollection' as const,
    features: venues.map((venue) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: venue.location.coordinates },
      properties: { id: venue.id, category: venue.category },
    })),
  };
}

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
  const [zoom, setZoom] = useState(13);
  const onCenterChangeRef = useRef(onCenterChange);
  const onSelectRef = useRef(onSelect);
  const venuesRef = useRef(venues);
  onCenterChangeRef.current = onCenterChange;
  onSelectRef.current = onSelect;
  venuesRef.current = venues;

  useEffect(() => {
    if (!container.current) return;
    const mapContainer = container.current;
    const configuredStyle: unknown = import.meta.env.VITE_MAP_STYLE_URL as unknown;
    const instance = new Map({
      container: mapContainer,
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
    instance.on('load', () => {
      setMapError(null);
      instance.addSource(venueSource, {
        type: 'geojson',
        data: venueFeatures(venuesRef.current),
        cluster: true,
        clusterRadius: 54,
        clusterMaxZoom: 13,
      });
      instance.addLayer({
        id: clusterLayer,
        type: 'circle',
        source: venueSource,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#17654d',
          'circle-radius': ['step', ['get', 'point_count'], 20, 10, 26, 40, 32],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 3,
        },
      });
      instance.addLayer({
        id: `${clusterLayer}-count`,
        type: 'symbol',
        source: venueSource,
        filter: ['has', 'point_count'],
        layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 13 },
        paint: { 'text-color': '#ffffff' },
      });
      instance.addLayer({
        id: singleLayer,
        type: 'circle',
        source: venueSource,
        maxzoom: 14,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['match', ['get', 'category'], 'CAFE', '#17654d', 'CINEMA', '#6751a4', '#b45736'],
          'circle-radius': 13,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      });
      instance.on('click', clusterLayer, (event) => {
        const feature = event.features?.[0];
        const id = feature?.properties?.cluster_id as number | undefined;
        if (id === undefined) return;
        const source = instance.getSource<GeoJSONSource>(venueSource);
        void source?.getClusterExpansionZoom(id).then(
          (nextZoom) => instance.easeTo({ center: event.lngLat, zoom: nextZoom }),
          () => undefined,
        );
      });
      instance.on('click', singleLayer, (event) => {
        const id = event.features?.[0]?.properties?.id as string | undefined;
        if (id) onSelectRef.current(id);
      });
      for (const layer of [clusterLayer, singleLayer]) {
        instance.on('mouseenter', layer, () => (instance.getCanvas().style.cursor = 'pointer'));
        instance.on('mouseleave', layer, () => (instance.getCanvas().style.cursor = ''));
      }
    });
    instance.addControl(new NavigationControl(), 'top-right');
    let disposed = false;
    const handleMoveEnd = () => {
      if (disposed) return;
      const center = instance.getCenter();
      onCenterChangeRef.current(Number(center.lat.toFixed(5)), Number(center.lng.toFixed(5)));
    };
    instance.on('moveend', handleMoveEnd);
    instance.on('zoomend', () => setZoom(instance.getZoom()));
    const resizeObserver = new ResizeObserver(() => instance.resize());
    resizeObserver.observe(mapContainer);
    map.current = instance;
    return () => {
      disposed = true;
      resizeObserver.disconnect();
      instance.off('moveend', handleMoveEnd);
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
    const selected = venues.find((venue) => venue.id === selectedId);
    if (!selected || !map.current) return;
    lastSelectionSerial.current = selectionSerial;
    const [selectedLng, selectedLat] = selected.location.coordinates;
    const center = map.current.getCenter();
    if (Math.abs(center.lat - selectedLat) > 0.0005 || Math.abs(center.lng - selectedLng) > 0.0005) {
      map.current.flyTo({ center: [selectedLng, selectedLat], zoom: Math.max(map.current.getZoom(), 14) });
    }
  }, [selectedId, selectionSerial, venues]);

  useEffect(() => {
    const source = map.current?.getSource<GeoJSONSource>(venueSource);
    void source?.setData(venueFeatures(venues));
  }, [venues]);

  useEffect(() => {
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];
    if (!map.current) return;
    for (const venue of venues) {
      if (zoom < 14 && venue.id !== selectedId) continue;
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
  }, [venues, selectedId, onSelect, parkingFacilities, selectedParkingSlug, onSelectParking, zoom]);

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
