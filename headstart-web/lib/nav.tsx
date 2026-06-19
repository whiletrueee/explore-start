'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface BackDesc {
  label: string;
  onBack: () => void;
}
interface NavCtx {
  back: BackDesc | null;
  setBack: (b: BackDesc | null) => void;
}

const Ctx = createContext<NavCtx | null>(null);

// Lets a sub-view (e.g. the gem detail) surface a back action in the app navbar.
export function NavProvider({ children }: { children: ReactNode }) {
  const [back, setBack] = useState<BackDesc | null>(null);
  return <Ctx.Provider value={{ back, setBack }}>{children}</Ctx.Provider>;
}

export function useNav() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useNav must be used within NavProvider');
  return c;
}
