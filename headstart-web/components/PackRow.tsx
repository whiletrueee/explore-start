import type { Gem } from '@/lib/types';
import { catV2 } from '@/lib/catalog';

interface Props {
  item: Gem;
  selected?: boolean;
  onOpen: (item: Gem) => void;
  saved?: boolean;
  onSave?: (item: Gem) => void;
}

// Media card: 16:9 image on top, title + category pill + theme tags below.
// Optional bookmark on the image toggles the wishlist without opening detail.
export default function PackRow({ item, selected, onOpen, saved, onSave }: Props) {
  const c = catV2(item);
  const media = item.media_url
    ? { backgroundImage: `url(${item.media_url})` }
    : { background: `linear-gradient(145deg, ${c.color}, ${c.color}99)` };
  const themes = (item.themes || []).slice(0, 3);
  return (
    <div className={'mp-card' + (selected ? ' on' : '')} role="button" data-id={item.id} onClick={() => onOpen(item)}>
      <div className="mp-card-img" style={media}>
        {item.media_url ? null : <span className="mp-card-glyph">{c.glyph}</span>}
        {onSave ? (
          <button
            className={'mp-card-save' + (saved ? ' on' : '')}
            aria-label={saved ? 'Saved' : 'Save'}
            onClick={(e) => {
              e.stopPropagation();
              onSave(item);
            }}
          >
            {saved ? '✓' : '🔖'}
          </button>
        ) : null}
      </div>
      <div className="mp-card-b">
        <h3 className="mp-card-title">{item.hook || item.name}</h3>
        <div className="mp-card-pills">
          <span className="mp-pill mp-pill-cat" style={{ color: c.color, borderColor: c.color + '55' }}>
            {c.glyph} {c.label}
          </span>
          {themes.map((t) => (
            <span key={t} className="mp-pill">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
