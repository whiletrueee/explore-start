'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useSaved } from '@/lib/saved';

export default function Navbar() {
  const router = useRouter();
  const path = usePathname();
  const { saved } = useSaved();
  const onSaved = path === '/saved';
  return (
    <header className="hs-nav">
      <button className="hs-brand" onClick={() => router.push('/')}>
        <span className="hs-logo">✦</span> Headstart
      </button>
      <button className={'hs-saved' + (onSaved ? ' on' : '')} onClick={() => router.push('/saved')} aria-label="Saved">
        <span className="hs-saved-ic">🔖</span> Saved{saved.length ? <i>{saved.length}</i> : null}
      </button>
    </header>
  );
}
