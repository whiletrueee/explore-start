export const meta = {
  name: 'make-itineraries',
  description: 'Compose complete day-by-day itineraries from each creator-city gem bundle',
  phases: [{ title: 'Compose', detail: 'one agent per target city' }],
}
const A = typeof args === 'string' ? JSON.parse(args) : (args || {})
const OUT = A.outDir
const manifest = A.manifest // [{target_id, path, days, ...}]

const PRINCIPLES = `
Build a REALISTIC, sequenced, time-blocked itinerary in the CREATOR'S VOICE, using ONLY gems in this
bundle (reference each by gem id). It is NOT a list — it's a plan a real person can actually do.

FEASIBILITY (most important — a tired human must be able to do this):
- A normal day runs ~09:00–21:00. Do NOT schedule pre-dawn starts, 4-hour hikes plus three other
  stops, or anything that needs superhuman energy. If a single activity eats most of a day (a long
  hike, a far day-trip), that IS the day — add only a meal and maybe one nearby stop.
- MAX 4–5 stops per day TOTAL (including lunch + dinner). Quality over coverage: pick the strongest
  gems (saved_from, then confidence, then bucket-list/hidden-gem) and LEAVE OUT the rest. You do not
  have to use every gem.
- One day = ONE tight area. Never combine areas more than ~30 min apart in the same day (e.g. don't
  pair two far-flung mountain villages). Order stops to avoid backtracking.
- Build in real travel time between stops and a 20–30% buffer; protect downtime. Each stop's time
  window should be plausible (a temple ~60–90 min, a meal ~60–90 min, a museum ~2 h).
- One clear ANCHOR per day; different area each day.

CONCISION (no fluff — this is consumed at a glance):
- what: ONE short line, ≤ 12 words, action-first ("Tour the circus museum + bayfront gardens").
- why: ≤ 12 words, one concrete reason, or null. No hype, no repetition of the name.
- tip: include ONLY if genuinely useful and specific; ≤ 1 tip per day; else null.
- summary: ≤ 2 short sentences. Day hook: ~5 words. pace_note: ≤ 12 words, state why it's doable.

- transit_next: short and concrete ("10-min walk" / "Bus #11, 20 min"); null on the last stop.
- Use only gems present in the bundle; never invent places.`

const SCHEMA = {
  type:'object', additionalProperties:false,
  required:['id','creator','destination','city','days_count','title','hook','summary','best_for','days','logistics','gem_ids_used'],
  properties:{
    id:{type:'string'},creator:{type:'string'},destination:{type:['string','null']},city:{type:'string'},
    days_count:{type:'integer'},title:{type:'string'},hook:{type:'string'},summary:{type:'string'},best_for:{type:'string'},
    days:{type:'array',items:{type:'object',additionalProperties:false,
      required:['day','hook','theme','area','anchor_gem_id','stops','pace_note'],
      properties:{day:{type:'integer'},hook:{type:'string'},theme:{type:'string'},area:{type:['string','null']},
        anchor_gem_id:{type:'string'},pace_note:{type:'string'},
        stops:{type:'array',items:{type:'object',additionalProperties:false,
          required:['slot','time','gem_id','title','what','why','transit_next','tip'],
          properties:{slot:{type:'string'},time:{type:'string'},gem_id:{type:'string'},title:{type:'string'},
            what:{type:'string'},why:{type:'string'},transit_next:{type:['string','null']},tip:{type:['string','null']}}}}}}},
    logistics:{type:'object',additionalProperties:false,
      required:['getting_around','where_to_stay','best_time','budget','creator_tip_gem_ids'],
      properties:{getting_around:{type:['string','null']},where_to_stay:{type:['string','null']},
        best_time:{type:['string','null']},budget:{type:['string','null']},creator_tip_gem_ids:{type:'array',items:{type:'string'}}}},
    gem_ids_used:{type:'array',items:{type:'string'}},
  },
}

phase('Compose')
const results = await pipeline(manifest, async (m) => {
  const outPath = `${OUT}/${m.target_id}.json`
  const prompt = `${PRINCIPLES}

STEP 1 — Read the gem bundle (Read tool): ${m.path}
It has {creator, destination, city, days, places:[...gems], tips:[...plan gems]}.
STEP 2 — Compose a ${m.days}-day itinerary for ${m.city} per the rules above, schema:
${JSON.stringify(SCHEMA.properties.days.items.required)} per day; stops carry slot/time/gem_id/title/
what/why/transit_next/tip. Fill logistics from the tips. Set id="${m.target_id}".
STEP 3 — Write the itinerary JSON (pretty) to: ${outPath}
STEP 4 — Return it via structured output.`
  return agent(prompt, { label:`itin:${m.target_id}`, phase:'Compose', model:'sonnet', schema:SCHEMA })
})
const ok = results.filter(Boolean)
log(`Composed ${ok.length}/${manifest.length} itineraries`)
return { count: ok.length, itineraries: ok.map(i=>({id:i.id,city:i.city,days:i.days_count,title:i.title})) }
