'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Gem } from '@/lib/types';
import { useSaved } from '@/lib/saved';
import PackRow from '@/components/PackRow';
import GemDetail from '@/components/GemDetail';
import ListDetail from '@/components/ListDetail';

export default function SavedPage() {
  const router = useRouter();
  const { saved, toggle } = useSaved();
  const [detail, setDetail] = useState<Gem | null>(null);

  const groups: Record<string, { creator: Gem['_creator']; items: Gem[] }> = {};
  saved.forEach((it) => {
    const key = it._creator?.handle || 'Saved';
    (groups[key] = groups[key] || { creator: it._creator, items: [] }).items.push(it);
  });
  const keys = Object.keys(groups);

  return (
    <div className="wl">
      <div className="wl-head">
        <button className="wl-back" onClick={() => router.push('/')}>‹</button>
        <h1>Saved</h1>
        {saved.length ? <span className="wl-count">{saved.length}</span> : null}
      </div>

      {saved.length === 0 ? (
        <div className="wl-empty">
          <div className="wl-empty-ic">🔖</div>
          <h2>Nothing saved yet</h2>
          <p>
            Tap <b>Save</b> on any gem and it lands here — your own running wishlist across every creator&apos;s guide.
          </p>
          <button className="wl-cta" onClick={() => router.push('/')}>Browse guides →</button>
        </div>
      ) : (
        <div className="wl-body">
          {keys.map((k) => (
            <div key={k} className="wl-group">
              <div className="wl-group-hd">
                {groups[k].creator ? (
                  <>
                    <span className="wl-av" style={{ background: groups[k].creator!.color }}>
                      {(groups[k].creator!.name || '?')[0]}
                    </span>
                    <span className="wl-group-handle">@{groups[k].creator!.handle}</span>
                  </>
                ) : (
                  <span className="wl-group-handle">Saved spots</span>
                )}
                <span className="wl-group-n">{groups[k].items.length}</span>
              </div>
              {groups[k].items.map((it) => (
                <PackRow key={it.id} item={it} onOpen={setDetail} saved onSave={(g) => toggle(g, g._creator)} />
              ))}
            </div>
          ))}
          <div className="wl-pad" />
        </div>
      )}

      {detail ? (
        detail.category === 'list' ? (
          <ListDetail item={detail} creator={detail._creator} onBack={() => setDetail(null)} isSaved={saved.some((s) => s.id === detail.id)} onToggleSave={toggle} />
        ) : (
          <GemDetail
            item={detail}
            creator={detail._creator}
            pack={null}
            onBack={() => setDetail(null)}
            isSaved={saved.some((s) => s.id === detail.id)}
            onToggleSave={toggle}
          />
        )
      ) : null}
    </div>
  );
}
