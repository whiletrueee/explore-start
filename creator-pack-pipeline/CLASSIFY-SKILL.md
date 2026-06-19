# Classification skill — turn a creator's reels into classified, geocoded pack gems

Turns one creator's raw Instagram reels (`../raw-meta/<creator>/*.json`) into polished, hook-first,
**type-aware** "gems" — categorised on a fixed taxonomy, deduped, geocoded, and packaged into a
per-creator pack file the app renders. This is the exact pipeline run for **empty.japan**, generalised
to any creator. Downstream itineraries are a separate step (see `ITINERARY-SKILL.md`).

**Produces (per creator):**
- `../classified-items-v2.json` — all classified items (taxonomy + metadata profile per item).
- `../packs/<creator>.json` — geocoded, city-bucketed gems + `cityMeta` centroids + the creator's
  itinerary, ready for the frontend (`geocode_pack.py`).
- *(optional)* hero media (`fal-ai/flux/schnell` from each `media_brief`) and the Field Atlas artifact
  (`build_artifact_v2.py`).

---

## 0. Input contract — `raw-meta/<creator>/*.json`

Each reel file is read by `preprocess_v2.py`; only these fields matter:

| field | use |
|---|---|
| `reel_id` (or filename) | stable id |
| `creator` | handle |
| `url` | `source_url` for attribution |
| `caption` | mined for places/advice (trimmed to 600 chars) |
| `transcription.text` / `.language` | the spoken content (trimmed to 1600 chars) — the richest signal |
| `metadata.hashtags[]` | up to 12, mined for intent |
| `metadata.geo_locations[]` + `metadata.pinned_places[]` | merged → `geo[]` location hints |

You also assign the creator a **`dest_hint`** (`new-york | london | florida | japan | … | mixed`) — a
prior, not a hard label; the model still decides `destination` per item.

---

## 1. The model — three layers

1. **kind/category → subcategory** — *what the gem is*. Exactly one category + one subcategory each,
   from the fixed taxonomy below.
2. **metadata profile** — per `(category, subcategory)`, which fields the type *needs*
   (`loc, addr, web, book, date, hours, price` + `scope`). Deterministic, in `profiles.py` → `schema_v2.json`.
   The model only *fills* what it can; the profile decides what the UI demands / flags as missing.
3. **card hierarchy** — `hook` (5-word lead) → `name` + subcategory → `why` → where (linked) →
   site/booking/date *(only the fields the profile demands)* → media.

### Taxonomy (pick exactly one category + one subcategory)
| category | subcategories | meaning |
|---|---|---|
| eat | restaurant · cafe · bakery-dessert · street-food · food-hall · market · fine-dining | a place to eat |
| drink | cocktail-bar · wine-bar · brewery · coffee · rooftop · speakeasy | a place to drink |
| stay | hotel · boutique-hotel · resort · hostel · unique-stay | lodging |
| see-do | landmark · museum-gallery · experience · tour · show · class-workshop · nightlife | a thing to do |
| shop | boutique · market · mall · bookstore · specialty | retail |
| view | observation-deck · skyline · scenic-overlook · photo-spot | a viewpoint |
| nature | beach · park-garden · hike-trail · waterfall · island · natural-landmark | outdoors |
| plan | budget-hack · when-to-go · what-to-skip · transit · packing · booking · points-miles | advice, **no single location** |
| itinerary | day-trip · multi-day · neighborhood-walk · food-crawl · weekend | a multi-stop route/plan |
| list | roundup · ranking · themed-collection | a collection that is **not one place** |

---

## 2. Pipeline run order (parameterised by `$CREATOR` + `$WORK`)

Set a fresh working dir each run (the scripts hardcode an old scratchpad path — see **Parameterize**):
`$WORK` = a writable dir, `$CREATOR` = the raw-meta folder name, `$HINT` = its destination hint.

1. **Preprocess** — `python3 preprocess_v2.py`
   Set `KEEP = {"<creator-folder>": "<hint>"}` and `OUT=$WORK/batches_v2`. Trims each reel to the input
   contract and shards into `batch_NNN.json` (**14 reels/batch**). Prints `reels=N batches=B`.

