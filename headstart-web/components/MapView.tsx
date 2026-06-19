'use client';

import { useEffect, type CSSProperties } from 'react';
import { Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import type { Gem } from '@/lib/types';
import { meta } from '@/lib/catalog';

// 'DEMO_MAP_ID' lets AdvancedMarkers work in development without creating a Map ID.
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';
const HAS_KEY = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface Props {
  gems: Gem[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  center: [number, number];
  zoom: number;
  active?: boolean | string;
  tiles?: string;
  path?: [number, number][]; // ordered route to draw (itinerary point-to-point) + fit bounds
  numbered?: boolean; // show ordered numbered markers (itinerary stops) instead of category pins
}

const ROUTE_COLOR = '#8000ff';

// Itinerary route: a soft halo line + a dotted overlay, fit to bounds. Reads as a walking path.
function Route({ path }: { path: [number, number][] }) {
  const map = useMap();
  const maps = useMapsLibrary('maps');
  useEffect(() => {
    if (!map || !maps || !path || path.length < 1) return;
    const pts = path.map(([lat, lng]) => ({ lat, lng }));
    const halo = new maps.Polyline({ path: pts, geodesic: true, strokeColor: ROUTE_COLOR, strokeOpacity: 0.2, strokeWeight: 7 });
    const dotted = new maps.Polyline({
      path: pts,
      geodesic: true,
      strokeOpacity: 0,
      icons: [
        {
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 3.2, fillColor: ROUTE_COLOR, fillOpacity: 1, strokeColor: '#fff', strokeWeight: 1.4 },
          offset: '0',
          repeat: '15px',
        },
      ],
    });
    halo.setMap(map);
    dotted.setMap(map);
    if (pts.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      pts.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds, 60);
    }
    return () => {
      halo.setMap(null);
      dotted.setMap(null);
    };
  }, [map, maps, path]);
  return null;
}

// Imperatively pan/zoom the camera when center/zoom or the selection changes
// (mirrors the old Leaflet flyTo/panTo behavior).
function Camera({ center, zoom, selectedId, gems }: Pick<Props, 'center' | 'zoom' | 'selectedId' | 'gems'>) {
  const map = useMap();
  useEffect(() => {
    if (map && center) map.panTo({ lat: center[0], lng: center[1] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, center?.[0], center?.[1]]);
  useEffect(() => {
    if (map) map.setZoom(zoom);
  }, [map, zoom]);
  useEffect(() => {
    if (!map || !selectedId) return;
    const g = gems.find((x) => x.id === selectedId);
    if (g && g.lat != null && g.lng != null) map.panTo({ lat: g.lat, lng: g.lng });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selectedId]);
  return null;
}

export default function MapView({ gems, selectedId, onSelect, center, zoom, path, numbered }: Props) {
  if (!HAS_KEY) {
    return (
      <div className="map map-noapi">
        <span>Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local to enable the map</span>
      </div>
    );
  }
  return (
    <Map
      className="map"
      mapId={MAP_ID}
      defaultCenter={{ lat: center[0], lng: center[1] }}
      defaultZoom={zoom}
      gestureHandling="greedy"
      disableDefaultUI
      zoomControl
      clickableIcons={false}
    >
      {path && path.length ? <Route path={path} /> : <Camera center={center} zoom={zoom} selectedId={selectedId} gems={gems} />}
      {gems.map((g, i) => {
        if (g.lat == null || g.lng == null) return null;
        const m = meta(g);
        const on = g.id === selectedId;
        return (
          <AdvancedMarker key={`${g.id}-${i}`} position={{ lat: g.lat, lng: g.lng }} onClick={() => onSelect && onSelect(g.id)}>
            {numbered ? (
              <div className={'pinnum' + (on ? ' active' : '')}>{i + 1}</div>
            ) : (
              <div className={'pinm' + (on ? ' active' : '')} style={{ ['--pc']: m.color } as CSSProperties}>
                <svg viewBox="0 0 24 32" width="22" height="29" aria-hidden="true">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 8.4 12 20 12 20s12-11.6 12-20C24 5.37 18.63 0 12 0z" fill={m.color} stroke="#fff" strokeWidth="2" />
                  <circle cx="12" cy="12" r="3.6" fill="#fff" />
                </svg>
              </div>
            )}
          </AdvancedMarker>
        );
      })}
    </Map>
  );
}
