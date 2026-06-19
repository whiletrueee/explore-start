# -*- coding: utf-8 -*-
"""Geocode one creator's v2 items (location_text -> lat/lng) via Nominatim and
emit a derived pack data file the prototype consumes. Geocoding is cached so
re-runs are instant. Run once; output is static.

Usage: python3 geocode_pack.py empty.japan
"""
import json, sys, time, urllib.parse, urllib.request, os

ROOT = os.environ.get("PIPELINE_ROOT", "/Users/headout/Documents/Yuvraj 2026/Claude - Headout/Headstart 2.0 - Hackin 2026/Hackin 2026 - Headstart 2.0")
CACHE = ROOT + "/creator-pack-pipeline/.geocode-cache.json"
CREATOR = sys.argv[1] if len(sys.argv) > 1 else "empty.japan"

# 'country' anchors the city-level geocode fallback (and is generalisable per creator).
META = {
  'empty.japan':                  {'name': 'empty.japan',              'tag': 'Japan secret spots',      'color': '#7A4FA3', 'destination': 'Japan',     'country': 'Japan',                 'center': [37.0, 137.5],     'zoom': 5,  'cityZoom': 12},
  'exploringlondon':              {'name': 'exploringlondon',          'tag': 'London & the UK',         'color': '#2D6A8E', 'destination': 'UK',        'country': 'United Kingdom',        'center': [53.0, -1.5],      'zoom': 6,  'cityZoom': 12},
  'thefloridaqueenie':            {'name': 'thefloridaqueenie',        'tag': 'Gulf-Coast Florida',      'color': '#F2542D', 'destination': 'Florida',   'country': 'United States',         'center': [27.8, -82.4],     'zoom': 7,  'cityZoom': 12},
  'raimeetravel':                 {'name': 'raimeetravel',             'tag': 'Travel hacks + Japan',    'color': '#C9962B', 'destination': 'Japan',     'country': 'Japan',                 'center': [37.0, 137.5],     'zoom': 5,  'cityZoom': 12},
  'blacktravelpin-dubai':         {'name': 'blacktravelpin',           'tag': 'Dubai luxe & gems',       'color': '#C9962B', 'destination': 'Dubai',     'country': 'United Arab Emirates',  'center': [25.08, 55.20],    'zoom': 10, 'cityZoom': 12},
  'ladyandhersweetescapes-dubai': {'name': 'Lady & Her Sweet Escapes', 'tag': 'Dubai eats & escapes',    'color': '#D94F70', 'destination': 'Dubai',     'country': 'United Arab Emirates',  'center': [25.08, 55.20],    'zoom': 10, 'cityZoom': 12},
  'dotzsoh-singapore':            {'name': 'dotzsoh',                  'tag': 'Singapore & beyond',      'color': '#2E8B7F', 'destination': 'Singapore', 'country': 'Singapore',             'center': [1.3521, 103.8198],'zoom': 11, 'cityZoom': 13},
}
m = META[CREATOR]
COUNTRY = m.get("country", "Japan")

cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}

def geocode(q):
    if q in cache:
        return cache[q]
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(
        {"q": q, "format": "json", "limit": 1})
    req = urllib.request.Request(url, headers={"User-Agent": "headstart-proto/1.0 (yuvraj@headout.com)"})
    try:
        r = json.load(urllib.request.urlopen(req, timeout=15))
        res = [float(r[0]["lat"]), float(r[0]["lon"])] if r else None
    except Exception as e:
        print("  geocode FAIL", q[:40], e); res = None
    cache[q] = res
    json.dump(cache, open(CACHE, "w"))
    time.sleep(1.1)  # Nominatim policy: <=1 req/s
    return res

items_all = json.load(open(ROOT + "/classified-items-v2.json"))["items"]
items = [i for i in items_all if i.get("creator") == CREATOR]
print(f"{CREATOR}: {len(items)} items")

KEEP = ["id", "hook", "name", "why", "category", "subcategory", "city", "area",
        "region", "location_text", "website", "price_text", "date_info", "themes",
        "source_reel", "saved_from", "media_url", "profile"]