2. **Classify** — run `classify_v2.workflow.js` as a **Workflow** with
   `args = { resultsDir: "$WORK/results_v2", batchesDir: "$WORK/batches_v2", count: B }`.
   One **Sonnet** agent per batch reads its file, applies the prompt (§3), and writes
   `result_NNN.json` = `{ results:[ { reel_id, creator, source_url, usable, skip_reason, items[] } ] }`
   (one entry per reel, same order). Returns per-batch counts; the workflow logs totals.

3. **Aggregate** — `python3 aggregate_v2.py` (`RES=$WORK/results_v2`)
   - validates `category` (drops unknown), coerces `subcategory` to a valid one for the category,
   - attaches the metadata `profile`, assigns a slug id,
   - **dedups** by `(creator, slug(name), city)`: keeps the higher-confidence editorial copy, merges
     `source_reels`, counts `saved_from`, back-fills missing loc/website/date/price,
   - buckets by city, writes `../classified-items-v2.json` (+ `workbench_v2.json`).
   - Prints the acceptance stats (§7).

4. **Geocode + package** — `python3 geocode_pack.py <creator>`
   Geocodes each item's `location_text` via **Nominatim** (≤1 req/s, cached). On miss, falls back to
   `city, <country>` with a deterministic ~1 km jitter so co-located pins don't stack; hard misses stay
   **ungeocoded** (kept as a card, never mis-pinned). Computes per-city centroids (`cityMeta`), inlines
   the creator's itinerary, writes `../prototype/data/pack-<creator>.json` (copy to `../packs/<creator>.json`
   for the repo). Add the creator to `geocode_pack.py`'s `META` map (name/tag/color/destination/center/zoom).

5. *(optional)* **Media** — pick strong items, generate hero photos with `fal-ai/flux/schnell` from each
   `media_brief`, downscale (`sips` → ~760px q60), base64 into `media_map.json` keyed by item id.

6. *(optional)* **Itinerary** — `ITINERARY-SKILL.md` (`prep_itineraries.py` + `itinerary.workflow.js`).

7. *(optional)* **Build artifact** — `python3 build_artifact_v2.py` → `../creator-pack-workbench.html`.

---

## 3. The extraction prompt (the heart — keep `classify_v2.workflow.js` PROMPT_HEAD in sync)

> You are a **senior travel editor** turning scraped Instagram reels into polished, structured "gems"
> for a discovery app. Each reel has `reel_id, creator, url, dest_hint, caption, lang, transcript,
> hashtags[], geo[]`. **Mine caption + transcript + hashtags + geo TOGETHER.**
>
> **Usability gate.** `usable=false` for noise (empty/junk transcript, song lyrics, "like & subscribe",
> pure lead-magnet "comment GUIDE", no real place/advice) → `items:[]` + a short `skip_reason`.
> Otherwise extract **EVERY distinct recommendation as its own item** (one roundup reel → many items).
>
> Use the taxonomy in §1. `plan` = advice with no single location; `itinerary` = multi-stop route;
> `list` = a collection that isn't one place.

### Item fields (exactly these keys)
- **hook** — FIXED ~5-word headline (4–6 words). The FIRST thing read; create excitement/intrigue, **not**
  the plain name. Sentence case, no ending period, no emoji/hashtags. *Good:* "Whisper secrets across a
  stone arch", "A Tokyo food hall in Brooklyn". *Bad:* "Japan Village" (name), "Amazing hidden gem you
  must see" (generic).
- **name** — proper name; for plan/list/itinerary a concise title.
- **category** / **subcategory** — from the taxonomy.
- **why** — 1–2 punchy sentences (≤~35 words): what it is + why it's worth it.
- **destination** — new-york | london | florida | rome | copenhagen | japan | maldives | dubai | singapore | other.
- **region / city / area** — broader region / city-town / neighborhood, or null.
- **location_text** — a **geocodable** address or landmark when the thing has a physical location; null
  for advice with none. **Never invent precise addresses** — use the most specific real location the reel supports.
- **website** — official site/booking URL **only** if clearly derivable or a well-known official domain; else null. **Never fabricate.**
- **date_info** — date/season/event/window specifics if tied to one; else null.
- **price_text** — a price/cost detail if mentioned; else null.
- **themes** — 0–4 of [hidden-gem, bucket-list, day-trip, free, luxury, family, photo-spot, seasonal, food, nightlife, budget, nature].
- **media_brief** — vivid 1-sentence HERO image-gen prompt (subject, setting, time of day, framing, mood); photographic editorial-travel; no text/watermark/faces-as-focus.
- **confidence** — high | medium | low.

