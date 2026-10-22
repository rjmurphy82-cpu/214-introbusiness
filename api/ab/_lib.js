// Shared server helpers for Ad Buy Showdown: Redis storage (Upstash via Vercel Marketplace), login tokens, responses.
// Files that start with "_" in /api are not public routes.
import crypto from "node:crypto";
import { ROUNDS } from "../../ad-buy-showdown/js/model.js";

/* ---------- Redis over REST (no packages needed) ---------- */
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export async function redis(...cmd) {
  if (!URL_ || !TOKEN) throw new Error("Storage is not connected. Add a Redis database in Vercel > Storage.");
  const r = await fetch(URL_, { method: "POST", headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify(cmd) });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}
export const P = "abs:"; // key prefix so this game shares the database safely with the other games (mdmb:, wcab:, bltl:)
export async function getJSON(key) { const v = await redis("GET", P + key); return v ? JSON.parse(v) : null; }
export async function setJSON(key, val) { return redis("SET", P + key, JSON.stringify(val)); }
export async function hgetall(key) {
  const flat = (await redis("HGETALL", P + key)) || [];
  if (!Array.isArray(flat)) return flat;
  const o = {}; for (let i = 0; i < flat.length; i += 2) o[flat[i]] = JSON.parse(flat[i + 1]); return o;
}

/* ---------- login tokens ---------- */
const SECRET = process.env.SESSION_SECRET || "abs-hersey-ad-buy-showdown";
const b64 = s => Buffer.from(s).toString("base64url");
const hmac = s => crypto.createHmac("sha256", SECRET).update(s).digest("base64url");

export function sign(payload, hours = 12) {
  const body = b64(JSON.stringify({ ...payload, exp: Date.now() + hours * 3600e3 }));
  return body + "." + hmac(body);
}
export function who(req) {
  const t = (req.headers.authorization || "").replace(/^Bearer /, "");
  const [body, sig] = t.split(".");
  if (!body || !sig) return null;
  const good = hmac(body);
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  try { const p = JSON.parse(Buffer.from(body, "base64url").toString()); return p.exp > Date.now() ? p : null; } catch { return null; }
}
export async function activeGame() {
  const id = await redis("GET", P + "active");
  return id ? getJSON("game:" + id) : null;
}

// Open Play: always open. Teams run all six clients on their own and send the report to the teacher.
export const OPEN_ID = "openplay";
export async function openPlayGame() {
  const g = await getJSON("game:" + OPEN_ID);
  if (g) return g;
  const game = { id: OPEN_ID, name: "Open Play", mode: "self", phase: "open", round: 0, results: [], maxTeams: 90, createdAt: Date.now() };
  await setJSON("game:" + OPEN_ID, game);
  return game;
}
export const gameFor = channel => channel === "open" ? openPlayGame() : activeGame();
export async function gameForToken(me) {
  if (me.game === OPEN_ID) return openPlayGame();
  const g = await activeGame();
  return g && g.id === me.game ? g : null;
}
export const MAX_TEAMS = 15;
export const maxTeams = g => g.maxTeams || MAX_TEAMS;

/* ---------- student-made teams ---------- */
export async function teamsOf(gameId) {
  const all = await hgetall(`teams:${gameId}`);
  const ids = Object.keys(all).sort((a, b) => all[a].created - all[b].created);
  const names = {}, members = {};
  ids.forEach(id => { names[id] = all[id].name; members[id] = all[id].members; });
  return { ids, names, members, all };
}
export async function withTeams(game) {
  if (!game) return null;
  const t = await teamsOf(game.id);
  return { ...game, teams: t.ids, teamNames: t.names, _members: t.members };
}
export const firstName = n => { const w = String(n || "").trim().split(/\s+/)[0].replace(/[^\p{L}'-]/gu, "").slice(0, 14); return w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ""; };
export function teamLabel(members) {
  const m = members.slice(0, 5);
  if (m.length <= 1) return m[0] || "Team";
  if (m.length === 2) return m[0] + " & " + m[1];
  return m.slice(0, -1).join(", ") + " & " + m[m.length - 1];
}

// Students poll every few seconds. Send them every team's headline numbers for the leaderboard,
// but the full campaign and notes only for their own team, so the payload stays small.
export function resultsForTeam(results, teamId) {
  return (results || []).map(rr => {
    if (!rr) return rr;
    const teams = {};
    Object.entries(rr.teams).forEach(([id, t]) => {
      if (id === teamId || !t.res) { teams[id] = t; return; }
      const x = t.res;
      teams[id] = { camp: null, res: { spend: x.spend, imps: x.imps, clicks: x.clicks, conv: x.conv, revenue: x.revenue, profit: x.profit, roas: x.roas, ctr: x.ctr, cpa: x.cpa, soldOut: x.soldOut } };
    });
    return { round: rr.round, teams };
  });
}
export const ROUND_COUNT = ROUNDS.length;

/* ---------- responses ---------- */
export const ok = (res, data) => { res.setHeader("Cache-Control", "no-store"); return res.status(200).json(data); };
export const fail = (res, code, error) => { res.setHeader("Cache-Control", "no-store"); return res.status(code).json({ error }); };
export const body = req => (typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {});
