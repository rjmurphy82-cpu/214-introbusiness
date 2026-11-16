/* The Turnaround: case builder and scoring. Needs /hire-power/data.js loaded first (it reuses the 14 companies).

   THE STORY. One year after Hire Power, every company is in trouble: people are quitting. Each pair gets one company's
   case file (7 evidence cards, 24 lines they can flag), finds the management problems hiding in it, then spends a
   $15,000 budget on fixes.

   THE PROBLEMS. 12 problem types, each tied to a unit concept. Each case plants 6 of them (a rotation, so across 14
   cases every problem shows up 7 times). A planted problem always shows up on its main card; half the time it also
   shows up on a second card. Two lines of evidence = a bigger problem (weight 2), one line = weight 1. Every other
   line on the cards is normal business and counts as a false alarm if flagged.

   SCORING
     Investigation: +10 for a planted line flagged with the right problem, +5 with a closely related problem,
                    -4 for flagging a normal line or the wrong kind of problem. Score = points / (10 x planted lines),
                    0 to 100.
     Fixes:         each planted problem fixed earns its weight. Score = earned / the best possible within the budget,
                    0 to 100. Fixing a problem that isn't there, or buying a quick fix (pizza party, posters, cameras,
                    firing someone, a one-time bonus), earns nothing.
     Turnaround score = 60% investigation + 40% fixes.
   SIX MONTHS LATER. Quits per month climb over the year to 1 + 0.4 per weight point of planted problems; each fixed problem
   takes its share off, and the chart shows the next six months. */
