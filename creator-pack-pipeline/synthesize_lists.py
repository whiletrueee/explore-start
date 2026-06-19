# -*- coding: utf-8 -*-
"""
Synthesize curated *lists* from classified gems.

A list is NOT an itinerary (no time slots). It is:  AXIS x PLACE x AUDIENCE-LENS
over a cluster of corroborated gems, with a punchy headline and a ranked menu of
options ("pick one or two").

Pipeline (per creator):
  axis ladder  : hybrid (theme x category)  ->  type (subcat/category)  ->  theme
  place        : city first; roll up to region only if no city clears
  collapse     : theme == category synonym  ->  clean type list
  dedup        : >70% gem overlap -> keep the more distinctive axis
  lens         : axis theme drives voice; creator prior breaks ties
  quality bar  : cardinality + corroboration + distinctiveness + tightness
                 nothing clears -> structured no_list{reason, remedy}  (no filler)
  + "from" family : day-trip gems -> "Day trips from <hub>"
  (plan-category gems are excluded — they're surfaced as Tips, see synthesize_tips.py)

Run:  python3 synthesize_lists.py
Out:  ../lists.json   (next to creator-pack-workbench.html so it can be fetched)
"""
import json, os, re
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC  = os.path.join(ROOT, "classified-items-v2.json")
OUT  = os.path.join(ROOT, "lists.json")

# ---------------------------------------------------------------- thresholds
FLOOR        = {"hybrid": 4, "type": 4, "theme": 6, "from": 4}
REGION_BONUS = 1        # region rollups must be bigger than city lists
DEDUP_JACCARD = 0.40    # drop a list overlapping an already-kept one above this (higher bar)
CORRO_MIN    = {"city": 0.45, "region": 0.55}   # corroboration floor by tightness
CAP_PER_CREATOR = 12    # surface only the best N; quality over quantity
NOUN_CAP   = 2          # max lists sharing a head-noun ("food spots", "things to do")
THEME_CAP  = 2          # max lists per axis-theme per creator (no "four hidden gems")
CONCENTRATION_MIN = 0.5 # hub must hold this share of a creator's footprint to be a "home base"
CATCHALL_DEST = {"other", "misc", "none", ""}   # unreliable destination labels
MIN_POOL_ABSTAIN = 4    # only flag "no_list" for places with real-but-insufficient presence
ABSTAIN_PER_CREATOR = 3 # only the top near-misses, not every thin town

# axis specificity ranking — drives both dedup priority and the quality score
AXIS_WEIGHT = {"hybrid": 4.0, "type": 3.0, "from": 2.5, "theme": 2.0}

# axis themes that *define* a list's audience (override creator prior)
LOCAL_AXIS  = {"hidden-gem", "free", "budget", "local-favorite", "seasonal"}
TOURIST_AXIS = {"bucket-list", "photo-spot", "luxury", "family", "nightlife"}

# themes that merely echo a category -> collapse hybrid to a clean type list
THEME_IS_CATEGORY = {"food": "eat", "nature": "nature", "nightlife": "drink"}

# themes too generic to anchor a *theme-only* list (they echo categories)
WEAK_THEME = {"food", "nature"}

# broad categories that need a subcategory/theme to be a list (a bare dump is not)
BROAD_CATEGORY = {"see-do", "eat"}

CREATOR_PRIOR = {
    "empty.japan": "local",
    "exploringlondon": "tourist",
    "thefloridaqueenie": "tourist",
    "raimeetravel": "tourist",
}

