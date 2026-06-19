export const meta = {
  name: 'classify-reels-v2',
  description: 'Re-classify shortlisted creator reels into the v2 hook/category/subcategory/metadata schema',
  phases: [{ title: 'Classify v2', detail: 'one agent per batch, hook-first editorial extraction' }],
}
const A = typeof args === 'string' ? JSON.parse(args) : (args || {})
const RESULTS_DIR = A.resultsDir, BATCHES_DIR = A.batchesDir, COUNT = A.count
const manifest = Array.from({ length: COUNT }, (_, i) => `${BATCHES_DIR}/batch_${String(i).padStart(3,'0')}.json`)

const TAXONOMY = `
CATEGORY -> allowed SUBCATEGORY (pick exactly one of each per item):
  eat:       restaurant | cafe | bakery-dessert | street-food | food-hall | market | fine-dining
  drink:     cocktail-bar | wine-bar | brewery | coffee | rooftop | speakeasy
  stay:      hotel | boutique-hotel | resort | hostel | unique-stay
  see-do:    landmark | museum-gallery | experience | tour | show | class-workshop | nightlife
  shop:      boutique | market | mall | bookstore | specialty
  view:      observation-deck | skyline | scenic-overlook | photo-spot
  nature:    beach | park-garden | hike-trail | waterfall | island | natural-landmark
  plan:      budget-hack | when-to-go | what-to-skip | transit | packing | booking | points-miles
  itinerary: day-trip | multi-day | neighborhood-walk | food-crawl | weekend
  list:      roundup | ranking | themed-collection
Use plan for advice with no single location. Use itinerary for multi-stop routes/day plans.
Use list for collections that are not one place ("5 free things").`

const PROMPT_HEAD = `You are a senior travel editor turning scraped Instagram reels into polished, structured
"gems" for a discovery app. Each reel object has: reel_id, creator, url, dest_hint, caption,
lang, transcript, hashtags[], geo[]. Mine caption + transcript + hashtags + geo TOGETHER.

For each reel decide "usable". usable=false for noise (empty/junk transcript, song lyrics,
"like & subscribe", pure lead-magnet "comment GUIDE", no real place/advice) -> items:[] + a
short skip_reason. Otherwise extract EVERY distinct recommendation as its own item.

${TAXONOMY}

Each item object has EXACTLY these keys:
- hook: a FIXED ~5-word headline (4-6 words). It is the FIRST thing a user reads and must create
  excitement or intrigue about the experience — NOT the plain name. Sentence case, no ending
  period, no emoji, no hashtags. Good: "Whisper secrets across a stone arch", "A Tokyo food hall
  in Brooklyn", "Ski indoors, ride coasters, eat lobster". Bad: "Japan Village" (that's the name),
  "Amazing hidden gem you must see" (generic).
- name: the proper name of the place/thing (e.g. "Japan Village"). For plan/list/itinerary, a
  concise title.
- category: one of the categories above.
- subcategory: one allowed subcategory for that category.
- why: 1-2 punchy sentences (max ~35 words) describing what it is and why it's worth it.
- destination: new-york | london | florida | rome | copenhagen | japan | maldives | other
- region: broader region if relevant ("Gulf Coast", "Kansai", "Cotswolds") else null.
- city: the city/town else null.
- area: neighborhood / sub-area else null.
- location_text: a geocodable address or landmark string when the thing has a physical location
  (places, viewpoints, beaches, itineraries' main hub). null for advice with no location. Do NOT
  invent precise addresses — use the most specific real location supported by the reel.
- website: official site / booking URL ONLY if it is clearly derivable or a well-known official
  domain; otherwise null. Never fabricate a URL.
- date_info: if the item is tied to a date/season/event/limited window, the specifics
  ("cherry blossom late March-April", "summer only", "Dec 2026 light festival"); else null.
- price_text: a price/cost detail if mentioned ("$35 lobster", "free", "~$25 entry"); else null.
- themes: subset of [hidden-gem, bucket-list, day-trip, free, luxury, family, photo-spot,
  seasonal, food, nightlife, budget, nature] (0-4 that genuinely apply).
- media_brief: a vivid 1-sentence image-generation prompt for the ideal HERO photo of this item
  (subject, setting, time of day, framing, mood). Photographic, editorial-travel style, no text,
  no watermark, no people's faces as focus. e.g. "Golden-hour wide shot of a neon-lit indoor
  food hall with steam rising from ramen stalls, shallow depth of field, editorial travel photo".
- confidence: high | medium | low.`

const SUMMARY_SCHEMA = {
  type:'object', additionalProperties:false,
  required:['batch_index','reels_in','reels_usable','items_out','wrote_path'],
  properties:{ batch_index:{type:'integer'}, reels_in:{type:'integer'}, reels_usable:{type:'integer'},
    items_out:{type:'integer'}, wrote_path:{type:'string'} },
}

phase('Classify v2')
const summaries = await pipeline(manifest, async (batchPath,_o,index) => {
  const outPath = `${RESULTS_DIR}/result_${String(index).padStart(3,'0')}.json`
  const prompt = `${PROMPT_HEAD}

STEP 1 — Read the batch file at this exact path (Read tool): ${batchPath}
STEP 2 — Build JSON: { "results":[ { "reel_id","creator","source_url","usable":bool,
  "skip_reason":str|null, "items":[ <item> ] } ] } — one entry per reel, same order.
STEP 3 — Write that JSON (pretty) to this exact path (Write tool): ${outPath}
STEP 4 — Return summary: batch_index=${index}, reels_in, reels_usable, items_out, wrote_path="${outPath}".`
  return agent(prompt, { label:`v2:${String(index).padStart(3,'0')}`, phase:'Classify v2',
    model:'sonnet', schema:SUMMARY_SCHEMA })
})

const ok = summaries.filter(Boolean)
const t = ok.reduce((a,s)=>({b:a.b+1,ri:a.ri+(s.reels_in||0),ru:a.ru+(s.reels_usable||0),io:a.io+(s.items_out||0)}),{b:0,ri:0,ru:0,io:0})
log(`v2 done: ${t.b}/${manifest.length} batches, ${t.io} items from ${t.ru}/${t.ri} usable reels`)
return { totals:t, failed:manifest.length-ok.length, result_files: ok.map(s=>s.wrote_path) }
