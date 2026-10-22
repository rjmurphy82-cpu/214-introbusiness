// Ad Buy Showdown: the market model. Shared by the student page, the teacher console, and the server.
// Pure functions only (no DOM), so the server scores rounds with exactly the same math the pages show.

export const PLATFORMS = [
  { id: 'ig', name: 'Instagram', cpm: 9.5, ctr: 0.009, color: '#C13584' },
  { id: 'tt', name: 'TikTok', cpm: 7.5, ctr: 0.010, color: '#25B8C4' },
  { id: 'sc', name: 'Snapchat', cpm: 5.5, ctr: 0.007, color: '#D9B800' },
  { id: 'yt', name: 'YouTube', cpm: 10.5, ctr: 0.006, color: '#E0372C' },
  { id: 'fb', name: 'Facebook', cpm: 8.5, ctr: 0.009, color: '#3B6FD8' },
  { id: 'pin', name: 'Pinterest', cpm: 6.0, ctr: 0.007, color: '#B5252F' }
];

// Segments: local population (25 mi of Arlington Heights), weekly platform reach
export const SEGMENTS = [
  { id: 's1', name: 'Ages 13–15', teen: true, size: 30000, reach: { ig: .55, tt: .62, sc: .58, yt: .90, fb: .18, pin: .25 } },
  { id: 's2', name: 'Ages 16–17', teen: true, size: 20000, reach: { ig: .68, tt: .65, sc: .62, yt: .90, fb: .25, pin: .30 } },
  { id: 's3', name: 'Ages 18–24', teen: false, size: 60000, reach: { ig: .78, tt: .62, sc: .60, yt: .93, fb: .55, pin: .38 } },
  { id: 's4', name: 'Ages 25–34', teen: false, size: 90000, reach: { ig: .62, tt: .45, sc: .35, yt: .92, fb: .70, pin: .38 } },
  { id: 's5', name: 'Ages 35–54 (parents)', teen: false, size: 180000, reach: { ig: .45, tt: .30, sc: .18, yt: .85, fb: .75, pin: .40 } },
  { id: 's6', name: 'Ages 55+', teen: false, size: 170000, reach: { ig: .22, tt: .15, sc: .06, yt: .75, fb: .68, pin: .25 } }
];

export const GEOS = [
  { id: 'local', name: 'Local', sub: '25 mi of Arlington Heights', pool: 1 },
  { id: 'metro', name: 'Chicagoland', sub: '60 mi metro area', pool: 2.6 },
  { id: 'midwest', name: 'Midwest', sub: '12 states', pool: 14 },
  { id: 'national', name: 'United States', sub: 'nationwide', pool: 60 }
];

export const OBJECTIVES = [
  { id: 'aware', name: 'Awareness', sub: 'Max reach. Cheapest impressions.', cpm: 0.7, ctr: 0.6, cvr: 0.65 },
  { id: 'traffic', name: 'Traffic', sub: 'Optimize for link clicks.', cpm: 1.0, ctr: 1.3, cvr: 0.75 },
  { id: 'sales', name: 'Sales', sub: 'Optimize for purchases. Pricier impressions.', cpm: 1.3, ctr: 1.0, cvr: 1.5 }
];

export const FORMATS = [
  { id: 'short', name: 'Short-form video', sub: 'Reels, TikToks, Shorts, Spotlight', fee: 0 },
  { id: 'creator', name: 'Creator partnership', sub: 'Paid influencer post. 15% creator fee.', fee: 0.15 },
  { id: 'static', name: 'Single image', sub: 'One photo + headline', fee: 0 },
  { id: 'carousel', name: 'Carousel', sub: '3–5 swipeable cards', fee: 0 },
  { id: 'story', name: 'Story / swipe-up', sub: 'Full-screen, tap to link', fee: 0 },
  { id: 'long', name: 'Video pre-roll', sub: '15–30 sec, plays before content', fee: 0 }
];

// how well a format performs on each platform
export const FMT_FIT = {
  short:    { ig: 1.15, tt: 1.30, sc: 1.10, yt: 1.00, fb: 0.90, pin: 0.80 },
  creator:  { ig: 1.20, tt: 1.25, sc: 0.90, yt: 1.20, fb: 0.80, pin: 0.90 },
  static:   { ig: 0.90, tt: 0.45, sc: 0.70, yt: 0.40, fb: 1.00, pin: 1.15 },
  carousel: { ig: 1.10, tt: 0.55, sc: 0.60, yt: 0.40, fb: 1.05, pin: 1.10 },
  story:    { ig: 1.05, tt: 0.70, sc: 1.25, yt: 0.50, fb: 0.85, pin: 0.60 },
  long:     { ig: 0.70, tt: 0.60, sc: 0.50, yt: 1.30, fb: 0.95, pin: 0.50 }
};

