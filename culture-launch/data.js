/* Culture Launch: content and the alignment engine. Shared by the student page and the teacher screen.

   THE MODEL (the "six months later" reveal; students don't see this until the end)
   Every choice sends a signal on two axes:
     S = structure. +2 is strict and controlled, -2 is loose and trusting.
     P = people.    +2 is caring, growth, and purpose. -2 is pressure, competition, and results at any cost.
   Each tone has a target point. For each section (leadership style, values, investments, policies, discipline,
   crisis response) the engine averages the section's signals, measures the distance to the tone's target, and turns
   it into a fit score: fit = 100 - 28 x distance (never below 0). The alignment score is the weighted average:
   style 15%, values 10%, investments 20%, policies 25%, discipline 20%, crisis 10%.
   Discipline is measured against what's normal for each infraction (theft is a firing offense at almost any company),
   so only how much harsher or softer you are than normal counts. Going soft on theft is a fairness flag (-10).
   A section that misses (fit under 60) produces an employee reaction that says which way it missed.
   Total score = alignment (0 to 100) + audience rubric (average of five 1-to-4 ratings, as a percent). */
"use strict";
var CL = (function () {
  const BUDGET = 8000, HOURS = 12, MAXLV = 3;

  const TONES = [
    { id: "firm", name: "Firm", line: "Clear rules. High standards. Real consequences.", s: 1.6, p: -0.2 },
    { id: "balanced", name: "Balanced", line: "Fair rules, real support, and room to breathe.", s: 0.3, p: 0.6 },
    { id: "relaxed", name: "Relaxed", line: "Trust people, keep it loose, and have fun.", s: -1.6, p: 0.8 },
    { id: "inspiring", name: "Inspiring", line: "A big purpose. Grow your people. Do work that matters.", s: -0.4, p: 1.5 },
    { id: "competitive", name: "Competitive", line: "Set the bar high, track everything, reward the winners.", s: 0.8, p: -1.3 }
  ];
  const STYLES = [
    { id: "autocratic", name: "Autocratic", q: "Here is what we are doing.", s: 2, p: -1 },
    { id: "democratic", name: "Democratic", q: "What do you all think?", s: -1, p: 1 },
    { id: "bureaucratic", name: "Bureaucratic", q: "Check the procedure manual.", s: 2, p: 0 },
    { id: "laissez", name: "Laissez-faire", q: "You know what to do.", s: -2, p: 0.5 },
    { id: "transactional", name: "Transactional", q: "Hit the goal, earn the bonus.", s: 1, p: -1.8 },
    { id: "transformational", name: "Transformational", q: "Imagine what we could become.", s: -0.5, p: 2 },
    { id: "pacesetter", name: "Pacesetter", q: "Do as I do, now.", s: 1, p: -2 },
    { id: "coaching", name: "Coaching", q: "Let's grow you.", s: 0, p: 2 },
    { id: "visionary", name: "Visionary", q: "Here's where we're going.", s: 0, p: 1.5 },
    { id: "servant", name: "Servant", q: "How can I help?", s: -1, p: 2 }
  ];
  const VALUES = [
    { id: "discipline", name: "Discipline", s: 2, p: 0 }, { id: "hustle", name: "Hustle", s: 1, p: -1.5 }, { id: "excellence", name: "Excellence", s: 1, p: -0.5 },
    { id: "accountability", name: "Accountability", s: 1.2, p: 0 }, { id: "integrity", name: "Integrity", s: 0.5, p: 0.5 }, { id: "customer", name: "Customer first", s: 0.5, p: 0 },
    { id: "craft", name: "Craftsmanship", s: 0.3, p: 0.5 }, { id: "respect", name: "Respect", s: 0, p: 1 }, { id: "teamwork", name: "Teamwork", s: -0.5, p: 1.2 },
    { id: "growth", name: "Growth", s: 0, p: 1.6 }, { id: "creativity", name: "Creativity", s: -1.2, p: 1 }, { id: "fun", name: "Fun", s: -2, p: 1 },
    { id: "winning", name: "Winning", s: 0.8, p: -2 }
  ];
  // culture levers: cost per level, manager hours per level, and the signal they send
  const LEVERS = [
    { id: "train", name: "Training program", blurb: "Skills classes for every restorer", cost: 1200, hrs: 2, s: 0.2, p: 1.6 },
    { id: "recog", name: "Recognition program", blurb: "Shout-outs, awards, a wall of fame", cost: 400, hrs: 1, s: 0, p: 1.4 },
    { id: "events", name: "Team events", blurb: "Bowling nights, potlucks, a summer outing", cost: 800, hrs: 1, s: -1.2, p: 1.2 },
    { id: "perks", name: "Break room and perks", blurb: "Snacks, music, a comfy break room", cost: 1000, hrs: 0, s: -1.5, p: 0.8 },
    { id: "flex", name: "Flexible scheduling", blurb: "A shift-swap app and flexible start times", cost: 300, hrs: 2, s: -2, p: 0.8 },
    { id: "wellness", name: "Wellness", blurb: "Gym discount, mental-health days", cost: 900, hrs: 0, s: -0.8, p: 1.5 },
    { id: "monitor", name: "Monitoring and quality checks", blurb: "Cameras, time clocks, audits of every order", cost: 1000, hrs: 2, s: 2, p: -1 },
    { id: "handbook", name: "Policy handbook and compliance training", blurb: "Written rules for everything", cost: 500, hrs: 2, s: 2, p: 0 },
    { id: "bonus", name: "Sales bonuses and leaderboards", blurb: "Daily rankings and cash for the top restorer", cost: 1500, hrs: 1, s: 0.8, p: -2 },
    { id: "pay", name: "Pay above market", blurb: "$1.50 an hour more than other shops", cost: 2000, hrs: 0, s: 0.3, p: 0.6 }
  ];
  // policies: five options each, from strictest to loosest, with their signals
  const POLICIES = [
    { id: "late", name: "Late arrivals", q: "How many late arrivals in a month before a write-up?", o: [["The first one", 2, -0.5], ["2 in a month", 1, 0], ["3 in a month", 0, 0], ["5 in a month", -1, 0.3], ["No write-ups, just a talk", -2, 0.6]] },
    { id: "phone", name: "Phones", q: "Phones on the shop floor?", o: [["Locked in lockers all shift", 2, -0.5], ["Breaks only", 1, 0], ["OK when no customers are in", 0, 0], ["OK anytime, keep it quick", -1, 0.3], ["Totally up to you", -2, 0.5]] },
    { id: "dress", name: "Dress code", q: "What does the crew wear?", o: [["Full uniform, inspected daily", 2, -0.3], ["Sole Revival shirt and black pants", 1, 0], ["Sole Revival shirt, any pants", 0, 0], ["Anything clean and safe", -1, 0.3], ["Wear whatever you want", -2, 0.5]] },
    { id: "sched", name: "Scheduling", q: "How do schedules work?", o: [["Set 4 weeks out, no swaps", 2, -0.6], ["Swaps need manager approval", 1, 0], ["Swaps with 48 hours' notice", 0, 0.2], ["Swap anytime in the app", -1, 0.5], ["The crew builds its own schedule", -2, 0.8]] },
    { id: "decide", name: "Decisions", q: "Who decides how work gets done?", o: [["The manager approves everything", 2, -0.5], ["The manager approves anything over $100", 1, 0], ["Restorers choose their own methods", -0.5, 0.6], ["The crew votes on most decisions", -1.5, 1.2], ["The crew runs the shop", -2, 0.8]] },
    { id: "feedback", name: "Feedback", q: "How often do people get feedback?", o: [["Once a year, at the annual review", 1, -1], ["Every three months", 0.5, 0], ["Monthly one-on-ones", 0, 1], ["Weekly check-ins", 0, 1.5], ["Daily huddles and shout-outs", -0.5, 1.8]] },
    { id: "target", name: "Targets", q: "How is performance measured?", o: [["Daily quotas, ranked on a board", 1.2, -2], ["Weekly targets for each person", 0.8, -1], ["Team goals we hit together", 0, 0.8], ["Quality over speed, no quotas", -0.8, 1.2], ["No measuring, we trust you", -2, 0.5]] }
  ];
  const RESP = ["Coaching talk", "Verbal warning", "Written warning", "Suspension", "Termination"];
  const INFRACTIONS = [
    { id: "late3", name: "Late 3 times in one month", base: 1 },
    { id: "phone", name: "On their phone while a customer waits", base: 1 },
    { id: "rude", name: "Rude to a customer", base: 2 },
    { id: "noshow", name: "No-call, no-show for a shift", base: 2.5 },
    { id: "quality", name: "Shipped a pair that failed the quality check", base: 1.5 },
    { id: "theft", name: "Took $40 from the register", base: 3.8 }
  ];
  const CRISES = [
    { id: "viral", head: "A video goes viral", text: "A customer posts a video of one of your restorers swearing at them. It has 200,000 views and the comments are brutal.",
      o: [["Fire the restorer today and post a public apology", 2, -1], ["Suspend them, retrain the whole crew, and apologize publicly", 1, 0], ["Talk with the restorer privately, apologize to the customer, and have the crew write new service standards together", -0.8, 1.5], ["Defend your restorer online: the customer started it", -1.8, 0.4]] },
    { id: "weekends", head: "Your two best restorers want weekends off", text: "Marcus and Rosa say they'll quit unless they get every weekend off. Saturday is your busiest day.",
      o: [["Say no. The schedule is the schedule.", 2, -1], ["Offer them a bonus to keep working Saturdays", 0.8, -1.5], ["Sit down with the whole crew and build a fair weekend rotation together", -1, 1.2], ["Give them weekends off and let them work it out with everyone else", -2, 0.4]] },
    { id: "ruined", head: "A $900 pair gets ruined", text: "A new restorer used the wrong cleaner on a customer's $900 limited-edition sneakers. The customer is furious.",
      o: [["Take the $900 out of the restorer's paychecks", 2, -1.5], ["Write them up and add a sign-off step for every expensive pair", 1.5, 0], ["Pay the customer, then coach the restorer and add training on rare materials", 0, 1.5], ["Pay the customer and move on. Mistakes happen.", -1.5, 0.5]] },
    { id: "quota", head: "The PM shift keeps falling behind", text: "Orders are piling up. The PM shift finished 30% fewer pairs than the AM shift three weeks in a row.",
      o: [["Post both shifts' numbers on the wall and set daily quotas", 1.2, -2], ["Have a manager watch the PM shift every night until numbers improve", 2, -0.5], ["Ask the PM shift what's slowing them down and fix it together", -0.8, 1.5], ["Let it go. They'll catch up when it slows down.", -2, 0.3]] },
    { id: "gossip", head: "A group chat gets ugly", text: "A screenshot shows three employees mocking a coworker in a group chat. The coworker saw it and is crying in the break room.",
      o: [["Fire all three. Zero tolerance.", 2, -0.5], ["Written warnings for all three and a new social media policy", 1.5, 0], ["Meet with each person, bring in a mediator, and hold a team talk about respect", -0.5, 1.8], ["Stay out of it. What happens outside work isn't your business.", -2, -0.5]] },
    { id: "idea", head: "An employee goes around you", text: "Lena emailed the owner directly with an idea to sell sneaker-care kits. She didn't ask you first. The owner loves it.",
      o: [["Remind Lena to follow the chain of command, and write her up if it happens again", 2, -0.5], ["Take over the project yourself and give her credit", 1, 0], ["Thank Lena and put her in charge of a pilot of her idea", -1, 1.8], ["Tell the whole crew to email the owner whenever they want", -2, 0.5]] }
  ];
  const RUBRIC = [
    { id: "pol", name: "Tone and policies", q: "The policies match the tone they promised." },
    { id: "disc", name: "Tone and discipline", q: "The discipline ladder matches the tone." },
    { id: "inv", name: "Tone and spending", q: "They spent money and time where their tone says they would." },
    { id: "sty", name: "Leadership style", q: "Their choices sound like the leadership style they picked." },
    { id: "pres", name: "Presentation", q: "Clear and confident, and both partners spoke." }
  ];
  const SCALE = [["1", "Doesn't match"], ["2", "Some mismatches"], ["3", "Mostly matches"], ["4", "Matches perfectly"]];
  const WEIGHTS = { style: 0.15, values: 0.1, invest: 0.2, policy: 0.25, disc: 0.2, crisis: 0.1 };
  const SECTION_NAMES = { style: "Leadership style", values: "Core values", invest: "Investments", policy: "Policies", disc: "Discipline", crisis: "Crisis response" };

  // employee reactions when a section misses the tone: [stricter, looser, softer, harsher]
  const REACT = {
    style: ["“They said the vibe would be easygoing, but the boss runs everything like a drill sergeant.”", "“The boss talks tough, then disappears and lets us figure it out. Which is it?”", "“The boss is so nice that nobody takes the goals seriously.”", "“The manager only cares about numbers. That's not what they promised at the launch.”"],
    values: ["“The values on the wall sound like a rule book, not the culture they described.”", "“The posters say one thing. Nobody here knows what we actually stand for.”", "“Our values are all feelings, but the tone was supposed to be about results.”", "“Our values say ‘win at all costs.’ That's not the culture they pitched us.”"],
    invest: ["“They said they trusted us, then spent the money on cameras and rule books.”", "“The money went to snacks and parties. Nobody's checking quality anymore.”", "“They said we'd compete for the top, then spent everything on wellness and team outings.”", "“All the money went to bonuses for the top restorer. So much for taking care of us.”"],
    policy: ["“Write-ups for one late arrival? Locked-up phones? That's not ‘relaxed.’”", "“There are basically no rules. It doesn't feel like the firm, serious shop they described.”", "“There's no pressure at all. The competitive crew they wanted gets bored.”", "“Quotas ranked on a board? They said this place was about people.”"],
    disc: ["“People get suspended for things that deserve a talk. Everyone's scared to make a mistake.”", "“Someone no-call no-showed and got a ‘talk.’ The hard workers feel like suckers.”", "“Nothing has real consequences. That doesn't match the high standards they promised.”", "“Discipline feels harsh and cold. Nobody feels supported when they slip up.”"],
    crisis: ["“When the crisis hit, management cracked down hard. Totally different from the culture they sold us.”", "“When things got serious, management just shrugged. That's not the firm leadership they promised.”", "“The crisis response was all hugs and no accountability.”", "“When things went wrong, management protected the business and threw the employee under the bus.”"]
  };
  const PRAISE = {
    style: "“The boss leads exactly the way they said they would.”", values: "“Our values actually describe how we work.”", invest: "“You can see the culture in where they spent the money.”",
    policy: "“The rules feel like they fit this place.”", disc: "“Discipline is fair and predictable. You know where you stand.”", crisis: "“How they handled the crisis is exactly who we are.”"
  };

  const byId = arr => { const o = {}; arr.forEach(x => o[x.id] = x); return o; };
  const toneById = byId(TONES), styleById = byId(STYLES), valueById = byId(VALUES), leverById = byId(LEVERS), crisisById = byId(CRISES);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const spend = inv => { let $ = 0, h = 0; LEVERS.forEach(l => { const n = (inv || {})[l.id] || 0; $ += n * l.cost; h += n * l.hrs; }); return { $, h }; };
  const canAdd = (inv, id) => { const l = leverById[id], n = (inv || {})[id] || 0, sp = spend(inv); return n < MAXLV && sp.$ + l.cost <= BUDGET && sp.h + l.hrs <= HOURS; };
  const crisisFor = (seed, gi) => CRISES[(gi + (seed || 0)) % CRISES.length];

  function pt(list) { // weighted average of [s, p, w]
    const W = list.reduce((t, x) => t + (x[2] ?? 1), 0); if (!W) return null;
    return { s: list.reduce((t, x) => t + x[0] * (x[2] ?? 1), 0) / W, p: list.reduce((t, x) => t + x[1] * (x[2] ?? 1), 0) / W };
  }
  // plan = { found:{tone, style, values:[]}, invest:{lever: level}, pol:{id: index}, disc:{id: index}, crisis:{o, text} }
  function points(plan, crisis) {
    const f = plan.found || {}, out = {};
    const st = styleById[f.style]; out.style = st ? { s: st.s, p: st.p } : null;
    out.values = pt((f.values || []).map(v => valueById[v]).filter(Boolean).map(v => [v.s, v.p]));
    out.invest = pt(LEVERS.filter(l => (plan.invest || {})[l.id]).map(l => [l.s, l.p, plan.invest[l.id]]));
    out.policy = pt(POLICIES.filter(x => (plan.pol || {})[x.id] != null).map(x => { const o = x.o[plan.pol[x.id]]; return [o[1], o[2]]; }));
    out.disc = pt(INFRACTIONS.filter(x => (plan.disc || {})[x.id] != null).map(x => { const d = plan.disc[x.id] - x.base; return [clamp(d, -2, 2), clamp(-0.6 * d, -2, 2)]; }));
    const c = crisis && plan.crisis && plan.crisis.o != null ? crisis.o[plan.crisis.o] : null; out.crisis = c ? { s: c[1], p: c[2] } : null;
    return out;
  }
  function score(plan, crisis) {
    const tone = toneById[(plan.found || {}).tone]; if (!tone) return { align: 0, secs: {}, reacts: [], flags: [] };
    const P = points(plan, crisis), secs = {}, reacts = [], flags = [];
    let align = 0;
    Object.keys(WEIGHTS).forEach(k => {
      const q = P[k]; if (!q) { secs[k] = { fit: 0, missing: true }; reacts.push({ k, bad: true, t: `${SECTION_NAMES[k]}: never finished. The crew has no idea what's expected.` }); return; }
      const dS = q.s - tone.s, dP = q.p - tone.p, dist = Math.sqrt(dS * dS + dP * dP), fit = Math.round(clamp(100 - 28 * dist, 0, 100));
      secs[k] = { fit, s: +q.s.toFixed(2), p: +q.p.toFixed(2) }; align += fit * WEIGHTS[k];
      if (fit < 60) { const dir = Math.abs(dS) >= Math.abs(dP) ? (dS > 0 ? 0 : 1) : (dP > 0 ? 2 : 3); reacts.push({ k, bad: true, fit, t: REACT[k][dir] }); }
      else if (fit >= 80) reacts.push({ k, bad: false, fit, t: PRAISE[k] });
    });
    const th = (plan.disc || {}).theft; if (th != null && th < 3) { flags.push("Going soft on theft feels unfair to everyone who follows the rules (-10)."); align -= 10; }
    return { align: Math.round(clamp(align, 0, 100)), secs, reacts: reacts.sort((a, b) => (b.bad - a.bad) || (a.fit - b.fit)), flags, tone };
  }
  return { BUDGET, HOURS, MAXLV, TONES, STYLES, VALUES, LEVERS, POLICIES, RESP, INFRACTIONS, CRISES, RUBRIC, SCALE, WEIGHTS, SECTION_NAMES,
    toneById, styleById, valueById, leverById, crisisById, spend, canAdd, crisisFor, points, score };
})();
if (typeof module !== "undefined") module.exports = CL;
