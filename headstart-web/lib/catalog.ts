import type { Gem } from './types';

// v2 creator-pack category vocabulary (from the Field Atlas).
export const CATV2: Record<string, { color: string; label: string; glyph: string }> = {
  eat: { color: '#F2542D', label: 'Eat', glyph: '🍽' },
  drink: { color: '#D98324', label: 'Drink', glyph: '🍸' },
  stay: { color: '#7A4FA3', label: 'Stay', glyph: '🛏' },
  'see-do': { color: '#2D6A8E', label: 'See & do', glyph: '✦' },
  shop: { color: '#C0398A', label: 'Shop', glyph: '🛍' },
  view: { color: '#1F8A70', label: 'View', glyph: '👁' },
  nature: { color: '#2E7D32', label: 'Nature', glyph: '🌿' },
  plan: { color: '#3A6EA5', label: 'Good to know', glyph: '💡' },
  itinerary: { color: '#B5651D', label: 'Itinerary', glyph: '🗺' },
  list: { color: '#6B7280', label: 'List', glyph: '📋' },
};

export const catV2 = (item: { category?: string }) => CATV2[item.category ?? ''] ?? CATV2.list;

export const isMappedV2 = (i: { lat?: number | null; lng?: number | null }) =>
  typeof i.lat === 'number' && typeof i.lng === 'number';

export const mapsLink = (q?: string | null) =>
  'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q || '');

// pin metadata for the map (color + glyph)
export const meta = (g: Gem) => {
  const v = catV2(g);
  return { color: v.color, emoji: v.glyph, label: v.label };
};

// categories that count as mappable "gems" (vs tips/lists/itineraries)
export const GRID = ['eat', 'drink', 'stay', 'see-do', 'shop', 'view', 'nature'];
