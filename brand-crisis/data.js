/* Brand Crisis: the brand, the crises, and the math. Shared by the student page and the teacher screen.
   Every student is Strider's marketing director. Each crisis has 8 responses. A response costs crisis budget
   and moves Trust (0-100) and weekly Sales (%). After everyone locks in, one random twist card ("what happened next")
   changes how some responses play out. Students who don't lock in "stayed quiet" (the silent option).
   Brand value = weekly sales x 52 x (trust / 100) + cash left. Trust multiplies everything. */
"use strict";
var CRISIS = (function () {
  const BRAND = {
    name: "Strider Sneakers",
    line: "Chicago sneaker brand · \"Built in Chicago\" · founded 2019",
    about: "Most buyers are 16 to 24 and pay with their own money. Parents buy back-to-school pairs. Strider's whole image is honest, local, and real.",
    start: { trust: 70, sales: 1000000, cash: 1000000 }
  };
  // o: [letter label is added on screen] t = text, cost = $ spent now, tr = trust change, sa = weekly sales change (%), tag = kind of response
  const CRISES = [
    {
      id: "creator", title: "The Creator Clip",
      story: "An old video of Strider's biggest sponsored creator (3 million followers) resurfaces. In it, he mocks people with disabilities. #DropStrider is trending.",
      opts: [
        { t: "Drop him today and post a short, clear apology.", cost: 0, tr: 4, sa: -2, tag: "apologize" },
        { t: "Stay quiet and wait for it to blow over.", cost: 0, tr: -12, sa: -6, tag: "silent" },
        { t: "Defend him: \"People change. That was years ago.\"", cost: 0, tr: -18, sa: -8, tag: "defend" },
        { t: "Drop him, apologize, and give $100,000 to an adaptive sports league whose athletes star in your next ad.", cost: 100000, tr: 10, sa: 2, tag: "fix" },
        { t: "Delete the angry comments and turn off replies.", cost: 0, tr: -15, sa: -5, tag: "hide" },
        { t: "Post a meme joking about the drama.", cost: 0, tr: -20, sa: -7, tag: "humor" },
        { t: "Pause every creator ad until a full review is done.", cost: 50000, tr: 2, sa: -6, tag: "pause" },
        { t: "Keep him, and let him post his own apology.", cost: 0, tr: -6, sa: -3, tag: "defend" }
      ],
      twists: [
        { t: "A reporter finds out Strider's team knew about the video last year.", note: "Hiding and defending look much worse now.", mods: { hide: { tr: -8 }, silent: { tr: -8 }, defend: { tr: -8 } } },
        { t: "The creator's own apology goes viral as sincere. Most fans forgive him.", note: "Keeping him and letting him apologize looks better.", mods: { defend: { tr: 8, sa: 3 } } },
        { t: "A bigger celebrity scandal takes over the news two days later.", note: "Staying quiet hurts less than usual.", mods: { silent: { tr: 7, sa: 3 } } }
      ]
    },
    {
      id: "soles", title: "Splitting Soles",
      story: "Soles on the new $140 Lakefront Runner are splitting after two weeks. #StriderSplit has 6 million views. You've sold 40,000 pairs.",
      opts: [
        { t: "Full recall: free replacement or refund for every pair.", cost: 300000, tr: 12, sa: -4, tag: "fix" },
        { t: "Replace pairs only for people who complain.", cost: 60000, tr: -4, sa: -3, tag: "partial" },
        { t: "Say it's \"a small batch\" and most pairs are fine.", cost: 0, tr: -10, sa: -6, tag: "deny" },
        { t: "Blame customers for \"improper use.\"", cost: 0, tr: -20, sa: -10, tag: "blame" },
        { t: "Give everyone 20% off their next pair.", cost: 40000, tr: -6, sa: -2, tag: "discount" },
        { t: "Founder video: shows what went wrong, the fix, a 1-year guarantee, and the full recall.", cost: 320000, tr: 16, sa: -2, tag: "fix" },
        { t: "Pay creators to post positive reviews of the shoe.", cost: 80000, tr: -14, sa: -4, tag: "fake" },
        { t: "Quietly stop selling the shoe.", cost: 0, tr: -8, sa: -7, tag: "silent" }
      ],
      twists: [
        { t: "Lawyers start a class-action lawsuit over the splitting soles.", note: "Denying, blaming, and silence now cost money and trust.", mods: { deny: { tr: -10, sa: -5 }, blame: { tr: -10, sa: -5 }, silent: { tr: -10, sa: -5 }, partial: { tr: -5 } } },
        { t: "Consumer Reports praises brands that recall fast this year.", note: "Full recalls get a bonus.", mods: { fix: { tr: 5, sa: 3 } } },
        { t: "Your replacement pairs ship three weeks late.", note: "Recalls lose some of their shine.", mods: { fix: { tr: -4 } } }
      ]
    },
    {
      id: "review", title: "The One-Star Video",
      story: "A customer's 2-minute video: her package was lost and support hung up on her twice. 4 million views. The comments are full of people with the same story.",
      opts: [
        { t: "Reply publicly within an hour, refund her, ship a new pair overnight, and DM her.", cost: 1000, tr: 6, sa: 1, tag: "fast" },
        { t: "Ignore it. It's one person.", cost: 0, tr: -8, sa: -3, tag: "silent" },
        { t: "Reply: \"We have no record of this order.\"", cost: 0, tr: -12, sa: -4, tag: "deny" },
        { t: "Fix support: hire 20 agents, promise 24-hour replies, and post the plan.", cost: 150000, tr: 12, sa: 3, tag: "fix" },
        { t: "Offer her free shoes for life if she deletes the video.", cost: 5000, tr: -10, sa: -2, tag: "hide" },
        { t: "Flood the comments with brand-friendly accounts.", cost: 20000, tr: -16, sa: -4, tag: "fake" },
        { t: "Invite her to Strider HQ to design a \"Customer Says\" pair.", cost: 40000, tr: 8, sa: 5, tag: "partner" },
        { t: "Post a funny video roasting the delivery company.", cost: 0, tr: -4, sa: 1, tag: "blame" }
      ],
      twists: [
        { t: "She posts a follow-up video about how Strider responded.", note: "Fast, fixing, and partnering responses get a boost. Asking her to delete it backfires.", mods: { fast: { tr: 4 }, fix: { tr: 4 }, partner: { tr: 4, sa: 2 }, hide: { tr: -8, sa: -3 } } },
        { t: "Customer-service horror stories start trending for every big brand.", note: "Brands that actually fixed support stand out.", mods: { fix: { tr: 3, sa: 4 } } },
        { t: "The delivery company apologizes and admits it lost thousands of packages.", note: "Pointing at the delivery company looks fair now.", mods: { blame: { tr: 8, sa: 2 } } }
      ]
    },
    {
      id: "attack", title: "The Attack Ad",
      story: "Rival brand Vantage runs an ad: \"Strider: $140 for 'Built in Chicago'? Same overseas factory as ours, half the price.\" It's partly true: some pairs are made overseas.",
      opts: [
        { t: "Ignore it.", cost: 0, tr: -4, sa: -4, tag: "silent" },
        { t: "Fire back with an attack ad mocking Vantage.", cost: 120000, tr: -6, sa: 2, tag: "attack" },
        { t: "Be honest: show which pairs are made where, and why.", cost: 30000, tr: 8, sa: -1, tag: "honest" },
        { t: "Cut prices 25% to match Vantage.", cost: 150000, tr: 0, sa: 6, tag: "discount" },
        { t: "Sue Vantage for false advertising.", cost: 200000, tr: -2, sa: -2, tag: "legal" },
        { t: "Move more production to Chicago and make that the new campaign.", cost: 250000, tr: 12, sa: 4, tag: "fix" },
        { t: "Post a funny video that admits it and pokes fun at Strider itself.", cost: 20000, tr: 6, sa: 3, tag: "humor" },
        { t: "Quietly remove \"Built in Chicago\" from the website.", cost: 0, tr: -10, sa: -3, tag: "hide" }
      ],
      twists: [
        { t: "A journalist confirms Vantage's claim with factory records.", note: "Hiding, ignoring, and suing look bad. Honesty gets credit.", mods: { hide: { tr: -8 }, silent: { tr: -6 }, legal: { tr: -8 }, honest: { tr: 4 } } },
        { t: "Viewers think Vantage's ad is mean. It flops.", note: "Ignoring it works, and firing back lands better than expected.", mods: { silent: { tr: 6, sa: 4 }, attack: { tr: 4 } } },
        { t: "Your self-roast gets picked up by sports radio.", note: "Humor pays off big.", mods: { humor: { tr: 4, sa: 4 } } }
      ]
    },
    {
      id: "factory", title: "The Factory Report",
      story: "A news report says one of Strider's overseas suppliers underpays workers and forces them to work overtime.",
      opts: [
        { t: "Deny it: \"We follow all laws.\"", cost: 0, tr: -14, sa: -5, tag: "deny" },
        { t: "Cut ties with the supplier today.", cost: 120000, tr: 6, sa: -5, tag: "cut" },
        { t: "Hire an outside auditor, publish the results, and fix pay with the supplier.", cost: 180000, tr: 14, sa: -1, tag: "honest" },
        { t: "Stay quiet.", cost: 0, tr: -10, sa: -4, tag: "silent" },
        { t: "Blame the supplier: \"We didn't know.\"", cost: 0, tr: -6, sa: -2, tag: "blame" },
        { t: "Launch a \"Fair Pair\" line: $10 of every pair goes to the workers.", cost: 60000, tr: 8, sa: 2, tag: "partner" },
        { t: "Donate $50,000 to a workers' rights group and say nothing else.", cost: 50000, tr: -2, sa: -1, tag: "donate" },
        { t: "Run a feel-good \"Chicago Pride\" ad to change the subject.", cost: 100000, tr: -12, sa: -2, tag: "distract" }
      ],
      twists: [
        { t: "A second report shows five other big brands use the same supplier.", note: "The heat spreads out. Every response hurts a little less.", mods: { deny: { tr: 5 }, silent: { tr: 5 }, blame: { tr: 5 }, distract: { tr: 4 } } },
        { t: "Students at 30 high schools organize a Strider boycott.", note: "Your young buyers are watching. Silence and spin cost more.", mods: { deny: { tr: -8, sa: -4 }, silent: { tr: -8, sa: -4 }, distract: { tr: -8, sa: -4 }, donate: { tr: -4 } } },
        { t: "The auditor finds the problem is real but already improving.", note: "Transparent and Fair Pair responses get extra credit.", mods: { honest: { tr: 4, sa: 2 }, partner: { tr: 3, sa: 2 } } }
      ]
    },
    {
      id: "breach", title: "The Data Breach",
      story: "Hackers stole 200,000 Strider customers' names, emails, and home addresses from your website.",
      opts: [
        { t: "Tell customers within 24 hours, explain what happened, and offer free identity protection.", cost: 200000, tr: 8, sa: -2, tag: "honest" },
        { t: "Wait three weeks until the lawyers are sure what happened.", cost: 0, tr: -14, sa: -5, tag: "silent" },
        { t: "Email a short notice with a 10% off code.", cost: 30000, tr: -8, sa: -1, tag: "discount" },
        { t: "Say \"No payment info was taken, so it's no big deal.\"", cost: 0, tr: -12, sa: -3, tag: "deny" },
        { t: "Hire a security firm, notify everyone, and post a CEO video with the fix plan.", cost: 260000, tr: 12, sa: -1, tag: "fix" },
        { t: "Blame the company that built your website.", cost: 0, tr: -8, sa: -3, tag: "blame" },
        { t: "Shut down the online store for a week to fix it.", cost: 150000, tr: 4, sa: -8, tag: "pause" },
        { t: "Post a meme: \"Even hackers want our shoes.\"", cost: 0, tr: -18, sa: -4, tag: "humor" }
      ],
      twists: [
        { t: "A state law requires telling customers within 7 days. Waiting brings a $100,000 fine.", note: "Waiting gets expensive.", mods: { silent: { tr: -10, cost: 100000 } } },
        { t: "The hackers post the stolen data online.", note: "Being upfront pays. Downplaying it backfires.", mods: { honest: { tr: 4 }, fix: { tr: 4 }, discount: { tr: -6 }, deny: { tr: -8 } } },
        { t: "A huge breach at a big-box store takes over the headlines.", note: "Everyone's response matters a little less.", mods: { silent: { tr: 5 }, deny: { tr: 4 }, blame: { tr: 4 } } }
      ]
    }
  ];
  const byId = Object.fromEntries(CRISES.map(c => [c.id, c]));
  const SILENT = c => c.opts.findIndex(o => o.tag === "silent");

  // The outcome of option i once the twist is known.
  function outcome(c, i, twistIdx) {
    const o = c.opts[i], m = (twistIdx != null && c.twists[twistIdx] && c.twists[twistIdx].mods[o.tag]) || {};
    return { cost: o.cost + (m.cost || 0), tr: o.tr + (m.tr || 0), sa: o.sa + (m.sa || 0) };
  }
  const value = b => b.sales * 52 * (b.trust / 100) + b.cash;
  function apply(b, out) {
    return { trust: Math.max(0, Math.min(100, b.trust + out.tr)), sales: Math.max(0, b.sales * (1 + out.sa / 100)), cash: b.cash - out.cost };
  }
  // Replay a player's game. picks[r] = option index (or null = stayed quiet). twists[r] = the twist drawn that round.
  function run(ids, picks, twists, upto) {
    let b = { ...BRAND.start };
    const log = [];
    for (let r = 0; r <= upto; r++) {
      const c = byId[ids[r]], raw = picks[r];
      let i = raw == null ? SILENT(c) : +raw;
      if (c.opts[i].cost > b.cash) i = SILENT(c); // couldn't afford it (the screen stops this, but just in case)
      const out = outcome(c, i, twists[r]), before = value(b);
      b = apply(b, out);
      log.push({ r, i, quiet: raw == null, out, delta: value(b) - before, b: { ...b } });
    }
    return { b, log, value: value(b) };
  }
  // The response that adds the most brand value this round, starting from the brand's state (for the reveal).
  function bestFor(c, twistIdx, b) {
    let top = -Infinity, best = 0;
    c.opts.forEach((o, i) => { if (o.cost > b.cash) return; const v = value(apply(b, outcome(c, i, twistIdx))) - value(b); if (v > top) { top = v; best = i; } });
    return best;
  }
  return { BRAND, CRISES, byId, SILENT, outcome, value, apply, run, bestFor };
})();
if (typeof module !== "undefined") module.exports = CRISIS;