# ---------------------------------------------------------------- vocab
TYPE_NOUN = {
    "eat": "food spots", "drink": "bars & drinks", "see-do": "things to do",
    "nature": "nature escapes", "shop": "shops", "stay": "stays",
    "view": "viewpoints", "plan": "tips",
}
SUBCAT_NOUN = {
    "cocktail-bar": "cocktail bars", "wine-bar": "wine bars", "speakeasy": "speakeasies",
    "rooftop": "rooftop bars", "brewery": "breweries", "coffee": "coffee shops",
    "cafe": "cafés", "restaurant": "restaurants", "fine-dining": "fine-dining spots",
    "bakery-dessert": "bakeries & dessert spots", "street-food": "street-food stops",
    "food-hall": "food halls", "market": "markets", "museum-gallery": "museums & galleries",
    "landmark": "landmarks", "experience": "experiences", "tour": "tours", "show": "shows",
    "class-workshop": "classes & workshops", "nightlife": "nightlife spots",
    "park-garden": "parks & gardens", "beach": "beaches", "hike-trail": "hikes & trails",
    "waterfall": "waterfalls", "island": "islands", "natural-landmark": "natural landmarks",
    "observation-deck": "observation decks", "skyline": "skyline views",
    "scenic-overlook": "scenic overlooks", "photo-spot": "photo spots",
    "boutique": "boutiques", "bookstore": "bookshops", "specialty": "specialty shops",
    "mall": "malls", "hotel": "hotels", "boutique-hotel": "boutique hotels",
    "resort": "resorts", "hostel": "hostels", "unique-stay": "unique stays",
}
# index 0 = primary phrasing; extra entries are rotated in to de-duplicate headlines
THEME_ADJ_VARIANTS = {
    "hidden-gem":  ["Hidden-gem", "Under-the-radar", "Lesser-known"],
    "photo-spot":  ["Most photogenic", "Picture-perfect", "Instagram-ready"],
    "free":        ["Free", "No-spend", "Zero-cost"],
    "budget":      ["Budget", "Wallet-friendly", "Cheap & cheerful"],
    "seasonal":    ["Seasonal", "In-season", "Right-now"],
    "family":      ["Family-friendly", "Kid-approved", "Family"],
    "luxury":      ["Luxury", "High-end", "Splurge-worthy"],
    "nightlife":   ["Late-night", "After-dark", "Nightlife"],
    "bucket-list": ["Bucket-list", "Iconic", "Must-see"],
}
THEME_NOUN_VARIANTS = {   # for theme-only lists
    "hidden-gem":  ["Hidden gems", "Secret spots", "Local secrets"],
    "photo-spot":  ["Photo spots", "Most photogenic places", "Instagram-worthy spots"],
    "free":        ["Free things to do", "No-spend outings", "Free days out"],
    "budget":      ["Budget finds", "Money-savers", "Cheap thrills"],
    "seasonal":    ["Seasonal picks", "In-season highlights", "Right-now picks"],
    "family":      ["Family outings", "Kid-friendly days", "Family favourites"],
    "luxury":      ["Luxe picks", "High-end highlights", "Splurges"],
    "bucket-list": ["Bucket-list spots", "Iconic must-dos", "Big-ticket sights"],
    "nightlife":   ["Nightlife", "After-dark spots", "Night-out picks"],
}
LENS_PREFIX_VARIANTS = {
    "local":   ["Underrated", "Overlooked", "Under-the-radar", "Where locals go for"],
    "tourist": ["Best", "Top", "Standout", "Don't-miss"],
}
THEME_ADJ   = {k: v[0] for k, v in THEME_ADJ_VARIANTS.items()}
THEME_NOUN  = {k: v[0] for k, v in THEME_NOUN_VARIANTS.items()}
LENS_PREFIX = {k: v[0] for k, v in LENS_PREFIX_VARIANTS.items()}


# ---------------------------------------------------------------- helpers
def place_of(it):
    return it.get("city") or it.get("region") or it.get("destination")

def region_of(it):
    return it.get("region") or it.get("destination")

def is_daytrip(it):
    return it.get("subcategory") == "day-trip" or "day-trip" in (it.get("themes") or [])

def conf_w(it):
    return {"high": 1.0, "medium": 0.6, "low": 0.2}.get(it.get("confidence"), 0.2)

