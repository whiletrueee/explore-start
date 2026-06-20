// Fixed display-name overrides by creator handle. Anything not listed falls
// back to the guideName received from the API.

const OVERRIDES: Record<string, string> = {
  'ladyandhersweetescapes-dubai': 'Adventures in Dubai',
  lina_newyorkcity: 'Rendezvous in New York City',
  'empty.japan': 'Japan, Off the Map',
  exploringlondon: 'London, Unlocked',
  thefloridaqueenie: "Florida's Gulf Coast",
  raimeetravel: 'Japan, Slow & Quiet',
  'dotzsoh-singapore': 'Singapore, Local-Only',
  'blacktravelpin-dubai': 'Dubai, Your Way',
};

// Pinned display order on the homepage grid. Lower index = earlier.
// Handles not listed appear after, in original API order.
const ORDER: string[] = [
  'ladyandhersweetescapes-dubai',
  'lina_newyorkcity',
];

export function creatorRank(handle: string | null | undefined): number {
  const h = (handle || '').toLowerCase().trim();
  const i = ORDER.indexOf(h);
  return i === -1 ? Number.MAX_SAFE_INTEGER : i;
}

export function creativeGuideName(
  fallback: string | null | undefined,
  handle: string | null | undefined,
): string {
  const h = (handle || '').toLowerCase().trim();
  if (h && OVERRIDES[h]) return OVERRIDES[h];
  return (fallback && fallback.trim()) || 'Guide';
}
