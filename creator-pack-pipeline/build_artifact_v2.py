# -*- coding: utf-8 -*-
import json
SP="/private/tmp/claude-501/-Users-headout-Documents-Yuvraj-2026-Claude---Headout-Headstart-2-0---Hackin-2026-Hackin-2026---Headstart-2-0/d31d13bd-282e-444b-ad76-77d835723ddb/scratchpad"
OUT="/Users/headout/Documents/Yuvraj 2026/Claude - Headout/Headstart 2.0 - Hackin 2026/Hackin 2026 - Headstart 2.0"
wb=json.load(open(SP+"/workbench_v2.json"))
schema=json.load(open(SP+"/schema_v2.json"))
media=json.load(open(SP+"/media_map.json"))
mcount=0
for cr in wb.values():
    for ci in cr["cities"].values():
        for it in ci["items"]:
            if it["id"] in media:
                it["media_url"]=media[it["id"]]; mcount+=1
print("attached media to", mcount, "items")

CREATOR_META={
 'thefloridaqueenie':{'name':'thefloridaqueenie','tag':'Gulf-Coast Florida','c':'#F2542D'},
 'exploringlondon':{'name':'exploringlondon','tag':'London & the UK','c':'#2D6A8E'},
 'empty.japan':{'name':'empty.japan','tag':'Japan secret spots','c':'#7A4FA3'},
 'raimeetravel':{'name':'raimeetravel','tag':'Travel hacks + Japan','c':'#C9962B'},
}
CATS=[('eat','Eat'),('drink','Drink'),('stay','Stay'),('see-do','See & do'),('shop','Shop'),
      ('view','View'),('nature','Nature'),('plan','Plan'),('itinerary','Itinerary'),('list','List')]

blob=json.dumps({'wb':wb,'creatorMeta':CREATOR_META,'cats':CATS,'schema':schema},ensure_ascii=False)

