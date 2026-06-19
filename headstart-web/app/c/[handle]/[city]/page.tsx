'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Gem, Pack } from '@/lib/types';
import { catV2, isMappedV2, GRID } from '@/lib/catalog';
import { useSaved } from '@/lib/saved';
import MapView from '@/components/MapView';
import PackRow from '@/components/PackRow';
import GemDetail from '@/components/GemDetail';

const PER_GROUP = 6;
const PRIMARIES: [string, string][] = [
  ['gems', 'Gems'],
  ['itinerary', 'Itinerary'],
  ['lists', 'Lists'],
  ['tips', 'Tips'],
];
const fileFor = (h: string) => '/data/pack-' + h.replace(/[^a-z0-9]/gi, '') + '.json';

export default function GuidePage() {
  const params = useParams<{ handle: string; city: string }>();
  const handle = params.handle;
  const router = useRouter();
  const { savedIds, toggle } = useSaved();

  const [pack, setPack] = useState<Pack | null>(null);
  const [err, setErr] = useState(false);
  const [primary, setPrimary] = useState('gems');
  const [cat, setCat] = useState<string | null>(null);
  const [detail, setDetail] = useState<Gem | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [scrolled, setScrolled] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [modal, setModal] = useState(false);

  useEffect(() => {
    setPack(null);
    setErr(false);
    setPrimary('gems');
    setCat(null);
    setExpanded(new Set());
    setDetail(null);
    setScrolled(false);
    setUnlocked(localStorage.getItem('hs_unlocked_' + handle) === '1');
    fetch(fileFor(handle))
      .then((r) => {
        if (!r.ok) throw new Error('no pack');
        return r.json();
      })
      .then(setPack)
      .catch(() => setErr(true));
  }, [handle]);

  const items: Gem[] = pack ? pack.items : [];
  const itemsById = useMemo(() => Object.fromEntries(items.map((i) => [i.id, i])), [items]);

  const toggleExpand = (k: string) =>
    setExpanded((p) => {
      const n = new Set(p);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });
  const openDetail = (item: Gem) => {
    if (!item) return;
    setPrimary('gems');
    setSelected(item.id);
    setDetail(item);
  };
  const closeDetail = () => {
    setDetail(null);
    setSelected(null);
  };
  const pickPin = (id: string) => openDetail(itemsById[id]);
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const s = (e.target as HTMLDivElement).scrollTop > 30;
    setScrolled((p) => (p === s ? p : s));
  };
  const confirmUnlock = () => {
    setUnlocked(true);
    localStorage.setItem('hs_unlocked_' + handle, '1');
    setModal(false);
  };

  if (err)
    return (
      <div className="mp mp-msg">
        <div className="mp-fallback">
          <div className="mp-fb-ic">🗺️</div>
          <h2>This guide isn&apos;t ready yet</h2>
          <p>No published pack for @{handle}.</p>
          <button className="mp-btn" onClick={() => router.push('/')}>Explore</button>
        </div>
      </div>
    );
  if (!pack) return <div className="mp mp-msg"><div className="mp-loading">Loading guide…</div></div>;

  const c = pack.creator;
  const dest = c.destination || 'this trip';
  const cityMeta = pack.cityMeta || {};
  const FREE_CITY = pack.freeCity || c.destination;
  const cityOf = (i: Gem) => i.city || dest;
  const placesAll = items.filter((i) => GRID.includes(i.category));
  const lists = items.filter((i) => i.category === 'list');
  const tips = items.filter((i) => i.category === 'plan');
  const itinItems = items.filter((i) => i.category === 'itinerary');
  const curatedLists = pack.curatedLists || [];

  const lockedCount = placesAll.filter((i) => cityOf(i) !== FREE_CITY).length;
  const browseGems = unlocked ? placesAll : placesAll.filter((i) => cityOf(i) === FREE_CITY);
  const catsPresent = GRID.filter((k) => browseGems.some((i) => i.category === k));
  const gemsFiltered = cat ? browseGems.filter((i) => i.category === cat) : browseGems;

  const regionOf = (i: Gem) => i.region || i.city || `More in ${dest}`;
  const regionCounts: Record<string, number> = {};
  gemsFiltered.forEach((i) => {
    const r = regionOf(i);
    regionCounts[r] = (regionCounts[r] || 0) + 1;
  });
  const regions = Object.keys(regionCounts).sort((a, b) => regionCounts[b] - regionCounts[a]);
  const groups = unlocked
    ? regions.map((r) => ({ key: r, label: r, items: gemsFiltered.filter((i) => regionOf(i) === r) }))
    : [{ key: 'free', label: FREE_CITY, items: gemsFiltered }];

  const mapCenter = unlocked ? pack.center : cityMeta[FREE_CITY]?.center || pack.center;
  const mapZoom = unlocked ? pack.zoom : cityMeta[FREE_CITY]?.zoom || pack.zoom;
  const mapPins = (primary === 'gems' ? gemsFiltered : browseGems).filter(isMappedV2);

  const listCount = curatedLists.length || lists.length;
  const count =
    primary === 'gems'
      ? `${gemsFiltered.length} ${cat ? catV2({ category: cat }).label.toLowerCase() : 'gems'}`
      : primary === 'itinerary'
        ? pack.itinerary
          ? `${(pack.itinerary.days || []).length} days`
          : itinItems.length
            ? `${itinItems.length} ${itinItems.length === 1 ? 'itinerary' : 'itineraries'}`
            : 'none yet'
        : primary === 'lists'
          ? `${listCount} ${listCount === 1 ? 'list' : 'lists'}`
          : `${tips.length} tips`;

  const itinCount = pack.itinerary ? 1 : itinItems.length;

  return (
    <div className="mp">
      <div className={'mp-thinbar' + (scrolled ? ' show' : '')}>
        <button className="mp-thin-back" onClick={() => router.push('/')}>‹</button>
        <span className="mp-av" style={{ background: c.color }}>{c.name[0]}</span>
        <div className="mp-thin-id">
          <span className="mp-thin-handle">@{c.handle}</span>
          <span className="mp-thin-name">{pack.guideName || 'Guide'}</span>
        </div>
      </div>

      <div className="mp-scroll" onScroll={onScroll}>
        <div
          className="mp-banner"
          style={
            pack.cover
              ? { backgroundImage: `linear-gradient(180deg, rgba(16,18,22,.30), rgba(16,18,22,.80)), url(${pack.cover})` }
              : { background: `linear-gradient(135deg, ${c.color}, ${c.color}bb)` }
          }
        >
          <button className="mp-back" onClick={() => router.push('/')}>‹ Back</button>
          <div className="mp-banner-id">
            <div className="mp-banner-cre">
              <span className="mp-av" style={{ background: c.color }}>{c.name[0]}</span>
              <span className="mp-gh-handle">@{c.handle}</span>
              <span className="mp-gh-sub">· {c.tag || ''}</span>
            </div>
            <h1 className="mp-gh-name">{pack.guideName || 'Guide'}</h1>
          </div>
          <div className="mp-gh-vol">
            <span><b>{placesAll.length}</b> gems</span>
            <i />
            <span><b>{itinCount}</b> {itinCount === 1 ? 'itinerary' : 'itineraries'}</span>
            <i />
            <span><b>{listCount}</b> {listCount === 1 ? 'list' : 'lists'}</span>
            <i />
            <span><b>{tips.length}</b> tips</span>
          </div>
        </div>

        <div className="mp-mapwrap">
          <MapView gems={mapPins} selectedId={primary === 'gems' ? selected : null} onSelect={pickPin} center={mapCenter} zoom={mapZoom} tiles="minimal" />
        </div>

        <div className="mp-filterbar">
          <div className="mp-primary">
            {PRIMARIES.map(([k, lb]) => (
              <button key={k} className={'mp-pchip' + (primary === k ? ' on' : '')} onClick={() => { setPrimary(k); setSelected(null); }}>
                {lb}
              </button>
            ))}
          </div>
          {primary === 'gems' && catsPresent.length ? (
            <div className="mp-subfilters">
              <button className={'mp-subchip' + (!cat ? ' on' : '')} onClick={() => setCat(null)}>All</button>
              {catsPresent.map((k) => {
                const cc = catV2({ category: k });
                return (
                  <button key={k} className={'mp-subchip' + (cat === k ? ' on' : '')} onClick={() => setCat(cat === k ? null : k)}>
                    <span className="mp-row-dot" style={{ background: cc.color }} />
                    {cc.label}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="mp-content">
          <div className="mp-switch"><strong className="mp-sheet-title">{count}</strong></div>

          {primary === 'gems' ? (
            <>
              {groups.map((g) => {
                const isExp = expanded.has(g.key);
                const shown = isExp ? g.items : g.items.slice(0, PER_GROUP);
                const more = g.items.length - PER_GROUP;
                return (
                  <div key={g.key} className="mp-group">
                    <div className="mp-grouphdr">{g.label}<span>{g.items.length}</span></div>
                    {shown.map((it) => (
                      <PackRow key={it.id} item={it} selected={selected === it.id} onOpen={openDetail} saved={savedIds.includes(it.id)} onSave={(gem) => toggle(gem, c)} />
                    ))}
                    {more > 0 ? (
                      <button className="mp-more" onClick={() => toggleExpand(g.key)}>{isExp ? 'Show less' : `See ${more} more`}</button>
                    ) : null}
                  </div>
                );
              })}
              {!unlocked && lockedCount > 0 ? (
                <button className="mp-locked" onClick={() => setModal(true)}>
                  <strong>🔒 {lockedCount} more spots</strong>
                  <span>Hidden gems beyond {FREE_CITY} — unlock to see them all on the map.</span>
                </button>
              ) : null}
              <div className="mp-bodypad" />
            </>
          ) : null}

          {primary === 'itinerary' ? (
            <div className="mp-itin">
              {pack.itinerary ? (
                <div className="mp-itin-hd"><strong>{pack.itinerary.title}</strong>{pack.itinerary.hook ? <p>{pack.itinerary.hook}</p> : null}</div>
              ) : null}
              {itinItems.length ? (
                <>
                  <div className="mp-grouphdr">{pack.itinerary ? 'More itinerary ideas' : 'Itineraries'}<span>{itinItems.length}</span></div>
                  {itinItems.map((t) => (
                    <button key={t.id} className="mp-tip" onClick={() => openDetail(t)}>
                      <strong>{t.hook || t.name}</strong>
                      <p>{(t.why || '').slice(0, 120)}</p>
                    </button>
                  ))}
                </>
              ) : null}
              {!pack.itinerary && !itinItems.length ? <div className="mp-empty">No itinerary in this guide yet.</div> : null}
              <div className="mp-bodypad" />
            </div>
          ) : null}

          {primary === 'lists' ? (
            <div className="mp-group">
              {lists.length ? (
                lists.map((t) => (
                  <button key={t.id} className="mp-tip" onClick={() => openDetail(t)}>
                    <strong>{t.hook || t.name}</strong>
                    <p>{(t.why || '').slice(0, 120)}</p>
                  </button>
                ))
              ) : (
                <div className="mp-empty">No lists in this guide yet.</div>
              )}
              <div className="mp-bodypad" />
            </div>
          ) : null}

          {primary === 'tips' ? (
            <div className="mp-group">
              {tips.length ? (
                tips.map((t) => (
                  <button key={t.id} className="mp-tip" onClick={() => openDetail(t)}>
                    <strong>{t.hook || t.name}</strong>
                    <p>{(t.why || '').slice(0, 120)}</p>
                  </button>
                ))
              ) : (
                <div className="mp-empty">No tips in this guide yet.</div>
              )}
              <div className="mp-bodypad" />
            </div>
          ) : null}
        </div>
      </div>

      {detail ? (
        <GemDetail item={detail} creator={c} pack={pack} onBack={closeDetail} isSaved={savedIds.includes(detail.id)} onToggleSave={toggle} />
      ) : null}

      {!unlocked && !detail ? (
        <div className="mp-unlockbar">
          <div className="mp-unlock-info">
            <strong>Unlock the full guide</strong>
            <span>{lockedCount} more spots · creator keeps 100%</span>
          </div>
          <button className="mp-unlock-btn" onClick={() => setModal(true)}>${pack.price}</button>
        </div>
      ) : null}

      {modal ? (
        <div className="mp-modal-scrim" onClick={() => setModal(false)}>
          <div className="mp-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Unlock {pack.guideName}</h3>
            <p>Get all {placesAll.length} spots on the map, plus itineraries, lists and tips. The creator keeps 100%.</p>
            <button className="mp-modal-go" onClick={confirmUnlock}>Unlock for ${pack.price}</button>
            <button className="mp-modal-x" onClick={() => setModal(false)}>Maybe later</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
