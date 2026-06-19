# Deterministic metadata profile, keyed by (category, subcategory).
# Fields: loc, addr, web, book, date, hours, price  (bools) + scope.
# scope: point | area | city | multi | none
import json

TAXONOMY = {
  "eat":       ["restaurant","cafe","bakery-dessert","street-food","food-hall","market","fine-dining"],
  "drink":     ["cocktail-bar","wine-bar","brewery","coffee","rooftop","speakeasy"],
  "stay":      ["hotel","boutique-hotel","resort","hostel","unique-stay"],
  "see-do":    ["landmark","museum-gallery","experience","tour","show","class-workshop","nightlife"],
  "shop":      ["boutique","market","mall","bookstore","specialty"],
  "view":      ["observation-deck","skyline","scenic-overlook","photo-spot"],
  "nature":    ["beach","park-garden","hike-trail","waterfall","island","natural-landmark"],
  "plan":      ["budget-hack","when-to-go","what-to-skip","transit","packing","booking","points-miles"],
  "itinerary": ["day-trip","multi-day","neighborhood-walk","food-crawl","weekend"],
  "list":      ["roundup","ranking","themed-collection"],
}

def P(loc=False, addr=False, web=False, book=False, date=False, hours=False, price=False, scope="none"):
    return {"loc":loc,"addr":addr,"web":web,"book":book,"date":date,"hours":hours,"price":price,"scope":scope}

# category defaults
CAT_DEF = {
  "eat":    P(loc=1,addr=1,hours=1,price=1,scope="point"),
  "drink":  P(loc=1,addr=1,hours=1,price=1,scope="point"),
  "stay":   P(loc=1,addr=1,web=1,book=1,price=1,scope="point"),
  "see-do": P(loc=1,addr=1,hours=1,price=1,scope="point"),
  "shop":   P(loc=1,addr=1,hours=1,scope="point"),
  "view":   P(loc=1,addr=1,scope="point"),
  "nature": P(loc=1,scope="point"),
  "plan":   P(scope="none"),
  "itinerary": P(loc=1,date=1,scope="multi"),
  "list":   P(scope="none"),
}
# subcategory overrides (only where they differ from the category default)
SUB_OVR = {
  ("eat","restaurant"):  P(loc=1,addr=1,web=1,hours=1,price=1,scope="point"),
  ("eat","fine-dining"): P(loc=1,addr=1,web=1,book=1,hours=1,price=1,scope="point"),
  ("eat","food-hall"):   P(loc=1,addr=1,web=1,hours=1,scope="point"),
  ("drink","cocktail-bar"): P(loc=1,addr=1,web=1,hours=1,price=1,scope="point"),
  ("drink","rooftop"):   P(loc=1,addr=1,web=1,hours=1,price=1,scope="point"),
  ("see-do","museum-gallery"): P(loc=1,addr=1,web=1,book=1,hours=1,price=1,scope="point"),
  ("see-do","experience"): P(loc=1,web=1,book=1,price=1,scope="point"),
  ("see-do","tour"):     P(loc=1,web=1,book=1,date=1,price=1,scope="point"),
  ("see-do","show"):     P(loc=1,addr=1,web=1,book=1,date=1,price=1,scope="point"),
  ("see-do","class-workshop"): P(loc=1,web=1,book=1,price=1,scope="point"),
  ("view","observation-deck"): P(loc=1,addr=1,web=1,book=1,hours=1,price=1,scope="point"),
  ("nature","park-garden"): P(loc=1,hours=1,scope="point"),
  ("nature","beach"):    P(loc=1,date=1,scope="point"),
  ("plan","points-miles"): P(web=1,scope="none"),
  ("plan","booking"):    P(web=1,scope="none"),
  ("plan","transit"):    P(scope="city"),
}

def profile(category, subcategory):
    return dict(SUB_OVR.get((category,subcategory)) or CAT_DEF.get(category) or P())

if __name__ == "__main__":
    # dump a flat profile lookup for the artifact + a taxonomy file
    flat = {}
    for cat, subs in TAXONOMY.items():
        for s in subs:
            flat[f"{cat}/{s}"] = profile(cat, s)
    out = {"taxonomy": TAXONOMY, "profiles": flat,
           "categories": list(TAXONOMY.keys())}
    SP = "/private/tmp/claude-501/-Users-headout-Documents-Yuvraj-2026-Claude---Headout-Headstart-2-0---Hackin-2026-Hackin-2026---Headstart-2-0/d31d13bd-282e-444b-ad76-77d835723ddb/scratchpad"
    json.dump(out, open(SP+"/schema_v2.json","w"), indent=1)
    print("subcategories:", sum(len(v) for v in TAXONOMY.values()))
    print("sample restaurant:", profile("eat","restaurant"))
    print("sample beach:", profile("nature","beach"))
    print("sample budget-hack:", profile("plan","budget-hack"))
