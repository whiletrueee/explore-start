import type { DiscoveryCreator } from '@/lib/types';
import { mediaSrc } from '@/lib/catalog';

interface Props {
  creator: DiscoveryCreator;
  onOpen: (creator: DiscoveryCreator) => void;
}

// Creator guide-pack tile: photo on top, clean info panel below (Eevee split card).
export default function CreatorCard({ creator, onOpen }: Props) {
  const counts = creator.counts || {};
  const total = (counts.gems || 0) + (counts.itineraries || 0) + (counts.lists || 0) + (counts.tips || 0);
  const itins = counts.itineraries || 0;
  return (
    <div className="cc" role="button" onClick={() => onOpen(creator)}>
      <div
        className="cc-media"
        style={{ backgroundColor: creator.color, backgroundImage: mediaSrc(creator.hero) ? `url(${mediaSrc(creator.hero)})` : 'none' }}
      >
        <span className="cc-city">{creator.city}</span>
      </div>
      <div className="cc-body">
        <div className="cc-cred">
          <span className="cc-av" style={{ background: creator.color }}>
            {creator.name[0]}
          </span>
          <span className="cc-handle">@{creator.handle}</span>
        </div>
        <div className="cc-pack">{creator.guideName ?? creator.packTitle}</div>
        <div className="cc-sub">
          {total} spots{itins ? ` · ${itins} ${itins === 1 ? 'itinerary' : 'itineraries'}` : ''}
        </div>
        <div className="cc-go">
          View guide <span>→</span>
        </div>
      </div>
    </div>
  );
}