html=r'''<meta charset="utf-8">
<title>Field Atlas v2 - Creator Pack Workbench</title>
<style>
:root{--ground:#EAEEF2;--paper:#F6F8FA;--ink:#15243A;--ink-soft:#4A5A70;--line:#C9D3DE;
 --accent:#F2542D;--accent-2:#2D6A8E;--shadow:0 1px 0 rgba(21,36,58,.04),0 10px 30px -18px rgba(21,36,58,.4);}
*{box-sizing:border-box}
body{margin:0;background:var(--ground);color:var(--ink);line-height:1.5;
 font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;}
.mono{font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;}
.wrap{max-width:1200px;margin:0 auto;padding:0 22px;}
a{color:var(--accent-2);text-decoration:none;border-bottom:1px solid #BcccdA;}
a:hover{border-bottom-color:var(--accent-2);}
.eyebrow{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--ink-soft);
 font-family:ui-monospace,monospace;}
header{padding:44px 0 22px;border-bottom:1px solid var(--line);}
h1{font-size:clamp(30px,5vw,46px);line-height:1.02;letter-spacing:-.02em;margin:.3em 0 .12em;font-weight:800;}
.lede{color:var(--ink-soft);max-width:64ch;font-size:15px;}
.legend{display:flex;flex-wrap:wrap;gap:26px;margin-top:20px;}
.stat b{font-size:25px;font-weight:800;letter-spacing:-.02em;display:block;}
.stat span{font-size:10.5px;letter-spacing:.15em;text-transform:uppercase;color:var(--ink-soft);font-family:ui-monospace,monospace;}
.tabs{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0;position:sticky;top:0;z-index:20;
 background:linear-gradient(var(--ground) 80%,transparent);padding:14px 0;}
.tab{border:1px solid var(--line);background:var(--paper);color:var(--ink);border-radius:999px;
 padding:9px 15px;cursor:pointer;font-size:13px;font-weight:650;display:flex;gap:9px;align-items:center;}
.tab .dot{width:9px;height:9px;border-radius:50%;}
.tab[aria-selected=true]{border-color:var(--ink);box-shadow:var(--shadow);}
.tab .n{font-family:ui-monospace,monospace;font-size:11px;color:var(--ink-soft);}
.crtitle{display:flex;align-items:baseline;gap:13px;flex-wrap:wrap;margin:12px 0 2px;}
.crtitle h2{font-size:23px;font-weight:800;margin:0;letter-spacing:-.01em;}
.crtitle .tg{color:var(--ink-soft);font-size:14px;}
.matrix-wrap{overflow-x:auto;margin:16px 0 6px;border:1px solid var(--line);border-radius:14px;background:var(--paper);box-shadow:var(--shadow);}
table.mx{border-collapse:collapse;width:100%;min-width:720px;}
table.mx thead th{font-family:ui-monospace,monospace;font-size:10px;letter-spacing:.03em;text-transform:uppercase;
 color:var(--ink-soft);font-weight:600;padding:11px 5px 9px;border-bottom:1px solid var(--line);white-space:nowrap;}
table.mx thead th.ch{text-align:left;padding-left:16px;}
.citycell{text-align:left;font-weight:700;font-size:13px;padding:0 16px;white-space:nowrap;cursor:pointer;border-right:1px solid var(--line);}
.citycell .ct{font-family:ui-monospace,monospace;font-size:9.5px;color:var(--ink-soft);font-weight:500;}
tr.mxrow{border-bottom:1px solid #E4E9EF;} tr.mxrow:last-child{border-bottom:none;}
.cell{cursor:pointer;height:40px;font-family:ui-monospace,monospace;font-size:12px;font-weight:600;text-align:center;
 outline:2px solid transparent;outline-offset:-3px;} .cell.z{color:#B7C2CE;}
.cell:hover{outline-color:var(--ink);} .cell.sel{outline-color:var(--accent);outline-width:3px;}
.citycell:hover,.cityrow.sel .citycell{color:var(--accent);}
.bar{display:flex;flex-wrap:wrap;gap:7px;align-items:center;margin:20px 0 4px;}
.bar .lab{font-family:ui-monospace,monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft);margin-right:3px;}
.chip{border:1px solid var(--line);background:var(--paper);color:var(--ink-soft);border-radius:7px;padding:6px 11px;font-size:12px;cursor:pointer;font-weight:600;}
.chip[aria-pressed=true]{background:var(--ink);color:#fff;border-color:var(--ink);}
.chip.clear{margin-left:auto;border-style:dashed;}
.count-note{font-family:ui-monospace,monospace;font-size:11px;color:var(--ink-soft);margin:14px 2px 4px;}
.city{margin-top:26px;scroll-margin-top:118px;}
.cityhdr{display:flex;align-items:baseline;gap:12px;padding-bottom:9px;border-bottom:2px solid var(--ink);margin-bottom:15px;}
.cityhdr h3{margin:0;font-size:18px;font-weight:800;letter-spacing:-.01em;}
.cityhdr .num{font-family:ui-monospace,monospace;font-size:11px;color:var(--ink-soft);}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;}
.card{background:var(--paper);border:1px solid var(--line);border-radius:14px;overflow:hidden;
 display:flex;flex-direction:column;box-shadow:var(--shadow);cursor:pointer;transition:transform .12s,box-shadow .12s;}
.card:hover{transform:translateY(-2px);box-shadow:0 14px 34px -16px rgba(21,36,58,.5);}
.media{height:124px;position:relative;display:flex;align-items:flex-end;padding:9px 11px;color:#fff;}
.media img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.media .ph-glyph{position:absolute;top:10px;right:12px;font-size:26px;opacity:.5;}
.media .scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.55));}
.media .cattag{position:relative;font-family:ui-monospace,monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;
 background:rgba(255,255,255,.92);color:var(--ink);padding:3px 8px;border-radius:6px;font-weight:700;}
.body{padding:13px 15px 15px;display:flex;flex-direction:column;gap:7px;}
.hook{font-size:17px;font-weight:800;letter-spacing:-.01em;line-height:1.18;}
.nameline{display:flex;align-items:center;gap:7px;flex-wrap:wrap;}
.nameline .nm{font-size:12.5px;color:var(--ink-soft);font-weight:650;}
.sub{font-family:ui-monospace,monospace;font-size:9.5px;letter-spacing:.05em;text-transform:uppercase;
 color:var(--accent-2);border:1px solid #C4D6E1;background:#EAF2F7;border-radius:5px;padding:2px 6px;}
.why{font-size:13px;color:#2B3A50;line-height:1.45;}
.metaline{display:flex;flex-wrap:wrap;gap:6px;margin-top:1px;font-family:ui-monospace,monospace;font-size:10.5px;}
.pill{display:inline-flex;align-items:center;gap:4px;border:1px solid var(--line);border-radius:6px;padding:3px 7px;color:var(--ink-soft);}
.pill.loc{color:var(--ink);} .pill.miss{border-style:dashed;color:#B23A2E;background:#FBECEA;}
.pill.date{color:#8A5CC4;border-color:#D6C6EC;background:#F2ECFA;}
.pill.has{color:var(--accent-2);}
.themes{display:flex;flex-wrap:wrap;gap:5px;}
.tm{font-size:9.5px;font-family:ui-monospace,monospace;color:var(--ink-soft);border:1px solid var(--line);border-radius:5px;padding:2px 6px;}
.conf{display:inline-flex;gap:4px;align-items:center;font-family:ui-monospace,monospace;font-size:10px;color:var(--ink-soft);}
.conf .d{width:6px;height:6px;border-radius:50%;}
.empty{color:var(--ink-soft);font-style:italic;padding:28px 0;}
/* spotlight */
.sl-back{position:fixed;inset:0;background:rgba(13,20,32,.55);backdrop-filter:blur(3px);z-index:50;display:none;}
.sl-back.on{display:block;}
.sl{position:fixed;z-index:51;top:50%;left:50%;transform:translate(-50%,-50%);width:min(680px,92vw);max-height:90vh;overflow:auto;
 background:var(--paper);border-radius:18px;box-shadow:0 30px 80px -20px rgba(0,0,0,.6);display:none;}
.sl.on{display:block;}
.sl .hero{height:230px;position:relative;display:flex;align-items:flex-end;padding:18px 22px;color:#fff;}
.sl .hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.sl .hero .scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.1),rgba(0,0,0,.6));}
.sl .hero .catt{position:relative;font-family:ui-monospace,monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;
 background:rgba(255,255,255,.92);color:var(--ink);padding:4px 9px;border-radius:7px;font-weight:700;}
.sl .x{position:absolute;top:14px;right:16px;z-index:2;background:rgba(255,255,255,.92);border:none;border-radius:50%;
 width:32px;height:32px;font-size:18px;cursor:pointer;color:var(--ink);}
.sl .pad{padding:20px 24px 26px;}
.sl .slhook{font-size:26px;font-weight:850;letter-spacing:-.02em;line-height:1.08;margin:0 0 4px;}
.sl .slname{font-size:14px;color:var(--ink-soft);font-weight:650;margin-bottom:14px;}
.sl .slwhy{font-size:15px;line-height:1.5;color:#27374C;margin-bottom:18px;}
.sl .row{display:flex;gap:10px;padding:11px 0;border-top:1px solid var(--line);font-size:13.5px;align-items:flex-start;}
.sl .row .k{font-family:ui-monospace,monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-soft);width:96px;flex:none;padding-top:2px;}
.sl .brief{font-size:12px;color:var(--ink-soft);font-style:italic;}
.sl .needs{display:flex;flex-wrap:wrap;gap:6px;}
@media(max-width:640px){.cards{grid-template-columns:1fr}.sl .row{flex-direction:column;gap:2px}.sl .row .k{width:auto}}
</style>
<div class="wrap">
<header>
 <div class="eyebrow">Headstart 2.0 &middot; creator-pack synthesis &middot; v2</div>
 <h1>Field Atlas</h1>
 <p class="lede">Hook first, then the place, then where and how to go. Every gem carries only the metadata its type needs &mdash; a restaurant wants a website and hours, a beach just wants a pin, a money tip wants neither. Click any card to spotlight it.</p>
 <div class="legend" id="legend"></div>
</header>
<nav class="tabs" id="tabs" role="tablist"></nav>
<section id="panel"></section>
<footer style="border-top:1px solid var(--line);padding:22px 0 60px;color:var(--ink-soft);font-size:12.5px;">
 Hooks, subcategories and media briefs are AI-drafted for polish. Dashed pills = metadata the type expects but we couldn't fill from the reel. Tell me what to rewrite, re-bucket, or which hooks to sharpen.
</footer>
</div>
<div class="sl-back" id="slback"></div>
<div class="sl" id="sl"></div>
<script>
const DB=__BLOB__; const {wb,creatorMeta,cats,schema}=DB;
const CATC={eat:'#F2542D','drink':'#D98324',stay:'#7A4FA3','see-do':'#2D6A8E',shop:'#C0398A',
 view:'#1F8A70',nature:'#2E7D32',plan:'#3A6EA5',itinerary:'#B5651D',list:'#6B7280'};
const GLYPH={eat:'🍽',drink:'🍸',stay:'🛏','see-do':'✦',shop:'🛍',view:'👁',nature:'🌿',plan:'💡',itinerary:'🗺',list:'📋'};
const CATLABEL=Object.fromEntries(cats); const CONFC={high:'#2E9E5B',medium:'#D98324',low:'#C0392B'};
const creators=Object.keys(wb); let active=creators[0], selCity=null, selCat=null;
const esc=s=>(s||'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const mapsLink=t=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(t);

function totals(){let i=0,cit=0,dat=0,loc=0;creators.forEach(c=>Object.values(wb[c].cities).forEach(ci=>{cit++;
 ci.items.forEach(it=>{i++;if(it.date_info)dat++;if(it.location_text)loc++;});}));return{i,cit,dat,loc};}
function renderLegend(){const t=totals();
 const L=[['04','Creators'],[t.cit,'City buckets'],[t.i,'Gems'],[t.loc,'Mapped'],[t.dat,'Date-specific']];
 legend.innerHTML=L.map(([b,s])=>`<div class="stat"><b>${b}</b><span>${s}</span></div>`).join('');}
function renderTabs(){tabs.innerHTML=creators.map(c=>{const m=creatorMeta[c]||{name:c,c:'#888'};
 return `<button class="tab" role="tab" data-cr="${c}" aria-selected="${c===active}">
  <span class="dot" style="background:${m.c}"></span>${m.name}<span class="n">${wb[c].total}</span></button>`;}).join('');
 document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{active=b.dataset.cr;selCity=null;selCat=null;render();});}
function maxCount(cr){let m=1;Object.values(wb[cr].cities).forEach(ci=>cats.forEach(([k])=>{const n=ci.cats[k]||0;if(n>m)m=n;}));return m;}
function shade(n,mx){if(!n)return'transparent';const a=.1+Math.min(1,n/mx)*.78;return`rgba(242,84,45,${a.toFixed(3)})`;}
function renderMatrix(cr){const cities=Object.entries(wb[cr].cities),mx=maxCount(cr);
 const head='<tr><th class="ch">City bucket</th>'+cats.map(([k,l])=>`<th>${l}</th>`).join('')+'<th>Σ</th></tr>';
 const rows=cities.map(([city,info])=>{const sel=selCity===city;
  const tds=cats.map(([k])=>{const n=info.cats[k]||0;
   return `<td class="cell${n?'':' z'}${(selCity===city&&selCat===k)?' sel':''}" style="background:${shade(n,mx)}" data-city="${esc(city)}" data-cat="${k}">${n||'·'}</td>`;}).join('');
  return `<tr class="mxrow cityrow${sel?' sel':''}"><td class="citycell" data-city="${esc(city)}">${esc(city)}<div class="ct">${info.n} gems</div></td>${tds}<td class="cell mono" style="font-weight:800">${info.n}</td></tr>`;}).join('');
 return `<div class="matrix-wrap"><table class="mx"><thead>${head}</thead><tbody>${rows}</tbody></table></div>`;}

function metaPills(it){const p=it.profile||{};const out=[];
 if(it.location_text)out.push(`<a class="pill loc" href="${mapsLink(it.location_text)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">📍 ${esc(it.city||it.area||it.location_text).slice(0,28)}</a>`);
 else if(p.loc)out.push('<span class="pill miss">📍 needs location</span>');
 if(it.website)out.push(`<a class="pill has" href="${esc(it.website)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">🔗 site</a>`);
 else if(p.web)out.push('<span class="pill miss">🔗 needs site</span>');
 if(p.book)out.push(it.website?'<span class="pill has">🎫 bookable</span>':'<span class="pill">🎫 book</span>');
 if(it.date_info)out.push(`<span class="pill date">📅 ${esc(it.date_info).slice(0,30)}</span>`);
 else if(p.date)out.push('<span class="pill miss">📅 set date</span>');
 if(it.price_text)out.push(`<span class="pill">💲 ${esc(it.price_text).slice(0,18)}</span>`);
 if(it.saved_from>1)out.push(`<span class="pill has">★ ${it.saved_from} reels</span>`);
 return out.join('');}
function mediaBlock(it,h){const c=CATC[it.category]||'#888';
 const bg=it.media_url?`<img src="${it.media_url}" alt="">`:
  `<div style="position:absolute;inset:0;background:linear-gradient(135deg,${c},${c}99)"></div><span class="ph-glyph">${GLYPH[it.category]||''}</span>`;
 return `<div class="media" style="height:${h}px">${bg}<div class="scrim"></div><span class="cattag">${CATLABEL[it.category]} · ${esc(it.subcategory||'')}</span></div>`;}
function card(it){return `<div class="card" data-id="${esc(it.id)}">
 ${mediaBlock(it,124)}
 <div class="body">
  <div class="hook">${esc(it.hook||it.name||'')}</div>
  <div class="nameline"><span class="nm">${esc(it.name||'')}</span></div>
  <div class="why">${esc((it.why||'').slice(0,150))}</div>
  <div class="metaline">${metaPills(it)}</div>
  ${it.themes&&it.themes.length?`<div class="themes">${it.themes.slice(0,3).map(t=>`<span class="tm">${esc(t)}</span>`).join('')}<span class="conf"><span class="d" style="background:${CONFC[it.confidence]||'#999'}"></span>${esc(it.confidence||'')}</span></div>`:''}
 </div></div>`;}

let ITEMS={};
function visible(cr){let out=[];Object.entries(wb[cr].cities).forEach(([city,info])=>{
 if(selCity&&city!==selCity)return;info.items.forEach(it=>{if(selCat&&it.category!==selCat)return;out.push({city,it});});});return out;}
function renderContent(cr){const vis=visible(cr);
 const note=`${vis.length} gem${vis.length===1?'':'s'}`+(selCity?` · ${selCity}`:'')+(selCat?` · ${CATLABEL[selCat]}`:'');
 if(!vis.length)return `<div class="count-note">${note}</div><div class="empty">Nothing with these filters.</div>`;
 const byCity={};vis.forEach(({city,it})=>{(byCity[city]=byCity[city]||[]).push(it);});
 let h=`<div class="count-note">${note}</div>`;
 Object.entries(byCity).forEach(([city,its])=>{h+=`<div class="city"><div class="cityhdr"><h3>${esc(city)}</h3><span class="num">${its.length} gems</span></div><div class="cards">${its.map(card).join('')}</div></div>`;});
 return h;}
function renderPanel(){const cr=active,m=creatorMeta[cr]||{name:cr,tag:''};
 ITEMS={};creators.forEach(c=>Object.values(wb[c].cities).forEach(ci=>ci.items.forEach(it=>ITEMS[it.id]=it)));
 const kc=cats.map(([k,l])=>`<button class="chip" aria-pressed="${selCat===k}" data-cat="${k}">${l}</button>`).join('');
 panel.innerHTML=`<div class="crtitle"><h2>${m.name}</h2><span class="tg">${m.tag}</span></div>`+renderMatrix(cr)+
  `<div class="bar"><span class="lab">Category</span><button class="chip" aria-pressed="${!selCat}" data-cat="">All</button>${kc}<button class="chip clear" data-clear="1">Reset</button></div>`+
  `<div id="content">${renderContent(cr)}</div>`;
 document.querySelectorAll('.cell[data-city]').forEach(c=>c.onclick=()=>{const ci=c.dataset.city,ca=c.dataset.cat;
  if(selCity===ci&&selCat===ca){selCity=null;selCat=null;}else{selCity=ci;selCat=ca;}render();});
 document.querySelectorAll('.citycell[data-city]').forEach(c=>c.onclick=()=>{const ci=c.dataset.city;selCity=(selCity===ci&&!selCat)?null:ci;selCat=null;render();});
 document.querySelectorAll('.chip[data-cat]').forEach(b=>b.onclick=()=>{selCat=b.dataset.cat||null;render();});
 const cl=document.querySelector('.chip[data-clear]');if(cl)cl.onclick=()=>{selCity=null;selCat=null;render();};
 document.querySelectorAll('.card[data-id]').forEach(c=>c.onclick=()=>spotlight(c.dataset.id));}

function spotlight(id){const it=ITEMS[id];if(!it)return;const p=it.profile||{};
 const where=it.location_text?`<a href="${mapsLink(it.location_text)}" target="_blank" rel="noopener">${esc(it.location_text)} ↗</a>`:(p.loc?'<span style="color:#B23A2E">needs a location</span>':'—');
 const rows=[];
 rows.push(['Where', where]);
 if(it.region||it.city||it.area)rows.push(['Region',[it.area,it.city,it.region,it.destination].filter(Boolean).join(' · ')]);
 if(p.web||it.website)rows.push(['Website', it.website?`<a href="${esc(it.website)}" target="_blank" rel="noopener">${esc(it.website)} ↗</a>`:'<span style="color:#B23A2E">needs official site</span>']);
 if(p.book)rows.push(['Booking', it.website?'bookable via site':'ticketed / reservable']);
 if(p.date||it.date_info)rows.push(['When', it.date_info?esc(it.date_info):'<span style="color:#B23A2E">date-specific — set window</span>']);
 if(it.price_text)rows.push(['Price', esc(it.price_text)]);
 if(it.themes&&it.themes.length)rows.push(['Themes', it.themes.map(esc).join(' · ')]);
 if(it.source_reel)rows.push(['Source', `<a href="${esc(it.source_reel)}" target="_blank" rel="noopener">original reel ↗</a> · ${esc(it.creator)}`]);
 rows.push(['Media brief', `<span class="brief">${esc(it.media_brief||'—')}</span>`]);
 sl.innerHTML=`<button class="x" id="slx">×</button>${mediaBlock(it,230).replace('class="media"','class="hero"').replace('height:230px','')}
  <div class="pad"><div class="slhook">${esc(it.hook||it.name)}</div><div class="slname">${esc(it.name||'')} · ${CATLABEL[it.category]} / ${esc(it.subcategory||'')}</div>
  <div class="slwhy">${esc(it.why||'')}</div>${rows.map(([k,v])=>`<div class="row"><div class="k">${k}</div><div>${v}</div></div>`).join('')}</div>`;
 sl.classList.add('on');slback.classList.add('on');
 document.getElementById('slx').onclick=closeSL;}
function closeSL(){sl.classList.remove('on');slback.classList.remove('on');}
slback.onclick=closeSL;document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSL();});
function render(){renderTabs();renderPanel();}
renderLegend();render();
</script>'''
html=html.replace('__BLOB__',blob)
open(OUT+"/creator-pack-workbench.html","w",encoding="utf-8").write(html)
print("wrote artifact",len(html),"bytes")
