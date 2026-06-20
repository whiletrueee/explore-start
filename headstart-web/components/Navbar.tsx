'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useSaved } from '@/lib/saved';
import { useNav } from '@/lib/nav';

export default function Navbar() {
  const router = useRouter();
  const path = usePathname();
  const { saved } = useSaved();
  const { back } = useNav();
  const onSaved = path === '/saved';
  const onGenerate = path === '/generate';
  return (
    <header className="hs-nav">
      {back ? (
        <button className="hs-back" onClick={back.onBack}>
          <span className="hs-back-chev">‹</span> {back.label}
        </button>
      ) : (
        <button className="hs-brand" onClick={() => router.push('/')}>
          <span className="hs-logo">✦</span> Headstart
        </button>
      )}
      <div className="hs-nav-right">
        <button
          className={'hs-gen' + (onGenerate ? ' on' : '')}
          onClick={() => router.push('/generate')}
          aria-label="Generate"
        >
          ✨ Generate
        </button>
        <button className={'hs-saved' + (onSaved ? ' on' : '')} onClick={() => router.push('/saved')} aria-label="Saved">
          <span className="hs-saved-ic">🔖</span> Saved{saved.length ? <i>{saved.length}</i> : null}
        </button>
      </div>
    </header>
  );
}