def jitter(pt, seed):
    # deterministic ~<=1km spread so city-fallback pins don't stack
    h = sum(ord(c) for c in seed)
    return [round(pt[0] + ((h % 19) - 9) * 0.0016, 5), round(pt[1] + ((h // 19 % 19) - 9) * 0.0016, 5)]

def candidates(it):
    """Ordered geocode queries. The full location_text is the only 'exact' try;
    everything after is a coarser fallback (jittered, flagged approx). Dropping the
    leading proper-name token and a bare-city query (no forced country) lets a global
    creator's far-flung places still pin when the precise string or the home-country
    fallback misses."""
    out = []
    loc = (it.get("location_text") or "").strip()
    if loc:
        out.append(loc)
        parts = [p.strip() for p in loc.split(",") if p.strip()]
        for k in range(1, len(parts)):          # progressively coarser address suffixes
            out.append(", ".join(parts[k:]))
    city, region = it.get("city"), it.get("region")
    for base in (city, region):
        if base:
            out += [base + ", " + COUNTRY, base]  # home-country first (disambiguates), then bare
    seen, uniq = set(), []
    for q in out:
        if q and q not in seen:
            seen.add(q); uniq.append(q)
    return uniq

def resolve(it):
    for idx, q in enumerate(candidates(it)):
        pt = geocode(q)
        if pt:
            return (pt, "exact") if idx == 0 else (jitter(pt, it["id"]), "approx")
    return None, None

out_items, geo_n, approx_n = [], 0, 0
for it in items:
    o = {k: it.get(k) for k in KEEP}
    pt, how = resolve(it)
    if pt:
        o["lat"], o["lng"] = pt
        o["approx"] = (how == "approx")
        geo_n += 1; approx_n += (how == "approx")
    out_items.append(o)
print(f"geocoded {geo_n}/{len(items)} ({approx_n} approx city-level)")

# city buckets: centroid of each city's geocoded items
from collections import defaultdict
bycity = defaultdict(list)
for o in out_items:
    if o.get("lat") is not None:
        bycity[o.get("city") or ("Around " + m["destination"])].append(o)
cityMeta = {}
for city, gs in bycity.items():
    lat = sum(g["lat"] for g in gs) / len(gs)
    lng = sum(g["lng"] for g in gs) / len(gs)
    cityMeta[city] = {"center": [round(lat, 5), round(lng, 5)], "zoom": m["cityZoom"], "count": len(gs)}

# the creator's itineraries; hero = the one for the most-pinned city (else longest)
itins = json.load(open(ROOT + "/itineraries.json"))["itineraries"]
mine = [x for x in itins if x.get("creator") == CREATOR]
city_rank = {c: i for i, (c, _) in enumerate(sorted(cityMeta.items(), key=lambda kv: -kv[1]["count"]))}
mine.sort(key=lambda x: (city_rank.get(x.get("city"), len(city_rank)), -x.get("days_count", 0)))
itinerary = mine[0] if mine else None

pack = {
    "creator": {"handle": CREATOR, **{k: m[k] for k in ("name", "tag", "color", "destination")}},
    "center": m["center"], "zoom": m["zoom"],
    "cityMeta": cityMeta,
    "items": out_items,
    "itinerary": itinerary,
    "itineraries": mine,
    "price": 3,
}
OUTDIR = os.environ.get("PIPELINE_PACK_OUTDIR", ROOT + "/prototype/data"); os.makedirs(OUTDIR, exist_ok=True)
PREFIX = os.environ.get("PIPELINE_PACK_PREFIX", "pack-")
outpath = os.path.join(OUTDIR, PREFIX + CREATOR.replace(".", "") + ".json")
json.dump(pack, open(outpath, "w"), ensure_ascii=False, indent=1)
print("wrote", outpath, "| cities:", {c: v["count"] for c, v in sorted(cityMeta.items(), key=lambda x: -x[1]["count"])})
print("itinerary:", itinerary["title"] if itinerary else None)