export const ROUNDS = [
  {
    title: 'Calvin Harris Live', think: 'Who can actually get to a Saturday night show in Chicago? Who has $110 for a ticket?', client: 'Lakeshore Live Promotions', tag: 'Concert tickets',
    what: 'Calvin Harris at the United Center, Chicago. Saturday night show, general admission floor plus seats.',
    price: 110, margin: 50, priceNote: 'avg ticket incl. fees', inventory: 1500, budget: 6000, cvr: 0.026, flight: '14 days before the show',
    goal: 'Sell the 1,500-ticket allotment. The promoter earns $50 per ticket after artist and venue costs.',
    intent: { s1: .35, s2: .70, s3: .95, s4: .60, s5: .15, s6: .03 },
    power:  { s1: .40, s2: .70, s3: .90, s4: 1, s5: 1, s6: 1 },
    interests: [
      { name: 'EDM / dance music', boost: 1.8, share: .12 },
      { name: 'Music festivals', boost: 1.6, share: .10 },
      { name: 'Pop music', boost: 1.15, share: .35 },
      { name: 'Video games', boost: 0.6, share: .30 }
    ],
    geoFit: { local: 1, metro: 1, midwest: .40, national: .05 },
    fmt: { short: 1.30, creator: 1.25, story: 1.10, static: .80, carousel: .85, long: .90 },
    plat: { ig: 1.1, tt: 1.15, sc: 1.0, yt: .9, fb: .75, pin: .5 },
    event: { title: 'New track teaser drops', text: 'Calvin Harris posts a clip of an unreleased track the week your ads run. EDM content takes off on TikTok.', ctr: { tt: 1.25 } }
  },
  {
    title: 'The Retro Runner Drop', think: 'There are only 250 pairs. What happens to ad dollars spent after the last pair sells?', client: 'Sole District (Chicago boutique)', tag: 'Limited sneaker release',
    what: 'A 250-pair limited retro runner, sold online only. Ships anywhere in the U.S. Drop goes live Friday at 10 a.m.',
    price: 180, margin: 70, priceNote: 'per pair', inventory: 250, budget: 5000, cvr: 0.022, flight: '7 days before the drop',
    goal: 'Sell out all 250 pairs. Sole District earns $70 per pair. Once they are gone, every extra ad dollar is wasted.',
    intent: { s1: .55, s2: .80, s3: .90, s4: .55, s5: .15, s6: .03 },
    power:  { s1: .35, s2: .55, s3: .75, s4: 1, s5: 1, s6: 1 },
    interests: [
      { name: 'Sneaker culture', boost: 2.0, share: .06 },
      { name: 'Streetwear fashion', boost: 1.6, share: .12 },
      { name: 'Basketball', boost: 1.2, share: .25 },
      { name: 'Running & fitness', boost: 0.8, share: .20 }
    ],
    geoFit: { local: 1, metro: 1, midwest: 1, national: 1 },
    fmt: { creator: 1.40, short: 1.20, carousel: 1.15, static: 1.0, story: 1.05, long: .80 },
    plat: { ig: 1.2, tt: 1.1, sc: .9, yt: .85, fb: .7, pin: .9 },
    event: { title: 'Reseller hype', text: 'A big sneaker reseller account reposts the drop. Instagram shoppers buy faster.', cvr: { ig: 1.2 } }
  },
  {
    title: 'Season Pass Sale', think: 'A season pass is fun for teens. Who usually pulls out the credit card?', client: 'Six Flags Great America (Gurnee)', tag: 'Theme park season pass',
    what: '2027 Season Pass: unlimited visits plus parking. Spring early-bird price ends Sunday.',
    price: 90, margin: 40, priceNote: 'per pass', inventory: 100000, budget: 8000, cvr: 0.034, flight: '10 days, ends Sunday',
    goal: 'Sell as many passes as possible before the early-bird price ends. The park keeps $40 per pass in profit.',
    intent: { s1: .70, s2: .75, s3: .60, s4: .45, s5: .60, s6: .10 },
    power:  { s1: .30, s2: .50, s3: .80, s4: 1, s5: 1, s6: 1 },
    interests: [
      { name: 'Roller coasters & theme parks', boost: 1.7, share: .10 },
      { name: 'Family activities', boost: 1.45, share: .20 },
      { name: 'Travel', boost: 0.9, share: .30 },
      { name: 'Video games', boost: 0.6, share: .30 }
    ],
    geoFit: { local: 1, metro: 1, midwest: .45, national: .03 },
    fmt: { short: 1.30, long: 1.10, carousel: 1.0, static: .90, story: 1.0, creator: 1.10 },
    plat: { ig: 1.0, tt: 1.1, sc: .9, yt: 1.05, fb: 1.1, pin: .7 },
    event: { title: 'Warm-weather forecast', text: 'A string of 75-degree days hits the forecast. Summer plans feel real, and buyers convert faster everywhere.', cvrAll: 1.12 }
  },
  {
    title: 'ScoreJump ACT Prep', think: 'Who uses this app, and who pays for it? Are they the same person?', client: 'ScoreJump (test prep app)', tag: 'App subscription',
    what: 'A 3-month ACT prep plan: daily practice sets, video lessons, and full timed tests. Works on any phone.',
    price: 79, margin: 65, priceNote: 'per 3-month plan', inventory: 100000, budget: 5000, cvr: 0.03, flight: '21 days before the spring test',
    goal: 'Sign up as many paid plans as possible. Software costs almost nothing to deliver, so ScoreJump keeps $65 per plan.',
    intent: { s1: .25, s2: .65, s3: .10, s4: .05, s5: .80, s6: .10 },
    power:  { s1: .15, s2: .30, s3: .50, s4: 1, s5: 1, s6: 1 },
    interests: [
      { name: 'Parenting teenagers', boost: 1.9, share: .12 },
      { name: 'College planning', boost: 1.7, share: .10 },
      { name: 'Personal finance', boost: 0.9, share: .20 },
      { name: 'Sports', boost: 0.6, share: .40 }
    ],
    geoFit: { local: 1, metro: 1, midwest: 1, national: 1 },
    fmt: { carousel: 1.10, static: 1.0, long: 1.15, short: 1.05, creator: 1.15, story: .90 },
    plat: { ig: 1.0, tt: .95, sc: .7, yt: 1.1, fb: 1.25, pin: .9 },
    event: { title: 'Score release week', text: 'Fall ACT scores come out. Parents start searching for help, and they click on Facebook and YouTube.', ctr: { fb: 1.18, yt: 1.15 } }
  },
  {
    title: 'Boba Lab Grand Opening', think: 'This shop is in downtown Arlington Heights. How far will someone drive for a $6 drink?', client: 'Boba Lab, downtown Arlington Heights', tag: 'Local restaurant opening',
    what: 'A new bubble tea shop opens near the Metra station. Opening week deal: buy one drink, get one free.',
    price: 12, margin: 6, priceNote: 'avg order', inventory: 1200, budget: 1500, cvr: 0.2, flight: 'opening week',
    goal: 'Pack the shop during opening week. Each order earns $6. The kitchen can handle about 1,200 orders.',
    intent: { s1: .80, s2: .90, s3: .85, s4: .60, s5: .30, s6: .10 },
    power:  { s1: .60, s2: .80, s3: 1, s4: 1, s5: 1, s6: 1 },
    interests: [
      { name: 'Bubble tea & cafés', boost: 1.8, share: .15 },
      { name: 'Foodies', boost: 1.4, share: .25 },
      { name: 'K-pop & anime', boost: 1.2, share: .10 },
      { name: 'Fitness', boost: 0.6, share: .25 }
    ],
    geoFit: { local: 1, metro: .18, midwest: .01, national: .001 },
    fmt: { story: 1.35, short: 1.25, creator: 1.30, static: .90, carousel: .95, long: .60 },
    plat: { ig: 1.15, tt: 1.1, sc: 1.3, yt: .6, fb: .8, pin: .5 },
    event: { title: 'Map pin goes live', text: 'Boba Lab shows up as a sponsored pin on the Snap Map. Snapchat users nearby tap through.', ctr: { sc: 1.3 } }
  },
  {
    title: 'PulseX Headset Launch', think: 'It is Black Friday week. Every brand is buying ads at the same time. What does that do to prices?', client: 'PulseX Audio', tag: 'Black Friday gaming headset',
    what: 'PulseX wireless gaming headset: 40-hour battery, works on PS5, Xbox, Switch, and PC. Black Friday price.',
    price: 129, margin: 45, priceNote: 'Black Friday price', inventory: 3000, budget: 10000, cvr: 0.03, flight: 'Black Friday week',
    goal: 'Move 3,000 headsets during Black Friday week. PulseX earns $45 per unit. Ships nationwide.',
    intent: { s1: .70, s2: .75, s3: .80, s4: .60, s5: .35, s6: .08 },
    power:  { s1: .30, s2: .50, s3: .80, s4: 1, s5: 1, s6: 1 },
    interests: [
      { name: 'PC & console gaming', boost: 1.9, share: .20 },
      { name: 'Esports & streaming', boost: 1.7, share: .08 },
      { name: 'Holiday gift shoppers', boost: 1.3, share: .30 },
      { name: 'Music & audio', boost: 1.1, share: .25 }
    ],
    geoFit: { local: 1, metro: 1, midwest: 1, national: 1 },
    fmt: { creator: 1.45, short: 1.20, long: 1.15, carousel: 1.0, static: .85, story: .95 },
    plat: { ig: .95, tt: 1.05, sc: .85, yt: 1.3, fb: .9, pin: .5 },
    event: { title: 'Black Friday auction pressure', text: 'Every brand in America is bidding for the same feeds. Ad prices jump 35% on every platform.', cpmAll: 1.35 }
  }
];

