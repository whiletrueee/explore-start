# Creator-pack pipeline (v2)

Turns raw creator reels (`../raw-meta/<creator>/*.json`) into classified, hook-first "gems" with
type-aware metadata and hero media, then renders the **Field Atlas** workbench artifact.

Artifact: `../creator-pack-workbench.html` · Data: `../classified-items-v2.json`

## Model

Two axes + a deterministic metadata layer:

- **kind/category → subcategory** — what the gem *is* (see `PROMPT.md`, taxonomy in `profiles.py`).
- **metadata profile** — per `(category, subcategory)`, which fields the type needs:
  `loc, addr, web, book, date, hours, price` + `scope` (point|area|city|multi|none).
  Defined in `profiles.py` (`CAT_DEF` + `SUB_OVR`), dumped to `schema_v2.json`.
- **card hierarchy** — hook (5-word) → name + subcategory → why → where (linked) → website /
  booking / date (only the fields the profile demands) → media.

## Run order

1. **Preprocess** — `python3 preprocess_v2.py`
   Trims reels for the target creators into `batches_v2/batch_NNN.json` (14 reels each).
   Edit the `KEEP` dict to choose creators. (Run from the scratchpad, or adjust paths.)

2. **Classify** — run `classify_v2.workflow.js` as a Workflow with args
   `{resultsDir, batchesDir, count}`. One Sonnet agent per batch reads its file, applies `PROMPT.md`,
   writes `results_v2/result_NNN.json` (`{results:[{reel_id,usable,skip_reason,items[]}]}`).

3. **Aggregate** — `python3 aggregate_v2.py`
   Validates category/subcategory, attaches the metadata profile, **dedups** by
   `(creator, slug(name), city)` keeping the higher-confidence copy and a `saved_from` count,
   buckets by city, writes `classified-items-v2.json` + `workbench_v2.json`.

4. **Media** (spotlight subset) — pick strong items, generate hero images with
   `fal-ai/flux/schnell` from each item's `media_brief`, downscale (sips → 760px / q60), base64 into
   `media_map.json` keyed by item id. Full coverage = generate for every item's `media_brief`.

5. **Build** — `python3 build_artifact_v2.py`
   Embeds data + `media_map.json` + `schema_v2.json`, writes `../creator-pack-workbench.html`.

## Current run (2026-06-19)
4 shortlisted creators (floridaqueenie, exploringlondon, empty.japan, raimeetravel):
350 reels → 221 usable → **360 gems** (after dedup), 332 mapped, 82 with websites, 92 date-specific.
11 spotlight hero images generated.

## To extend
- More creators/cities: add to `preprocess_v2.py` `KEEP`, re-run 1–5.
- New subcategory or metadata rule: edit `profiles.py` (taxonomy + profile), re-run `profiles.py`
  to refresh `schema_v2.json`, then `aggregate_v2.py` + `build_artifact_v2.py` (no re-classify
  needed unless the prompt's taxonomy list changed).
- Sharper hooks/why for a creator: edit `PROMPT.md`/the workflow PROMPT_HEAD and re-run classify.
