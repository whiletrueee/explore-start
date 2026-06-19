# -*- coding: utf-8 -*-
import json, glob, collections, re, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from profiles import TAXONOMY, profile

SP=os.environ.get("PIPELINE_WORK","/private/tmp/claude-501/-Users-headout-Documents-Yuvraj-2026-Claude---Headout-Headstart-2-0---Hackin-2026-Hackin-2026---Headstart-2-0/d31d13bd-282e-444b-ad76-77d835723ddb/scratchpad")
RES=os.environ.get("PIPELINE_RESULTS", SP+"/results_v2")
# OUT = dir that receives classified-items-v2.json (point at a scratch dir to keep a
# per-run file for merging instead of clobbering an existing multi-creator dataset)
OUT=os.environ.get("PIPELINE_OUT","/Users/headout/Documents/Yuvraj 2026/Claude - Headout/Headstart 2.0 - Hackin 2026/Hackin 2026 - Headstart 2.0")

VALID_CAT=set(TAXONOMY)
def fix_sub(cat, sub):
    subs=TAXONOMY.get(cat,[])
    if sub in subs: return sub
    return subs[0] if subs else None
def slug(s): return re.sub(r'-+','-',re.sub(r'[^a-z0-9]+','-',(s or '').lower())).strip('-')[:60]

CREATOR_CITY_NOGEO={'plan','list'}
def city_bucket(it):
    if it['category'] in CREATOR_CITY_NOGEO and not it.get('city'):
        return 'Travel hacks (no city)' if it['category']=='plan' else 'Roundups & lists'
    return it.get('city') or it.get('area') or it.get('region') or it.get('destination') or 'Unsorted'

items=[]; reels=set(); usable=0; skips=collections.Counter(); seen=collections.Counter(); badcat=0
for f in sorted(glob.glob(RES+"/result_*.json")):
    d=json.load(open(f))
    for r in d.get("results",[]):
        reels.add(r.get("reel_id"))
        if not r.get("usable"):
            skips[(r.get("skip_reason") or '?').strip().lower()[:40]]+=1; continue
        usable+=1
        for it in r.get("items",[]):
            cat=it.get("category")
            if cat not in VALID_CAT: badcat+=1; continue
            sub=fix_sub(cat, it.get("subcategory"))
            prof=profile(cat, sub)
            base=slug(it.get("name")) or slug(it.get("hook")) or "item"; seen[base]+=1
            iid=base if seen[base]==1 else f"{base}-{seen[base]}"
            rec={"id":iid,"hook":it.get("hook"),"name":it.get("name"),
                 "category":cat,"subcategory":sub,"why":it.get("why"),
                 "destination":it.get("destination"),"region":it.get("region"),
                 "city":it.get("city"),"area":it.get("area"),
                 "location_text":it.get("location_text"),"website":it.get("website"),
                 "date_info":it.get("date_info"),"price_text":it.get("price_text"),
                 "themes":it.get("themes") or [],"media_brief":it.get("media_brief"),
                 "confidence":it.get("confidence"),"profile":prof,
                 "creator":r.get("creator"),"reel_id":r.get("reel_id"),
                 "source_reel":r.get("source_url"),"media_url":None}
            rec["_city"]=city_bucket(rec)
            items.append(rec)

# dedup: merge same place (slug(name)+city) within a creator; keep best confidence, count saved_from
CONF_RANK={'high':3,'medium':2,'low':1}
merged={}; order=[]
for it in items:
    key=(it['creator'], slug(it['name']), (it.get('city') or '').lower())
    if key not in merged:
        it['saved_from']=1; it['source_reels']=[it['source_reel']] if it.get('source_reel') else []
        merged[key]=it; order.append(key)
    else:
        m=merged[key]; m['saved_from']+=1
        if it.get('source_reel') and it['source_reel'] not in m['source_reels']:
            m['source_reels'].append(it['source_reel'])
        # prefer the higher-confidence version's editorial fields
        if CONF_RANK.get(it.get('confidence'),0) > CONF_RANK.get(m.get('confidence'),0):
            for fld in ('hook','why','media_brief','confidence','location_text','website','date_info','price_text'):
                if it.get(fld): m[fld]=it[fld]
        else:
            for fld in ('location_text','website','date_info','price_text'):
                if not m.get(fld) and it.get(fld): m[fld]=it[fld]
items=[merged[k] for k in order]
print("after dedup:", len(items), "items")

# group creator -> city -> items
by={}
for it in items:
    by.setdefault(it['creator'],{}).setdefault(it['_city'],[]).append(it)
workbench={}
for cr,cities in by.items():
    workbench[cr]={"total":sum(len(v) for v in cities.values()),"cities":{}}
    for city,its in sorted(cities.items(), key=lambda kv:-len(kv[1])):
        catc=collections.Counter(x['category'] for x in its)
        workbench[cr]["cities"][city]={"n":len(its),"cats":dict(catc),"items":its}

dataset={"counts":{"reels":len(reels),"usable":usable,"items":len(items)},
         "taxonomy":TAXONOMY,"items":items}
json.dump(dataset, open(OUT+"/classified-items-v2.json","w"), indent=1, ensure_ascii=False)
json.dump(workbench, open(SP+"/workbench_v2.json","w"), ensure_ascii=False)

print("reels",len(reels),"usable",usable,"items",len(items),"badcat",badcat)
print("category:", dict(collections.Counter(x['category'] for x in items)))
print("subcat top:", collections.Counter(f"{x['category']}/{x['subcategory']}" for x in items).most_common(12))
print("with location_text:", sum(1 for x in items if x['location_text']))
print("with website:", sum(1 for x in items if x['website']))
print("date-specific:", sum(1 for x in items if x['date_info']))
print("with media_brief:", sum(1 for x in items if x['media_brief']))
print("hook sample:", [x['hook'] for x in items[:6]])
