'use client';

import { type ReactNode } from 'react';
import { SavedProvider } from '@/lib/saved';
import Navbar from './Navbar';

// Phone-framed shell: persistent navbar + stage, wrapped in the saved-state provider.
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <SavedProvider>
      <div className="phone">
        <Navbar />
        <div className="stage">{children}</div>
      </div>
    </SavedProvider>
  );
}
