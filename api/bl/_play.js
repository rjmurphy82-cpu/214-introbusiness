// POST /api/bl/play  -> self-paced mode, one team working through the companies on its own
//   { action: "launch",  company, lineup, why }   launch this round's lineup, get results right away
//   { action: "reflect", company, answers: [3] }  finish a company
//   { action: "send" }                            send the report to the teacher
import { who, gameForToken, redis, P, ok, fail, body } from "./_lib.js";
import { companyById, cleanLineup, scoreLineup, wordCount, ROUNDS } from "../../build-the-lineup/js/model.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return fail(res, 405, "Use POST.");
  const me = who(req);
  if (!me || me.role !== "team") return fail(res, 401, "Please join again.");
  try {
    const b = body(req);
    const game = await gameForToken(me);
    if (!game) return fail(res, 401, "Your teacher started a new game. Join again.");
    if (game.mode !== "self") return fail(res, 409, "This game is teacher-paced.");
    if (!(await redis("HEXISTS", `${P}teams:${game.id}`, me.team))) return fail(res, 401, "Your team was removed. Join again.");
    if (game.phase === "final") return fail(res, 409, "Your teacher closed this activity.");
    const key = `${P}prog:${game.id}`;
    const prog = JSON.parse((await redis("HGET", key, me.team)) || '{"companies":{}}');
    if (b.action === "send") {
      prog.sentAt = Date.now();
      await redis("HSET", key, me.team, JSON.stringify(prog));
      return ok(res, { prog });
    }
    if (!game.companies.includes(b.company)) return fail(res, 400, "Pick one of the assigned companies.");
    const co = companyById(b.company);
    const entry = prog.companies[co.id] || (prog.companies[co.id] = { rounds: [], reflect: null });
    if (b.action === "launch") {
      const r = entry.rounds.length;
      if (r >= ROUNDS) return fail(res, 409, "Both launches are done for this company.");
      const lineup = cleanLineup(co, b.lineup);
      if (!lineup) return fail(res, 400, "Pick a price for all three versions.");
      const why = String(b.why || "").trim().slice(0, 600);
      if (wordCount(why) < 8) return fail(res, 400, "Explain your lineup in at least one full sentence (8+ words).");
      const s = scoreLineup(co, lineup);
      entry.rounds.push({ lineup, profits: s.vers.map(v => v.profit), total: s.total, why, at: Date.now() });
      await redis("HSET", key, me.team, JSON.stringify(prog));
      return ok(res, { prog, round: r });
    }
    if (b.action === "reflect") {
      if (entry.rounds.length < ROUNDS) return fail(res, 409, "Finish both launches first.");
      const answers = (Array.isArray(b.answers) ? b.answers : []).map(a => String(a || "").trim().slice(0, 800));
      if (answers.length !== 3 || answers.some(a => wordCount(a) < 5)) return fail(res, 400, "Answer all three questions (5+ words each).");
      entry.reflect = answers;
      await redis("HSET", key, me.team, JSON.stringify(prog));
      return ok(res, { prog });
    }
    return fail(res, 400, "Unknown action.");
  } catch (e) { return fail(res, 500, e.message); }
}
