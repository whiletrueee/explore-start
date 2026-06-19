import { mediaSrc } from '@/lib/catalog';

const ITIN_COLOR = '#B5651D';

export function tripType(days?: number): string | null {
  if (!days) return null;
  if (days <= 1) return 'Day trip';
  if (days <= 3) return 'Weekend';
  return 'Multi-day';
}

interface Props {
  title: string;
  hook?: string;
  cover?: string | null;
  days?: number;
  city?: string;
  onClick: () => void;
}

// Landscape media card (same shape as gem cards) for an itinerary on the tab's front page.
export default function ItineraryCard({ title, hook, cover, days, city, onClick }: Props) {
  const src = mediaSrc(cover);
  const tt = tripType(days);
  return (
    <div className="mp-card" role="button" onClick={onClick}>
      <div
        className="mp-card-img"
        style={src ? { backgroundImage: `url(${src})` } : { background: `linear-gradient(145deg, ${ITIN_COLOR}, ${ITIN_COLOR}99)` }}
      >
        {src ? null : <span className="mp-card-glyph">🗺</span>}
        {tt ? (
          <span className="itin-ribbon">
            {tt}
            {days ? ` · ${days}d` : ''}
          </span>
        ) : null}
      </div>
      <div className="mp-card-b">
        <h3 className="mp-card-title">{title}</h3>
        {hook ? <p className="mp-card-hook">{hook}</p> : null}
        <div className="mp-card-pills">
          <span className="mp-pill mp-pill-cat" style={{ color: ITIN_COLOR, borderColor: ITIN_COLOR + '55' }}>
            🗺 Itinerary
          </span>
          {city ? <span className="mp-pill">{city}</span> : null}
        </div>
      </div>
    </div>
  );
}
