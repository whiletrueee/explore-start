# World-class itinerary references — what great looks like

Researched 2026-06-19 to ground the itinerary skill. The throughline: an itinerary is **not a list of
places** — it's a *sequenced, time-blocked, logistics-aware plan* a traveler can follow hour by hour.

## The core distinction (Thatch)
- **Guide** = a list of recommendations + a map; the traveler figures out how to spend their time.
- **Itinerary** = curated and ordered, planned **day by day**, "down to the best order to visit the
  attractions, including important logistical information like travel times and how to get to your
  accommodation from the airport."

Our current "itinerary" items are really *guides*. This skill builds true itineraries.

## Rexby (the platform these creators publish on)
Itineraries are **named, scoped plans** — "a 7-day roadtrip itinerary", "a 3-day weekend itinerary" —
sitting alongside an interactive **map with pins**, photos/video, and a **Travel Tips** section.
Travelers can follow pins in real time, offline. Itineraries carry the **creator's voice and picks**,
not generic advice. → Our itineraries must be built only from a creator's own gems, in their voice.

## NYT "36 Hours" (gold-standard editorial format)
Running since 2002. A time-boxed ("36 hours / two nights") plan that gives a **full sense of one place**
through **expert curation**: specific named restaurants/hotels, an opinionated through-line, a **map**,
and photos. The *constraint* is the magic — it forces hard choices and a tight, exciting narrative.
→ Each itinerary should feel authored and opinionated, not exhaustive.

## Day-design principles (synthesized across sources)
1. **Three blocks per day** — Morning (8–12, high-energy / early-access / less-crowded), Afternoon
   (12–5, a proper 1–2h lunch + 1–2 majors), Evening (5–10, dinner / show / lighter).
2. **One anchor per day** — a single must-do; build the rest of the day around its location, timing,
   and energy.
3. **Geographic clustering** — group each day by neighborhood; order stops to avoid backtracking;
   sequence by opening hours + proximity + energy.
4. **Time buffers** — add **20–30%** to every activity (things run long, you get lost).
5. **Pacing** — alternate high-intensity and lighter days; protect downtime; respect local rhythms;
   add rest days on longer trips.
6. **Duration fit** — 2–3 days = single city, 2–3 majors/day · 5–7 = one region, mixed + rest ·
   2+ weeks = multi-city with rest days.
7. **Logistics threaded in, not bolted on** — transit between stops, meal slots, airport→hotel, hours,
   reservations/booking links, where the hotel sits relative to everything.
8. **Map + visual** — every stop pinned; the day legible as a route.
9. **Structured output** — generate as validated JSON, then render.

## Design rules for OUR skill (the synthesis)
- Build each itinerary **only from one creator's gems** for one destination/city; reference them by id.
- Pick a **daily anchor** from the highest-signal gems (saved_from, confidence, bucket-list/hidden-gem).
- **Cluster by `area`**, one cluster ≈ one day; sequence morning→evening by category logic
  (see-do/view early, eat at meal slots, nightlife/drink late) and proximity.
- Weave the creator's own **plan/tip gems** (transit, when-to-go, budget) into the matching day/slot.
- Slot an **eat** gem at lunch and dinner where available; a **view/nature** at golden hour.
- Title the trip and each day with a **hook** (the same 5-word excitement rule as gems).
- Honor buffers and downtime; never overstuff (max ~3 anchors + meals/day).
- Output a **structured itinerary** (schema in `ITINERARY-SKILL.md`).

## Sources
- [Thatch — custom guide vs custom itinerary](https://www.thatch.co/seller/services/itinerary/@fly)
- [Rexby — the best way for creators to build a travel guide](https://www.rexby.com/blog/the-best-way-for-creators-to-build-a-travel-guide)
- [Rexby — future of travel guides for creators](https://www.rexby.com/blog/rexby-is-the-future-of-travel-guides-for-creators)
- [NYT 36 Hours (Taschen sourcebook)](https://www.amazon.com/NYT-Hours-USA-Canada-3rd/dp/3836575329)
- [TriPandoo — plan a travel itinerary like a pro (2026)](https://www.tripandoo.com/blog/plan-travel-itinerary-complete-guide)
- [Panoramic Pathways — building an itinerary (blocks & flexibility)](https://panoramicpathways.com/travel-tips/building-itinerary/)
- [Tourist Trip Design Problem — literature review (clustering/anchors)](https://www.sciencedirect.com/science/article/pii/S2214716022000069)