export const NROUNDS = ROUNDS.length;
export const platformById = id => PLATFORMS.find(p => p.id === id);
export const segById = id => SEGMENTS.find(s => s.id === id);
const geoById = id => GEOS.find(g => g.id === id) || GEOS[0];
const objById = id => OBJECTIVES.find(o => o.id === id) || OBJECTIVES[0];
const fmtById = id => FORMATS.find(f => f.id === id) || FORMATS[0];
export { geoById, objById, fmtById };

// A stable number from any string (team id, game id), used to seed the small random swings in results.
export function hashStr(s) { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function hashRand(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5; let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function blankCampaign() { return { obj: "sales", geo: "local", segs: [], interest: -1, fmt: "short", spend: { ig: 0, tt: 0, sc: 0, yt: 0, fb: 0, pin: 0 } }; }
export const totalSpend = c => PLATFORMS.reduce((a, p) => a + (+(c && c.spend && c.spend[p.id]) || 0), 0);

// Checks a campaign sent from a browser. Returns a clean copy, or { error } explaining what to fix.
export function cleanCampaign(round, c) {
  const R = ROUNDS[round];
  if (!R || !c || typeof c !== "object") return { error: "Build your campaign first." };
  const out = {
    obj: OBJECTIVES.some(o => o.id === c.obj) ? c.obj : null,
    geo: GEOS.some(g => g.id === c.geo) ? c.geo : null,
    segs: SEGMENTS.map(s => s.id).filter(id => Array.isArray(c.segs) && c.segs.includes(id)),
    interest: Number.isInteger(c.interest) && c.interest >= 0 && c.interest < R.interests.length ? c.interest : -1,
    fmt: FORMATS.some(f => f.id === c.fmt) ? c.fmt : null,
    spend: {}
  };
  PLATFORMS.forEach(p => { const v = Math.round(+(c.spend && c.spend[p.id]) || 0); out.spend[p.id] = Math.max(0, Math.min(1e7, v)); });
  if (!out.obj) return { error: "Pick a campaign objective." };
  if (!out.geo) return { error: "Pick a location." };
  if (!out.segs.length) return { error: "Pick at least one age group." };
  if (!out.fmt) return { error: "Pick a creative format." };
  const t = totalSpend(out);
  if (!t) return { error: "Put some budget on at least one platform." };
  if (t > R.budget) return { error: `Your budget adds up to $${t.toLocaleString()}. The limit is $${R.budget.toLocaleString()}.` };
  return out;
}

// People on one platform who match the campaign's ages, location, and interest.
export function audienceFor(round, c, platId) {
  const R = ROUNDS[round], geo = geoById(c.geo);
  const intr = c.interest != null && c.interest >= 0 ? R.interests[c.interest] : null;
  return SEGMENTS.filter(s => c.segs.includes(s.id)).map(s => {
    let pool = s.size * geo.pool * s.reach[platId];
    let intent = R.intent[s.id];
    if (intr && !s.teen) { pool *= intr.share; intent = Math.min(1, intent * intr.boost); }
    return { seg: s, pool, intent };
  });
}
export function totalAudience(round, c) {
  const R = ROUNDS[round], geo = geoById(c.geo);
  const intr = c.interest != null && c.interest >= 0 ? R.interests[c.interest] : null;
  return SEGMENTS.filter(s => c.segs.includes(s.id)).reduce((sum, s) => sum + s.size * geo.pool * ((intr && !s.teen) ? intr.share : 1), 0);
}

// Runs one campaign for one round. Same campaign + same seed always gives the same result.
export function simulate(round, c, seed) {
  const R = ROUNDS[round], obj = objById(c.obj), fmt = fmtById(c.fmt);
  const geoFit = R.geoFit[c.geo] ?? 1, ev = R.event, rnd = hashRand(seed);
  const rows = [], segImps = {};
  let tot = { spend: 0, imps: 0, reach: 0, clicks: 0, conv: 0 };
  PLATFORMS.forEach(p => {
    const spend = Math.max(0, +c.spend[p.id] || 0);
    if (!spend) return;
    const aud = audienceFor(round, c, p.id);
    const pool = aud.reduce((a, x) => a + x.pool, 0);
    if (pool < 1) { rows.push({ pid: p.id, spend: 0, refunded: spend, imps: 0, reach: 0, freq: 0, clicks: 0, conv: 0, cpm: 0, nodelivery: true }); return; }
    const noise = () => 0.9 + rnd() * 0.2;
    let cpm = p.cpm * obj.cpm * (ev.cpmAll || 1);
    if (pool < 15000) cpm *= 1.45; else if (pool < 50000) cpm *= 1.2; else if (pool > 2e6) cpm *= 0.9;
    cpm *= noise();
    const media = spend * (1 - fmt.fee);
    const imps = media / cpm * 1000;
    const reach = pool * (1 - Math.exp(-imps / pool));
    const freq = reach > 0 ? imps / reach : 0;
    const effFreq = freq <= 3 ? freq : 3 + Math.log(1 + (freq - 3)); // ad fatigue after about 3 views
    const effImps = reach * effFreq;
    let clicks = 0, conv = 0;
    const ctrBase = p.ctr * FMT_FIT[fmt.id][p.id] * R.fmt[fmt.id] * obj.ctr * ((ev.ctr && ev.ctr[p.id]) || 1);
    aud.forEach(a => {
      const share = a.pool / pool, e = effImps * share;
      segImps[a.seg.id] = (segImps[a.seg.id] || 0) + imps * share;
      const ck = e * ctrBase * (0.4 + a.intent) * noise();
      const cv = ck * R.cvr * a.intent * obj.cvr * geoFit * R.plat[p.id] * R.power[a.seg.id] * ((ev.cvr && ev.cvr[p.id]) || 1) * (ev.cvrAll || 1) * (fmt.id === "creator" ? 1.1 : 1) * noise();
      clicks += ck; conv += cv;
    });
    rows.push({ pid: p.id, spend, imps, reach, freq, clicks, conv, cpm });
    tot.spend += spend; tot.imps += imps; tot.reach += reach; tot.clicks += clicks; tot.conv += conv;
  });
  let soldOut = false, wasted = 0;
  if (tot.conv > R.inventory) {
    const scale = R.inventory / tot.conv;
    soldOut = true; wasted = tot.spend * (1 - scale);
    rows.forEach(r => r.conv *= scale);
  }
  rows.forEach(r => { r.conv = Math.round(r.conv); r.clicks = Math.round(r.clicks); r.imps = Math.round(r.imps); r.reach = Math.round(r.reach); r.cpm = Math.round(r.cpm * 100) / 100; r.freq = Math.round(r.freq * 10) / 10; });
  let conv = rows.reduce((a, r) => a + r.conv, 0);
  if (soldOut) conv = Math.min(conv, R.inventory);
  const clicks = rows.reduce((a, r) => a + r.clicks, 0);
  const revenue = conv * R.price, gross = conv * R.margin, profit = gross - tot.spend;
  const res = {
    rows, spend: tot.spend, imps: Math.round(tot.imps), reach: Math.round(tot.reach), freq: tot.reach ? Math.round(tot.imps / tot.reach * 10) / 10 : 0,
    clicks, conv, revenue, gross, profit,
    ctr: tot.imps ? clicks / tot.imps : 0, cpc: clicks ? tot.spend / clicks : 0,
    cpa: conv ? tot.spend / conv : 0, roas: tot.spend ? revenue / tot.spend : 0,
    soldOut, wasted: Math.round(wasted), unspent: R.budget - tot.spend
  };
  res.notes = analyst(round, c, res, segImps);
  return res;
}

// Plain-language coaching notes for one result.
function analyst(round, c, r, segImps) {
  const R = ROUNDS[round], notes = [], fmt = fmtById(c.fmt);
  const totalImps = Object.values(segImps).reduce((a, b) => a + b, 0) || 1;
  SEGMENTS.filter(s => (segImps[s.id] || 0) / totalImps > 0.2 && R.intent[s.id] < 0.3)
    .forEach(s => notes.push({ t: "bad", m: `${Math.round(segImps[s.id] / totalImps * 100)}% of impressions went to ${s.name}, a group with little interest in this product.` }));
  SEGMENTS.filter(s => !c.segs.includes(s.id) && R.intent[s.id] >= 0.75)
    .forEach(s => notes.push({ t: "warn", m: `You skipped ${s.name}, one of the hottest buyer groups for this product.` }));
  r.rows.forEach(row => {
    const p = platformById(row.pid);
    if (row.nodelivery) notes.push({ t: "bad", m: `${p.name} could not deliver: none of your chosen people use it. That money was not spent.` });
    else if (row.freq > 8) notes.push({ t: "warn", m: `On ${p.name}, the same people saw your ad ${row.freq.toFixed(1)} times. Ad fatigue set in. A bigger audience or less spend would help.` });
    if (!row.nodelivery && FMT_FIT[c.fmt][row.pid] < 0.65 && row.spend >= R.budget * 0.15) notes.push({ t: "warn", m: `${fmt.name} is a weak fit for ${p.name}. Users there scroll past that format.` });
  });
  if ((R.geoFit[c.geo] ?? 1) < 0.5) notes.push({ t: "bad", m: "Most of the people you reached live too far away to buy. Location targeting did not match the product." });
  if (r.soldOut) notes.push({ t: "good", m: `SOLD OUT. But about $${r.wasted.toLocaleString()} of ad spend ran after inventory was gone.` });
  if (r.unspent > R.budget * 0.25) notes.push({ t: "warn", m: `$${Math.round(r.unspent).toLocaleString()} of budget was left on the table.` });
  if (c.interest >= 0 && c.segs.some(id => segById(id).teen)) notes.push({ t: "info", m: "Policy: platforms do not allow interest targeting for users under 18. Teens saw your ads by age and location only." });
  const live = r.rows.filter(x => x.conv > 0);
  if (live.length > 1) {
    const best = live.reduce((a, b) => (a.spend / a.conv < b.spend / b.conv ? a : b));
    notes.push({ t: "good", m: `Best platform: ${platformById(best.pid).name} at $${(best.spend / best.conv).toFixed(2)} per sale.` });
  }
  if (r.profit < 0) notes.push({ t: "bad", m: "The campaign lost money: ad costs were higher than the profit from sales." });
  return notes;
}

export const seedFor = (gameId, teamId, round) => (hashStr(gameId + ":" + teamId) + round * 7919) >>> 0;

// Scores a whole class round. buys: { teamId: campaign }. Teams with no campaign earn $0.
export function scoreRound(game, round, buys) {
  const teams = {};
  game.teams.forEach(id => {
    const c = buys[id] ? cleanCampaign(round, buys[id]) : null;
    teams[id] = c && !c.error ? { camp: c, res: simulate(round, c, seedFor(game.id, id, round)) } : { camp: null, res: null };
  });
  return { round, teams };
}

// Total profit per team across every scored round.
export function totals(teamIds, results) {
  const out = {};
  teamIds.forEach(id => {
    const per = ROUNDS.map((_, r) => results[r] && results[r].teams[id] ? (results[r].teams[id].res ? results[r].teams[id].res.profit : 0) : null);
    out[id] = { per, sum: per.reduce((a, b) => a + (b || 0), 0) };
  });
  return out;
}

/* ---------- teacher review: model answers and decision grading ---------- */
const sp0 = o => Object.assign({ ig: 0, tt: 0, sc: 0, yt: 0, fb: 0, pin: 0 }, o);
// One strong campaign per client (checked against a search of thousands of campaigns), with the reasons to talk through.
export const KEYS = [
  { camp: { obj: "sales", geo: "metro", segs: ["s2", "s3", "s4"], interest: 2, fmt: "short", spend: sp0({ tt: 3000, ig: 1500, sc: 1500 }) },
    why: ["Fans who can get to a Saturday show in Chicago: ages 16–34 across Chicagoland. Parents and 55+ barely buy EDM tickets.",
      "Pop music fans: a big enough interest group that the ads don't wear out. EDM fans are hotter but there are fewer of them.",
      "Short-form video on TikTok, Instagram, and Snapchat, where these ages scroll every day."] },
  { camp: { obj: "sales", geo: "national", segs: ["s3", "s4"], interest: 0, fmt: "creator", spend: sp0({ ig: 2000, tt: 1500 }) },
    why: ["It ships anywhere, so go national. More buyers and almost no ad fatigue.",
      "Adults 18–34 who follow sneaker culture have the money and the interest. Teens want it but can't always pay $180.",
      "Only spend $3,500. There are just 250 pairs, and ads that run after a sell-out earn nothing."] },
  { camp: { obj: "sales", geo: "metro", segs: ["s3", "s5"], interest: 1, fmt: "short", spend: sp0({ fb: 3000, ig: 2500, tt: 2000, sc: 500 }) },
    why: ["Parents pay for most passes. Target ages 35–54 with the Family activities interest, plus young adults who buy their own.",
      "Facebook carries the parents. Instagram and TikTok carry the young adults.",
      "Chicagoland only. Families from other states rarely buy a season pass to Gurnee."] },
  { camp: { obj: "sales", geo: "national", segs: ["s5"], interest: 0, fmt: "carousel", spend: sp0({ fb: 5000 }) },
    why: ["The junior uses the app, but the parent pays. Aim only at parents of teenagers.",
      "Facebook is where 75% of parents scroll, and a carousel can walk through what the app does.",
      "Go national: any parent in the country can buy an app."] },
  { camp: { obj: "sales", geo: "local", segs: ["s2", "s3", "s4"], interest: 1, fmt: "story", spend: sp0({ sc: 1000, ig: 300, tt: 200 }) },
    why: ["Local only. Nobody drives across the state for a $6 drink.",
      "Teens and young adults are the bubble tea crowd, and Foodies narrows the adults.",
      "Story ads on Snapchat, the strongest story format, plus a little Instagram and TikTok."] },
  { camp: { obj: "sales", geo: "national", segs: ["s3", "s4"], interest: 0, fmt: "creator", spend: sp0({ tt: 10000 }) },
    why: ["Black Friday prices are up 35%, so every dollar has to go to likely buyers: adult gamers 18–34 with their own money.",
      "A streamer partnership on TikTok. Gamers trust creators more than ads.",
      "National: it ships anywhere."] }
];
export const keyResult = r => simulate(r, KEYS[r].camp, 4242 + r);

const HOT = 0.55, WARM = 0.3;
const segValue = (R, id) => R.intent[id] * R.power[id];
const segWord = v => v >= HOT ? "likely buyers" : v >= WARM ? "some buyers" : "unlikely buyers";
const list = a => a.length <= 2 ? a.join(" and ") : a.slice(0, -1).join(", ") + ", and " + a[a.length - 1];
const short = n => n.replace("Ages ", "").replace(" (parents)", "");

// Grades each campaign decision: v is "good" (correct), "ok" (partly), or "bad" (incorrect), with the reason.
export function gradeCampaign(round, c, res) {
  const R = ROUNDS[round], out = [];
  // 1. Objective
  out.push({ key: "obj", label: "Objective", pick: objById(c.obj).name,
    ...(c.obj === "sales" ? { v: "good", why: "The client gets paid when people buy, so Sales tells the platform to hunt for buyers." }
      : c.obj === "traffic" ? { v: "ok", why: "Clicks aren't sales. Traffic finds people who tap, not people who buy. Sales would have found more buyers." }
      : { v: "bad", why: "Awareness buys the cheapest views, but it isn't built to find buyers, so few of them purchased." }) });
  // 2. Location
  const fit = R.geoFit[c.geo] ?? 1, best = GEOS.filter(g => (R.geoFit[g.id] ?? 1) >= 0.9).pop();
  out.push({ key: "geo", label: "Location", pick: geoById(c.geo).name,
    ...(fit < 0.5 ? { v: "bad", why: `Most of these people live too far away to buy. ${best.name} was the right area.` }
      : c.geo === best.id ? { v: "good", why: best.id === "local" ? "Right call: only people nearby will actually come in." : `Right call: ${best.name} reaches everyone who can realistically buy.` }
      : fit < 0.9 ? { v: "ok", why: `Some of these people are too far away to buy. ${best.name} fit better.` }
      : { v: "ok", why: `Everyone here can buy, but ${best.name} reaches more buyers and keeps the same people from seeing the ad over and over.` }) });
  // 3. Age groups
  const chosen = c.segs.map(id => ({ id, v: segValue(R, id) }));
  const cold = chosen.filter(x => x.v < WARM), missed = SEGMENTS.filter(s => !c.segs.includes(s.id) && segValue(R, s.id) >= HOT);
  const hot = chosen.filter(x => x.v >= HOT);
  let ageWhy = [];
  if (hot.length) ageWhy.push(`${list(hot.map(x => short(segById(x.id).name)))}: likely buyers.`);
  if (cold.length) ageWhy.push(`${list(cold.map(x => short(segById(x.id).name)))}: unlikely buyers. Little interest or no money for this product.`);
  if (missed.length) ageWhy.push(`Missed ${list(missed.map(s => short(s.name)))}, ${missed.length > 1 ? "some of the best buyer groups" : "one of the best buyer groups"} here.`);
  if (!ageWhy.length) ageWhy.push("These groups buy some, but none of them are the strongest buyers for this product.");
  out.push({ key: "segs", label: "Age groups", pick: c.segs.map(id => short(segById(id).name)).join(", "),
    v: cold.length ? "bad" : missed.length || !hot.length ? "ok" : "good", why: ageWhy.join(" ") });
  // 4. Interest
  const bestInt = KEYS[round].camp.interest >= 0 ? R.interests[KEYS[round].camp.interest].name : R.interests.slice().sort((a, b) => b.boost - a.boost)[0].name;
  const adults = c.segs.some(id => !segById(id).teen);
  const it = c.interest >= 0 ? R.interests[c.interest] : null;
  out.push({ key: "interest", label: "Interest", pick: it ? it.name : "None (broad)",
    ...(!it ? { v: "ok", why: `Broad works, but narrowing adults to an interest that fits (like ${bestInt}) finds likelier buyers.` }
      : !adults ? { v: "ok", why: "This did nothing. Interests only narrow adults, and you only picked teen groups." }
      : it.boost < 1 ? { v: "bad", why: `${it.name} fans aren't the buyers for this product, so it shrank the audience to the wrong people.` }
      : { v: "good", why: `${it.name} narrows adults to people more likely to buy. Smaller audience, better buyers.` }) });
  // 5. Creative format
  const spent = PLATFORMS.filter(p => +c.spend[p.id] > 0), tot = totalSpend(c) || 1;
  const platFit = spent.reduce((a, p) => a + FMT_FIT[c.fmt][p.id] * c.spend[p.id] / tot, 0);
  const score = R.fmt[c.fmt] * platFit, weak = spent.filter(p => FMT_FIT[c.fmt][p.id] < 0.65).map(p => p.name);
  const fmt = fmtById(c.fmt), bestFmt = FORMATS.slice().sort((a, b) => R.fmt[b.id] - R.fmt[a.id])[0];
  out.push({ key: "fmt", label: "Creative format", pick: fmt.name,
    v: score >= 1.15 ? "good" : score >= 0.85 ? "ok" : "bad",
    why: score >= 1.15 ? `${fmt.name} fits this product and the platforms you bought.`
      : weak.length ? `${fmt.name} is a weak fit for ${list(weak)}. People there scroll right past it.`
      : `${fmt.name} works, but ${bestFmt.name} fits this product better.` });
  // 6. Budget, judged platform by platform on what each sale actually cost
  const rows = (res ? res.rows : []).map(w => {
    const p = platformById(w.pid);
    if (w.nodelivery) return { pid: w.pid, name: p.name, spend: 0, conv: 0, v: "bad", why: "None of the people you picked use it. That money was refunded." };
    const cpa = w.conv ? w.spend / w.conv : Infinity;
    return { pid: w.pid, name: p.name, spend: w.spend, conv: w.conv, cpa,
      v: cpa <= R.margin * 0.6 ? "good" : cpa <= R.margin ? "ok" : "bad",
      why: !w.conv ? "Spent money and made no sales." : cpa <= R.margin * 0.6 ? `Each sale cost ${fmt$(cpa)} in ads and earned ${fmt$(R.margin)}. Money well spent.`
        : cpa <= R.margin ? `Each sale cost ${fmt$(cpa)} in ads against ${fmt$(R.margin)} profit. Barely worth it.`
        : `Each sale cost ${fmt$(cpa)} in ads but only earned ${fmt$(R.margin)}. It lost ${fmt$(cpa - R.margin)} on every sale.` };
  });
  const lost = rows.filter(w => w.v === "bad").reduce((a, w) => a + w.spend, 0), spentTot = rows.reduce((a, w) => a + w.spend, 0) || 1;
  const budgetNotes = [];
  if (res && res.soldOut) budgetNotes.push(`Sold out, but about ${fmt$(res.wasted)} ran after there was nothing left to sell.`);
  if (res && res.unspent > R.budget * 0.25) budgetNotes.push(`${fmt$(res.unspent)} was left unspent${res.profit > 0 ? ", which is fine if more ads would have lost money" : ""}.`);
  if (lost) budgetNotes.push(`${fmt$(lost)} went to platforms that lost money on every sale.`);
  const good = rows.filter(w => w.v === "good").sort((x, y) => x.cpa - y.cpa).map(w => `${w.name} at ${fmt$(w.cpa)} per sale`);
  if (!lost && good.length) budgetNotes.push(`Every platform you bought paid for itself. Best: ${good[0]}.`);
  out.push({ key: "budget", label: "Budget split", pick: rows.length ? rows.map(w => `${w.name} ${fmt$(w.spend)}`).join(", ") : "Nothing spent",
    v: !rows.length ? "bad" : lost / spentTot > 0.4 || (res && res.wasted > R.budget * 0.25) ? "bad" : lost || (res && res.wasted > R.budget * 0.1) ? "ok" : "good",
    why: budgetNotes.join(" ") || "Spent on platforms that paid for themselves.", rows });
  return out;
}
const fmt$ = v => "$" + (Math.round(v * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 });
