// =====================================================================
// BUILD THE LINEUP: scoring model (shared by the browser and the server)
// Same rules as the printed Student Guide:
//   Unit cost = base cost + every feature added
//   Fit       = 100%, +5% per nice-to-have included, then cut in half per must-have left out
//   Buyers    = segment size x % who would buy at that price x Fit (whole number)
//   Profit    = buyers x (price - unit cost)
// =====================================================================
import { COMPANIES } from "./data.js";
export { COMPANIES };

export const MUST = 60, NICE = 30, NICE_BONUS = 0.05, ROUNDS = 2, LETTERS = ["A", "B", "C"];
export const companyById = id => COMPANIES.find(c => c.id === id) || COMPANIES[0];

// Python-style rounding (half to even) so the site matches the printed answer key exactly
const pyRound = x => { const r = Math.round(x); return Math.abs(x % 1) === 0.5 && r % 2 !== 0 ? r - 1 : r; };
const cents = x => pyRound(x * 100) / 100;

export const tier = (co, si, f) => { const p = co.feats[f].pct[si]; return p >= MUST ? "must" : p >= NICE ? "nice" : "none"; };
export const unitCost = (co, feats) => co.base + feats.reduce((a, f) => a + co.feats[f].cost, 0);

// One version for one segment. ver = { f: [feature indexes], p: price index }
export function scoreVersion(co, si, ver) {
  const seg = co.segs[si], feats = [...new Set(ver.f)].sort((a, b) => a - b);
  const cost = unitCost(co, feats);
  const must = co.feats.map((_, f) => f).filter(f => tier(co, si, f) === "must");
  const missing = must.filter(f => !feats.includes(f));
  const niceIn = feats.filter(f => tier(co, si, f) === "nice");
  const wasted = feats.filter(f => tier(co, si, f) === "none");
  const fit = (1 + NICE_BONUS * niceIn.length) * 0.5 ** missing.length;
  const price = co.prices[ver.p], pct = seg.wtp[ver.p];
  const buyers = pyRound(seg.size * pct / 100 * fit);
  const profit = cents(buyers * (price - cost));
  return { feats, p: ver.p, cost: cents(cost), price, pct, fit, buyers, profit, missing, niceIn, wasted };
}

export function scoreLineup(co, lineup) {
  const vers = lineup.map((v, si) => scoreVersion(co, si, v));
  return { vers, total: cents(vers.reduce((a, v) => a + v.profit, 0)) };
}

// Best price for a fixed set of features
export function bestPriceFor(co, si, feats) {
  let best = null;
  co.prices.forEach((_, p) => { const r = scoreVersion(co, si, { f: feats, p }); if (!best || r.profit > best.profit) best = r; });
  return best;
}

// Best possible version for a segment: every feature combination at every price
const BEST = {};
export function bestVersion(co, si) {
  const k = co.id + si;
  if (BEST[k]) return BEST[k];
  let best = null;
  for (let m = 0; m < 1 << co.feats.length; m++) {
    const f = co.feats.map((_, i) => i).filter(i => m & (1 << i));
    const r = bestPriceFor(co, si, f);
    if (!best || r.profit > best.profit) best = r;
  }
  return (BEST[k] = best);
}
export const bestLineup = co => { const vers = co.segs.map((_, si) => bestVersion(co, si)); return { vers, total: cents(vers.reduce((a, v) => a + v.profit, 0)) }; };

// The best single version sold to all three segments at one price (the "one size fits all" comparison)
const SINGLE = {};
export function bestSingle(co) {
  if (SINGLE[co.id]) return SINGLE[co.id];
  let best = null;
  for (let m = 0; m < 1 << co.feats.length; m++) {
    const f = co.feats.map((_, i) => i).filter(i => m & (1 << i));
    co.prices.forEach((_, p) => {
      const total = cents(co.segs.reduce((a, _, si) => a + scoreVersion(co, si, { f, p }).profit, 0));
      if (!best || total > best.total) best = { f, p, price: co.prices[p], cost: unitCost(co, f), total };
    });
  }
  return (SINGLE[co.id] = best);
}

export const pctOfBest = (co, total) => Math.max(0, Math.min(100, Math.round(total / bestLineup(co).total * 100)));

// Coaching notes for one version after it launches
export function versionNotes(co, si, r) {
  const notes = [];
  const names = fs => fs.map(f => co.feats[f].name).join(", ");
  if (r.missing.length) notes.push({ bad: true, t: `Missing a must-have: ${names(r.missing)}. That cut this segment's buyers ${r.missing.length > 1 ? "to a quarter or less" : "in half"}.` });
  if (r.wasted.length) notes.push({ bad: true, t: `Paid for features this segment barely wants: ${names(r.wasted)} (${moneyExact(r.wasted.reduce((a, f) => a + co.feats[f].cost, 0))} added to every unit).` });
  if (r.price <= r.cost) notes.push({ bad: true, t: `The price is at or below the unit cost, so every sale loses money.` });
  const bp = bestPriceFor(co, si, r.feats);
  if (bp.p !== r.p && bp.profit > r.profit) notes.push({ bad: false, t: `With these same features, ${moneyExact(bp.price)} would have earned ${moneyExact(bp.profit)}.` });
  if (!notes.length) notes.push({ bad: false, good: true, t: "Strong version: every must-have, nothing wasted, and the best price for these features." });
  return notes;
}

/* ---------- validation (server and browser) ---------- */
export function cleanLineup(co, lineup) {
  if (!Array.isArray(lineup) || lineup.length !== co.segs.length) return null;
  const out = [];
  for (const v of lineup) {
    if (!v || !Array.isArray(v.f) || !Number.isInteger(v.p) || v.p < 0 || v.p >= co.prices.length) return null;
    if (v.f.some(f => !Number.isInteger(f) || f < 0 || f >= co.feats.length)) return null;
    out.push({ f: [...new Set(v.f)].sort((a, b) => a - b), p: v.p, n: String(v.n || "").trim().slice(0, 24) });
  }
  return out;
}
export const lineupReady = l => Array.isArray(l) && l.length === 3 && l.every(v => v && Number.isInteger(v.p));

/* ---------- live mode: score a round for every team ---------- */
export function scoreRound(game, round, buys) {
  const co = companyById(game.company), teams = {};
  game.teams.forEach(id => {
    const l = buys[id] ? cleanLineup(co, buys[id]) : null;
    if (!l) { teams[id] = { missing: true, total: 0 }; return; }
    const s = scoreLineup(co, l);
    teams[id] = { lineup: l, profits: s.vers.map(v => v.profit), total: s.total };
  });
  return { round, teams };
}

/* ---------- formatting ---------- */
export const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export function moneyExact(n) {
  const neg = n < 0, a = Math.abs(n);
  const s = Number.isInteger(a) ? a.toLocaleString("en-US") : a.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (neg ? "−$" : "$") + s;
}
export function money(n) { const a = Math.abs(n), sg = n < 0 ? "−" : ""; if (a >= 1e6) return sg + "$" + (a / 1e6).toFixed(2) + "M"; if (a >= 1e4) return sg + "$" + Math.round(a / 1e3) + "K"; return moneyExact(Math.round(n)); }
export const wordCount = s => String(s || "").trim().split(/\s+/).filter(Boolean).length;
