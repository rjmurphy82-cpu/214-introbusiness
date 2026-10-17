"""Builds survey data and the scoring model for every company, then brute-forces
the best version for each segment (used by the teacher key and QA checks).
Writes ../data.json."""
import json, math, random, itertools, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from companies import COMPANIES, MAYA

MUST, NICE = 60, 30          # survey thresholds
MISS_PENALTY, NICE_BONUS = 0.5, 0.05
RANGES = {"M": (62, 88), "N": (33, 56), "X": (6, 24)}
REACH = 92

def money(x):
    return round(x, 2)

def build(co, seed):
    rnd = random.Random(seed)
    feats = []
    for (name, desc, cost, tags) in co["feats"]:
        pcts = [rnd.randint(*RANGES[t]) for t in tags]
        feats.append(dict(name=name, desc=desc, cost=cost, tags=tags, pct=pcts))
    segs = []
    for i, s in enumerate(co["segs"]):
        wtp = []
        for p in co["prices"]:
            v = REACH / (1 + math.exp((p - s["med"]) / s["spr"]))
            wtp.append(int(round(v)))
        # guarantee strictly usable, non-increasing
        for k in range(1, len(wtp)):
            wtp[k] = min(wtp[k], wtp[k-1])
        segs.append(dict(letter="ABC"[i], size=s["size"], key=s["key"], bullets=s["bullets"],
                         quote=s["quote"], wtp=wtp))
    out = dict(id=co["id"], name=co["name"], product=co["product"], unit=co["unit"],
               blurb=co["blurb"], base=co["base"], prices=co["prices"], segs=segs, feats=feats)
    out["single"] = single_for(out)
    for si, seg in enumerate(segs):
        seg["best"] = best_for(out, si)
        seg["loaded"] = score(out, si, list(range(len(feats))), None)
        seg["bare"] = score(out, si, [], None)
    return out

def score(co, si, chosen, price_idx):
    """chosen: list of feature indexes. price_idx None => best price for that build."""
    seg = co["segs"][si]
    cost = co["base"] + sum(co["feats"][f]["cost"] for f in chosen)
    must = [f for f, ft in enumerate(co["feats"]) if ft["pct"][si] >= MUST]
    nice = [f for f, ft in enumerate(co["feats"]) if NICE <= ft["pct"][si] < MUST]
    missing = [f for f in must if f not in chosen]
    nice_in = [f for f in nice if f in chosen]
    fit = (1 + NICE_BONUS * len(nice_in)) * (0.5 ** len(missing))
    best = None
    rng = range(len(co["prices"])) if price_idx is None else [price_idx]
    for pi in rng:
        price = co["prices"][pi]
        buyers = int(round(seg["size"] * seg["wtp"][pi] / 100 * fit))
        profit = money(buyers * (price - cost))
        r = dict(feats=sorted(chosen), cost=money(cost), price=price, pi=pi, pct=seg["wtp"][pi],
                 fit=round(fit, 2), missing=len(missing), nice=len(nice_in), buyers=buyers, profit=profit)
        if best is None or profit > best["profit"]:
            best = r
    return best

def best_for(co, si):
    n = len(co["feats"])
    best = None
    for r in range(n + 1):
        for combo in itertools.combinations(range(n), r):
            s = score(co, si, list(combo), None)
            if best is None or s["profit"] > best["profit"]:
                best = s
    return best

def single_for(co):
    """Best ONE version (same features, same price) sold to all three segments."""
    n = len(co["feats"])
    best = None
    for r in range(n + 1):
        for combo in itertools.combinations(range(n), r):
            for pi in range(len(co["prices"])):
                parts = [score(co, si, list(combo), pi) for si in range(3)]
                tot = money(sum(p["profit"] for p in parts))
                if best is None or tot > best["profit"]:
                    best = dict(feats=list(combo), price=co["prices"][pi], cost=parts[0]["cost"],
                                profit=tot, buyers=sum(p["buyers"] for p in parts))
    return best

def check(co):
    problems = []
    for si, seg in enumerate(co["segs"]):
        must = [f for f, ft in enumerate(co["feats"]) if ft["pct"][si] >= MUST]
        b = seg["best"]
        if not must:
            problems.append(f"{co['id']} seg {si}: no must-haves")
        if any(f not in b["feats"] for f in must):
            problems.append(f"{co['id']} seg {si}: best build skips a must-have")
        if b["profit"] <= 0:
            problems.append(f"{co['id']} seg {si}: no profit")
        if b["pi"] in (0, len(co["prices"]) - 1) and co["id"] != "maya":
            problems.append(f"{co['id']} seg {si}: best price at edge ({b['price']})")
        if seg["loaded"]["profit"] >= b["profit"] and len(b["feats"]) < len(co["feats"]):
            problems.append(f"{co['id']} seg {si}: loaded ties best")
    lineup = sum(s["best"]["profit"] for s in co["segs"])
    co["lineup"] = money(lineup)
    if co["single"]["profit"] > 0.8 * lineup:
        problems.append(f"{co['id']}: single version too close ({co['single']['profit']:.0f} vs {lineup:.0f})")
    sets = [tuple(s["best"]["feats"]) for s in co["segs"]]
    if len(set(sets)) < 3:
        problems.append(f"{co['id']}: two segments share the same best build")
    return problems

if __name__ == "__main__":
    data = []
    allp = []
    for i, co in enumerate(COMPANIES):
        d = build(co, 100 + i)
        allp += check(d)
        data.append(d)
    maya = build(MAYA, 7)
    allp += [p for p in check(maya) if "edge" not in p]
    json.dump(dict(companies=data, maya=maya,
                   rules=dict(must=MUST, nice=NICE, miss=MISS_PENALTY, bonus=NICE_BONUS)),
              open(os.path.join(os.path.dirname(__file__), "..", "data.json"), "w"), indent=1)
    for d in data + [maya]:
        print(d["name"], "lineup", d.get("lineup"), "single", d["single"]["profit"], d["single"]["price"])
        for s in d["segs"]:
            b = s["best"]
            print(f"  {s['letter']} {s['key']:<24} price {b['price']:>6} cost {b['cost']:>7} pct {b['pct']:>3} fit {b['fit']} "
                  f"buyers {b['buyers']:>6} profit {b['profit']:>10,.0f} | loaded {s['loaded']['profit']:>10,.0f} "
                  f"| feats {[d['feats'][f]['name'][:14] for f in b['feats']]}")
    print("\nPROBLEMS:", *allp, sep="\n  ")
