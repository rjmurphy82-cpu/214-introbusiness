// Brand Crisis Hall of Fame: the all-time leaderboard of the best brand values across every class.
// GET  -> { list: [...top entries], periods: {...} }
// POST { code, label } -> the teacher screen sends this when a game ends. The server does NOT trust any scores from
//   the browser: it reads that game's teams, picks, and twists from Redis, loads the game's own rules from
//   /brand-crisis/data.js, and works out every team's brand value itself. Each game can be added once.
import vm from "node:vm";
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const BOARD = "bcrisis:board", KEEP = 100;

async function r(cmd) {
  const res = await fetch(URL_, { method: "POST", headers: { Authorization: "Bearer " + TOKEN, "Content-Type": "application/json" }, body: JSON.stringify(cmd) });
  const j = await res.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}
const J = s => (s == null ? null : JSON.parse(s));
let RULES = null;
async function rules(req) {
  if (RULES) return RULES;
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const src = await (await fetch(`https://${host}/brand-crisis/data.js`)).text();
  const ctx = {}; vm.createContext(ctx); vm.runInContext(src + ";this.CRISIS = CRISIS;", ctx, { timeout: 1000 });
  return (RULES = ctx.CRISIS);
}
const clean = s => String(s || "").replace(/[<>]/g, "").trim().slice(0, 40);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!URL_ || !TOKEN) return res.status(503).json({ error: "No database connected" });
  try {
    if (req.method === "GET") return res.json({ list: J(await r(["GET", BOARD])) || [] });
    if (req.method !== "POST") return res.status(405).json({ error: "GET or POST" });
    const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const code = String(b.code || "");
    if (!/^\d{4}$/.test(code)) return res.status(400).json({ error: "Bad code" });
    const meta = J(await r(["GET", `ibl:${code}:meta`])), state = J(await r(["GET", `ibl:${code}:state`]));
    if (!meta || meta.game !== "crisis") return res.status(404).json({ error: "No Brand Crisis game with that code" });
    if (!state || state.phase !== "end") return res.status(409).json({ error: "That game isn't finished yet" });
    if (!(await r(["SET", `bcrisis:posted:${code}:${meta.created}`, "1", "EX", 60 * 60 * 24 * 30, "NX"]))) return res.json({ ok: true, already: true, list: J(await r(["GET", BOARD])) || [] });
    const K = await rules(req), arr = await r(["HGETALL", `ibl:${code}:players`]) || [], ids = meta.ids || [];
    const last = ids.length - 1, entries = [];
    for (let i = 0; i < arr.length; i += 2) {
      const p = J(arr[i + 1]); if (!p || p.out || !p.name) continue;
      if (!ids.every(id => K.byId[id])) break;
      const run = K.run(ids, p.p || {}, state.tw || [], last);
      entries.push({ name: clean(p.name), value: Math.round(run.value), trust: Math.round(run.b.trust), crises: ids.length, label: clean(b.label || meta.label || ""), date: new Date().toISOString().slice(0, 10), code });
    }
    entries.sort((a, z) => z.value - a.value);
    entries.forEach((e, i) => { e.place = i + 1; e.of = entries.length; });
    const board = (J(await r(["GET", BOARD])) || []).concat(entries.slice(0, 3)) // the top 3 teams from each game can make the Hall of Fame
      .sort((a, z) => z.value - a.value).slice(0, KEEP);
    await r(["SET", BOARD, JSON.stringify(board)]);
    return res.json({ ok: true, added: entries.slice(0, 3), list: board });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
