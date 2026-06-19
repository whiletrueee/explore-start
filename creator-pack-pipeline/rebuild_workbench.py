# -*- coding: utf-8 -*-
"""
Rebuild the workbench's embedded data blob from the canonical Field Atlas dataset
(field-atlas-data.json, schema_v3) — preserving the page's CSS/JS untouched.

Single source of truth: build_dataset.py -> field-atlas-data.json. This script only
*reshapes* it for the page (wb tree, creatorMeta, guides) and routes lists/tips/itins
to guides. Base64 media (blank in the dataset) is re-attached from the existing blob.

Run order:  build_dataset.py  ->  synthesize_lists.py / synthesize_tips.py  ->  rebuild_workbench.py
"""
import json, os
from collections import defaultdict, Counter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
HTML = os.path.join(ROOT, "creator-pack-workbench.html")
DATA = os.path.join(ROOT, "field-atlas-data.json")
ITIN = os.path.join(ROOT, "itineraries.json")
LISTS = os.path.join(ROOT, "lists.json")
TIPS  = os.path.join(ROOT, "tips.json")

CATS = [["eat", "Eat"], ["drink", "Drink"], ["stay", "Stay"], ["see-do", "See & do"],
        ["shop", "Shop"], ["view", "View"], ["nature", "Nature"], ["plan", "Plan"],
        ["itinerary", "Itinerary"], ["list", "List"]]


def extract_old(html):
    i = html.index("const DB=")
    d = html.index("const {wb,creatorMeta", i)
    blob = json.loads(html[i + len("const DB="):d].rstrip().rstrip(";").rstrip())
    return blob, i, d


def media_map_from(blob):
    m = {}
    for cr in blob.get("wb", {}).values():
        for ci in cr.get("cities", {}).values():
            for it in ci.get("items", []):
                mu = it.get("media_url")
                if mu and isinstance(mu, str) and len(mu) > 20:
                    m[it["id"]] = mu
    return m


def build_wb(gems, media):
    by_creator = defaultdict(list)
    for g in gems:
        by_creator[g["creator"]].append(g)
    wb = {}
    for creator, gs in by_creator.items():
        cities = {}
        buckets = defaultdict(list)
        for g in gs:
            key = g.get("city") or g.get("region") or g.get("destination") or "Other"
            buckets[key].append(g)
        for city, items in buckets.items():
            items = sorted(items, key=lambda x: (x.get("category") or "", x.get("name") or ""))
            for it in items:
                if not it.get("media_url") and it["id"] in media:
                    it["media_url"] = media[it["id"]]
            cities[city] = {"n": len(items),
                            "cats": dict(Counter(it.get("category") for it in items)),
                            "items": items}
        wb[creator] = {"total": len(gs), "cities": cities}
    return wb


def tag_content(path, key, router):
    doc = json.load(open(path))
    routed = 0
    for r in doc[key]:
        gid = router(r)
        r["guide_id"] = gid
        routed += bool(gid)
    json.dump(doc, open(path, "w"), ensure_ascii=False, indent=1)
    print(f"  tagged {os.path.basename(path)}: {routed}/{len(doc[key])} routed")


def main():
    html = open(HTML, encoding="utf-8").read()
    old_blob, i, d = extract_old(html)
    media = media_map_from(old_blob)

    data = json.load(open(DATA))
    gems, guides, creators = data["gems"], data["guides"], data["creators"]

    # routing maps from the canonical guides
    city2guide, dest2guide = {}, {}
    for g in sorted(guides, key=lambda x: x["n_gems"]):   # larger wins on ties
        for c in g["cities"]:
            city2guide[(g["creator"], c)] = g["id"]
        dest2guide[(g["creator"], g["destination"])] = g["id"]
    g_city = lambda cr, c: city2guide.get((cr, c))
    g_dest = lambda cr, ds: dest2guide.get((cr, ds))

    # itineraries -> guide by city
    itins = json.load(open(ITIN)).get("itineraries", [])
    for it in itins:
        it["guide_id"] = g_city(it.get("creator"), it.get("city"))
    # lists -> by city place ; tips -> by destination place
    tag_content(LISTS, "lists", lambda r: g_city(r["creator"], r.get("place")))
    tag_content(TIPS, "units", lambda r: g_dest(r["creator"], r.get("place")))

    wb = build_wb(gems, media)
    creatorMeta = {c["id"]: {"name": c["name"], "tag": c["tag"], "c": c["color"]} for c in creators}
    guides_blob = {}
    for g in guides:
        guides_blob.setdefault(g["creator"], []).append({
            "id": g["id"], "label": g["label"], "n": g["n_gems"], "level": g["level"],
            "destination": g["destination"], "cities": g["cities"],
            "lens": g["lens"], "blurb": g["blurb"], "hero_image": g["hero_image"],
        })

    new_blob = {"wb": wb, "creatorMeta": creatorMeta, "cats": CATS,
                "schema": old_blob.get("schema", {}), "itins": itins, "guides": guides_blob}
    new_html = html[:i] + "const DB=" + json.dumps(new_blob, ensure_ascii=False) + "; " + html[d:]
    open(HTML, "w", encoding="utf-8").write(new_html)

    print(f"re-attached media for {len(media)} gems")
    print(f"creators {len(creators)} | guides {len(guides)} | gems {len(gems)}")
    print(f"wrote {HTML} ({len(new_html):,} bytes)")


if __name__ == "__main__":
    main()
