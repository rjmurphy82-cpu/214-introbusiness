// GET /api/ab/state               -> a team's view (needs the team login)
// GET /api/ab/state?view=teacher  -> the teacher console view of the class game (open, no password)
// GET /api/ab/state?view=teacher&game=openplay -> the teacher console view of Open Play
import { who, getJSON, redis, hgetall, activeGame, openPlayGame, gameForToken, withTeams, maxTeams, resultsForTeam, OPEN_ID, P, ok, fail } from "./_lib.js";

export default async function handler(req, res) {
  const teacher = req.query && req.query.view === "teacher";
  const me = teacher ? { role: "teacher" } : who(req);
  if (!me) return fail(res, 401, "Please log in again.");
  try {
    const raw = me.role === "teacher" ? (req.query.game === OPEN_ID ? await openPlayGame() : await activeGame()) : await gameForToken(me);
    const game = await withTeams(raw);
    const members = game ? game._members : {};
    if (game) delete game._members;

    if (me.role === "teacher") {
      const ids = (await getJSON("gameids")) || [];
      const games = ids.length ? (await redis("MGET", ...ids.map(id => P + "game:" + id))).filter(Boolean).map(s => { const g = JSON.parse(s); return { id: g.id, name: g.name, phase: g.phase, round: g.round }; }) : [];
      // Live: which teams have locked in a campaign this round (campaigns stay hidden until launch)
      const buys = game && game.mode !== "self" ? Object.keys(await hgetall(`buys:${game.id}:${game.round}`)) : [];
      const progress = game && game.mode === "self" ? await hgetall(`prog:${game.id}`) : {};
      return ok(res, { role: "teacher", game, games, buys, progress, members, max: game ? maxTeams(game) : 15, activeId: await redis("GET", P + "active") });
    }

    if (!game) return fail(res, 401, "Your teacher started a new game. Join again.");
    if (!game.teams.includes(me.team)) return fail(res, 401, "Your team was removed. Join again.");
    if (game.mode === "self") {
      const p = await redis("HGET", `${P}prog:${game.id}`, me.team);
      return ok(res, { role: "team", team: me.team, roster: members[me.team] || [], game, prog: p ? JSON.parse(p) : { rounds: {} } });
    }
    game.results = resultsForTeam(game.results, me.team);
    const v = await redis("HGET", `${P}buys:${game.id}:${game.round}`, me.team);
    return ok(res, { role: "team", team: me.team, roster: members[me.team] || [], game, myBuy: v ? JSON.parse(v) : null });
  } catch (e) { return fail(res, 500, e.message); }
}
