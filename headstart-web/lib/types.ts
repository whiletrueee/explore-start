export interface Creator {
  handle: string;
  name: string;
  color: string;
  tag?: string;
  destination?: string;
}

export interface Gem {
  id: string;
  name?: string;
  hook?: string;
  why?: string;
  category: string;
  subcategory?: string;
  city?: string;
  area?: string | null;
  region?: string | null;
  location_text?: string | null;
  website?: string | null;
  price_text?: string | null;
  date_info?: string | null;
  themes?: string[];
  saved_from?: number;
  source_reel?: string | null;
  media_url?: string | null;
  profile?: Record<string, unknown>;
  lat?: number | null;
  lng?: number | null;
  approx?: boolean;
  days?: number;
  // structured round-up items (curated lists) — each is gem-like with its own why/area/price
  options?: Gem[];
  // attached when saved to the wishlist
  _creator?: { handle: string; name: string; color: string } | null;
}

export interface DiscoveryCreator extends Creator {
  city: string;
  packTitle?: string;
  hero?: string;
  counts?: { gems?: number; itineraries?: number; lists?: number; tips?: number };
  gems?: Gem[];
  tips?: Gem[];
  lists?: Gem[];
  itineraries?: Array<{ id: string; title: string; hook?: string; days?: number; city?: string; best_for?: string; media_url?: string | null }>;
}

export interface Discovery {
  creators: DiscoveryCreator[];
}

export interface CityMeta {
  center: [number, number];
  zoom: number;
  count: number;
}

export interface ItineraryStop {
  slot?: string;
  time?: string;
  gem_id?: string;
  title?: string;
  what?: string;
  why?: string;
  transit_next?: string;
  tip?: string;
}
export interface ItineraryDay {
  day: number;
  hook?: string;
  theme?: string;
  area?: string;
  pace_note?: string;
  stops?: ItineraryStop[];
}
export interface ItineraryData {
  id?: string;
  title?: string;
  hook?: string;
  summary?: string;
  best_for?: string;
  days_count?: number;
  city?: string;
  days?: ItineraryDay[];
  logistics?: { getting_around?: string; where_to_stay?: string; best_time?: string };
  gem_ids_used?: string[];
}

export interface Pack {
  creator: { handle: string; name: string; tag: string; color: string; destination: string };
  center: [number, number];
  zoom: number;
  cityMeta: Record<string, CityMeta>;
  items: Gem[];
  itinerary: ItineraryData | null;
  price: number;
  curatedLists: Array<{ id: string; headline: string; subhead: string; price_band?: string; lens?: string; options: Gem[] }>;
  guideName: string;
  cover?: string | null;
  freeCity?: string;
}
