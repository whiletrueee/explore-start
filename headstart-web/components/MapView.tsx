'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import type { Gem } from '@/lib/types';
import { meta } from '@/lib/catalog';

interface Props {
  gems: Gem[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  center: [number, number];
  zoom: number;
  active?: boolean | string;
  tiles?: 'minimal' | 'voyager' | 'dark';
}

// Imperative Leaflet wrapper (client-only). Mirrors the prototype MapView behavior:
// divIcon pins, click-to-select, pan/fly on selection + scope change, invalidateSize.
export default function MapView({ gems, selectedId, onSelect, center, zoom, active = true, tiles = 'minimal' }: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Record<string, any>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef = useRef<any>(null);

  const buildMarkers = () => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    Object.values(markersRef.current).forEach((mk) => map.removeLayer(mk));
    markersRef.current = {};
    gems.forEach((g) => {
      if (g.lat == null || g.lng == null) return;
      const m = meta(g);
      const icon = L.divIcon({
        className: '',
        html: `<div class="pin" style="border-color:${m.color}"><div class="pin-dot">${m.emoji}</div></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 26],
      });
      const mk = L.marker([g.lat, g.lng], { icon }).addTo(map);
      mk.on('click', () => onSelect && onSelect(g.id));
      markersRef.current[g.id] = mk;
    });
  };

  const reflectSelection = () => {
    const map = mapRef.current;
    if (!map) return;
    Object.entries(markersRef.current).forEach(([id, mk]) => {
      const el = mk.getElement() && mk.getElement().querySelector('.pin');
      if (el) el.classList.toggle('active', id === selectedId);
    });
    if (selectedId && markersRef.current[selectedId]) {
      map.panTo(markersRef.current[selectedId].getLatLng(), { animate: true });
    }
  };

  // init once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (mapRef.current || !elRef.current) return;
      const L = (await import('leaflet')).default;
      if (cancelled || !elRef.current || mapRef.current) return;
      LRef.current = L;
      const map = L.map(elRef.current, { zoomControl: false, attributionControl: false }).setView(center, zoom);
      const TILE: Record<string, string> = {
        dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        minimal: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      };
      L.tileLayer(TILE[tiles] || TILE.voyager, { maxZoom: 19 }).addTo(map);
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapRef.current = map;
      buildMarkers();
      reflectSelection();
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { buildMarkers(); reflectSelection(); }, [gems]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reflectSelection(); }, [selectedId]);
  useEffect(() => {
    const map = mapRef.current;
    if (map && center) map.flyTo(center, zoom, { duration: 0.55 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center?.[0], center?.[1], zoom]);
  useEffect(() => {
    if (mapRef.current) setTimeout(() => mapRef.current && mapRef.current.invalidateSize(), 60);
  }, [active]);

  return <div className="map" ref={elRef} />;
}
