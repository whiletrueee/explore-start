# -*- coding: utf-8 -*-
"""
Guide resolution — group a creator's content into city-level *guides*.

Rule (threshold = MIN_GEMS):
  - within each destination, find cities with >= MIN_GEMS gems
  - >=2 such cities  -> ONE destination-as-city guide  (e.g. "Florida")
  - exactly 1        -> that city is the guide          (Kyoto, London, Dubai, Singapore, Macau)
  - 0                -> no guide for that destination
  Gems outside a guide's cities are not part of any guide. They are NOT removed
  from the dataset: build_dataset keeps every gem and sets guide_id=null for them.

Routing:
  - gem        -> guide whose .cities contains gem.city
  - list       -> guide whose .cities contains list.place   (lists are city-keyed)
  - itinerary  -> guide whose .cities contains itinerary.city
  - tip unit   -> guide whose .destination == tip.place      (tips are destination-keyed)
"""
import re
from collections import defaultdict, Counter

MIN_GEMS = 10

def _slug(s):
    return re.sub(r"[^a-z0-9]+", "-", str(s).lower()).strip("-")

def resolve_guides(items):
    """items: classified gems. Returns {creator: [guide,...]} where a guide is
    {id,label,creator,destination,cities(set),gem_ids(set),n}."""
    by_creator = defaultdict(list)
    for it in items:
        by_creator[it.get("creator")].append(it)

    out = {}
    for creator, its in by_creator.items():
        guides = []
        by_dest = defaultdict(list)
        for it in its:
            by_dest[it.get("destination")].append(it)
        for dest, gems in by_dest.items():
            city_ct = Counter(g.get("city") for g in gems if g.get("city"))
            big = [c for c, n in city_ct.items() if n >= MIN_GEMS]
            if len(big) >= 2:
                # destination-as-city guide (e.g. Florida): keep the whole destination
                label = (dest or "").title()
                cities = set(city_ct)
                members = gems
            elif len(big) == 1:
                city = big[0]
                label = city
                cities = {city}
                members = [g for g in gems if g.get("city") == city]
            else:
                continue
            guides.append({
                "id": f"{creator}-{_slug(label)}",
                "label": label, "creator": creator, "destination": dest,
                "cities": cities, "gem_ids": {g["id"] for g in members}, "n": len(members),
            })
        guides.sort(key=lambda g: g["n"], reverse=True)
        out[creator] = guides
    return out

def guide_for_city(guides, creator, city):
    for g in guides.get(creator, []):
        if city in g["cities"]:
            return g["id"]
    return None
