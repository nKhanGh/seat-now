import { useEffect, useRef, useState } from 'react';
import { Map, Marker, NavigationControl, setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';

setWorkerUrl(workerUrl);

type Props = { lat: number; lng: number; onChange: (lat: number, lng: number) => void };

export function ProposalLocationPicker({ lat, lng, onChange }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const marker = useRef<Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const [mapError, setMapError] = useState(false);
  onChangeRef.current = onChange;

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
      zoom: 15,
    });
    const pin = document.createElement('div');
    pin.className = 'proposal-location-pin';
    pin.setAttribute('role', 'img');
    pin.setAttribute('aria-label', 'Vị trí quán đề xuất');
    const selected = new Marker({ element: pin, draggable: true }).setLngLat([lng, lat]).addTo(instance);
    const choose = (nextLat: number, nextLng: number) =>
      onChangeRef.current(Number(nextLat.toFixed(6)), Number(nextLng.toFixed(6)));
    instance.on('click', (event) => choose(event.lngLat.lat, event.lngLat.lng));
    selected.on('dragend', () => {
      const point = selected.getLngLat();
      choose(point.lat, point.lng);
    });
    instance.on('error', () => setMapError(true));
    instance.on('load', () => setMapError(false));
    instance.addControl(new NavigationControl(), 'top-right');
    map.current = instance;
    marker.current = selected;
    return () => {
      selected.remove();
      instance.remove();
      map.current = null;
      marker.current = null;
    };
  }, []);

  useEffect(() => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180)
      return;
    marker.current?.setLngLat([lng, lat]);
    const center = map.current?.getCenter();
    if (center && (Math.abs(center.lat - lat) > 0.001 || Math.abs(center.lng - lng) > 0.001))
      map.current?.flyTo({ center: [lng, lat] });
  }, [lat, lng]);

  return (
    <div className="proposal-map-wrap">
      <p className="small">
        Bấm bản đồ hoặc kéo ghim để chọn đúng vị trí quán. Có thể chỉnh lại tọa độ bên dưới.
      </p>
      <div ref={container} className="proposal-map" aria-label="Chọn vị trí quán trên bản đồ" />
      {mapError && <p role="alert">Không tải được bản đồ nền. Bạn vẫn có thể nhập tọa độ bên dưới.</p>}
    </div>
  );
}