"use strict";
var TA = (function () {
  const BUDGET = 15000;
  const FIRST = ["Aaliyah", "Marcus", "Sofia", "Jayden", "Priya", "Diego", "Hannah", "Malik", "Elena", "Tyler", "Mei", "Andre", "Grace", "Omar", "Lucia", "Ethan", "Zoe", "Kwame",
    "Nadia", "Brandon", "Isabel", "Jamal", "Chloe", "Mateo", "Fatima", "Ryan", "Leah", "Darius", "Ana", "Connor", "Imani", "Kevin", "Yasmin", "Luis", "Megan", "Tariq",
    "Rosa", "Owen", "Keisha", "Victor", "Lily", "Sam", "Noor", "Gabriel", "Tessa", "Hiro", "Bianca", "Xavier", "Jordan", "Riley", "Camila", "Dev"];
  const CARDS = [
    { id: "org", name: "Org Chart", icon: "▦", sub: "Who reports to whom" },
    { id: "survey", name: "Employee Survey", icon: "▮", sub: "% of employees who agree" },
    { id: "exit", name: "Exit Interviews", icon: "❝", sub: "Why people said they quit" },
    { id: "log", name: "Manager's Notebook", icon: "✎", sub: "The general manager's notes from last month" },
    { id: "book", name: "Employee Handbook", icon: "▤", sub: "Values and policies" },
    { id: "hires", name: "Hiring File", icon: "☰", sub: "The last three hires" },
    { id: "reviews", name: "Customer Reviews", icon: "★", sub: "Recent online reviews" }
  ];
  // c = concept from the unit; fix = the real fix; ev = [main evidence, second evidence]
  const PROBLEMS = [
    { id: "style", name: "Wrong leadership style for the employee's level", c: "Situational leadership", fix: "Train managers to match their style to each employee's level", cost: 4000,
      ev: [{ card: "log", t: v => v.flip ? `${v.vet} has been our best ${v.job} for ${v.yrs} years. I still walk ${v.vet} through every step and check every single task.` : `Hired ${v.nw} on Monday, handed over the keys, and left for the week. ${v.nw} will figure it out.` },
           { card: "survey", q: "My manager adjusts to how experienced I am." }] },
    { id: "span", name: "Span of control too wide", c: "Organizational structure", fix: "Promote two shift leads so no one manages more than 7 people", cost: 6000,
      ev: [{ card: "org", t: v => `${v.mgr}, the general manager, has ${v.span} people reporting directly to them.` },
           { card: "reviews", t: v => `Asked for a manager three times. The only one there was running between ${v.span} employees and never came over.` }] },
    { id: "levels", name: "Too many levels of management", c: "Levels of management", fix: "Cut a layer and let the general manager decide small things", cost: 2000,
      ev: [{ card: "org", t: v => `Six levels of management for a ${v.size}-person business: owner, regional director, district manager, general manager, assistant manager, shift lead.` },
           { card: "log", t: () => `A $200 repair has waited five weeks for sign-off from the district manager, then the regional director, then the owner.` }] },
    { id: "hygiene", name: "Pay or working conditions below standard", c: "Herzberg: hygiene factors", fix: "Raise pay to match nearby competitors", cost: 8000,
      ev: [{ card: "survey", q: "My pay is fair for the work I do." },
           { card: "exit", t: () => `"Got a job down the street for $3 more an hour. Same work."` }] },
    { id: "motiv", name: "No recognition or chance to grow", c: "Herzberg: motivators", fix: "Start a recognition program and a promotion path", cost: 3000,
      ev: [{ card: "survey", q: "Someone noticed my good work this month." },
           { card: "exit", t: () => `"Two years there and nobody ever said thanks or talked to me about moving up."` }] },
    { id: "theoryx", name: "Manager assumes people are lazy (Theory X)", c: "Theory X and Theory Y", fix: "Coach the manager to set goals and trust people instead of watching them", cost: 3000,
      ev: [{ card: "log", t: () => `Put cameras over every station. People slack off the second I'm not watching.` },
           { card: "exit", t: () => `"I felt like a suspect, not an employee."` }] },
    { id: "culture", name: "Policies don't match the culture the company claims", c: "Organizational culture", fix: "Rewrite the handbook so the policies match the values", cost: 2000,
      ev: [{ card: "book", t: () => `Every bathroom break must be signed out with a manager.` },
           { card: "survey", q: "The rules here match what the company says it values." }] },
    { id: "uneven", name: "Rules applied unevenly", c: "Discipline and fairness", fix: "Set one discipline ladder that applies to everyone", cost: 1000,
      ev: [{ card: "log", t: v => `Wrote up ${v.a} for being 5 minutes late. Let ${v.b} slide for the same thing; ${v.b} is my best ${v.job}.` },
           { card: "exit", t: () => `"There are rules for some people and no rules for the manager's favorites."` }] },
    { id: "voice", name: "Decisions made with no employee input", c: "Leadership styles: autocratic vs. democratic", fix: "Hold monthly team meetings to get input before big changes", cost: 1000,
      ev: [{ card: "log", t: () => `Switched everyone to 6 a.m. starts next month. Didn't ask anyone. They'll adjust.` },
           { card: "survey", q: "I have a say in decisions that affect my job." }] },
    { id: "nocheck", name: "Hiring without checking skills or references", c: "Hiring: the interview process", fix: "Add a skills test and reference checks to every hire", cost: 2000,
      ev: [{ card: "hires", t: v => `Hired ${v.h1} as ${v.art} ${v.job2} after a 10-minute coffee chat. No skills test, no reference calls. Let go after three weeks.` },
           { card: "log", t: v => `Had to let ${v.h1} go for missing shifts. Turns out the last two employers had the same problem.` }] },
    { id: "overlap", name: "Hires overlap while a key skill is missing", c: "Hiring: skills and team fit", fix: "Hire someone with the missing skill", cost: 5000,
      ev: [{ card: "hires", t: v => `All three hires this year were ${v.job1}s with the same skills. Nobody left on the team can do ${v.skill.toLowerCase()}.` },
           { card: "reviews", t: v => `They couldn't help us. Said the only person who knew ${v.skill.toLowerCase()} quit.` }] },
    { id: "needs", name: "Basic needs not met: long shifts, no breaks", c: "Maslow: physical and safety needs", fix: "Cap shifts at 8 hours and guarantee breaks", cost: 4000,
      ev: [{ card: "book", t: () => `Shifts can run 10 hours with one 10-minute break.` },
           { card: "survey", q: "I get my breaks and feel safe at work." }] }
  ];
  const QUICK = [
    { id: "pizza", name: "Throw a pizza party every Friday", cost: 2000, says: "Everyone liked the pizza. Nobody stayed because of it." },
    { id: "posters", name: "Put up motivational posters", cost: 1000, says: "The posters went up. Two people quit the next week anyway." },
    { id: "cams", name: "Install more cameras to watch employees", cost: 3000, says: "People felt watched and trusted the company even less." },
    { id: "fire", name: "Fire the lowest performer as a warning", cost: 1000, says: "Everyone got scared, and two good people started job hunting." },
    { id: "bonus", name: "Give everyone a one-time $100 bonus", cost: 3000, says: "A nice week. By next month, nothing had changed." }
  ];
  const RELATED = [["style", "theoryx"], ["theoryx", "culture"], ["theoryx", "voice"], ["hygiene", "needs"], ["motiv", "voice"], ["span", "levels"], ["nocheck", "overlap"], ["culture", "uneven"], ["style", "motiv"]];
  const related = (a, b) => RELATED.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const SURVEY_Q = PROBLEMS.filter(p => p.ev.some(e => e.q)).map(p => ({ id: p.id, q: p.ev.find(e => e.q).q }));
  const NEUTRAL = {
    org: [v => `Each shift lead has 4 to 6 people on their team.`, v => `Three levels: the owner, the general manager, and ${v.leads} shift leads.`],
    exit: [() => `"I'm moving to Ohio for college. I'll miss the crew."`, () => `"Left to go back to school full-time. Good place to work."`, () => `"I needed more hours than they could give me in the slow season."`, () => `"My family moved to Texas."`, () => `"Got into a nursing program. It was time."`],
    log: [v => `Met with ${v.c} to set goals for next month. Good talk.`, () => `Ordered extra supplies before the weekend rush.`, v => `Gave ${v.d} the lead on Saturday's opening. Ready for it.`, () => `Fixed the schedule so nobody closes and then opens the next morning.`],
    book: [() => `Schedules are posted two weeks ahead.`, () => `Employees get a free meal or drink every shift.`, () => `Shift swaps are fine with 24 hours' notice.`, () => `Uniform: company shirt and closed-toe shoes.`],
    hires: [v => `Hired ${v.h2} as ${v.art2} ${v.job3} after a work sample and two reference calls. Doing great.`, v => `Promoted ${v.h3} from within to ${v.job0}.`, v => `Hired ${v.h4} after a team panel interview and a skills test.`],
    reviews: [() => `Great prices and friendly people.`, () => `Parking is rough on weekends.`, () => `Wish they were open later on Sundays.`, () => `Fast service. Would come back.`]
  };
  const COUNT = { org: 2, exit: 3, log: 4, book: 3, hires: 3, reviews: 3 };

  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const ORDER = ["style", "hygiene", "span", "culture", "nocheck", "voice", "motiv", "levels", "uneven", "needs", "theoryx", "overlap"];
  const art = w => /^[aeiou]/i.test(w) ? "an" : "a";
  const CACHE = {};
  function build(ci) {
    if (CACHE[ci]) return CACHE[ci];
    const comp = HP.COMPANIES[ci], R = rng(4421 + ci * 97);
    const shuf = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const names = shuf(FIRST);
    const lc = s => s.toLowerCase();
    const v = { mgr: names[0], vet: names[1], nw: names[2], a: names[3], b: names[4], c: names[5], d: names[6], h1: names[7], h2: names[8], h3: names[9], h4: names[10],
      job: lc(comp.jobs[0].t), job0: lc(comp.jobs[3].t), job1: lc(comp.jobs[1].t), job2: lc(comp.jobs[0].t), job3: lc(comp.jobs[2].t), skill: comp.jobs[2].s[0],
      yrs: 4 + Math.floor(R() * 5), span: 14 + Math.floor(R() * 5), size: 18 + Math.floor(R() * 12), leads: 3 + Math.floor(R() * 2), flip: R() < 0.5 };
    v.art = art(v.job2); v.art2 = art(v.job3);
    const planted = [0, 1, 2, 3, 4, 5].map(k => ORDER[(ci * 5 + k) % 12]);
    const weight = {}, lines = { org: [], exit: [], log: [], book: [], hires: [], reviews: [] }, low = {};
    planted.forEach(pid => { const p = PROBLEMS.find(x => x.id === pid), two = R() < 0.5; weight[pid] = two ? 2 : 1;
      p.ev.slice(0, two ? 2 : 1).forEach(e => { if (e.q) low[pid] = true; else lines[e.card].push({ t: e.t(v), p: pid }); }); });
    // org lines can't contradict each other
    const ps = planted.includes("span"), pl = planted.includes("levels");
    if (ps && !pl) lines.org.push({ t: `Three levels: the owner, the general manager, and everyone else.`, p: null });
    if (pl && !ps) lines.org.push({ t: NEUTRAL.org[0](v), p: null });
    Object.keys(lines).forEach(card => { const pool = shuf(NEUTRAL[card]);
      while (lines[card].length < COUNT[card] && pool.length) lines[card].push({ t: pool.shift()(v), p: null });
      lines[card] = shuf(lines[card]); });
    const survey = SURVEY_Q.map(s => ({ t: s.q, p: low[s.id] ? s.id : null, pct: low[s.id] ? 12 + Math.floor(R() * 20) : 64 + Math.floor(R() * 25) }));
    const cards = {};
    CARDS.forEach(c => { cards[c.id] = (c.id === "survey" ? survey : lines[c.id]).map((l, i) => ({ ...l, id: c.id + i })); });
    const tw = Object.values(weight).reduce((a, b) => a + b, 0);
    const quits = []; let q = 0.5; const top = 1 + 0.4 * tw; for (let m = 0; m < 12; m++) { quits.push(Math.max(0, Math.round(q + (R() - 0.5) * 0.8))); q += (top - 0.5) / 11; }
    const intro = `One year after hiring its new team, ${comp.name} is losing people. ${quits.slice(-3).reduce((a, b) => a + b, 0)} employees quit in the last three months, and the owner wants to know why before the busy season. You're the turnaround team: find out what management is doing wrong.`;
    return (CACHE[ci] = { ci, comp, v, planted, weight, cards, quits, intro, size: v.size });
  }
  const allLines = cs => CARDS.flatMap(c => cs.cards[c.id]);
  const fixOf = pid => PROBLEMS.find(p => p.id === pid);
  const FIXES = PROBLEMS.map(p => ({ id: p.id, name: p.fix, cost: p.cost })).concat(QUICK.map(q => ({ id: q.id, name: q.name, cost: q.cost, quick: true })));
  const fixById = id => FIXES.find(f => f.id === id);
  const spent = fx => (fx || []).reduce((t, id) => t + ((fixById(id) || {}).cost || 0), 0);
  function bestFix(cs) { // brute force over the planted fixes
    const ids = cs.planted; let best = 0;
    for (let m = 0; m < 1 << ids.length; m++) { let c = 0, w = 0; ids.forEach((id, i) => { if (m & (1 << i)) { c += fixOf(id).cost; w += cs.weight[id]; } }); if (c <= BUDGET && w > best) best = w; }
    return best;
  }
  // flags: { lineId: problemId }   fixes: [fixId]
  function score(ci, flags, fixes) {
    const cs = build(ci), lines = allLines(cs), F = flags || {}, out = { lines: [], found: [], missed: [], alarms: 0 };
    let pts = 0; const max = 10 * lines.filter(l => l.p).length;
    lines.forEach(l => { const f = F[l.id]; let r = "none";
      if (l.p) { if (f === l.p) { pts += 10; r = "hit"; } else if (f && related(f, l.p)) { pts += 5; r = "close"; } else if (f) { pts -= 4; r = "wrong"; } else r = "miss"; }
      else if (f) { pts -= 4; r = "alarm"; out.alarms++; }
      out.lines.push({ id: l.id, p: l.p, f, r }); });
    const inv = Math.max(0, Math.min(100, Math.round(100 * pts / max)));
    cs.planted.forEach(pid => { const ls = out.lines.filter(x => x.p === pid); (ls.some(x => x.r === "hit" || x.r === "close") ? out.found : out.missed).push(pid); });
    const fx = (fixes || []).filter(id => fixById(id)), earned = fx.filter(id => cs.planted.includes(id)).reduce((t, id) => t + cs.weight[id], 0), best = bestFix(cs);
    const fixScore = Math.round(100 * Math.min(1, earned / best));
    const tw = Object.values(cs.weight).reduce((a, b) => a + b, 0), last = cs.quits[cs.quits.length - 1];
    const after = []; let q = last; const target = Math.max(0.5, 1 + 0.4 * (tw - earned));
    for (let m = 0; m < 6; m++) { q += (target - q) * 0.45; after.push(Math.round(q * 10) / 10); }
    const story = fx.map(id => { const f = fixById(id); if (f.quick) return { id, good: false, t: `${f.name}. ${QUICK.find(q => q.id === id).says}` };
      return cs.planted.includes(id) ? { id, good: true, t: `${f.name}: it worked. ${cs.weight[id] === 2 ? "This was one of the biggest problems." : ""}`.trim() } : { id, good: false, t: `${f.name}: money spent on a problem this company didn't have.` }; });
    return { inv, fixScore, total: Math.round(0.6 * inv + 0.4 * fixScore), pts, max, earned, best, after, story, ...out };
  }
  return { BUDGET, CARDS, PROBLEMS, QUICK, FIXES, fixById, spent, related, build, allLines, score, fixOf };
})();
if (typeof module !== "undefined") module.exports = TA;
