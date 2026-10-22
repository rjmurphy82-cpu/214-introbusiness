// One function for this game's whole API (Vercel's free plan allows 12 functions per site).
// /api/ab/state, /api/ab/login, ... all land here, and the route picks the handler.
// Files that start with "_" are not public routes on their own.
import buy from "./_buy.js";
import lobby from "./_lobby.js";
import login from "./_login.js";
import play from "./_play.js";
import state from "./_state.js";
import teacher from "./_teacher.js";

const ROUTES = { buy, lobby, login, play, state, teacher };

export default function handler(req, res) {
  const route = ROUTES[req.query && req.query.route];
  if (!route) { res.setHeader("Cache-Control", "no-store"); return res.status(404).json({ error: "Not found." }); }
  return route(req, res);
}
