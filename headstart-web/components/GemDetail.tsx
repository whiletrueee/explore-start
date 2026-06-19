'use client';

import { useState, useEffect } from 'react';
import { useNav } from '@/lib/nav';
import type { Gem, Creator, Pack } from '@/lib/types';
import { catV2, isMappedV2, mapsLink, mediaSrc } from '@/lib/catalog';
import MapView from './MapView';

interface Props {
  item: Gem;
  creator?: Creator | null;
  pack?: Pack | null;
  onBack: () => void;
  isSaved?: boolean;
  onToggleSave?: (item: Gem, creator?: Creator | null) => void;
}

// Full-screen gem detail: media hero → title + tags → embedded location map → creator
// message → pinned CTAs. Always shows a map (precise pin, else a contextual area map).
export default function GemDetail({ item, creator, pack, onBack, isSaved, onToggleSave }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { setBack } = useNav();
  // surface this view's back action in the app navbar
  useEffect(() => {
    setBack({ label: 'All gems', onBack });
    return () => setBack(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const c = catV2(item);
  const mapped = isMappedV2(item);
  const themes = (item.themes || []).slice(0, 4);
  const bookable = (item.profile && item.profile.book) || ['eat', 'see-do', 'view'].includes(item.category);
  const why = item.why || '';
  const long = why.length > 220;
  const heroSrc = mediaSrc(item.media_url);
  const hasMedia = !!heroSrc;
  const showHook = item.name && item.hook && item.name !== item.hook;
  const handle = (creator && creator.handle) || item._creator?.handle || '';

  const cityMeta = (pack && pack.cityMeta && item.city && pack.cityMeta[item.city]) || null;
  const dest = (pack && pack.creator && pack.creator.destination) || '';
  const mapCenter: [number, number] | null = mapped
    ? [item.lat as number, item.lng as number]
    : cityMeta
      ? cityMeta.center
      : pack
        ? pack.center
        : null;
  const mapZoom = mapped ? 15 : cityMeta ? Math.min(cityMeta.zoom || 12, 12) : pack ? pack.zoom : 11;
  const areaLabel = item.city || dest;

  const mapBlock = mapCenter ? (
    <>
      <div className="gd-mapcard">
        <MapView gems={mapped ? [item] : []} selectedId={mapped ? item.id : null} center={mapCenter} zoom={mapZoom} tiles="minimal" />
        {!mapped ? <div className="gd-map-note">📍 Found across {areaLabel}</div> : null}
      </div>
      {mapped && item.location_text ? (
        <a className="gd-addr" href={mapsLink(item.location_text)} target="_blank" rel="noopener noreferrer">
          <span className="gd-addr-pin">📍</span>
          <span className="gd-addr-t">{item.location_text}</span>
          <span className="gd-addr-dir">Directions ↗</span>
        </a>
      ) : null}
    </>
  ) : null;

  const heroBtns = (
    <button className={'gd-save' + (isSaved ? ' on' : '')} onClick={() => onToggleSave && onToggleSave(item, creator)}>
      {isSaved ? 'Saved' : 'Save'} <span>{isSaved ? '✓' : '🔖'}</span>
    </button>
  );

  const footer = (
    <div className="gd-foot">
      {bookable ? <button className="gd-book">Book on Headout →</button> : null}
      {item.source_reel ? (
        <a className={'gd-reel' + (bookable ? '' : ' solo')} href={item.source_reel} target="_blank" rel="noopener noreferrer">
          ▶ Watch the source reel
        </a>
      ) : null}
    </div>
  );

  // ---- Eat: editorial / review layout ----
  if (item.category === 'eat') {
    const place = item.area || item.city || dest;
    return (
      <div className="gd gd-eat">
        <div className="gd-scroll">
          <div
            className="gd-hero gd-hero-tall"
            style={hasMedia ? { backgroundImage: `url(${heroSrc})` } : { background: `linear-gradient(150deg, ${c.color}, ${c.color}aa)` }}
          >
            {hasMedia ? null : <span className="gd-hero-glyph">{c.glyph}</span>}
            {heroBtns}
          </div>
          <div className="gd-body">
            <div className="gd-eat-kicker" style={{ color: c.color }}>
              {c.glyph} {c.label}{item.price_text ? ` · ${item.price_text}` : ''}{place ? ` · ${place}` : ''}
            </div>
            <h2 className="gd-eat-title">{item.name || item.hook}</h2>
            {showHook ? <p className="gd-eat-dek">{item.hook}</p> : null}
            {why ? (
              <blockquote className="gd-quote" style={{ borderLeftColor: c.color }}>
                <p>{why}</p>
                <cite>— @{handle}</cite>
              </blockquote>
            ) : null}
            {themes.length ? (
              <div className="gd-eat-tags">
                {themes.map((t) => (
                  <span key={t} className="mp-pill">
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
            {mapBlock}
            {item.date_info ? (
              <div className="gd-info">
                <span>🗓</span> {item.date_info}
              </div>
            ) : null}
            {item.website ? (
              <a className="gd-info gd-link" href={item.website} target="_blank" rel="noopener noreferrer">
                <span>🔗</span> Visit website ↗
              </a>
            ) : null}
          </div>
        </div>
        {footer}
      </div>
    );
  }

  return (
    <div className="gd">
      <div className="gd-scroll">
        <div
          className="gd-hero"
          style={hasMedia ? { backgroundImage: `url(${heroSrc})` } : { background: `linear-gradient(150deg, ${c.color}, ${c.color}aa)` }}
        >
          {hasMedia ? null : <span className="gd-hero-glyph">{c.glyph}</span>}
          {heroBtns}
        </div>

        <div className="gd-body">
          <h2 className="gd-title">{item.name || item.hook}</h2>
          {showHook ? <p className="gd-hook">{item.hook}</p> : null}

          <div className="gd-tags">
            <span className="mp-pill mp-pill-cat" style={{ color: c.color, borderColor: c.color + '55' }}>
              {c.glyph} {c.label}
            </span>
            {item.price_text ? <span className="mp-pill gd-pill-price">🏷️ {item.price_text}</span> : null}
            {themes.map((t) => (
              <span key={t} className="mp-pill">
                {t}
              </span>
            ))}
            {item.saved_from && item.saved_from > 1 ? <span className="mp-pill gd-pill-saves">🔖 {item.saved_from} saves</span> : null}
          </div>

          {mapCenter ? (
            <>
              <div className="gd-mapcard">
                <MapView gems={mapped ? [item] : []} selectedId={mapped ? item.id : null} center={mapCenter} zoom={mapZoom} tiles="minimal" />
                {!mapped ? <div className="gd-map-note">📍 Found across {areaLabel}</div> : null}
              </div>
              {mapped && item.location_text ? (
                <a className="gd-addr" href={mapsLink(item.location_text)} target="_blank" rel="noopener noreferrer">
                  <span className="gd-addr-pin">📍</span>
                  <span className="gd-addr-t">{item.location_text}</span>
                  <span className="gd-addr-dir">Directions ↗</span>
                </a>
              ) : null}
            </>
          ) : null}

          <div className="gd-msg">
            <div className="gd-msg-h">
              <span className="gd-av" style={{ background: (creator && creator.color) || '#8000ff' }}>
                {((creator && creator.name) || handle || '?')[0]}
              </span>
              From <strong>@{handle}</strong>
            </div>
            <p className={'gd-why' + (expanded ? ' open' : '')}>{why}</p>
            {long ? (
              <button className="gd-morelink" onClick={() => setExpanded((e) => !e)}>
                {expanded ? 'Show less' : 'Read more'}
              </button>
            ) : null}
          </div>

          {item.date_info ? (
            <div className="gd-info">
              <span>🗓</span> {item.date_info}
            </div>
          ) : null}
          {item.website ? (
            <a className="gd-info gd-link" href={item.website} target="_blank" rel="noopener noreferrer">
              <span>🔗</span> Visit website ↗
            </a>
          ) : null}
          {!mapped && item.location_text ? (
            <a className="gd-info gd-link" href={mapsLink(item.location_text)} target="_blank" rel="noopener noreferrer">
              <span>📍</span> {item.location_text} · Directions ↗
            </a>
          ) : null}
        </div>
      </div>

      <div className="gd-foot">
        {bookable ? <button className="gd-book">Book on Headout →</button> : null}
        {item.source_reel ? (
          <a className={'gd-reel' + (bookable ? '' : ' solo')} href={item.source_reel} target="_blank" rel="noopener noreferrer">
            ▶ Watch the source reel
          </a>
        ) : null}
      </div>
    </div>
  );
}
