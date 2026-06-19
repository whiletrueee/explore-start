import type { Gem } from '@/lib/types';

const WORDS: Record<string, number> = {
  two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
};

// Pull the "N things" count out of a listicle title/hook (digits ≤ 99, or spelled-out).
function countFrom(s?: string): string | null {
  if (!s) return null;
  const d = s.match(/\b(\d{1,2})\b/);
  if (d) return d[1];
  const w = s.toLowerCase().match(/\b(two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\b/);
  return w ? String(WORDS[w[1]]) : null;
}

export default function ListRow({ item, onOpen }: { item: Gem; onOpen: (item: Gem) => void }) {
  const num = countFrom(item.hook) || countFrom(item.name);
  const themes = (item.themes || []).slice(0, 2);
  return (
    <button className="lst-row" onClick={() => onOpen(item)}>
      <div className="lst-num">{num ?? <span className="lst-num-ic">≡</span>}</div>
      <div className="lst-b">
        <h3 className="lst-title">{item.name || item.hook}</h3>
        <div className="lst-badges">
          {item.price_text ? <span className="lst-badge hot">{item.price_text}</span> : null}
          {themes.map((t) => (
            <span key={t} className="lst-badge">
              {t}
            </span>
          ))}
        </div>
        <p className="lst-desc">{item.why || item.hook}</p>
      </div>
    </button>
  );
}
