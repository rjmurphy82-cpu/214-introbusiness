// POST /api/ab/buy { camp }  -> live mode: saves (or updates) this team's campaign for the open round
import { who, getJSON, redis, P, ok, fail, body } from "./_lib.js";
import { cleanCampaign } from "../../ad-buy-showdown/js/model.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return fail(res, 405, "Use POST.");
  const me = who(req);
  if (!me || me.role !== "team") return fail(res, 401, "Please log in again.");
  try {
    const activeId = await redis("GET", P + "active");
    const game = activeId ? await getJSON("game:" + activeId) : null;
    if (!game) return fail(res, 409, "No game is running.");
    if (me.game && me.game !== game.id) return fail(res, 401, "A new game started. Log in again.");
    if (!(await redis("HEXISTS", `${P}teams:${game.id}`, me.team))) return fail(res, 401, "Your team was removed. Join again.");
    if (game.phase !== "open") return fail(res, 409, "Your teacher already launched this round.");
    const camp = cleanCampaign(game.round, body(req).camp);
    if (camp.error) return fail(res, 400, camp.error);
    await redis("HSET", `${P}buys:${game.id}:${game.round}`, me.team, JSON.stringify(camp));
    return ok(res, { saved: true, round: game.round, camp });
  } catch (e) { return fail(res, 500, e.message); }
}
