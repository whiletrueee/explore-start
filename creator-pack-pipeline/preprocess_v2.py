import json, glob, os, math
ROOT="/Users/headout/Documents/Yuvraj 2026/Claude - Headout/Headstart 2.0 - Hackin 2026/Hackin 2026 - Headstart 2.0"
SP="/private/tmp/claude-501/-Users-headout-Documents-Yuvraj-2026-Claude---Headout-Headstart-2-0---Hackin-2026-Hackin-2026---Headstart-2-0/d31d13bd-282e-444b-ad76-77d835723ddb/scratchpad"
OUT=SP+"/batches_v2"; os.makedirs(OUT, exist_ok=True)

# only the 4 shortlisted creators (folder -> dest hint)
KEEP = {
  "thefloridaqueenie":"florida",
  "exploringlondon-london-rexby":"london",
  "empty.japan":"japan",
  "raimeetravel":"mixed",
}
reels=[]
for folder,hint in KEEP.items():
    for f in sorted(glob.glob(os.path.join(ROOT,"raw-meta",folder,"*.json"))):
        d=json.load(open(f)); t=d.get("transcription") or {}; md=d.get("metadata") or {}
        reels.append({
            "reel_id": d.get("reel_id") or os.path.splitext(os.path.basename(f))[0],
            "creator": d.get("creator") or folder,
            "url": d.get("url"), "dest_hint": hint,
            "caption": (d.get("caption") or "").strip()[:600],
            "lang": t.get("language"),
            "transcript": (t.get("text") or "").strip()[:1600],
            "hashtags": md.get("hashtags",[])[:12],
            "geo": list(dict.fromkeys((md.get("geo_locations") or [])+(md.get("pinned_places") or []))),
        })
BATCH=14; n=math.ceil(len(reels)/BATCH); man=[]
for i in range(n):
    p=os.path.join(OUT,f"batch_{i:03d}.json")
    json.dump(reels[i*BATCH:(i+1)*BATCH], open(p,"w"), ensure_ascii=False); man.append(p)
print(f"reels={len(reels)} batches={n}")
