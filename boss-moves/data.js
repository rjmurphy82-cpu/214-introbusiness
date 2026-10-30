/* Boss Moves: everything the game teaches. Shared by the student page and the teacher screen.
   STYLES are the 10 leadership styles from the Management & Leadership slides.
   LEVELS are the four developmental levels on the Situational Leadership grid.
   Each SCENARIO is one round: a workplace situation, 8 style choices, the best style (300 points),
   good-fit styles (150 points), why, and the Perfect Statement the class compares their statements to. */
"use strict";
var BOSS = (function () {
  const STYLES = {
    autocratic:      { name: "Autocratic",       tag: "I decide, you do it. Fast and clear." },
    bureaucratic:    { name: "Bureaucratic",     tag: "Follow the rules and procedures exactly." },
    coaching:        { name: "Coaching",         tag: "Feedback, practice, and growth." },
    democratic:      { name: "Democratic",       tag: "Everyone gives input, the leader decides." },
    laissez:         { name: "Laissez-Faire",    tag: "Give the goal, then step back." },
    pacesetter:      { name: "Pacesetter",       tag: "High standards, lead by example, move fast." },
    servant:         { name: "Servant",          tag: "Take care of your people first." },
    transactional:   { name: "Transactional",    tag: "Clear goals, rewards for hitting them." },
    transformational:{ name: "Transformational", tag: "Inspire people to grow past what they thought they could do." },
    visionary:       { name: "Visionary",        tag: "Paint the picture of where we're going." }
  };

  const LEVELS = {
    d1: { name: "Enthusiastic Beginner", sub: "Low competence, high commitment", fit: "Directing" },
    d2: { name: "Disillusioned Learner", sub: "Some competence, low commitment", fit: "Coaching" },
    d3: { name: "Capable but Cautious Performer", sub: "High competence, variable commitment", fit: "Supporting" },
    d4: { name: "Self-Reliant Achiever", sub: "High competence, high commitment", fit: "Delegating" }
  };

  const SCENARIOS = [
    { id: "opening", org: "Crust & Co. Pizza", title: "Grand Opening",
      team: "12 brand-new hires. For most of them it's their first job. They're excited, but none of them has used the ovens or the registers yet.",
      sit: "Doors open in one hour and 300 people are expected for free slices.",
      level: "d1",
      opts: ["autocratic", "laissez", "democratic", "coaching", "servant", "bureaucratic", "visionary", "transactional"],
      best: "autocratic", good: ["coaching", "bureaucratic"],
      why: "A brand-new crew has plenty of energy but no skills yet. They need clear direction: who does what, and exactly how. Asking for votes or stepping back would leave them guessing in the middle of a rush.",
      perfect: "Welcome to opening day! I've assigned every station, and in the next 20 minutes I'll walk each of you through yours. Follow the checklist at your station. If you get stuck, come find me. Let's go make some pizza.",
      moves: ["Assigns every role", "Gives exact steps", "Keeps the energy up"] },

    { id: "storm", org: "Splash Cove Waterpark", title: "Lightning Alert",
      team: "14 trained lifeguards spread across the park.",
      sit: "Lightning was just spotted 5 miles away. 600 guests are in the pools. Every guest has to be out of the water and inside in 10 minutes.",
      level: null,
      opts: ["democratic", "autocratic", "laissez", "servant", "bureaucratic", "coaching", "visionary", "transformational"],
      best: "autocratic", good: ["bureaucratic"],
      why: "In a life-or-death moment there is no time for discussion. One leader gives short, clear orders and everyone follows them. Following the emergency procedure (bureaucratic) also works.",
      perfect: "Lightning alert. Clear every pool now. Three long whistles, then walk guests to the lodge. Jada takes the wave pool, Marcus the lazy river, everyone else your normal zones. Radio me when your zone is empty.",
      moves: ["Short, clear orders", "Says who does what", "Says how to report back"] },

    { id: "studio", org: "Northside Creative", title: "The Dream Team",
      team: "Five designers who have worked together for 8 years and won national awards.",
      sit: "Riverside Bank wants a brand-new ad campaign, and they asked for this team by name. The deadline is in two months.",
      level: "d4",
      opts: ["autocratic", "laissez", "pacesetter", "democratic", "bureaucratic", "servant", "transactional", "coaching"],
      best: "laissez", good: ["democratic", "servant"],
      why: "Skilled, motivated experts do their best work with freedom. Give them the goal and the limits, then get out of the way. Telling award winners exactly what to do (autocratic) or pushing them to go faster (pacesetter) would drag them down.",
      perfect: "Big news: Riverside Bank wants a full new campaign, and they asked for you by name. How you run it is your call. The deadline is March 1 and the budget is $40,000. I'm here if you need anything cleared. Otherwise, I can't wait to see it.",
      moves: ["Gives the goal and the limits", "Hands over the decisions", "Offers support, not orders"] },

    { id: "callcenter", org: "TechHelp Support Line", title: "Rough Start",
      team: "8 new support reps, six weeks into the job. They know the basics, but they're frustrated, and a few are talking about quitting.",
      sit: "Customer complaints are up 30% this month, and the reps feel like they're failing.",
      level: "d2",
      opts: ["laissez", "coaching", "pacesetter", "autocratic", "servant", "visionary", "transactional", "democratic"],
      best: "coaching", good: ["servant", "autocratic"],
      why: "These reps know some of the job but have lost their confidence. They need both direction and encouragement: specific feedback on what to fix, plus support so they don't quit. That mix is coaching.",
      perfect: "You've learned a lot in six weeks, and the first months are the hardest part of this job. Starting tomorrow, I'll sit in on one call a day with each of you and give you two things you did well and one thing to fix. We'll get those complaints down together.",
      moves: ["Admits it's hard", "Gives specific feedback", "Sets up regular practice"] },

    { id: "slump", org: "Lakeshore Auto", title: "Sales Slump",
      team: "Six salespeople with years of experience. They know how to sell, but after two bad months they're second-guessing themselves.",
      sit: "Morale is low, and the team has stopped chasing new customers.",
      level: "d3",
      opts: ["servant", "autocratic", "pacesetter", "transactional", "coaching", "laissez", "democratic", "bureaucratic"],
      best: "servant", good: ["coaching", "democratic"],
      why: "The skills are still there; the confidence is not. A skilled team that is shaky needs support, not more orders: listen, show you believe in them, and clear what's in their way.",
      perfect: "You all know how to sell. That hasn't changed, and two slow months don't erase years of results. This week I want to hear what's getting in your way, and I'll clear it out. Lunch is on me Thursday so we can talk it through.",
      moves: ["Shows confidence in their skills", "Asks what they need", "Removes obstacles"] },

    { id: "blackfriday", org: "Gear Up Sporting Goods", title: "Black Friday",
      team: "An experienced store crew that has worked Black Friday before.",
      sit: "The store's goal is $80,000 in sales by 4 PM. Lines are already out the door.",
      level: null,
      opts: ["laissez", "pacesetter", "democratic", "servant", "transactional", "bureaucratic", "autocratic", "visionary"],
      best: "pacesetter", good: ["transactional", "autocratic"],
      why: "A short, urgent push with a skilled team is where a pacesetter shines: set a high goal, work right next to them, and keep the speed up. Just don't lead like this every day, or the team burns out.",
      perfect: "Today's goal: $80,000 by 4 PM. I'll be on the floor with you the whole day, and I'll post our total every hour. You know this store. Let's move fast, help every customer, and smash that number.",
      moves: ["Sets a high, clear goal", "Leads by example", "Tracks progress out loud"] },

    { id: "collections", org: "PrimeLine Mortgage", title: "Hit the Numbers",
      team: "20 collections reps. Every call is recorded, and every rep's results are easy to measure.",
      sit: "The company just approved bonuses for reps who hit the monthly goals.",
      level: null,
      opts: ["servant", "transactional", "laissez", "visionary", "pacesetter", "democratic", "bureaucratic", "coaching"],
      best: "transactional", good: ["pacesetter", "bureaucratic"],
      why: "When the goals are clear, the results are measurable, and there's a reward to give, transactional leadership fits: set the targets, pay for hitting them, and check the numbers often.",
      perfect: "This month has three goals: 400 calls each, 60 payment plans set up, and a 90% quality score. Hit all three and you earn a $500 bonus. I'll post everyone's numbers every Friday, and we'll use the best calls for training.",
      moves: ["Clear, measurable goals", "A reward tied to results", "Regular check-ins on the numbers"] },

    { id: "hardware", org: "Miller's Hardware", title: "Going Online",
      team: "Longtime employees who know every customer by name. Most have worked here 15+ years.",
      sit: "The family store, open since 1962, is losing customers to Amazon. The owner wants to start online ordering and same-day delivery. The staff is nervous about the change.",
      level: null,
      opts: ["autocratic", "visionary", "bureaucratic", "laissez", "transformational", "transactional", "democratic", "pacesetter"],
      best: "visionary", good: ["transformational", "democratic"],
      why: "Big change scares people. A visionary leader paints a clear picture of the future and why it matters, so the team wants to go there instead of being pushed there.",
      perfect: "Picture this: a customer needs a part at 9 PM, orders it from us on her phone, and one of you drops it off before work the next day. That's where we're going. Nobody here is being replaced. You're the reason people trust Miller's, and this puts that trust online.",
      moves: ["Paints a picture of the future", "Explains why", "Calms fears about the change"] },

    { id: "inspection", org: "Sunrise Diner", title: "Failed Inspection",
      team: "A busy kitchen crew that has gotten sloppy about food safety.",
      sit: "The diner failed its health inspection: wrong fridge temperatures and missed handwashing. The re-inspection is next Friday. If it fails again, the diner closes.",
      level: null,
      opts: ["laissez", "bureaucratic", "visionary", "democratic", "autocratic", "pacesetter", "servant", "coaching"],
      best: "bureaucratic", good: ["autocratic", "coaching"],
      why: "When the rules have to be followed exactly, a bureaucratic leader sets the procedure, gives each person a clear job, and allows no shortcuts.",
      perfect: "We failed inspection, and we get one more chance next Friday. Starting today, every shift follows the posted food safety checklist: fridge temperatures logged every 2 hours, handwashing between every task, signed off by the shift lead. No shortcuts. No exceptions.",
      moves: ["Sets clear rules", "Gives each person a responsibility", "No exceptions"] },

    { id: "pantry", org: "Hope Kitchen Food Pantry", title: "Burned-Out Volunteers",
      team: "40 volunteers who give their own time. Nobody gets paid.",
      sit: "After a huge holiday season, volunteers are worn out and fewer are showing up each week.",
      level: null,
      opts: ["autocratic", "servant", "pacesetter", "transactional", "bureaucratic", "democratic", "laissez", "coaching"],
      best: "servant", good: ["coaching", "democratic"],
      why: "Volunteers can't be ordered or paid to stay. A servant leader puts their needs first, thanks them, and makes the work easier. That's how you keep people who choose to be there.",
      perfect: "Thank you. You served 4,000 families this season, and I know it wore you out. Starting this week, shifts are 2 hours instead of 4, and there's a new sign-up sheet so you pick times that work for you. Tell me what else would help, and I'll make it happen.",
      moves: ["Thanks and recognizes them", "Puts their needs first", "Asks what would help"] },

    { id: "schedule", org: "Bean Scene Coffee", title: "The Schedule Decision",
      team: "15 baristas with strong opinions about how the schedule should work.",
      sit: "The shop has to pick between a new scheduling app and the old paper schedule. There's no rush: three weeks to decide.",
      level: null,
      opts: ["autocratic", "pacesetter", "democratic", "laissez", "bureaucratic", "transactional", "servant", "coaching"],
      best: "democratic", good: ["servant", "coaching"],
      why: "The team will live with this decision, and there's time to hear them. A democratic leader asks for input, lets everyone be heard, and still makes the final call.",
      perfect: "We're picking a new way to do the schedule, and you're the ones who use it, so I want your input. Try both options this week and tell me what you like. We'll talk it over Friday, and I'll make the final decision by the end of the month.",
      moves: ["Asks for input", "Gives everyone a voice", "The leader still makes the call"] }
  ];
  const byId = {}; SCENARIOS.forEach(s => byId[s.id] = s);
  const DEFAULT = ["opening", "storm", "callcenter", "slump", "studio", "blackfriday"];
  const stylePts = (sc, s) => (s === sc.best ? 300 : sc.good.includes(s) ? 150 : 0);

  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function shuffle(a, rnd) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  // Style buttons in a different order every round so the best answer isn't always in the same spot
  const optsFor = (sc, seed, r) => shuffle(sc.opts, rng(seed + r * 7919));

  return { STYLES, LEVELS, SCENARIOS, byId, DEFAULT, stylePts, shuffle, rng, optsFor,
    PTS: { best: 300, good: 150, vote: 50, top: 200, cast: 25 } };
})();
if (typeof module !== "undefined") module.exports = BOSS;