def corro_score(members):
    """0..1 — how *real* are these gems (confidence + cross-reel corroboration)."""
    s = sum(conf_w(m) for m in members) / len(members)
    multi = sum(1 for m in members if (m.get("saved_from") or 1) > 1) / len(members)
    return round(0.7 * s + 0.3 * multi, 3)

def lens_for(axis_theme, creator):
    if axis_theme in LOCAL_AXIS:   return "local"
    if axis_theme in TOURIST_AXIS: return "tourist"
    return CREATOR_PRIOR.get(creator, "tourist")

def reel_count(members):
    reels = set()
    for m in members:
        for r in (m.get("source_reels") or [m.get("source_reel")]):
            if r: reels.add(r)
    return len(reels)

def norm_name(nm):
    """Collapse 'Woolwich Town Hall — Victoria Hall' / 'Cafe X, Soho' to a base key."""
    base = re.split(r"\s[—–\-]\s|,|\(|:", str(nm or ""))[0]
    return re.sub(r"[^a-z0-9 ]", "", base.lower()).strip()

def dedup_by_name(members):
    """One option per real venue — keep the best-corroborated of any near-duplicates."""
    ranked = sorted(members, key=lambda m: (conf_w(m), m.get("saved_from") or 1), reverse=True)
    seen, out = set(), []
    for m in ranked:
        k = norm_name(m.get("name") or m.get("id"))
        if k and k in seen:
            continue
        seen.add(k); out.append(m)
    return out

def areas_of(members):
    c = Counter(m.get("area") for m in members if m.get("area"))
    return [a for a, _ in c.most_common()]

def price_band(members):
    have = [(m.get("price_text") or "").lower() for m in members if m.get("price_text")]
    if len(have) < max(2, round(len(members) * 0.3)):
        return None                       # too little price data to claim a band
    free = sum(1 for p in have if "free" in p)
    if free == len(have):       return "free"
    if free >= len(have) * 0.5: return "mostly-free"
    if free == 0:               return "paid"
    return "mixed"

def rank_options(members):
    """Best-corroborated first; high confidence, then saved_from."""
    def key(m):
        return (conf_w(m), m.get("saved_from") or 1)
    out = []
    for m in sorted(members, key=key, reverse=True):
        out.append({
            "gem_id": m.get("id"), "name": m.get("name"), "hook": m.get("hook"),
            "why": m.get("why"), "category": m.get("category"),
            "subcategory": m.get("subcategory"), "area": m.get("area"),
            "city": m.get("city"), "location_text": m.get("location_text"),
            "website": m.get("website"), "price_text": m.get("price_text"),
            "date_info": m.get("date_info"), "themes": m.get("themes") or [],
            "saved_from": m.get("saved_from") or 1, "confidence": m.get("confidence"),
            "source_reel": m.get("source_reel"), "media_url": m.get("media_url"),
        })
    return out

def gem_ids(members):
    return {m.get("id") for m in members}

def jaccard(a, b):
    if not a or not b: return 0.0
    return len(a & b) / len(a | b)


