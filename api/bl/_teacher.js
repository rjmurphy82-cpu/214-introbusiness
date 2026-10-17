// POST /api/bl/teacher { action, ... }  -> teacher controls
//   create   { name, mode, company, companies }
//            mode "live": teacher-paced, one company, two launches revealed together
//            mode "self": teams work through the assigned companies on their own
//   activate { id }        switch the active game
//   open                   open Launch 1 (or Launch 2 after a reveal)
//   reveal                 close launching, score the round, show results
//   final                  show final standings after Launch 2
//   remove   { team }      delete a team (duplicates, typos)
//   close / reopen         self-paced: lock or unlock the activity
//   Add gameId: "openplay" to remove / close / reopen to act on Open Play instead of the class game
import { getJSON, setJSON, redis, hgetall, withTeams, openPlayGame, OPEN_ID, P, ok, fail, body } from "./_lib.js";
import { COMPANIES, ROUNDS, scoreRound } from "../../build-the-lineup/js/model.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return fail(res, 405, "Use POST.");
  try {
    const b = body(req);
    if (b.action === "create") {
      const id = Date.now().toString(36);
      const mode = b.mode === "self" ? "self" : "live";
      const valid = c => COMPANIES.some(x => x.id === c);
      const companies = (Array.isArray(b.companies) ? b.companies : []).filter(valid);
      const company = valid(b.company) ? b.company : COMPANIES[0].id;
      if (mode === "self" && !companies.length) return fail(res, 400, "Pick at least one company.");
      const game = { id, name: String(b.name || "Game").slice(0, 30), mode, company, companies: mode === "self" ? companies : [company], phase: mode === "self" ? "open" : "lobby", round: 0, results: [], createdAt: Date.now() };
      await setJSON("game:" + id, game);
      const ids = (await getJSON("gameids")) || []; ids.unshift(id); await setJSON("gameids", ids);
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
      if (b.action === "open" && game.phase !== "open") game.phase = "open";
      else if (b.action === "close" && game.phase === "open") game.phase = "final";
      else if (b.action === "reopen" && game.phase === "final") game.phase = "open";
      else return fail(res, 409, "Can't do that right now.");
      await setJSON("game:" + game.id, game);
      return ok(res, { game });
    }
    if (b.action === "open") {
      if (game.phase === "lobby") { game.phase = "open"; game.round = 0; }
      else if (game.phase === "revealed" && game.round < ROUNDS - 1) { game.phase = "open"; game.round += 1; }
      else return fail(res, 409, "Can't open launching right now.");
    } else if (b.action === "reveal") {
      if (game.phase !== "open") return fail(res, 409, "Launching isn't open.");
      const buys = await hgetall(`buys:${game.id}:${game.round}`);
      const live = await withTeams(game);
      if (!live.teams.length) return fail(res, 409, "No teams have joined yet.");
      game.results[game.round] = scoreRound(live, game.round, buys);
      game.phase = "revealed";
    } else if (b.action === "final") {
      if (game.phase !== "revealed" || game.round < ROUNDS - 1) return fail(res, 409, "Finish Launch 2 first.");
      game.phase = "final";
    } else return fail(res, 400, "Unknown action.");
    await setJSON("game:" + game.id, game);
    return ok(res, { game });
  } catch (e) { return fail(res, 500, e.message); }
}