---

## 4. Gem-copy quality bar (`hook` + `why`)
This is the product. Bake these into the prompt and a curation pass (anchored in `ux-direction.md` Surface 5 / The Infatuation):
1. **One sharp claim per place** — lead with the reason to go, not a category label.
2. **Name a specific, checkable detail** — a dish, a time, a seat, a quirk ("Go before 7 or you'll wait"). Specificity is the #1 authenticity signal.
3. **Cut the obvious** — if it's a steakhouse, we assume the steak's good; say the non-obvious thing.
4. **Commit** — "skip the X, order the Y." No hedging ("might", "could potentially").
5. **Spoken cadence** — contractions, second person, fragments OK. Read-aloud test.
6. **Ban LLM tells** — *nestled, hidden gem (as filler), vibrant, boasts, a perfect blend of, whether you're X or Y, look no further*, tricolon lists, em-dash-balanced clauses.
7. **Front-load the payoff** — first 4–5 words carry it (mobile cards truncate).

---

## 5. Metadata profile (type-aware) — why cards differ
`profiles.py` maps every `(category, subcategory)` to which fields matter. Examples:
- `eat/restaurant` → loc + addr + **web** + hours + price (`scope: point`)
- `nature/beach` → loc + **date** only (a pin + season)
- `view/skyline` → loc only
- `plan/budget-hack` → **nothing** (`scope: none`) — a tip carries no pins/links
- `itinerary/*` → loc + date (`scope: multi`)

The UI shows only the pills a type's profile expects **and** the data has; it flags the rest as missing
(internal QA only — not shown to consumers). To add/adjust a type: edit `profiles.py`, re-run it to refresh
`schema_v2.json`, then re-run `aggregate_v2.py` (no re-classify needed unless the taxonomy list changed).

---

## 6. Dedup
Key = `(creator, slug(name), lower(city))`. First occurrence wins the slot; duplicates increment
`saved_from`, union `source_reels`, and either upgrade the editorial fields (if higher confidence) or
back-fill empty loc/website/date/price. Build this on day one — retrofitting merges is painful.

---

## 7. Acceptance checks (QA gate before packaging)
From `aggregate_v2.py`'s printout + a manual skim:
- **Coverage:** `usable` reels and `items` counts are sane; `badcat` ≈ 0 (no dropped categories).
- **Geocoding:** `geocode_pack.py` reports ≥~85% of place gems pinned; the un-pinned are overwhelmingly
  `plan`/`list` (no location) — spot-check that no real place is silently dropped or mis-pinned.
- **Voice:** blind-read ~20 hooks — ≥90% "sounds human, not LLM" (apply §4). Re-run classify with a sharpened
  prompt if not.
- **Profiles:** a restaurant shows site/price, a beach just a pin, a tip nothing — confirm on a few cards.
- **Dedup:** the same place from two reels is one gem with `saved_from: 2`, not two cards.

---

## 8. Parameterize for a new creator (the only edits)
The scripts were written for one batch run and hardcode an old scratchpad path + a 4-creator `KEEP`.
For a new creator:
1. Ensure `../raw-meta/<creator>/` exists (pull from the data repo if needed).
2. `preprocess_v2.py`: set `KEEP = {"<creator-folder>": "<hint>"}`; set `OUT` to `$WORK/batches_v2`.
3. `aggregate_v2.py`: set `RES = $WORK/results_v2`.
4. `geocode_pack.py`: add the creator to `META` (name/tag/color/destination/center/zoom/cityZoom);
   adjust `FREE_CITY` / city fallback country if not Japan.
*(Recommended hardening: replace the hardcoded `SP`/`ROOT` constants with `os.environ["WORK"]` /
`os.environ["ROOT"]` so a run is `WORK=… CREATOR=… python3 …` with no edits.)*

## 9. Knobs
- **Batch size** (`BATCH=14`) — larger = fewer agents, riskier truncation.
- **Model** — Sonnet per batch (quality/throughput sweet spot); bump for hard creators.
- **`dest_hint`** — set per creator; the model can still override per item.
- **Free vs paid split** — the frontend pack uses `FREE_CITY` as the free preview; pick the creator's hero city.
- **Geocoder** — Nominatim (free, ≤1 req/s) or swap to Google Geocoding (key) for precision/volume.