# ---------------------------------------------------------------- list builders
def make_list(creator, members, axis_type, place, tightness, *, theme=None,
              category=None, subcategory=None, frame="in"):
    """Build a list object if it clears the quality bar; else return a reason string."""
    members = dedup_by_name(members)     # one entry per real venue
    n = len(members)
    floor = FLOOR[axis_type] + (REGION_BONUS if tightness == "region" else 0)
    if n < floor:
        return ("sparse", f"{axis_label(axis_type, theme, category, subcategory)} in {place} "
                          f"({n} gems, need {floor})")
    corro = corro_score(members)
    if corro < CORRO_MIN[tightness]:
        return ("weak-corroboration", f"{axis_label(axis_type, theme, category, subcategory)} in {place} "
                                      f"({n} gems but corroboration {corro})")

    axis_theme = theme
    lens = lens_for(axis_theme, creator)
    headline = build_headline(axis_type, theme, category, subcategory, place, lens, frame)
    place_disp = place
    opts = rank_options(members)
    nreels = reel_count(members)
    lid = "-".join(filter(None, [creator, slug(place_disp), axis_type,
                                  slug(theme), slug(subcategory or category)]))
    return {
        "id": lid, "kind": "list", "creator": creator,
        "axis_type": axis_type, "axis": axis_label(axis_type, theme, category, subcategory),
        "place": place_disp, "place_scope": tightness, "frame": frame,
        "lens": lens, "headline": headline,
        "subhead": build_subhead(n, nreels, lens, frame),
        "count": n, "source_reel_count": nreels,
        "themes": top_themes(members),
        "areas": areas_of(members),          # neighborhoods the list spans (distinctive)
        "price_band": price_band(members),   # free | mostly-free | mixed | paid | null
        "lead": opts[0]["name"] if opts else None,
        "quality": {"cardinality": n, "corroboration": corro, "tightness": tightness},
        "options": opts,
        "_noun": noun_for(axis_type, theme, category, subcategory),
        "_theme": axis_theme,
        "_ids": [o["gem_id"] for o in opts],
    }

def noun_for(axis_type, theme, category, subcategory):
    if axis_type in ("hybrid", "type"):
        return SUBCAT_NOUN.get(subcategory) or TYPE_NOUN.get(category, category)
    if axis_type == "theme":
        return THEME_NOUN.get(theme, (theme or "").replace("-", " "))
    if axis_type == "from": return "day trips"
    return axis_type

def axis_label(axis_type, theme, category, subcategory):
    if axis_type == "hybrid": return f"{theme} × {category}"
    if axis_type == "type":   return subcategory or category
    if axis_type == "theme":  return theme
    if axis_type == "from":   return "day-trip"
    return axis_type

def build_headline(axis_type, theme, category, subcategory, place, lens, frame):
    prep = "from" if frame == "from" else "in"
    if axis_type == "hybrid":
        adj = THEME_ADJ.get(theme, theme.replace("-", " ").title())
        noun = SUBCAT_NOUN.get(subcategory) or TYPE_NOUN.get(category, category)
        return f"{adj} {noun} {prep} {place}"
    if axis_type == "type":
        noun = SUBCAT_NOUN.get(subcategory) or TYPE_NOUN.get(category, category)
        return f"{LENS_PREFIX[lens]} {noun} {prep} {place}"
    if axis_type == "theme":
        return f"{THEME_NOUN.get(theme, theme.replace('-', ' ').title())} {prep} {place}"
    if axis_type == "from":
        return f"Day trips from {place}"
    return f"{place}"

def build_subhead(n, nreels, lens, frame):
    who = "spots locals rate" if lens == "local" else "top picks"
    if frame == "from":
        return f"{n} escapes pulled from {nreels} reels"
    return f"{n} {who}, pulled from {nreels} reel{'s' if nreels != 1 else ''}"

def top_themes(members):
    c = Counter(t for m in members for t in (m.get("themes") or []))
    return [t for t, _ in c.most_common(4)]

def slug(s):
    if not s: return ""
    return "".join(ch if ch.isalnum() else "-" for ch in str(s).lower()).strip("-")


