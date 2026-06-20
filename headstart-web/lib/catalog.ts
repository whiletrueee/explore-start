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

// Normalize image refs: remote URLs pass through; local "data/img/..." paths become
// absolute so they resolve on nested routes (e.g. /c/[handle]/[city]).
export const mediaSrc = (u?: string | null): string | null => {
  if (!u) return null;
  if (/^https?:\/\//.test(u)) return u;
  // /api/... is served by headstart-admin — prefix with its origin so it resolves cross-domain.
  if (u.startsWith('/api/')) return absoluteAdmin(u);
  if (u.startsWith('/')) return u;
  return '/' + u.replace(/^\.?\//, '');
};

// headstart-admin origin (strip trailing /api from NEXT_PUBLIC_API_BASE).
// Used to absolute-ize root-relative proxy URLs like /api/places/photo?ref=...
const ADMIN_ORIGIN = (() => {
  const base = process.env.NEXT_PUBLIC_API_BASE || '';
  if (!base) return '';
  return base.replace(/\/api\/?$/, '');
})();

const absoluteAdmin = (u: string): string => {
  if (/^https?:\/\//.test(u)) return u;
  if (u.startsWith('/') && ADMIN_ORIGIN) return ADMIN_ORIGIN + u;
  return u;
};

export interface GemImage {
  url: string;
  thumb?: string;
  w?: number;
  h?: number;
  attribution?: string[];
}

// Pick the best image for a gem-like item. Prefers Google Places photos
// enriched into master-json (item.images[]), falls back to legacy media_url.
export const imageSrc = (
  item: { images?: GemImage[]; media_url?: string | null },
  variant: 'full' | 'thumb' = 'full',
): string | null => {
  const first = item.images?.[0];
  if (first) {
    const u = variant === 'thumb' ? first.thumb || first.url : first.url;
    return absoluteAdmin(u);
  }
  return mediaSrc(item.media_url);
};

// HTML attribution snippet(s) Google requires us to show alongside Places photos.
export const imageAttribution = (item: { images?: GemImage[] }): string[] =>
  item.images?.[0]?.attribution || [];

// pin metadata for the map (color + glyph)
export const meta = (g: Gem) => {
  const v = catV2(g);
  return { color: v.color, emoji: v.glyph, label: v.label };
};

// categories that count as mappable "gems" (vs tips/lists/itineraries)
export const GRID = ['eat', 'drink', 'stay', 'see-do', 'shop', 'view', 'nature'];
