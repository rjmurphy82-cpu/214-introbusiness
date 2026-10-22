// POST /api/ab/play  -> Open Play: one team working through the six clients on its own
//   { action: "launch", round, camp }   run that client's campaign once and get results right away
//   { action: "send" }                  send the report to the teacher
import { who, gameForToken, redis, P, ok, fail, body } from "./_lib.js";
import { cleanCampaign, simulate, seedFor, NROUNDS } from "../../ad-buy-showdown/js/model.js";

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
    const prog = JSON.parse((await redis("HGET", key, me.team)) || '{"rounds":{}}');
    if (b.action === "send") {
      if (!Object.keys(prog.rounds).length) return fail(res, 409, "Launch at least one campaign first.");
      prog.sentAt = Date.now();
      await redis("HSET", key, me.team, JSON.stringify(prog));
      return ok(res, { prog });
    }
    if (b.action === "launch") {
      const r = Number(b.round);
      if (!Number.isInteger(r) || r < 0 || r >= NROUNDS) return fail(res, 400, "Pick a client.");
      if (prog.rounds[r]) return fail(res, 409, "You already ran this client's campaign.");
      const camp = cleanCampaign(r, b.camp);
      if (camp.error) return fail(res, 400, camp.error);
      prog.rounds[r] = { camp, res: simulate(r, camp, seedFor(game.id, me.team, r)), at: Date.now() };
      await redis("HSET", key, me.team, JSON.stringify(prog));
      return ok(res, { prog, round: r });
    }
    return fail(res, 400, "Unknown action.");
  } catch (e) { return fail(res, 500, e.message); }
}