# ---------------------------------------------------------------- main synth
def synthesize(items):
    by_creator = defaultdict(list)
    for it in items:
        by_creator[it.get("creator")].append(it)

    all_lists, abstentions = [], []

    for creator, its in by_creator.items():
        creator_lists = []
        attempts_failed = defaultdict(list)   # place -> [reasons]
        pool_size = {}                         # place -> # candidate gems

        # ---- place pools (exclude roundup-lists, rich itineraries, and plan gems —
        #      day-trips go to the "from" family; plan gems are Tips, not lists)
        point_pool = [it for it in its
                      if it.get("category") not in ("list", "itinerary", "plan")
                      and not is_daytrip(it) and place_of(it)]

        cities = defaultdict(list)
        for it in point_pool:
            key = it.get("city") or it.get("region")   # "in X" needs a real place, not a country
            if key:
                cities[key].append(it)

        for city, pool in cities.items():
            pool_size[city] = len(pool)
            tightness = "city" if any(it.get("city") for it in pool) else "region"
            cands = build_candidates(creator, pool, city, tightness)
            kept, fails = select(cands)
            if kept:
                creator_lists += kept
            else:
                attempts_failed[city] += fails

        # ---- region rollup for creators whose cities all came up empty
        if not creator_lists:
            regions = defaultdict(list)
            for it in point_pool:
                if region_of(it): regions[region_of(it)].append(it)
            for region, pool in regions.items():
                cands = build_candidates(creator, pool, region, "region")
                kept, fails = select(cands)
                creator_lists += kept

        # ---- "from" family: day trips, anchored to the creator's home base.
        #      Only trips that share the home country (or, for a hub-concentrated
        #      creator, carry the unreliable catch-all destination) belong to it —
        #      so a globe-trotting creator doesn't get "Day trips from <one city>"
        #      mixing four continents.
        hd = hub_and_daytrips(its, point_pool)
        if hd and hd["members"]:
            res = make_list(creator, dedup_members(hd["members"]), "from",
                            hd["hub"], "city", frame="from")
            if isinstance(res, dict): creator_lists.append(res)
            else: attempts_failed[hd["hub"]].append(res[1])
        elif hd and hd["dropped"]:
            attempts_failed[hd["hub"]].append(
                f"day trips from {hd['hub']} ({hd['dropped']} day-trip gems span "
                f"multiple geographies — no coherent home base)")

        # (plan-category gems are NOT lists — they're surfaced in the Tips tab,
        #  generated by synthesize_tips.py)

        # ---- overlap + noun + theme caps, then diversify headlines
        creator_lists = diversify(creator_lists)
        shipped_places = {l["place"] for l in creator_lists}
        all_lists += creator_lists

        # ---- abstentions: only genuine near-misses — places with real-but-insufficient
        #      presence that still shipped nothing. Not every one-gem town.
        near_miss = []
        for place, reasons in attempts_failed.items():
            if place in shipped_places:
                continue
            if pool_size.get(place, 0) < MIN_POOL_ABSTAIN:
                continue   # too thin to even be a "go scrape more" candidate
            best = max(reasons, key=len) if reasons else "no coherent axis"
            reason = ("weak-corroboration" if "corroboration" in best
                      else "sparse" if "need" in best else "no-coherent-axis")
            near_miss.append((pool_size[place], {
                "creator": creator, "place": place, "status": "no_list",
                "pool_gems": pool_size[place],
                "reason": reason, "best_attempt": best,
                "remedy": "scrape-more-reels" if reason in ("sparse", "no-coherent-axis")
                          else "needs-manual-curation",
            }))
        near_miss.sort(key=lambda x: x[0], reverse=True)
        abstentions += [a for _, a in near_miss[:ABSTAIN_PER_CREATOR]]

    return all_lists, abstentions


def quality_score(l):
    n = l["count"]
    sweet = 1.0 - min(abs(n - 8), 8) / 16.0          # peaks around 8 options
    return AXIS_WEIGHT[l["axis_type"]] + l["quality"]["corroboration"] + 0.5 * sweet

def rephrase(l, vi):
    """Re-render a headline using variant phrasing #vi (0 = primary)."""
    a, th, place = l["axis_type"], l["_theme"], l["place"]
    prep = "from" if l["frame"] == "from" else "in"
    pick = lambda pool: pool[vi % len(pool)]
    if a == "hybrid":
        adj = pick(THEME_ADJ_VARIANTS.get(th, [THEME_ADJ.get(th, (th or "").title())]))
        return f"{adj} {l['_noun']} {prep} {place}"
    if a == "theme":
        return f"{pick(THEME_NOUN_VARIANTS.get(th, [THEME_NOUN.get(th, (th or '').title())]))} {prep} {place}"
    if a == "type":
        return f"{pick(LENS_PREFIX_VARIANTS.get(l['lens'], [LENS_PREFIX[l['lens']]]))} {l['_noun']} {prep} {place}"
    return l["headline"]

