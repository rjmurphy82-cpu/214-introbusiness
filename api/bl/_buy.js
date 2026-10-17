// POST /api/bl/buy { lineup: [{ f: [feature indexes], p: price index, n: name } x3] }
//   -> live mode: saves this team's lineup for the open round
import { who, getJSON, redis, P, ok, fail, body } from "./_lib.js";
import { companyById, cleanLineup } from "../../build-the-lineup/js/model.js";

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
    if (game.mode === "self") return fail(res, 409, "This game is self-paced.");
    if (game.phase !== "open") return fail(res, 409, "Launching is closed.");
    const lineup = cleanLineup(companyById(game.company), body(req).lineup);
    if (!lineup) return fail(res, 400, "Pick a price for all three versions.");
    await redis("HSET", `${P}buys:${game.id}:${game.round}`, me.team, JSON.stringify(lineup));
    return ok(res, { saved: true, round: game.round, lineup });
  } catch (e) { return fail(res, 500, e.message); }
}
