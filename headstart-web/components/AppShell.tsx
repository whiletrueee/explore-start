'use client';

import { type ReactNode } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { SavedProvider } from '@/lib/saved';
import { NavProvider } from '@/lib/nav';
import Navbar from './Navbar';

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Phone-framed shell: persistent navbar + stage, wrapped in saved-state + nav + Google Maps providers.
export default function AppShell({ children }: { children: ReactNode }) {
  const shell = (
    <div className="phone">
      <Navbar />
      <div className="stage">{children}</div>
    </div>
  );
  return (
    <SavedProvider>
      <NavProvider>{MAPS_KEY ? <APIProvider apiKey={MAPS_KEY}>{shell}</APIProvider> : shell}</NavProvider>
    </SavedProvider>
  );
}