def diversify(creator_lists):
    """Per-creator: enforce overlap + noun + theme caps, then de-duplicate phrasing."""
    creator_lists.sort(key=quality_score, reverse=True)
    kept, kept_ids = [], []
    noun_ct, theme_ct = Counter(), Counter()
    for l in creator_lists:
        ids = set(l["_ids"])
        if any(jaccard(ids, k) > DEDUP_JACCARD for k in kept_ids):
            continue                                   # too much gem overlap with a kept list
        if l["_noun"] and noun_ct[l["_noun"]] >= NOUN_CAP:
            continue                                   # already 2 lists with this head-noun
        if l["_theme"] and theme_ct[l["_theme"]] >= THEME_CAP:
            continue                                   # already 2 lists on this theme
        kept.append(l); kept_ids.append(ids)
        if l["_noun"]:  noun_ct[l["_noun"]] += 1
        if l["_theme"]: theme_ct[l["_theme"]] += 1
        if len(kept) >= CAP_PER_CREATOR:
            break
    # rotate phrasing so repeated themes / lens-prefixes read differently
    theme_seen, lens_seen = Counter(), Counter()
    for l in kept:
        if l["axis_type"] in ("hybrid", "theme") and l["_theme"]:
            l["headline"] = rephrase(l, theme_seen[l["_theme"]]); theme_seen[l["_theme"]] += 1
        elif l["axis_type"] == "type":
            l["headline"] = rephrase(l, lens_seen[l["lens"]]); lens_seen[l["lens"]] += 1
    return kept

def dedup_members(members):
    seen, out = set(), []
    for m in members:
        if m.get("id") in seen: continue
        seen.add(m.get("id")); out.append(m)
    return out


def hub_and_daytrips(its, point_pool):
    """Resolve a creator's home base and the day-trips that genuinely radiate from it.

    A day-trip belongs to the hub if it shares the hub's home destination (same
    country), OR the creator is hub-concentrated and the trip carries the
    unreliable catch-all destination (so we trust it's near home). Trips in other
    countries are dropped — a scattered creator ends up with no coherent home base.
    """
    city_ct = Counter(it.get("city") for it in point_pool if it.get("city"))
    if not city_ct:
        return None
    hub, hub_n = city_ct.most_common(1)[0]
    home_share = hub_n / sum(city_ct.values())
    concentrated = home_share >= CONCENTRATION_MIN
    dest_ct = Counter(it.get("destination") for it in point_pool
                      if it.get("city") == hub and it.get("destination"))
    home_dest = dest_ct.most_common(1)[0][0] if dest_ct else None

    dt = [it for it in its if is_daytrip(it) and it.get("category") != "list"]
    members = []
    for it in dt:
        d = (it.get("destination") or "").lower()
        if it.get("destination") == home_dest:
            members.append(it)
        elif concentrated and d in CATCHALL_DEST:
            members.append(it)
    return {"hub": hub, "home_dest": home_dest, "concentrated": concentrated,
            "members": members, "dropped": len(dt) - len(members)}


