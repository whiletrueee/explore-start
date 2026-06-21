'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Discovery, DiscoveryCreator } from '@/lib/types';
import CreatorCard from '@/components/CreatorCard';
import { fetchDiscovery } from '@/lib/api';
import { creatorRank } from '@/lib/guide-name';

const DEST_COUNTRY: Record<string, string> = {
  Dubai: 'UAE',
  Singapore: 'Singapore',
  London: 'UK',
  Florida: 'USA',
  'Boca Grande': 'USA',
  Japan: 'Japan',
  Kyoto: 'Japan',
  Tokyo: 'Japan',
  Osaka: 'Japan',
};

export default function Home() {
  const router = useRouter();
  const [disc, setDisc] = useState<Discovery | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [cityF, setCityF] = useState<string | null>(null);

  useEffect(() => {
    fetchDiscovery<Discovery>().then(setDisc).catch(() => setDisc(null));
  }, []);

  if (!disc) return <div className="hm"><div className="mp-empty">Loading…</div></div>;

  // Exclude creators with no guides (guideId === null) from the discovery feed.
  const creators = [...disc.creators]
    .filter((c) => c.guideId != null)
    .sort((a, b) => creatorRank(a.handle) - creatorRank(b.handle));
  const countryOf = (c: DiscoveryCreator) => DEST_COUNTRY[c.city] || c.city;

  const countries: Record<string, { count: number; cities: Record<string, number> }> = {};
  creators.forEach((c) => {
    const co = countryOf(c);
    const ci = c.city;
    const e = countries[co] || (countries[co] = { count: 0, cities: {} });
    e.count++;
    e.cities[ci] = (e.cities[ci] || 0) + 1;
  });
  const countryList = Object.keys(countries).sort((a, b) => countries[b].count - countries[a].count);
  const cityList = country ? Object.keys(countries[country].cities) : [];

  let shown = creators;
  if (country) shown = shown.filter((c) => countryOf(c) === country);
  if (cityF) shown = shown.filter((c) => c.city === cityF);

  const onCountry = (v: string) => {
    setCountry(v || null);
    setCityF(null);
  };
  const scope = cityF || country;

  return (
    <div className="hm">
      <section className="hm-banner">
        <div className="hm-banner-in">
          <div className="hm-brandrow">
            <span className="hm-bmark">✦</span> Headstart <span className="hm-by">by Headout</span>
          </div>
          <h1>
            Travel guides, straight
            <br />
            from the creators.
          </h1>
          <p>Real spots, maps and itineraries — saved by the creators you follow, ready for you to explore.</p>
          <div className="hm-bstat">
            {creators.length} guides · {countryList.length} destinations
          </div>
        </div>
      </section>

      <div className="hm-filter">
        <div className="hm-filter-lbl">Browse by destination</div>
        <div className="hm-selects">
          <label className="hm-select">
            <span className="hm-select-cap">Country</span>
            <div className="hm-select-box">
              <select value={country ?? ''} onChange={(e) => onCountry(e.target.value)}>
                <option value="">All destinations</option>
                {countryList.map((co) => (
                  <option key={co} value={co}>
                    {co} ({countries[co].count})
                  </option>
                ))}
              </select>
              <span className="hm-select-chev">▾</span>
            </div>
          </label>

          <label className={'hm-select' + (country ? '' : ' is-disabled')}>
            <span className="hm-select-cap">City</span>
            <div className="hm-select-box">
              <select value={cityF ?? ''} disabled={!country} onChange={(e) => setCityF(e.target.value || null)}>
                <option value="">{country ? `All of ${country}` : 'Pick a country first'}</option>
                {country &&
                  cityList.map((ci) => (
                    <option key={ci} value={ci}>
                      {ci} ({countries[country].cities[ci]})
                    </option>
                  ))}
              </select>
              <span className="hm-select-chev">▾</span>
            </div>
          </label>
        </div>
      </div>

      <div className="hm-cat-hd">
        <h2>
          {shown.length} {shown.length === 1 ? 'guide' : 'guides'}
        </h2>
        <span>{scope ? scope : 'All destinations'}</span>
      </div>
      <div className="hm-catalogue">
        {shown.length ? (
          shown.map((c) => (
            <CreatorCard
              key={`${c.handle}:${c.guideId ?? 'guide'}`}
              creator={c}
              onOpen={(cr) => router.push(`/c/${cr.handle}/${cr.guideId ?? 'guide'}`)}
            />
          ))
        ) : (
          <div className="mp-empty">No guides in this destination yet.</div>
        )}
      </div>
      <div className="hm-pad" />
    </div>
  );
}
