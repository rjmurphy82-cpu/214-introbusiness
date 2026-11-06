/* Keep the Crew: everything the game teaches, plus the month-by-month engine.
   Shared by the student page, the teacher screen, and solo play. The engine is deterministic: the same picks
   always give the same results, so every shop faces the same month and the class can compare fairly.

   THE MODEL (this is the debrief, not student-facing until the end)
   - Seven survey items, 0 to 100 (% of the crew who agree). Four are Herzberg HYGIENE factors
     (pay, conditions, security, coworkers) and three are MOTIVATORS (recognition, growth, meaningful work).
   - Each crew member has one main need, tied to a Maslow level and to one survey item.
   - Morale = 8 + 0.40 x hygiene part + 0.25 x motivator part + 0.35 x need part (+ personal changes).
       hygiene part   = hygiene average, capped at 70   (fixing basics stops unhappiness, it can't create joy)
       motivator part = motivator average x GATE
       need part      = the person's need item (capped at 80 if it's a hygiene item, x GATE if it's a motivator)
       GATE           = 1 when the hygiene average is 60 or more, 0.5 when it's below 60
                        (Herzberg: motivators only half work while people are still unhappy with the basics)
   - Effects are permanent (installed programs) or temporary (bonuses, parties: half of the boost fades each month).
     Every month motivator items fade 2 points and hygiene items wear 1 point, so a shop has to keep investing.
   - Morale below 35 at the end of a month is a warning. Below 35 two months in a row: that person quits.
     A quit costs $1,500 to cover the open seat, and the seat stays empty for the rest of the game.
   - Revenue per crew member = $1,000 x (0.5 + morale / 100). Profit = revenue minus spending minus quit costs.
   - Month score = profit / 100 + average crew morale + 5 for each correct label - 25 for each quit. */
