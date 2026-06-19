# Itinerary skill — compose complete day-by-day itineraries from a creator's gems

Turns a creator's classified gems for one city into a **sequenced, time-blocked, logistics-aware
itinerary** in the creator's voice. Grounded in `ITINERARY-REFERENCES.md`. Runnable via
`itinerary.workflow.js`.

## Inputs
- `creator`, `city` (+ `destination`)
- `days` — target length. Default heuristic: `clamp(round(mappable_place_gems / 6), 2, 5)`.
- The creator's gems for that city (place gems: eat/drink/stay/see-do/shop/view/nature with
  hook/name/subcategory/area/location_text/why/themes/saved_from/confidence) + the creator's
  `plan`/tip gems for the destination (transit/when-to-go/budget/what-to-skip).

## Composition algorithm
1. **Eligible set** = place gems for (creator, city) with a `location_text`; keep tips aside.
2. **Anchors** — rank by `saved_from` desc, then confidence, then bucket-list/hidden-gem themes.
   Pick `days` anchors, ideally in different `area`s.
3. **Cluster** — one day ≈ one `area` cluster around its anchor; assign remaining gems to the day of
   their area (or nearest by area name) so each day is geographically tight.
4. **Sequence each day** into slots, honoring the references:
   - morning: see-do (landmark/museum)/view/nature, early-access or less-crowded first
   - lunch: an `eat` gem (cafe/restaurant/street-food/food-hall)
   - afternoon: 1–2 majors (see-do/shop/experience), ordered by proximity
   - golden hour: a `view`/`nature`/`rooftop` gem
   - dinner: a stronger `eat` (restaurant/fine-dining)
   - late (optional): `drink`/nightlife
5. **Thread logistics** — for each stop add `transit_next` (how to reach the next), and weave a
   matching `plan`/tip gem into the day or the itinerary `logistics`. Respect 20–30% buffers and
   downtime; **max ~3 anchors + meals per day**; never overstuff.
6. **Voice & hooks** — title the trip and each day with a 5-word hook; write in the creator's spirit;
   use only this creator's gems (reference every one by `gem_id`).

## Output schema (one object per itinerary)
```json
{
  "id": "empty-japan-kyoto-3day",
  "creator": "empty.japan", "destination": "japan", "city": "Kyoto", "days_count": 3,
  "title": "Three Quiet Days in Kyoto",
  "hook": "Temples, tea, and secret backstreets",
  "summary": "1–2 sentence editorial intro in the creator's voice.",
  "best_for": "shoulder-season, slow travelers",
  "days": [
    { "day": 1, "hook": "Eastern temples at first light", "theme": "Higashiyama old town",
      "area": "Higashiyama", "anchor_gem_id": "kiyomizu-dera",
      "stops": [
        { "slot": "morning", "time": "8:00–10:30", "gem_id": "kiyomizu-dera",
          "title": "Kiyomizu-dera at opening", "what": "…", "why": "creator's reason",
          "transit_next": "10-min walk down Sannenzaka", "tip": "woven creator tip or null" }
      ],
      "pace_note": "light afternoon — lots of walking on hills" }
  ],
  "logistics": { "getting_around": "…", "where_to_stay": "…", "best_time": "…",
    "budget": "…", "creator_tip_gem_ids": ["kyoto-bus-pass-tip"] },
  "gem_ids_used": ["kiyomizu-dera", "…"]
}
```

## Run
1. `python3 prep_itineraries.py` → writes per-target gem bundles to `itin_targets/` + a manifest.
2. Run `itinerary.workflow.js` as a Workflow with `{targetsDir, outDir, manifest}` — one agent per
   target composes its itinerary JSON.
3. Aggregate into `../itineraries.json`; optionally render into the Field Atlas artifact as an
   "Itineraries" view.

## Quality bar (reject & redo if)
- Any stop references a gem not in this creator's set, or invents a place.
- A day backtracks across the city, or exceeds ~3 anchors + meals.
- No logistics/transit between stops, or no creator tips woven in where available.
- Hooks are generic ("Amazing day in X") rather than specific and exciting.