def build_candidates(creator, pool, place, tightness):
    """Return list of (priority, builder-result) candidates for one place."""
    cands = []

    # ---- HYBRID: theme x category
    hyb = defaultdict(list)
    for it in pool:
        for th in (it.get("themes") or []):
            if th in WEAK_THEME:            # food/nature echo a category — never an adjective
                continue
            hyb[(th, it["category"])].append(it)
    for (th, cat), members in hyb.items():
        members = dedup_members(members)
        # collapse theme==category synonym to a clean type list (handled in TYPE pass)
        if THEME_IS_CATEGORY.get(th) == cat:
            continue
        res = make_list(creator, members, "hybrid", place, tightness,
                        theme=th, category=cat)
        cands.append(("hybrid", th, gem_ids(members), res))

    # ---- TYPE: subcategory (preferred) then narrow category
    sub = defaultdict(list)
    for it in pool:
        if it.get("subcategory"):
            sub[(it["category"], it["subcategory"])].append(it)
    for (cat, s), members in sub.items():
        members = dedup_members(members)
        res = make_list(creator, members, "type", place, tightness,
                        category=cat, subcategory=s)
        cands.append(("type", None, gem_ids(members), res))

    cat_groups = defaultdict(list)
    for it in pool:
        cat_groups[it["category"]].append(it)
    for cat, members in cat_groups.items():
        if cat in BROAD_CATEGORY:   # too generic without a theme/subcat
            continue
        members = dedup_members(members)
        res = make_list(creator, members, "type", place, tightness, category=cat)
        cands.append(("type", None, gem_ids(members), res))

    # ---- THEME-only (fallback only; highest floor). Suppressed in select() when a
    #      hybrid on the same theme already shipped — the hybrid is more actionable.
    thg = defaultdict(list)
    for it in pool:
        for th in (it.get("themes") or []):
            if th in WEAK_THEME: continue
            thg[th].append(it)
    for th, members in thg.items():
        members = dedup_members(members)
        res = make_list(creator, members, "theme", place, tightness, theme=th)
        cands.append(("theme", th, gem_ids(members), res))

    return cands


def select(cands):
    """Quality gate + dedup. cands are (axis_type, theme, ids, result)."""
    passing = [(a, th, ids, r) for (a, th, ids, r) in cands if isinstance(r, dict)]
    fails   = [(a, th, ids, r) for (a, th, ids, r) in cands if isinstance(r, tuple)]

    # process specific axes first: hybrid > type > from > theme, then by size
    passing.sort(key=lambda x: (AXIS_WEIGHT[x[0]], x[3]["count"]), reverse=True)

    kept, kept_ids = [], []
    hybrid_themes = set()
    for axis, th, ids, lst in passing:
        # a broad theme-only list is redundant once a hybrid on that theme exists
        if axis == "theme" and th in hybrid_themes:
            continue
        if any(jaccard(ids, k) > DEDUP_JACCARD for k in kept_ids):
            continue   # near-duplicate of a higher-priority list
        kept.append(lst); kept_ids.append(ids)
        if axis == "hybrid":
            hybrid_themes.add(th)
    fail_msgs = [r[1] for (_, _, _, r) in fails]
    return kept, fail_msgs


# ---------------------------------------------------------------- run
def main():
    data = json.load(open(SRC))
    items = data["items"]
    lists, abstentions = synthesize(items)
    for l in lists:                                   # drop internal-only fields
        for k in [k for k in l if k.startswith("_")]:
            del l[k]

    by_creator = Counter(l["creator"] for l in lists)
    out = {
        "counts": {
            "lists": len(lists),
            "abstentions": len(abstentions),
            "by_creator": dict(by_creator),
        },
        "thresholds": {"FLOOR": FLOOR, "DEDUP_JACCARD": DEDUP_JACCARD,
                       "CORRO_MIN": CORRO_MIN, "REGION_BONUS": REGION_BONUS},
        "lists": lists,
        "abstentions": abstentions,
    }
    json.dump(out, open(OUT, "w"), ensure_ascii=False, indent=1)
    print(f"wrote {OUT}")
    print(f"  {len(lists)} lists, {len(abstentions)} abstentions")
    for c, n in by_creator.items():
        print(f"    {c:20} {n} lists")
    print("\n  sample headlines:")
    for l in sorted(lists, key=lambda x: x["count"], reverse=True)[:14]:
        print(f"    [{l['lens']:7}|{l['axis_type']:6}|{l['count']:2}] {l['headline']}")


if __name__ == "__main__":
    main()
