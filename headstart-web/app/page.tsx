'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Discovery, DiscoveryCreator } from '@/lib/types';
import CreatorCard from '@/components/CreatorCard';

const DEST_COUNTRY: Record<string, string> = {
  Dubai: 'UAE',
  Singapore: 'Singapore',
  London: 'UK',
  Florida: 'USA',
  Japan: 'Japan',
};

export default function Home() {
  const router = useRouter();
  const [disc, setDisc] = useState<Discovery | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [cityF, setCityF] = useState<string | null>(null);

  useEffect(() => {
    fetch('/data/discovery.json').then((r) => r.json()).then(setDisc);
  }, []);

  if (!disc) return <div className="hm"><div className="mp-empty">Loading…</div></div>;

  const creators = disc.creators;
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

  const allOff = () => {
    setCountry(null);
    setCityF(null);
  };
  const pickCountry = (co: string) => {
    if (co === country) allOff();
    else {
      setCountry(co);
      setCityF(null);
    }
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
        <div className="hm-chiprow">
          <button className={'hm-fchip' + (!country ? ' on' : '')} onClick={allOff}>
            All
          </button>
          {countryList.map((co) => (
            <button key={co} className={'hm-fchip' + (country === co ? ' on' : '')} onClick={() => pickCountry(co)}>
              {co}
              <i>{countries[co].count}</i>
            </button>
          ))}
        </div>
        {country && cityList.length ? (
          <div className="hm-chiprow hm-chiprow-sub">
            <button className={'hm-fchip hm-fchip-sm' + (!cityF ? ' on' : '')} onClick={() => setCityF(null)}>
              All of {country}
            </button>
            {cityList.map((ci) => (
              <button
                key={ci}
                className={'hm-fchip hm-fchip-sm' + (cityF === ci ? ' on' : '')}
                onClick={() => setCityF(cityF === ci ? null : ci)}
              >
                {ci}
                <i>{countries[country].cities[ci]}</i>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="hm-cat-hd">
        <h2>
          {shown.length} {shown.length === 1 ? 'guide' : 'guides'}
        </h2>
        <span>{scope ? scope : 'All destinations'}</span>
      </div>
      <div className="hm-catalogue">
        {shown.length ? (
          shown.map((c) => <CreatorCard key={c.handle} creator={c} onOpen={(cr) => router.push(`/c/${cr.handle}/guide`)} />)
        ) : (
          <div className="mp-empty">No guides in this destination yet.</div>
        )}
      </div>
      <div className="hm-pad" />
    </div>
  );
}
