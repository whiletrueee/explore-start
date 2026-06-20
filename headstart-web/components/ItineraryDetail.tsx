'use client';

import { useEffect } from 'react';
import type { Gem, Pack } from '@/lib/types';
import { imageSrc } from '@/lib/catalog';
import { useNav } from '@/lib/nav';
import MapView from './MapView';
import { tripType } from './ItineraryCard';

interface Stop {
  slot?: string;
  time?: string;
  gem_id?: string;
  title?: string;
  what?: string;
  why?: string;
  transit_next?: string;
  tip?: string;
}
interface Day {
  day: number;
  hook?: string;
  theme?: string;
  area?: string;
  stops?: Stop[];
  pace_note?: string;
}
// A detailed itinerary (empty.japan shape) OR a summary itinerary item (Gem).
export type Itin = {
  title?: string;
  name?: string;
  hook?: string;
  summary?: string;
  best_for?: string;
  why?: string;
  days_count?: number;
  days?: Day[] | number;
  city?: string;
  logistics?: { getting_around?: string; where_to_stay?: string; best_time?: string };
  lat?: number | null;
  lng?: number | null;
};

interface Props {
  itinerary: Itin;
  itemsById: Record<string, Gem>;
  pack: Pack;
  onBack: () => void;
}

export default function ItineraryDetail({ itinerary, itemsById, pack, onBack }: Props) {
  const { setBack } = useNav();
  useEffect(() => {
    setBack({ label: 'Itineraries', onBack });
    return () => setBack(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const title = itinerary.title || itinerary.name || 'Itinerary';
  const detailed = Array.isArray(itinerary.days);
  const days = detailed ? (itinerary.days as Day[]) : [];
  const dayCount = itinerary.days_count || (typeof itinerary.days === 'number' ? itinerary.days : days.length);
  const bestFor = itinerary.best_for || itinerary.why;

  // ordered stops -> route path (keeps revisits) + deduped markers (one pin per place)
  const stops = days.flatMap((d) => (d.stops || []).map((s) => ({ ...s, gem: s.gem_id ? itemsById[s.gem_id] : undefined })));
  const routeGems = stops.map((s) => s.gem).filter((g): g is Gem => !!g && g.lat != null && g.lng != null);
  const path = routeGems.map((g) => [g.lat as number, g.lng as number] as [number, number]);
  const seen = new Set<string>();
  const mapGems = routeGems.filter((g) => (seen.has(g.id) ? false : (seen.add(g.id), true)));
  const center: [number, number] = path[0] || (itinerary.lat != null ? [itinerary.lat, itinerary.lng as number] : pack.center);

  return (
    <div className="itd">
      <div className="itd-map">
        <MapView
          gems={mapGems.length ? mapGems : []}
          center={center}
          zoom={mapGems.length ? 12 : 11}
          path={path.length > 1 ? path : undefined}
          numbered
          tiles="minimal"
        />
      </div>

      <div className="itd-scroll">
        <div className="itd-head">
          <div className="itd-kicker">
            🗺 {tripType(dayCount) || 'Itinerary'}
            {dayCount ? ` · ${dayCount} ${dayCount === 1 ? 'day' : 'days'}` : ''}
            {itinerary.city ? ` · ${itinerary.city}` : ''}
          </div>
          <h2 className="itd-title">{title}</h2>
          {itinerary.hook ? <p className="itd-hook">{itinerary.hook}</p> : null}
          {itinerary.summary ? <p className="itd-summary">{itinerary.summary}</p> : null}
          {bestFor ? (
            <div className="itd-bestfor">
              <span>Best for</span> {bestFor}
            </div>
          ) : null}
        </div>

        {detailed ? (
          <div className="itd-days">
            {days.map((d) => (
              <section key={d.day} className="itd-day">
                <div className="itd-day-hd">
                  <span className="itd-day-n">Day {d.day}</span>
                  <div className="itd-day-meta">
                    <strong>{d.theme || d.hook}</strong>
                    {d.area ? <span>{d.area}</span> : null}
                  </div>
                </div>
                <div className="itd-stops">
                  {(d.stops || []).map((s, i) => {
                    const g = s.gem_id ? itemsById[s.gem_id] : undefined;
                    const img = g ? imageSrc(g, 'thumb') : null;
                    return (
                      <div key={i} className="itd-stop">
                        <div className="itd-rail">
                          <span className="itd-dot" />
                          {i < (d.stops || []).length - 1 ? <span className="itd-line" /> : null}
                        </div>
                        <div className="itd-stop-b">
                          <div className="itd-stop-time">
                            {s.time ? <b>{s.time}</b> : null}
                            {s.slot ? <span className="itd-slot">{s.slot}</span> : null}
                          </div>
                          <h4 className="itd-stop-title">{s.title}</h4>
                          {img ? <div className="itd-stop-img" style={{ backgroundImage: `url(${img})` }} /> : null}
                          {s.what ? <p className="itd-stop-what">{s.what}</p> : null}
                          {s.why ? <p className="itd-stop-why">{s.why}</p> : null}
                          {s.tip ? <div className="itd-tip">💡 {s.tip}</div> : null}
                          {s.transit_next ? <div className="itd-transit">↓ {s.transit_next}</div> : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {d.pace_note ? <div className="itd-pace">🕑 {d.pace_note}</div> : null}
              </section>
            ))}

            {itinerary.logistics ? (
              <section className="itd-logistics">
                <h3>Good to know</h3>
                {itinerary.logistics.getting_around ? (
                  <p><b>Getting around</b> {itinerary.logistics.getting_around}</p>
                ) : null}
                {itinerary.logistics.where_to_stay ? (
                  <p><b>Where to stay</b> {itinerary.logistics.where_to_stay}</p>
                ) : null}
                {itinerary.logistics.best_time ? <p><b>Best time</b> {itinerary.logistics.best_time}</p> : null}
              </section>
            ) : null}
          </div>
        ) : (
          <div className="itd-soon">
            <div className="itd-soon-ic">🧭</div>
            <p>The full day-by-day plan for this itinerary is coming soon.</p>
          </div>
        )}
        <div className="itd-pad" />
      </div>
    </div>
  );
}
