'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Gem, Creator } from './types';

const SAVED_KEY = 'hs_saved';

interface SavedCtx {
  saved: Gem[];
  savedIds: string[];
  isSaved: (id: string) => boolean;
  toggle: (gem: Gem, creator?: Creator | null) => void;
}

const Ctx = createContext<SavedCtx | null>(null);

export function SavedProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Gem[]>([]);

  // hydrate from localStorage on mount (client only)
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
      if (Array.isArray(raw)) setSaved(raw.filter((x) => x && typeof x === 'object'));
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = (gem: Gem, creator?: Creator | null) => {
    if (!gem) return;
    setSaved((prev) => {
      const exists = prev.some((s) => s.id === gem.id);
      const next = exists
        ? prev.filter((s) => s.id !== gem.id)
        : [
            ...prev,
            {
              ...gem,
              _creator: creator
                ? { handle: creator.handle, name: creator.name, color: creator.color }
                : gem._creator ?? null,
            },
          ];
      localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      return next;
    });
  };

  const savedIds = saved.map((s) => s.id);
  const value: SavedCtx = { saved, savedIds, isSaved: (id) => savedIds.includes(id), toggle };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSaved() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSaved must be used within SavedProvider');
  return ctx;
}
