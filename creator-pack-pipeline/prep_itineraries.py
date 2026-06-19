# -*- coding: utf-8 -*-
import json, collections, os
ROOT=os.environ.get("PIPELINE_ROOT","/Users/headout/Documents/Yuvraj 2026/Claude - Headout/Headstart 2.0 - Hackin 2026/Hackin 2026 - Headstart 2.0")
SP=os.environ.get("PIPELINE_WORK","/private/tmp/claude-501/-Users-headout-Documents-Yuvraj-2026-Claude---Headout-Headstart-2-0---Hackin-2026-Hackin-2026---Headstart-2-0/d31d13bd-282e-444b-ad76-77d835723ddb/scratchpad")
OUT=SP+"/itin_targets"; os.makedirs(OUT, exist_ok=True)
# limit to specific creators via PIPELINE_ITIN_CREATORS (comma-separated) so a run
# only (re)composes itineraries for newly-added creators
ONLY=set(c for c in os.environ.get("PIPELINE_ITIN_CREATORS","").split(",") if c)
d=json.load(open(ROOT+"/classified-items-v2.json")); items=d['items']
PLACE={'eat','drink','stay','see-do','shop','view','nature'}
CONF={'high':3,'medium':2,'low':1}

# candidate (creator, city) with >=6 mappable place-gems
cand=collections.Counter()
for it in items:
    if it['category'] in PLACE and it.get('location_text') and it.get('city'):
        cand[(it['creator'],it['city'])]+=1
targets=[(cr,ci,n) for (cr,ci),n in cand.items() if n>=6 and (not ONLY or cr in ONLY)]
targets.sort(key=lambda t:-t[2])

def slim(it):
    return {k:it.get(k) for k in ('id','hook','name','category','subcategory','area',
            'location_text','why','themes','saved_from','confidence','date_info','price_text','website')}

man=[]
for cr,city,n in targets:
    places=[slim(it) for it in items if it['creator']==cr and it.get('city')==city
            and it['category'] in PLACE and it.get('location_text')]
    # creator's destination-level tips (plan) + itinerary/list context
    dest=next((it['destination'] for it in items if it['creator']==cr and it.get('city')==city), None)
    tips=[slim(it) for it in items if it['creator']==cr and it['category']=='plan'
          and (it.get('destination')==dest or it.get('city')==city)]
    days=max(2, min(5, round(len(places)/6)))
    tid=f"{cr}-{city}".lower().replace(' ','-').replace('.','')
    bundle={'target_id':tid,'creator':cr,'destination':dest,'city':city,'days':days,
            'places':places,'tips':tips}
    p=os.path.join(OUT, tid+".json"); json.dump(bundle, open(p,'w'), ensure_ascii=False)
    man.append({'target_id':tid,'path':p,'creator':cr,'city':city,'days':days,'places':len(places),'tips':len(tips)})

json.dump(man, open(OUT+"/manifest.json","w"))
print(f"targets: {len(man)}")
for m in man: print(f"  {m['days']}d  {m['creator']:18} {m['city']:16} places={m['places']:2} tips={m['tips']}")
