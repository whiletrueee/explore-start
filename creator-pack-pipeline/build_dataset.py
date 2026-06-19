# -*- coding: utf-8 -*-
"""
Build the canonical Field Atlas dataset (schema_v3) from classified gems.

Output: ../field-atlas-data.json  — three tables:
  creators[]  — all creators (incl. ones with no guide, e.g. raimeetravel)
  guides[]    — city-level guides with lens / blurb / hero (guide-page metadata)
  gems[]      — every gem, all v3 columns; lat/lng + headout_* + media_url blank (fill_later)

New in v3 vs the old classified record:
  + lat, lng                                            (blank, bulk-fill later)
  + headout_tgid, headout_poi (yes/no),
    headout_subcategory_id, headout_collection_id        (blank, bulk-fill later)
  + guide_id                                             (derived)
  - hours (profile flag + any field)                     (dropped)
  - _city                                                (internal alias dropped)
"""
import json, os
from collections import Counter
from guides import resolve_guides, guide_for_city

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC  = os.path.join(ROOT, "classified-items-v2.json")
OUT  = os.path.join(ROOT, "field-atlas-data.json")

CREATOR_META = {
    "thefloridaqueenie":            {"name": "thefloridaqueenie",      "tag": "Gulf-Coast Florida",   "color": "#F2542D"},
    "exploringlondon":              {"name": "exploringlondon",        "tag": "London & the UK",      "color": "#2D6A8E"},
    "empty.japan":                  {"name": "empty.japan",            "tag": "Japan secret spots",   "color": "#7A4FA3"},
    "raimeetravel":                 {"name": "raimeetravel",           "tag": "Travel hacks + Japan", "color": "#C9962B"},
    "blacktravelpin-dubai":         {"name": "blacktravelpin",         "tag": "Dubai",                "color": "#B5651D"},
    "ladyandhersweetescapes-dubai": {"name": "ladyandhersweetescapes", "tag": "Dubai · sweet escapes","color": "#C0398A"},
    "dotzsoh-singapore":            {"name": "dotzsoh",                "tag": "Singapore",            "color": "#1F8A70"},
}
LOCAL_AXIS   = {"hidden-gem", "free", "budget", "local-favorite", "seasonal"}
TOURIST_AXIS = {"bucket-list", "photo-spot", "luxury", "family", "nightlife"}

def conf_w(g):
    return {"high": 1.0, "medium": 0.6, "low": 0.2}.get(g.get("confidence"), 0.2)

def gem_record(it, guide_id):
    p = dict(it.get("profile") or {})
    p.pop("hours", None)                       # v3: hours dropped
    return {
        # identity / editorial
        "id": it.get("id"), "name": it.get("name"), "hook": it.get("hook"),
        "why": it.get("why"), "confidence": it.get("confidence"),
        # taxonomy
        "category": it.get("category"), "subcategory": it.get("subcategory"),
        "themes": it.get("themes") or [],
        # location
        "destination": it.get("destination"), "region": it.get("region"),
        "city": it.get("city"), "area": it.get("area"),
        "location_text": it.get("location_text"),
        "lat": None, "lng": None,              # fill_later (bulk geocode)
        "scope": p.get("scope"),
        # links
        "website": it.get("website"),
        "source_reel": it.get("source_reel"), "source_reels": it.get("source_reels") or [],
        # headout (fill_later)
        "headout_tgid": None, "headout_poi": None,
        "headout_subcategory_id": None, "headout_collection_id": None,
        # temporal / price
        "date_info": it.get("date_info"), "price_text": it.get("price_text"),
        # provenance
        "creator": it.get("creator"), "reel_id": it.get("reel_id"),
        "saved_from": it.get("saved_from") or 1,
        # media
        "media_brief": it.get("media_brief"), "media_url": None,   # fill_later
        # per-type field expectations (hours removed)
        "profile": p,
        # derived
        "guide_id": guide_id,
    }

def guide_lens(gems):
    c = Counter(t for g in gems for t in (g.get("themes") or []))
    loc = sum(c[t] for t in LOCAL_AXIS); tou = sum(c[t] for t in TOURIST_AXIS)
    return "local" if loc > tou else "tourist"

def guide_blurb(label, gems):
    themes = [t for t, _ in Counter(t for g in gems for t in (g.get("themes") or [])).most_common(3)]
    cats = [c for c, _ in Counter(g.get("category") for g in gems).most_common(3)]
    bits = ", ".join(themes) if themes else ", ".join(cats)
    return f"{len(gems)} gems across {label} — {bits}."

def main():
    items = json.load(open(SRC))["items"]
    G = resolve_guides(items)

    # ---- gems (every creator, every gem; guide_id may be null) ----
    gems = []
    by_guide = {}
    for it in items:
        gid = guide_for_city(G, it.get("creator"), it.get("city"))
        rec = gem_record(it, gid)
        gems.append(rec)
        if gid:
            by_guide.setdefault(gid, []).append(rec)

    # ---- guides (with lens / blurb / hero) ----
    guides = []
    for cr, gs in G.items():
        for g in gs:
            members = by_guide.get(g["id"], [])
            hero = max(members, key=lambda m: (conf_w(m), m.get("saved_from") or 1))["id"] if members else None
            guides.append({
                "id": g["id"], "creator": cr, "label": g["label"],
                "level": "destination" if g["label"].lower() == (g["destination"] or "").lower() else "city",
                "destination": g["destination"], "cities": sorted(g["cities"]),
                "n_gems": g["n"], "lens": guide_lens(members),
                "blurb": guide_blurb(g["label"], members),
                "hero_gem_id": hero, "hero_image": None,     # fill_later
            })
    guides.sort(key=lambda x: x["n_gems"], reverse=True)

    # ---- creators (all 7, incl. guideless) ----
    creators = []
    gem_ct = Counter(g["creator"] for g in gems)
    for cr in gem_ct:
        m = CREATOR_META.get(cr, {"name": cr, "tag": "", "color": "#888"})
        creators.append({
            "id": cr, **m, "n_gems": gem_ct[cr],
            "guide_ids": [g["id"] for g in guides if g["creator"] == cr],
        })

    out = {
        "version": 3, "schema": "schema_v3.json",
        "counts": {"creators": len(creators), "guides": len(guides), "gems": len(gems),
                   "guided_gems": sum(1 for g in gems if g["guide_id"]),
                   "guideless_gems": sum(1 for g in gems if not g["guide_id"])},
        "creators": creators, "guides": guides, "gems": gems,
    }
    json.dump(out, open(OUT, "w"), ensure_ascii=False, indent=1)
    print(f"wrote {OUT}")
    print(f"  creators {len(creators)} | guides {len(guides)} | gems {len(gems)} "
          f"(guided {out['counts']['guided_gems']}, guideless {out['counts']['guideless_gems']})")
    for c in creators:
        gl = ", ".join(f"{g['label']}({g['n_gems']},{g['lens']})" for g in guides if g["creator"] == c["id"]) or "— no guide"
        print(f"    {c['id']:32} {c['n_gems']:4} gems | {gl}")


if __name__ == "__main__":
    main()
