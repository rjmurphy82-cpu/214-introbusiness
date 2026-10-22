// POST /api/ab/teacher { action, ... }  -> teacher controls
//   create   { name }   new live class game, made active
//   activate { id }     switch the active game
//   open                open Round 1 (or the next round after results)
//   reveal              close the round, run every campaign, show results
//   final               show final standings after Round 6
//   remove   { team }   delete a team (duplicates, typos)
//   close / reopen      Open Play only: lock or unlock it
//   Add gameId: "openplay" to remove / close / reopen to act on Open Play instead of the class game
import { getJSON, setJSON, redis, hgetall, withTeams, openPlayGame, OPEN_ID, P, ok, fail, body } from "./_lib.js";
import { NROUNDS, scoreRound } from "../../ad-buy-showdown/js/model.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return fail(res, 405, "Use POST.");
  try {
    const b = body(req);
    if (b.action === "create") {
      const id = Date.now().toString(36);
      const game = { id, name: String(b.name || "Game").slice(0, 30), mode: "live", phase: "lobby", round: 0, results: [], createdAt: Date.now() };
      await setJSON("game:" + id, game);
      const ids = (await getJSON("gameids")) || []; ids.unshift(id); await setJSON("gameids", ids.slice(0, 60));
      await redis("SET", P + "active", id);
      return ok(res, { game });
    }
    if (b.action === "activate") {
      if (!(await getJSON("game:" + b.id))) return fail(res, 404, "Game not found.");
      await redis("SET", P + "active", b.id);
      return ok(res, { active: b.id });
    }
    const activeId = await redis("GET", P + "active");
    const game = b.gameId === OPEN_ID ? await openPlayGame() : activeId ? await getJSON("game:" + activeId) : null;
    if (!game) return fail(res, 409, "No class game is running. Create one on Games.");
    if (b.action === "remove") {
      await redis("HDEL", `${P}teams:${game.id}`, String(b.team || ""));
      return ok(res, { removed: b.team });
    }
    if (game.mode === "self") {
      if (b.action === "close" && game.phase === "open") game.phase = "final";
      else if (b.action === "reopen" && game.phase === "final") game.phase = "open";
      else return fail(res, 409, "Can't do that right now.");
      await setJSON("game:" + game.id, game);
      return ok(res, { game });
    }
    if (b.action === "open") {
      if (game.phase === "lobby") { game.phase = "open"; game.round = 0; }
      else if (game.phase === "revealed" && game.round < NROUNDS - 1) { game.phase = "open"; game.round += 1; }
      else return fail(res, 409, "Can't open a round right now.");
    } else if (b.action === "reveal") {
      if (game.phase !== "open") return fail(res, 409, "No round is open.");
      const live = await withTeams(game);
      if (!live.teams.length) return fail(res, 409, "No teams have joined yet.");
      const buys = await hgetall(`buys:${game.id}:${game.round}`);
      game.results[game.round] = scoreRound(live, game.round, buys);
      game.phase = "revealed";
    } else if (b.action === "final") {
      if (game.phase !== "revealed" || game.round < NROUNDS - 1) return fail(res, 409, "Finish Round 6 first.");
      game.phase = "final";
    } else return fail(res, 400, "Unknown action.");
    await setJSON("game:" + game.id, game);
    return ok(res, { game });
  } catch (e) { return fail(res, 500, e.message); }
}
