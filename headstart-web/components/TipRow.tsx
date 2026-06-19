'use client';

import { useState } from 'react';
import type { Gem } from '@/lib/types';

const TYPE: Record<string, { icon: string; label: string; color: string }> = {
  transit: { icon: '🚇', label: 'Getting around', color: '#2D6A8E' },
  'budget-hack': { icon: '💸', label: 'Save money', color: '#2E7D32' },
  'what-to-skip': { icon: '🚫', label: 'Good to skip', color: '#C2410C' },
  'when-to-go': { icon: '🗓', label: 'Timing', color: '#7A4FA3' },
  booking: { icon: '🎫', label: 'Booking', color: '#8000ff' },
  'points-miles': { icon: '✈️', label: 'Miles & flights', color: '#1F8A70' },
};
const DEFAULT_TYPE = { icon: '💡', label: 'Good to know', color: '#6B7280' };

export default function TipRow({ item }: { item: Gem }) {
  const [open, setOpen] = useState(false);
  const t = TYPE[item.subcategory ?? ''] ?? DEFAULT_TYPE;
  const cost = item.price_text || undefined;
  const free = !!cost && /^free\b|^\s*free\s*$/i.test(cost);
  return (
    <div className={'tip' + (open ? ' open' : '')}>
      <button className="tip-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="tip-ic" style={{ background: t.color + '1f' }}>{t.icon}</span>
        <span className="tip-hd">{item.hook || item.name}</span>
        {cost ? <span className={'tip-cost' + (free ? ' free' : '')}>{free ? 'Free' : cost}</span> : null}
        <span className="tip-chev">⌄</span>
      </button>
      {open ? (
        <div className="tip-body">
          <div className="tip-type" style={{ color: t.color }}>{t.label}</div>
          <p className="tip-why">{item.why}</p>
          {item.date_info ? <div className="tip-meta">🗓 {item.date_info}</div> : null}
          {cost && !free ? <div className="tip-meta">💲 {cost}</div> : null}
          {item.source_reel ? (
            <a className="tip-reel" href={item.source_reel} target="_blank" rel="noopener noreferrer">
              ▶ Watch the source reel
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