"use strict";
var CREW = (function () {
  const MONTHS = 6, BUDGET = 1500, PICKS = 2, QUIT_AT = 35, QUIT_COST = 1500;
  const PTS = { label: 5, quit: -25 };

  const ITEMS = [
    { id: "pay", label: "My pay is fair", short: "Pay", hyg: true, start: 52 },
    { id: "cond", label: "The shop is a good place to work", short: "Conditions", hyg: true, start: 38 },
    { id: "sec", label: "My job feels secure", short: "Security", hyg: true, start: 44 },
    { id: "team", label: "I get along with my coworkers", short: "Coworkers", hyg: true, start: 55 },
    { id: "rec", label: "My work gets noticed", short: "Recognition", hyg: false, start: 30 },
    { id: "grow", label: "I'm learning and growing here", short: "Growth", hyg: false, start: 36 },
    { id: "mean", label: "My work matters", short: "Meaningful work", hyg: false, start: 50 }
  ];
  const itemById = {}; ITEMS.forEach(i => itemById[i.id] = i);

  // the crew: same six people in every shop. Quotes are the clues: they hint at each person's need.
  const PEOPLE = [
    { id: "dev", name: "Dev", role: "Front counter", need: "pay", maslow: "Physiological",
      q: ["My rent went up again. I picked up weekend shifts at a second job just to cover it.", "Money's still tight, but it's better than it was.", "I finally stopped stressing about rent. I can actually focus here."],
      warn: "Dev asked if there are any extra hours. He looks exhausted.",
      quit: "I'm sorry. Kicks Lab offered me more an hour and I can't make rent on what I make here." },
    { id: "omar", name: "Omar", role: "PM shift restorer", need: "sec", maslow: "Safety",
      q: ["I keep hearing the PM shift might get cut. Is my job safe?", "I think my job is OK. I'd just like to know for sure.", "I know where I stand here. That means a lot."],
      warn: "Omar has been checking job listings on his break.",
      quit: "I found a job with a steady schedule. I couldn't keep wondering if my shift would disappear." },
    { id: "tasha", name: "Tasha", role: "Restorer, 2 months", need: "team", maslow: "Social",
      q: ["I eat lunch in my car. I don't really know anyone here yet.", "People are nice. I'm starting to feel like part of the team.", "This crew is like family. I'd hate to leave them."],
      warn: "Tasha left early again without saying goodbye to anyone.",
      quit: "I never really felt like I belonged here. I'm going somewhere my friends work." },
    { id: "rosa", name: "Rosa", role: "Suede specialist, 3 years", need: "rec", maslow: "Esteem",
      q: ["Three years of suede work and nobody has ever said a word about it.", "Someone finally noticed my work this month. That felt good.", "I feel respected here. People know what I bring."],
      warn: "Rosa skipped the team meeting again. Her work is slowing down.",
      quit: "I'm taking a job where my work actually gets noticed. Three years and almost nobody said anything." },
    { id: "marcus", name: "Marcus", role: "Lead restorer", need: "mean", maslow: "Self-actualization",
      q: ["I can restore anything. I just do the same thing every day. I want to create something.", "I'm getting a little room to be creative. I want more.", "I get to design my own work here. This is what I love doing."],
      warn: "Marcus has been posting his own custom designs online and talking about going solo.",
      quit: "I'm starting my own custom sneaker brand. I need to make something that's mine." },
    { id: "lena", name: "Lena", role: "New restorer", need: "grow", maslow: "Esteem",
      q: ["I want to get really good at this, but nobody has time to teach me.", "I'm learning some new skills. I want to keep going.", "I've learned so much here. I can see myself moving up."],
      warn: "Lena asked a coworker if other shops have training programs.",
      quit: "I want a job where I can actually learn. I'm not getting any better here." }
  ];
  const personById = {}; PEOPLE.forEach(p => personById[p.id] = p);
  const MASLOW = ["Physiological", "Safety", "Social", "Esteem", "Self-actualization"];

  /* ACTIONS. h: true = hygiene factor, false = motivator. e: true = extrinsic (a reward or condition given to you),
     false = intrinsic (satisfaction from the work itself). p = permanent item changes, t = temporary (fade),
     once = can only be bought once, monthly = cost repeats every month after you start it. who = personal changes. */
  const ACTIONS = [
    { id: "ac", name: "Fix the air conditioning", cost: 900, once: true, h: true, e: true, p: { cond: 25 },
      blurb: "It's been broken since July.", why: "Working conditions are a hygiene factor. A cool shop stops complaints but doesn't make anyone love the job." },
    { id: "raise", name: "Raise everyone $1 an hour", cost: 600, monthly: true, once: true, h: true, e: true, p: { pay: 22 },
      blurb: "Costs $600 every month from now on.", why: "Pay is the classic hygiene factor and an extrinsic reward. It fixes unfair pay; it doesn't create passion." },
    { id: "bonus", name: "$150 bonus for everyone", cost: 900, h: true, e: true, t: { pay: 12 },
      blurb: "One-time cash this month.", why: "Money is extrinsic and pay is a hygiene factor. A one-time bonus fades fast." },
    { id: "pizza", name: "Pizza party", cost: 150, h: true, e: true, t: { team: 6 },
      blurb: "Friday after close.", why: "A perk is extrinsic, and coworker relationships are a hygiene factor. Fun, but it fades by Monday." },
    { id: "lunch", name: "Weekly team lunch", cost: 250, monthly: true, once: true, h: true, e: true, p: { team: 16 },
      blurb: "Costs $250 every month from now on.", why: "Relationships with coworkers are a Herzberg hygiene factor and meet the Maslow social need." },
    { id: "policy", name: "Post a clear schedule and attendance policy", cost: 0, once: true, h: true, e: true, p: { sec: 8, cond: 6 },
      blurb: "Schedules out two weeks ahead.", why: "Company policy is a hygiene factor. Clear rules remove stress but don't inspire." },
    { id: "pledge", name: "Promise: no PM shift cuts this year", cost: 0, once: true, h: true, e: true, p: { sec: 18 },
      blurb: "Put it in writing.", why: "Job security is a hygiene factor and the Maslow safety need." },
    { id: "flex", name: "Flexible scheduling", cost: 0, once: true, h: true, e: true, p: { cond: 10 }, who: { dev: 4 },
      blurb: "Crew can swap shifts in a group chat.", why: "Working conditions are a hygiene factor. Dev can fit his second job around it." },
    { id: "wall", name: "Restoration of the Month wall", cost: 50, once: true, h: false, e: true, p: { rec: 15 },
      blurb: "Before-and-after photos with names.", why: "Recognition is a Herzberg motivator. It comes from someone else, so it's extrinsic." },
    { id: "shout", name: "Shout-outs at every shift meeting", cost: 0, once: true, h: false, e: true, p: { rec: 10 },
      blurb: "Name one great pair every shift.", why: "Recognition is a motivator. Praise comes from the manager, so it's extrinsic." },
    { id: "train", name: "Leather and suede training course", cost: 400, once: true, h: false, e: false, p: { grow: 22 },
      blurb: "Six Saturday sessions.", why: "Growth is a Herzberg motivator. Getting better at your craft is intrinsic." },
    { id: "colorway", name: "Custom colorway program", cost: 300, once: true, h: false, e: false, p: { mean: 22, grow: 6 },
      blurb: "The crew designs their own colorways to sell.", why: "The work itself and creativity are motivators and intrinsic. This is self-actualization." },
    { id: "promote", name: "Promote Omar to shift lead", cost: 150, monthly: true, once: true, h: false, e: true, p: { grow: 8, sec: 4 }, who: { omar: 12 },
      blurb: "+$1 an hour for Omar. $150 every month.", why: "Advancement is a Herzberg motivator. A promotion and title are extrinsic rewards." },
    { id: "teach", name: "Veterans train the new hires", cost: 0, once: true, h: false, e: false, p: { grow: 8, mean: 8 },
      blurb: "Marcus and Rosa each mentor one person.", why: "Responsibility is a motivator, and teaching your craft is intrinsically rewarding." },
    { id: "thanks", name: "Customer reaction board", cost: 25, once: true, h: false, e: false, p: { mean: 12, rec: 4 },
      blurb: "Post customers' thank-you notes and photos.", why: "Seeing that your work matters is intrinsic. Meaningful work is a motivator." }
  ];
  const actById = {}; ACTIONS.forEach(a => actById[a.id] = a);

  // the month's news: shown while shops plan, applied when the month closes. Same for every shop.
  const EVENTS = [
    { head: "Welcome to your shop", text: "You're the new manager of a Sole Revival location. The AC has been broken since July, and there's a rumor that the PM shift might get cut. Read your crew, check the survey, and make two moves." },
    { head: "Heat wave next week", text: "The forecast says 95 degrees all week. If the AC still isn't fixed, the shop will be miserable." },
    { head: "Kicks Lab opens down the street", text: "A new sneaker shop is hiring restorers at $1.50 more an hour. Your crew has noticed. Shops that already raised pay will feel it less." },
    { head: "Holiday rush", text: "Orders are up 40% this month, so revenue is up too. The long shifts are stressful. Flexible scheduling and team lunches help a crew get through it." },
    { head: "A big custom order", text: "A Chicago boutique wants 40 custom pairs, worth $2,000. They'll only hire a shop whose crew says they're learning and growing (Growth at 60% or more)." },
    { head: "Kicks Lab calls Rosa", text: "Kicks Lab offered Rosa a job. She'll think about whether anyone here notices her work (Recognition at 55% or more)." }
  ];

  const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
  const HYG = ITEMS.filter(i => i.hyg).map(i => i.id), MOT = ITEMS.filter(i => !i.hyg).map(i => i.id);
  const avg = a => a.reduce((s, x) => s + x, 0) / (a.length || 1);

  function newShop() {
    const base = {}, temp = {}; ITEMS.forEach(i => { base[i.id] = i.start; temp[i.id] = 0; });
    const shop = { m: 0, base, temp, owned: {}, buys: {}, mods: {}, crew: PEOPLE.map(p => ({ id: p.id, warn: false, quit: false })), hist: [], total: 0, profit: 0 };
    shop.items = items(shop); shop.startItems = { ...shop.items }; shop.crew.forEach(c => c.morale = moraleOf(shop, c.id)); shop.start = shop.crew.map(c => c.morale);
    return shop;
  }
  function items(shop) { const o = {}; ITEMS.forEach(i => o[i.id] = Math.round(clamp(shop.base[i.id] + shop.temp[i.id]))); return o; }
  function gate(it) { return avg(HYG.map(k => it[k])) >= 60 ? 1 : 0.5; }
  function moraleOf(shop, pid) {
    const it = shop.items || items(shop), p = personById[pid], g = gate(it);
    const hyg = Math.min(avg(HYG.map(k => it[k])), 70), mot = avg(MOT.map(k => it[k])) * g;
    const nv = it[p.need], need = itemById[p.need].hyg ? Math.min(nv, 80) : nv * g;
    return Math.round(clamp(8 + 0.4 * hyg + 0.25 * mot + 0.35 * need + (shop.mods[pid] || 0)));
  }
  const committed = shop => ACTIONS.filter(a => a.monthly && shop.owned[a.id]).reduce((s, a) => s + a.cost, 0);
  const budgetLeft = (shop, ids) => BUDGET - committed(shop) - (ids || []).reduce((s, id) => s + actById[id].cost, 0);
  function canBuy(shop, id, ids) {
    const a = actById[id]; if (!a) return false;
    if (a.once && shop.owned[id]) return false;
    if ((ids || []).includes(id)) return true;
    return (ids || []).length < PICKS && budgetLeft(shop, ids) - a.cost >= 0;
  }
  function labelScore(pick) {
    let right = 0, total = 0; const by = {};
    (pick && pick.a || []).forEach(id => { const a = actById[id], l = (pick.l || {})[id] || {};
      const h = l.h != null && (l.h === "H") === a.h, e = l.e != null && (l.e === "E") === a.e;
      by[id] = { h, e }; right += h + e; total += 2; });
    return { right, total, by };
  }
  // close one month: apply this month's picks and event, return the new shop (never mutates the old one)
  function step(prev, pick) {
    const s = JSON.parse(JSON.stringify(prev)), m = s.m, ev = m, ids = (pick && pick.a || []).filter(id => actById[id]).slice(0, PICKS);
    const okIds = []; ids.forEach(id => { if (canBuy(prev, id, okIds)) okIds.push(id); });
    // spending: monthly programs already owned, then this month's buys
    let spend = committed(prev);
    // fade last month's temporary boosts, then wear
    ITEMS.forEach(i => { s.temp[i.id] = Math.round(s.temp[i.id] / 2); s.base[i.id] = clamp(s.base[i.id] - (i.hyg ? 1 : 2)); });
    okIds.forEach(id => {
      const a = actById[id], n = s.buys[id] || 0; spend += a.cost; s.buys[id] = n + 1;
      if (a.once) s.owned[id] = true;
      Object.entries(a.p || {}).forEach(([k, v]) => s.base[k] = clamp(s.base[k] + v));
      Object.entries(a.t || {}).forEach(([k, v]) => s.temp[k] += Math.round(v * Math.pow(0.5, n))); // repeats are worth less
      Object.entries(a.who || {}).forEach(([k, v]) => s.mods[k] = (s.mods[k] || 0) + v);
    });
    // the event
    let bonusRev = 0, revMult = 1, evNote = "";
    if (ev === 1) { if (!s.owned.ac) { s.temp.cond -= 15; evNote = "The heat wave hit a shop with no AC. Conditions dropped."; } else evNote = "The AC was fixed. The heat wave didn't hurt."; }
    if (ev === 2) { const hit = s.owned.raise ? 6 : 16; s.base.pay = clamp(s.base.pay - hit); evNote = s.owned.raise ? "Your raise softened the Kicks Lab news. Pay fairness dropped a little." : "Kicks Lab pays more. Pay fairness dropped a lot."; }
    if (ev === 3) { revMult = 1.4; s.temp.team -= s.owned.lunch ? 3 : 8; s.temp.cond -= s.owned.flex ? 0 : 6; evNote = "Revenue was up 40%. " + (s.owned.flex && s.owned.lunch ? "Flexible scheduling and team lunches kept the stress down." : s.owned.flex || s.owned.lunch ? "Your programs took some of the edge off the stress." : "Long shifts wore the crew down."); }
    s.items = items(s);
    if (ev === 4) { if (s.items.grow >= 60) { bonusRev = 2000; s.temp.mean += 8; evNote = "Your crew was skilled enough to land the $2,000 boutique order."; } else { s.temp.mean -= 6; evNote = "Growth was under 60%. The boutique hired someone else."; } }
    if (ev === 5) { if (s.items.rec >= 55) evNote = "Rosa turned down Kicks Lab. She feels noticed here."; else { s.mods.rosa = (s.mods.rosa || 0) - 12; evNote = "Recognition was under 55%. Rosa is seriously thinking about the offer."; } }
    s.items = items(s);
    // crew morale, warnings, quits
    const quits = [], warns = [], before = {};
    prev.crew.forEach(c => before[c.id] = c.morale);
    s.crew.forEach(c => { if (c.quit) return; c.morale = moraleOf(s, c.id);
      if (c.morale < QUIT_AT) { if (c.warn) { c.quit = true; c.quitM = m; quits.push(c.id); } else { c.warn = true; warns.push(c.id); } } else c.warn = false; });
    const active = s.crew.filter(c => !c.quit);
    const revenue = Math.round(active.reduce((t, c) => t + 1000 * (0.5 + c.morale / 100), 0) * revMult + bonusRev);
    const quitCost = quits.length * QUIT_COST, profit = revenue - spend - quitCost;
    const am = active.length ? Math.round(avg(active.map(c => c.morale))) : 0;
    const lab = labelScore({ a: okIds, l: pick && pick.l });
    const score = Math.round(profit / 100) + am + lab.right * PTS.label + quits.length * PTS.quit;
    s.hist.push({ m, acts: okIds, labels: (pick && pick.l) || {}, lab: { right: lab.right, total: lab.total, by: lab.by }, items: s.items, morale: s.crew.map(c => c.quit && c.quitM !== m ? null : c.morale),
      before, avg: am, revenue, spend, quitCost, profit, score, quits, warns, ev: evNote, crewLeft: active.length });
    s.total += score; s.profit += profit; s.spent = (s.spent || 0) + spend; s.m = m + 1;
    return s;
  }
  // the quote a person shows right now: low, middle, or high morale
  const quoteOf = (shop, pid) => { const c = shop.crew.find(x => x.id === pid), p = personById[pid];
    if (c.quit) return p.quit; if (c.warn) return p.warn; return p.q[c.morale < 45 ? 0 : c.morale < 65 ? 1 : 2]; };
  const mood = m => m < 35 ? "Ready to quit" : m < 45 ? "Unhappy" : m < 55 ? "Getting by" : m < 70 ? "Pretty good" : "All in";
  const money = n => (n < 0 ? "-$" : "$") + Math.abs(Math.round(n)).toLocaleString("en-US");

  return { MONTHS, BUDGET, PICKS, QUIT_AT, QUIT_COST, PTS, ITEMS, itemById, PEOPLE, personById, MASLOW, ACTIONS, actById, EVENTS,
    newShop, step, canBuy, budgetLeft, committed, labelScore, moraleOf, gate, quoteOf, mood, money, HYG, MOT };
})();
if (typeof module !== "undefined") module.exports = CREW;
