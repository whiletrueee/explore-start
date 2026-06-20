'use client';

import { useEffect } from 'react';
import type { Gem, Creator } from '@/lib/types';
import { catV2, imageSrc } from '@/lib/catalog';
import { useNav } from '@/lib/nav';

interface Item {
  title: string;
  detail: string | null;
  description?: string | null;
}

// Best-effort: turn a round-up's prose into discrete items.
// "Intro: A (x), B (y), and C (z)." -> [{A, x}, {B, y}, {C, z}]
function parseItems(why?: string): Item[] {
  if (!why) return [];
  let body = why.trim();
  const ci = body.indexOf(':');
  if (ci > -1 && ci < 70) body = body.slice(ci + 1).trim();
  const parts = body
    .split(/,\s*and\s+|,\s*|;\s*|\s+and\s+/i)
    .map((s) => s.trim().replace(/\.$/, ''))
    .filter(Boolean);
  return parts.map((p) => {
    const m = p.match(/^(.+?)\s*\(([^)]+)\)$/);
    return m ? { title: m[1].trim(), detail: m[2].trim() } : { title: p, detail: null };
  });
}

interface Props {
  item: Gem;
  creator?: Creator | null;
  onBack: () => void;
  isSaved?: boolean;
  onToggleSave?: (item: Gem, creator?: Creator | null) => void;
}

export default function ListDetail({ item, creator, onBack, isSaved, onToggleSave }: Props) {
  const { setBack } = useNav();
  useEffect(() => {
    setBack({ label: 'Lists', onBack });
    return () => setBack(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const c = catV2(item);
  const heroSrc = imageSrc(item);
  const place = item.area || item.city;
  const themes = (item.themes || []).slice(0, 4);
  const handle = (creator && creator.handle) || item._creator?.handle;
  const showHook = item.name && item.hook && item.name !== item.hook;

  // structured round-up (curated list) → rich items with descriptions; else parse the prose
  const structured = (item.options || []).map((o) => ({
    title: o.name || o.hook || '',
    detail: o.area || o.city || o.price_text || null,
    description: o.why || o.hook || null,
  }));
  const parsed = parseItems(item.why);
  const items: Item[] = structured.length ? structured : parsed;
  const asList =
    structured.length > 0 ||
    (parsed.length >= 2 &&
      parsed.length <= 15 &&
      (parsed.filter((i) => i.detail).length >= Math.min(2, parsed.length) || parsed.every((i) => i.title.length <= 42)));

  return (
    <div className="gd gd-eat">
      <div className="gd-scroll">
        <div
          className="gd-hero gd-hero-tall"
          style={heroSrc ? { backgroundImage: `url(${heroSrc})` } : { background: `linear-gradient(150deg, ${c.color}, ${c.color}aa)` }}
        >
          {heroSrc ? null : <span className="gd-hero-glyph">{c.glyph}</span>}
          <button className={'gd-save' + (isSaved ? ' on' : '')} onClick={() => onToggleSave && onToggleSave(item, creator)}>
            {isSaved ? 'Saved' : 'Save'} <span>{isSaved ? '✓' : '🔖'}</span>
          </button>
        </div>

        <div className="gd-body">
          <div className="gd-eat-kicker" style={{ color: c.color }}>
            {c.glyph} {c.label}
            {asList ? ` · ${items.length} picks` : ''}
            {place ? ` · ${place}` : ''}
          </div>
          <h2 className="gd-eat-title">{item.name || item.hook}</h2>
          {showHook ? <p className="gd-eat-dek">{item.hook}</p> : null}

          {asList ? (
            <ol className="ld-list">
              {items.map((it, i) => (
                <li key={i} className="ld-item">
                  <span className="ld-n">{i + 1}</span>
                  <div className="ld-it-b">
                    <span className="ld-it-title">{it.title}</span>
                    {it.detail ? <span className="ld-it-detail">{it.detail}</span> : null}
                    {it.description ? <p className="ld-it-desc">{it.description}</p> : null}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="ld-prose">{item.why}</p>
          )}

          {themes.length ? (
            <div className="gd-eat-tags">
              {themes.map((t) => (
                <span key={t} className="mp-pill">
                  {t}
                </span>
              ))}
            </div>
          ) : null}

          {item.website ? (
            <a className="gd-info gd-link" href={item.website} target="_blank" rel="noopener noreferrer">
              <span>🔗</span> Visit website ↗
            </a>
          ) : null}
        </div>
      </div>

      <div className="gd-foot">
        {item.source_reel ? (
          <a className="gd-reel solo" href={item.source_reel} target="_blank" rel="noopener noreferrer">
            ▶ Watch the source reel
          </a>
        ) : null}
        <p className="ld-credit">From @{handle}</p>
      </div>
    </div>
  );
}
