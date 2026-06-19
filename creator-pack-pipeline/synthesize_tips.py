# -*- coding: utf-8 -*-
"""
Synthesize travel *tips* from plan-category gems.

A tip is NOT a place and NOT an itinerary — it's concise practical advice for a
(mostly first-time / tourist) traveler. Each gem's `hook` is already the 5-20 word
tip line; `why` is the expandable detail.

Two unit shapes (per the product model):
  - solo  : a subcategory with exactly 1 tip  -> a standalone line, NO heading
  - group : a subcategory with >=2 tips        -> a heading + bullet list

Ordering is hybrid: tourist-importance of the subcategory first, then group size
(richer blocks lead within a priority tier). A creator with no plan gems emits
nothing — tips are surfaced, not manufactured.

Run:  python3 synthesize_tips.py
Out:  ../tips.json   (next to creator-pack-workbench.html so it can be fetched)
"""
import json, os
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC  = os.path.join(ROOT, "classified-items-v2.json")
OUT  = os.path.join(ROOT, "tips.json")

GROUP_MIN = 2     # a subcategory needs this many tips to become a headed group

# subcategory -> reader-facing heading
HEADING = {
    "where-to-go":  "Where to go instead",
    "budget-hack":  "Cost-saving hacks",
    "when-to-go":   "When to go",
    "transit":      "Getting around",
    "booking":      "Booking tips",
    "packing":      "What to pack",
    "what-to-skip": "Good to know",
    "points-miles": "Points & miles",
}
# tourist-importance order (index 0 = most important to a first-timer)
TIP_PRIORITY = ["where-to-go", "when-to-go", "transit", "budget-hack", "booking",
                "packing", "what-to-skip", "points-miles"]

# A tip that recommends an alternative/underrated *destination* ("go to Nagano",
# "Japan beyond Tokyo", "Ski Japan not Colorado") is a where-to-go tip regardless
# of the subcategory the classifier assigned it. Detect by phrasing.
WHERE_PATTERNS = ["beyond", "more than just", "best-kept secret", "best kept secret",
                  "secret side", "off-the-beaten", "off the beaten", "for less than",
                  "instead of", "international escape", "escape right now"]

def where_to_go(it):
    blob = f"{it.get('hook') or ''} {it.get('name') or ''}".lower()
    return any(p in blob for p in WHERE_PATTERNS)

CONF_W = {"high": 1.0, "medium": 0.6, "low": 0.2}


def tip_text(it):
    """The concise 5-20 word tip line, from the hook (the why is detail)."""
    h = (it.get("hook") or "").strip().rstrip(".")
    words = h.split()
    if len(words) < 5 and it.get("name"):       # too terse — add the subject
        h = f"{h}: {it['name']}".strip()
        words = h.split()
    if len(words) > 20:                          # too long — clamp
        h = " ".join(words[:20])
    return h

def tip_obj(it):
    return {
        "text": tip_text(it),
        "detail": it.get("why"),
        "name": it.get("name"),
        "subcategory": it.get("subcategory"),
        "place": it.get("city") or it.get("region") or it.get("destination"),
        "themes": it.get("themes") or [],
        "confidence": it.get("confidence"),
        "saved_from": it.get("saved_from") or 1,
        "source_reel": it.get("source_reel"),
    }

def rank_tips(items):
    return sorted(items, key=lambda it: (CONF_W.get(it.get("confidence"), 0.2),
                                         it.get("saved_from") or 1), reverse=True)

def slug(s):
    return "".join(c if c.isalnum() else "-" for c in str(s or "").lower()).strip("-")

def priority_index(subcat):
    return TIP_PRIORITY.index(subcat) if subcat in TIP_PRIORITY else len(TIP_PRIORITY)


def synthesize(items):
    plan = [it for it in items if it.get("category") == "plan"]
    by_creator = defaultdict(list)
    for it in plan:
        by_creator[it.get("creator")].append(it)

    all_units = []
    for creator, tips in by_creator.items():
        sub = defaultdict(list)
        for it in tips:
            subcat = "where-to-go" if where_to_go(it) else (it.get("subcategory") or "what-to-skip")
            sub[subcat].append(it)

        units = []
        for subcat, arr in sub.items():
            arr = rank_tips(arr)
            place = (arr[0].get("destination") or arr[0].get("region")
                     or arr[0].get("city"))
            if len(arr) >= GROUP_MIN:
                units.append({
                    "id": f"{creator}-tips-{slug(subcat)}",
                    "creator": creator, "kind": "group",
                    "subcategory": subcat, "heading": HEADING.get(subcat, "Good to know"),
                    "place": place, "size": len(arr),
                    "tips": [tip_obj(it) for it in arr],
                })
            else:
                units.append({
                    "id": f"{creator}-tip-{slug(subcat)}",
                    "creator": creator, "kind": "solo",
                    "subcategory": subcat, "place": place, "size": 1,
                    "tip": tip_obj(arr[0]),
                })

        # hybrid sort: tourist priority first, then richer groups within a tier
        units.sort(key=lambda u: (priority_index(u["subcategory"]), -u["size"]))
        all_units += units

    return all_units


def main():
    items = json.load(open(SRC))["items"]
    units = synthesize(items)

    by_creator = defaultdict(lambda: {"units": 0, "tips": 0})
    for u in units:
        by_creator[u["creator"]]["units"] += 1
        by_creator[u["creator"]]["tips"] += u["size"]

    out = {
        "counts": {
            "units": len(units),
            "tips": sum(u["size"] for u in units),
            "by_creator": {c: v for c, v in by_creator.items()},
        },
        "config": {"GROUP_MIN": GROUP_MIN, "priority": TIP_PRIORITY},
        "units": units,
    }
    json.dump(out, open(OUT, "w"), ensure_ascii=False, indent=1)
    print(f"wrote {OUT}")
    print(f"  {len(units)} units, {out['counts']['tips']} tips")
    for c, v in by_creator.items():
        print(f"    {c:20} {v['units']} units / {v['tips']} tips")


if __name__ == "__main__":
    main()
