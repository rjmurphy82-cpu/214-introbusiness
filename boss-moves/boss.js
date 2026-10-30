/* Boss Moves: a live management simulation for the Management & Leadership unit.
   Students join with their first name and get a new partner every round. Each round:
     1. Make the Call - the pair reads a workplace situation, picks the leadership style that fits (8 choices),
                        and writes the statement they'd release to their team
     2. Reveal        - the best style, the team's developmental level, how the class voted, and the Perfect Statement
     3. Vote          - everyone votes for the class statement closest to the Perfect Statement (not their own)
     4. Results       - style points + vote points, then new partners
   Points belong to each student and add up all game. The teacher screen does all the scoring and writes it to the
   shared state; student devices only send their pick, statement, and vote.
   Storage: the same /api/live store as Ad Buy Live, Marketing Ladder, and Brand Crisis (codes under ibl:). */
"use strict";
const B = window.BOSS;
const $ = s => document.querySelector(s);
const app = $("#app");
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const num = n => Math.round(n).toLocaleString("en-US");
const ROLE = window.BRL_ROLE || "student";
const MOCK = /[?&]mock=1/.test(location.search);
const GAME = "boss";
const LET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const MAXLEN = 280;
const P = B.PTS;
const ord = n => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th");
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
function beep(f, d) { try { const c = beep.c || (beep.c = new (window.AudioContext || window.webkitAudioContext)()); const o = c.createOscillator(), g = c.createGain(); o.frequency.value = f; g.gain.value = .06; o.connect(g); g.connect(c.destination); const t = c.currentTime; g.gain.exponentialRampToValueAtTime(.0001, t + d); o.start(t); o.stop(t + d); } catch (e) {} }

/* ============================================================ NETWORK (same store as Ad Buy Live) */
function mockNet() {
  const KEY = "bossMock", bc = ("BroadcastChannel" in window) ? new BroadcastChannel(KEY) : null, subs = [];
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } };
  const write = t => { localStorage.setItem(KEY, JSON.stringify(t)); fire(); if (bc) bc.postMessage(1); };
  const at = (t, p) => p.split("/").filter(Boolean).reduce((o, k) => (o == null ? undefined : o[k]), t);
  const put = (t, p, v) => { const ks = p.split("/").filter(Boolean); let o = t; ks.slice(0, -1).forEach(k => { if (typeof o[k] !== "object" || o[k] === null) o[k] = {}; o = o[k]; }); if (v === null) delete o[ks[ks.length - 1]]; else o[ks[ks.length - 1]] = v; };
  const fire = () => { const t = read(); subs.forEach(s => { const v = JSON.stringify(at(t, s.p) ?? null); if (v !== s.last) { s.last = v; s.cb(JSON.parse(v)); } }); };
  if (bc) bc.onmessage = fire; window.addEventListener("storage", e => { if (e.key === KEY) fire(); });
  return {
    get: async p => at(read(), p) ?? null,
    set: async (p, v) => { const t = read(); put(t, p, v); write(t); },
    update: async (p, o) => { const t = read(); Object.entries(o).forEach(([k, v]) => put(t, p + "/" + k, v)); write(t); },
    remove: async p => { const t = read(); put(t, p, null); write(t); },
    on: (p, cb) => { const s = { p, cb, last: undefined }; subs.push(s); setTimeout(fire, 0); return () => { const i = subs.indexOf(s); if (i >= 0) subs.splice(i, 1); }; }
  };
}
async function vercelNet() {
  const call = async (op, path, v) => { const r = await fetch("/api/live", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op, path, v }) });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || r.status); return j; };
  try { const p = await call("ping"); if (!p.ok) return null; } catch (e) { return null; }
  return {
    get: async p => (await call("get", p)).v ?? null,
    set: (p, v) => call("set", p, v),
    update: (p, o) => call("update", p, o),
    remove: p => call("remove", p),
    on: (p, cb) => { let last, stop = false, t;
      const tick = async () => { if (stop) return;
        if (!document.hidden) { try { const v = (await call("get", p)).v ?? null, s = JSON.stringify(v); if (s !== last) { last = s; cb(v); } } catch (e) {} }
        if (!stop) t = setTimeout(tick, 1200); };
      tick(); return () => { stop = true; clearTimeout(t); }; }
  };
}
let NET = null;
async function net() { if (NET) return NET; NET = MOCK ? mockNet() : await vercelNet(); return NET; }

/* ============================================================ PARTNERS */
const pkey = (a, b) => (a < b ? a + "|" + b : b + "|" + a);
// Pairs; an odd one out joins the last pair as a group of 3. Never a group of 1 unless only 1 player.
function groupsOf(order) {
  const out = []; for (let i = 0; i + 1 < order.length; i += 2) out.push([order[i], order[i + 1]]);
  if (order.length % 2) { if (out.length) out[out.length - 1].push(order[order.length - 1]); else out.push([order[0]]); }
  return out;
}
function cost(groups, hist) { let c = 0; groups.forEach(g => { for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) c += (hist[pkey(g[i], g[j])] || 0) * 10; }); return c; }
// New partners each round: try lots of random pairings and keep the one with the fewest repeat partners
function pairUp(ids, hist) {
  let best = null, bc = Infinity;
  for (let t = 0; t < 400 && bc > 0; t++) { const g = groupsOf(B.shuffle(ids, Math.random)), c = cost(g, hist); if (c < bc) { bc = c; best = g; } }
  return best || [];
}
const pairOf = (st, pid) => (st.pairs || []).findIndex(g => g.includes(pid));

/* ============================================================ SHARED VIEW PIECES */
const scen = (meta, r) => B.byId[meta.plan[r]];
const secsLeft = (t0, secs) => Math.max(0, secs - (performance.now() - t0) / 1000);
const clockText = s => (s >= 60 ? Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0") : String(s));
const timerHTML = secs => `<div class="row tline"><div class="timer" style="flex:1"><i></i></div><span class="secs">${clockText(secs)}</span></div>`;
let TICK = null;
function stopTick() { clearInterval(TICK); TICK = null; }
function startTimer(el, secs, t0, onEnd) {
  stopTick();
  const bar = el.querySelector(".timer i"), sec = el.querySelector(".secs"), tm = el.querySelector(".timer"); let last = null;
  TICK = setInterval(() => {
    const left = secsLeft(t0, secs), c = Math.ceil(left);
    if (bar) bar.style.transform = `scaleX(${left / secs})`;
    if (c !== last) { last = c; if (sec) sec.textContent = clockText(c); if (c <= 3 && c > 0 && ROLE !== "teacher") beep(880, .05); }
    if (tm) tm.classList.toggle("low", left <= Math.min(15, secs * .2));
    if (left <= 0) { stopTick(); onEnd && onEnd(); }
  }, 100);
}
function caseHTML(sc, o = {}) {
  return `<div class="case">
    <div class="chead"><div><div class="kind">${esc(sc.org)}</div><h2>${esc(sc.title)}</h2></div>${o.right || ""}</div>
    <div class="cbody"><div class="cline"><b>Your team</b>${esc(sc.team)}</div><div class="cline sit"><b>The situation</b>${esc(sc.sit)}</div></div>
    ${o.ask === false ? "" : `<div class="askline">You're the manager. Pick the leadership style that fits, then write the statement you'd give your team.</div>`}
  </div>`;
}
const styleName = id => (B.STYLES[id] ? B.STYLES[id].name : "No pick");
function perfectHTML(sc, o = {}) {
  return `<div class="perfect ${o.small ? "small" : ""}"><div class="ph"><span class="star">★</span>The Perfect Statement<em>${esc(styleName(sc.best))}</em></div>
    <p>“${esc(sc.perfect)}”</p>
    ${o.moves === false ? "" : `<div class="moves">${sc.moves.map(m => `<span>✓ ${esc(m)}</span>`).join("")}</div>`}</div>`;
}
function levelHTML(sc) {
  if (!sc.level) return "";
  const L = B.LEVELS[sc.level];
  return `<div class="lvl"><b>Situational Leadership</b><div><span class="ln">${esc(L.name)}</span><span class="ls">${esc(L.sub)}</span></div><div class="lf">→ ${esc(L.fit)}</div></div>`;
}

/* ============================================================ FIT THE PROJECTOR */
function zoomApp() { const a = app; a.style.zoom = ""; const R = document.documentElement; let lo = .55, hi = 2.2;
  for (let i = 0; i < 12; i++) { const m = (lo + hi) / 2; a.style.zoom = m.toFixed(3); (R.scrollHeight <= innerHeight + 1 && R.scrollWidth <= innerWidth + 1) ? lo = m : hi = m; }
  a.style.zoom = lo.toFixed(3); }
function fit() { if (ROLE !== "teacher") return; document.body.classList.add("wide"); requestAnimationFrame(zoomApp); }
window.addEventListener("resize", () => { if (ROLE === "teacher") { clearTimeout(fit.t); fit.t = setTimeout(zoomApp, 150); } });

/* ============================================================ HOME */
const hdr = () => `<h1 class="title">Boss <span>Moves.</span></h1>
  <p class="lede">${ROLE === "teacher"
    ? "Teacher screen for the projector. Students join on their own devices and get a new partner every round. Each pair reads a workplace situation, picks the leadership style that fits, and writes the statement they'd give their team. Then the class sees the Perfect Statement and votes for the one that matches it best."
    : "Join with your first name. Every round you get a new partner and a new workplace problem. Pick the leadership style that fits, write what you'd say to your team, then vote for the statement that best matches the Perfect Statement. Your points add up all game."}</p>`;
function needSetup() {
  app.innerHTML = `${hdr()}<div class="panel"><h2>${ROLE === "teacher" ? "Class games need the database" : "The game isn't open yet"}</h2>
    <p>${ROLE === "teacher" ? "In Vercel, connect the Upstash for Redis database to this project, then redeploy. It's the same setup Ad Buy Live uses." : "Wait for your teacher to start it, then reload this page."}</p>
    <button class="btn main" id="b">Reload</button></div>`;
  $("#b").onclick = () => location.reload();
}
function home() { stopTick(); document.body.classList.remove("wide", "finale-on"); app.style.zoom = ""; $("#who").hidden = true; ROLE === "teacher" ? hostSetup() : joinForm(); }

/* ============================================================ HOST */
let H = null;
async function hostSetup() {
  const N = await net().catch(() => null); if (!N) return needSetup();
  const cfg = { scen: B.DEFAULT.slice(), csecs: 180, vsecs: 75 };
  app.innerHTML = `${hdr()}<div class="panel wide-panel"><h2>Host a game</h2>
    <p>Rounds: each situation is one round, played in this order. Tap to turn one off.</p>
    <div class="seg multi" id="sc">${B.SCENARIOS.map(s => `<button data-v="${s.id}" aria-pressed="${cfg.scen.includes(s.id)}"><b>${esc(s.title)}</b><small>${esc(s.org)}${s.level ? " · " + esc(B.LEVELS[s.level].fit) : ""}</small></button>`).join("")}</div>
    <p class="note" id="rc"></p>
    <p>Time to pick a style and write the statement:</p><div class="seg" data-k="csecs"><button data-v="120">2 min</button><button data-v="180" aria-pressed="true">3 min</button><button data-v="240">4 min</button></div>
    <p>Time to vote:</p><div class="seg" data-k="vsecs"><button data-v="45">45 sec</button><button data-v="75" aria-pressed="true">75 sec</button><button data-v="120">2 min</button></div>
    <p class="note">Scoring: best style ${P.best}, a good fit ${P.good}. Each vote your statement gets is +${P.vote}, the top statement each round gets +${P.top}, and voting earns +${P.cast}. Both partners get the pair's points.</p>
    <div class="err" id="er"></div><button class="btn main" id="go">Create game</button></div>`;
  const note = () => { const n = cfg.scen.length; $("#rc").textContent = n ? `${plural(n, "round")}, about ${n * 6} to ${n * 7} minutes with 28 students.` : "Pick at least one round."; $("#go").disabled = !n; };
  note();
  $("#sc").onclick = e => { const b = e.target.closest("button"); if (!b) return; b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true");
    cfg.scen = B.SCENARIOS.map(s => s.id).filter(id => document.querySelector(`#sc [data-v="${id}"]`).getAttribute("aria-pressed") === "true"); note(); };
  app.querySelectorAll(".seg[data-k]").forEach(sg => sg.onclick = e => { const b = e.target.closest("button"); if (!b) return;
    [...sg.children].forEach(x => x.setAttribute("aria-pressed", x === b)); cfg[sg.dataset.k] = +b.dataset.v; });
  $("#go").onclick = async () => {
    $("#go").disabled = true;
    try {
      let code; for (let t = 0; t < 20; t++) { code = String(Math.floor(1000 + Math.random() * 9000)); if (!(await N.get("games/" + code))) break; }
      const seed = Math.floor(Math.random() * 1e9);
      const meta = { created: Date.now(), game: GAME, seed, plan: cfg.scen, rounds: cfg.scen.length, csecs: cfg.csecs, vsecs: cfg.vsecs };
      const state = { phase: "lobby", tot: {} };
      await N.set("games/" + code, { ...meta, state });
      H = { N, code, meta, state, players: {} };
      H.off = N.on("games/" + code + "/players", v => { H.players = v || {}; hostRender(true); });
      hostRender();
    } catch (e) { $("#er").textContent = "Couldn't reach the class game database."; $("#go").disabled = false; }
  };
}
const active = () => Object.entries(H.players).filter(([, p]) => !p.out).map(([id]) => id);
const nameOf = pid => (H.players[pid] && H.players[pid].name) || (H.state.names && H.state.names[pid]) || "?";
const seated = () => (H.state.pairs || []).flat();
const pairNames = g => g.map(nameOf).join(" & ");
function namesMap() { const o = {}; Object.entries(H.players).forEach(([id, p]) => o[id] = p.name); return o; }
function hostSet(state) { H.state = state; H.rq = null; H.N.set("games/" + H.code + "/state", state).catch(() => {}); hostRender(); }

function hostRender(fromPlayers) {
  const st = H.state;
  if (fromPlayers && !["lobby", "seat", "call", "vote"].includes(st.phase)) return;
  if (st.phase === "lobby") return hostLobby();
  if (st.phase === "seat") return hostSeat(fromPlayers);
  if (st.phase === "call") return hostCall();
  if (st.phase === "reveal") return hostReveal();
  if (st.phase === "vote") return hostVote(fromPlayers);
  if (st.phase === "results") return hostResults();
  if (st.phase === "end") return hostEnd();
}
function hostLobby() {
  const ps = active(), url = location.origin + "/boss-moves/?code=" + H.code;
  if (!H.qr) H.qr = qrSvg(url);
  app.innerHTML = `<div class="lobby"><div class="lobtop"><div class="lobleft"><div class="join">Scan the code, or open <b>Boss Moves</b> on the Intro to Business site and enter</div>
    <div class="code">${H.code}</div><div class="url">${esc(url.replace(/^https?:\/\//, ""))}</div></div>
    ${H.qr ? `<div class="qr">${H.qr}<span>Scan to join</span></div>` : ""}</div>
    <div class="count">${plural(ps.length, "player")} joined · ${plural(Math.floor(ps.length / 2), "pair")}</div>
    <div class="names">${ps.map(id => `<span>${esc(nameOf(id))}</span>`).join("") || '<span style="opacity:.5">Waiting for players…</span>'}</div>
    <p class="note">${plural(H.meta.rounds, "round")} · new partner every round · points add up all game</p>
    <div class="row" style="justify-content:center"><button class="btn main" id="start" ${ps.length >= 2 ? "" : "disabled"}>Pair everyone up</button><button class="btn" id="end">Cancel</button></div></div>`;
  $("#start").onclick = () => hostSet({ phase: "seat", r: 0, pairs: pairUp(active(), {}), hist: {}, tot: {}, names: namesMap() });
  $("#end").onclick = hostErase;
  fit();
}
function hostSeat(fromPlayers) {
  const st = H.state;
  // anyone new gets a partner; anyone removed leaves their pair
  const inSeat = new Set(seated()), fresh = active().filter(p => !inSeat.has(p));
  const gone = seated().filter(p => H.players[p] && H.players[p].out);
  if (fresh.length || gone.length) {
    let pairs = st.pairs.map(g => g.filter(p => !gone.includes(p))).filter(g => g.length);
    fresh.forEach(p => { const solo = pairs.find(g => g.length === 1); if (solo) solo.push(p); else pairs.push([p]); });
    const solos = pairs.filter(g => g.length === 1);
    if (solos.length && pairs.length > 1) { pairs = pairs.filter(g => g.length > 1); solos.forEach(g => { const tgt = pairs.filter(x => x.length === 2).pop() || pairs[pairs.length - 1]; tgt.push(g[0]); }); }
    return hostSet({ ...st, pairs, names: namesMap() });
  }
  if (fromPlayers && H.rq === "seat") return;
  H.rq = "seat";
  app.innerHTML = `<div class="hostbar"><div><div class="kick">Round ${st.r + 1} of ${H.meta.rounds}</div><h2>${st.r === 0 ? "Find your partner" : "New partners"}</h2></div>
    <p>${st.r === 0 ? "Sit with the person on your screen. One of you types, both of you decide." : "Everyone gets someone new. Find your partner and sit together."}</p></div>
    <div class="pgrid">${st.pairs.map((g, i) => `<div class="pcard"><span class="pn">${i + 1}</span><div class="pp">${g.map(p => `<div class="tn"><span>${esc(nameOf(p))}</span><em>${num((st.tot || {})[p] || 0)}</em><button class="x" data-p="${p}" title="Remove from the game">✕</button></div>`).join("")}</div></div>`).join("")}</div>
    <div class="row" style="justify-content:center;margin-top:14px"><button class="btn main" id="go">Everyone's with a partner: start Round ${st.r + 1}</button></div>
    <p class="note" style="text-align:center">✕ removes an absent student. If they come back, they rejoin with the same name and keep their points.</p>`;
  app.querySelectorAll(".x").forEach(b => b.onclick = async () => { const p = b.dataset.p; H.players[p] = { ...H.players[p], out: true }; await H.N.update(`games/${H.code}/players/${p}`, { out: true }).catch(() => {}); H.rq = null; hostSeat(); });
  $("#go").onclick = () => hostSet({ ...H.state, phase: "call", t0: Date.now() });
  fit();
}
// The pair's call = the most recent one either partner locked in
function pairCall(g, r, players) {
  let best = null;
  g.forEach(p => { const c = players[p] && players[p].c && players[p].c[r]; if (c && c.s && (!best || (c.at || 0) > (best.at || 0))) best = { ...c, by: p }; });
  return best;
}
function hostCall() {
  const st = H.state, sc = scen(H.meta, st.r), secs = H.meta.csecs;
  const locked = st.pairs.map(g => !!pairCall(g, st.r, H.players)), n = locked.filter(Boolean).length;
  if (H.rq !== "call" + st.r) {
    H.rq = "call" + st.r; H.t0 = performance.now();
    app.innerHTML = `<div class="kick" style="margin-bottom:6px">Round ${st.r + 1} of ${H.meta.rounds} · Make the Call</div>`
      + caseHTML(sc, { right: `<div class="clock"><div class="secs big">${clockText(secs)}</div><div class="count" id="cnt"></div></div>` })
      + `<div class="stylechips">${B.optsFor(sc, H.meta.seed, st.r).map(id => `<span>${esc(B.STYLES[id].name)}</span>`).join("")}</div>`
      + `<div class="dots" id="dots"></div>
      <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn" id="close">Close it now</button></div>`;
    $("#close").onclick = () => hostCloseCall();
    startTimer(app, secs, H.t0, () => setTimeout(hostCloseCall, 4000)); // a few extra seconds so devices can send their auto-submit
    fit();
  }
  $("#cnt").textContent = `${n} of ${st.pairs.length} pairs locked in`;
  $("#dots").innerHTML = st.pairs.map((g, i) => `<span class="${locked[i] ? "on" : ""}" title="${esc(pairNames(g))}">${i + 1}</span>`).join("");
  if (st.pairs.length && n >= st.pairs.length && !H.closing) { H.closing = setTimeout(() => { H.closing = null; if (H.state.phase === "call") hostCloseCall(); }, 3000); }
}
async function hostCloseCall() {
  if (H.state.phase !== "call" || H.closingNow) return; H.closingNow = true; stopTick();
  try { H.players = (await H.N.get(`games/${H.code}/players`)) || H.players; } catch (e) {}
  const st = H.state, picks = st.pairs.map(g => { const c = pairCall(g, st.r, H.players); return c ? { s: c.s, t: String(c.t || "").trim().slice(0, MAXLEN) } : null; });
  const withText = st.pairs.map((_, i) => i).filter(i => picks[i] && picks[i].t);
  const stmts = B.shuffle(withText, Math.random).map((pi, k) => ({ k: LET[k % 26] + (k >= 26 ? Math.floor(k / 26) + 1 : ""), pi, t: picks[pi].t, s: picks[pi].s }));
  H.closingNow = false;
  hostSet({ ...st, phase: "reveal", picks, stmts, hid: [], names: namesMap() });
}
function hostReveal() {
  const st = H.state, sc = scen(H.meta, st.r), opts = B.optsFor(sc, H.meta.seed, st.r);
  const counts = {}; opts.forEach(o => counts[o] = 0); let none = 0;
  st.picks.forEach(p => { if (p && counts[p.s] != null) counts[p.s]++; else none++; });
  const mx = Math.max(1, ...Object.values(counts));
  const tier = id => (id === sc.best ? "best" : sc.good.includes(id) ? "good" : "");
  app.innerHTML = `<div class="hostbar"><div><div class="kick">Round ${st.r + 1} · ${esc(sc.org)}</div><h2>The best call: ${esc(styleName(sc.best))}</h2></div>
      <div class="bigstat"><b>+${P.best}</b><span>best style · good fit +${P.good}</span></div></div>
    <div class="revgrid"><div>
      <div class="sbars">${opts.map(id => `<div class="sbrow ${tier(id)}"><span class="bn">${esc(B.STYLES[id].name)}${tier(id) === "good" ? ` <small>good fit</small>` : ""}</span><div class="sbar"><i style="width:${counts[id] / mx * 100}%"></i><b>${counts[id]}</b></div></div>`).join("")}
        ${none ? `<p class="note">${plural(none, "pair")} didn't lock in.</p>` : ""}</div>
      ${levelHTML(sc)}
      <div class="lesson"><b>Why</b>${esc(sc.why)}</div></div>
      <div>${perfectHTML(sc)}<p class="note" style="margin-top:10px">${plural(st.stmts.length, "statement")} came in. Next, everyone votes for the one that comes closest to the Perfect Statement.</p></div></div>
    <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn main" id="nx">Open voting →</button></div>`;
  $("#nx").onclick = () => hostSet({ ...st, phase: "vote" });
  fit();
}
const votedCount = r => seated().filter(p => H.players[p] && H.players[p].v && H.players[p].v[r] != null).length;
function hostVote(fromPlayers) {
  const st = H.state, sc = scen(H.meta, st.r), secs = H.meta.vsecs, total = seated().length, v = votedCount(st.r);
  const hid = new Set(st.hid || []), shown = st.stmts.filter(x => !hid.has(x.pi));
  if (H.rq !== "vote" + st.r + "|" + (st.hid || []).join(",")) {
    if (H.vR !== st.r || H.t0v == null) { H.vR = st.r; H.t0v = performance.now(); } // hiding a statement redraws but keeps the clock
    H.rq = "vote" + st.r + "|" + (st.hid || []).join(",");
    app.innerHTML = `<div class="votehead"><div class="kick">Round ${st.r + 1} · Vote</div>${timerHTML(secs)}<span class="count" id="cnt"></span></div>
      ${perfectHTML(sc, { small: true })}
      <div class="sgrid ${shown.length > 9 ? "dense" : ""}">${shown.map(x => `<div class="scard"><div class="sk"><b>${esc(x.k)}</b><span>${esc(styleName(x.s))}</span><button class="x" data-pi="${x.pi}" title="Hide this statement">✕</button></div><p>${esc(x.t)}</p></div>`).join("") || "<p class='note'>No statements came in this round.</p>"}</div>
      <div class="row" style="justify-content:space-between;margin-top:10px"><span class="note">Vote for the statement closest to the Perfect Statement. You can't vote for your own. ✕ hides a statement.</span><button class="btn" id="close">Close voting now</button></div>`;
    app.querySelectorAll(".x").forEach(b => b.onclick = () => hostSet({ ...H.state, hid: [...(H.state.hid || []), +b.dataset.pi] }));
    $("#close").onclick = () => hostCloseVote();
    startTimer(app, secs, H.t0v, () => setTimeout(hostCloseVote, 2500));
    fit();
  }
  const c = $("#cnt"); if (c) c.textContent = `${v} of ${total} voted`;
  if (total && v >= total && !H.vclosing) { H.vclosing = setTimeout(() => { H.vclosing = null; if (H.state.phase === "vote") hostCloseVote(); }, 2500); }
}
async function hostCloseVote() {
  if (H.state.phase !== "vote" || H.closingNow) return; H.closingNow = true; stopTick(); H.t0v = null;
  try { H.players = (await H.N.get(`games/${H.code}/players`)) || H.players; } catch (e) {}
  const st = H.state, sc = scen(H.meta, st.r), hid = new Set(st.hid || []), live = new Set(st.stmts.map(x => x.pi).filter(pi => !hid.has(pi)));
  const votes = st.pairs.map(() => 0), cast = {};
  seated().forEach(p => { const v = H.players[p] && H.players[p].v && H.players[p].v[st.r];
    if (v == null) return; cast[p] = true; if (live.has(v) && v !== pairOf(st, p)) votes[v]++; });
  const mx = Math.max(0, ...votes);
  const res = st.pairs.map((g, i) => { const pk = st.picks[i], sp = pk ? B.stylePts(sc, pk.s) : 0, top = mx > 0 && votes[i] === mx && live.has(i);
    return { sp, votes: votes[i], top, pts: sp + votes[i] * P.vote + (top ? P.top : 0) }; });
  const tot = { ...(st.tot || {}) }, rp = {};
  st.pairs.forEach((g, i) => g.forEach(p => { rp[p] = res[i].pts + (cast[p] ? P.cast : 0); tot[p] = (tot[p] || 0) + rp[p]; }));
  const hist = { ...(st.hist || {}) }; st.pairs.forEach(g => { for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) { const k = pkey(g[i], g[j]); hist[k] = (hist[k] || 0) + 1; } });
  const log = [...(st.log || []), { r: st.r, best: st.picks.filter(p => p && p.s === sc.best).length, good: st.picks.filter(p => p && sc.good.includes(p.s)).length, n: st.pairs.length,
    top: st.stmts.filter(x => live.has(x.pi) && votes[x.pi] === mx && mx > 0).map(x => ({ t: x.t, s: x.s, who: st.pairs[x.pi].map(nameOf).join(" & "), v: mx })) }];
  H.closingNow = false;
  hostSet({ ...st, phase: "results", res, rp, tot, cast, hist, log, names: namesMap() });
}
function standings(st) { return Object.entries(st.tot || {}).map(([p, s]) => ({ p, s })).sort((a, b) => b.s - a.s); }
function hostResults() {
  const st = H.state, sc = scen(H.meta, st.r), last = st.r >= H.meta.rounds - 1, hid = new Set(st.hid || []);
  const ranked = st.stmts.filter(x => !hid.has(x.pi)).map(x => ({ ...x, v: st.res[x.pi].votes })).sort((a, b) => b.v - a.v).slice(0, 3);
  const list = standings(st).slice(0, 10);
  app.innerHTML = `<div class="hostbar"><div><div class="kick">Round ${st.r + 1} of ${H.meta.rounds} · ${esc(sc.title)}</div><h2>Round results</h2></div>
    <p>${last ? "Last round done. Points are final." : "Next round: everyone gets a new partner."}</p></div>
    <div class="revgrid"><div><div class="skh">Class favorites</div>${ranked.map((x, i) => `<div class="scard win ${i === 0 && x.v ? "first" : ""}"><div class="sk"><b>${esc(x.k)}</b><span>${esc(styleName(x.s))}</span><em>${plural(x.v, "vote")}${i === 0 && x.v ? ` · +${P.top} bonus` : ""}</em></div>
        <p>${esc(x.t)}</p><div class="by">${esc(pairNames(st.pairs[x.pi]))}</div></div>`).join("") || "<p class='note'>No votes this round.</p>"}</div>
      <div><div class="skh">Leaderboard</div><div class="lbx">${list.map((x, i) => `<div><span class="r">${i + 1}</span><span class="n">${esc(nameOf(x.p))}</span><em>+${num((st.rp || {})[x.p] || 0)}</em><b>${num(x.s)}</b></div>`).join("")}</div></div></div>
    <div class="row" style="justify-content:center;margin-top:14px"><button class="btn main" id="nx">${last ? "Final results →" : `New partners for Round ${st.r + 2} →`}</button></div>`;
  $("#nx").onclick = () => last ? hostSet({ ...st, phase: "end" })
    : hostSet({ phase: "seat", r: st.r + 1, pairs: pairUp(active(), st.hist || {}), hist: st.hist, tot: st.tot, log: st.log, names: namesMap() });
  fit();
}
function hostEnd() {
  if (H.rq === "end") return; H.rq = "end";
  const st = H.state, list = standings(st), top = list.slice(0, 5), rk = []; let r = 0, prev = null;
  list.forEach((x, i) => { if (x.s !== prev) { r = i + 1; prev = x.s; } rk.push(r); });
  const slot = (x, i, cls) => x ? `<div class="pod ${cls}" data-i="${i}"><div class="who"><div class="medal">${rk[i]}</div><div class="nm">${esc(nameOf(x.p))}</div><div class="pts">${num(x.s)}</div></div><div class="block"><span>${ord(rk[i])}</span></div></div>` : `<div class="pod ${cls} empty"></div>`;
  document.body.classList.add("finale-on");
  app.style.zoom = "";
  app.innerHTML = `<div class="finale"><div class="rays"></div>
    <div class="fhead"><div class="kick">Boss Moves · Final</div><h2>Top 5 Bosses</h2></div>
    <div class="podium">${slot(top[1], 1, "p2")}${slot(top[0], 0, "p1")}${slot(top[2], 2, "p3")}</div>
    <div class="rest">${top.slice(3).map((x, k) => `<div class="row45" data-i="${k + 3}"><span class="r">${rk[k + 3]}</span><span class="n">${esc(nameOf(x.p))}</span><span class="s">${num(x.s)}</span></div>`).join("")}</div>
    <div class="fbar"><button class="btn" id="cr">Class results</button><button class="btn" id="erase">Erase game</button><button class="btn" id="done">Done</button></div></div>`;
  [4, 3, 2, 1, 0].filter(i => top[i]).forEach((i, n) => setTimeout(() => { const el = app.querySelector(`.finale [data-i="${i}"]`); if (el) el.classList.add("in"); beep(i === 0 ? 1047 : 600, .2); }, 600 + n * 1000));
  $("#cr").onclick = classResults; $("#erase").onclick = hostErase; $("#done").onclick = () => { cleanupHost(); home(); };
}
function classResults() {
  document.body.classList.remove("finale-on");
  const st = H.state, list = standings(st);
  app.innerHTML = `<div class="rep"><h2>Class results</h2><div class="endgrid">
    <div class="skills"><div class="skh">Picked the best style</div>${(st.log || []).map(x => { const sc = scen(H.meta, x.r), p = x.n ? x.best / x.n : 0;
      return `<div class="sk"><span><b>${esc(sc.title)}</b><br><small>${esc(styleName(sc.best))}</small></span><div class="bar"><i class="${p >= .7 ? "" : p >= .4 ? "mid" : "lo"}" style="width:${Math.max(4, p * 100)}%"></i></div><span class="v">${x.best}/${x.n}</span></div>`; }).join("")}
      <div class="skh" style="margin-top:10px">Top statement each round</div>${(st.log || []).map(x => x.top.slice(0, 1).map(t => `<div class="tipline"><b>${esc(scen(H.meta, x.r).title)}:</b> “${esc(t.t)}” <small>${esc(t.who)}</small></div>`).join("")).join("")}</div>
    <div class="skills"><div class="skh">Final standings</div><ol class="stand">${list.map(x => `<li><span>${esc(nameOf(x.p))}</span><em>${num(x.s)}</em></li>`).join("")}</ol></div></div>
    <div class="row" style="justify-content:center;margin-top:14px"><button class="btn main" id="pod">Back to Top 5</button><button class="btn" id="erase">Erase game</button></div></div>`;
  $("#pod").onclick = () => { H.rq = null; hostEnd(); }; $("#erase").onclick = hostErase;
  fit();
}
function cleanupHost() { stopTick(); if (H && H.off) H.off(); }
async function hostErase() { if (!H) return home(); cleanupHost(); try { await H.N.remove("games/" + H.code); } catch (e) {} H = null; home(); }
function qrSvg(text) {
  try { if (!window.qrcode) return ""; const q = qrcode(0, "M"); q.addData(text); q.make(); const n = q.getModuleCount(), m = 2; let d = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + m} ${r + m}h1v1h-1z`;
    return `<svg viewBox="0 0 ${n + 2 * m} ${n + 2 * m}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#111"/></svg>`; } catch (e) { return ""; }
}

/* ============================================================ STUDENT */
let ME = null;
const SKEY = "bossSession";
const saveSess = o => { try { localStorage.setItem(SKEY, JSON.stringify(o)); } catch (e) {} };
const loadSess = () => { try { return JSON.parse(localStorage.getItem(SKEY) || "null"); } catch (e) { return null; } };
async function joinForm() {
  const N = await net().catch(() => null); if (!N) return needSetup();
  const sv = loadSess(), qcode = (location.search.match(/[?&]code=(\d{4})/) || [])[1];
  app.innerHTML = `${hdr()}<div class="panel"><h2>Join the game</h2><p>${qcode ? "Code filled in. Type your first name." : "Type the code on the board and your first name."} Closed the page? Join again with the same name and you keep your points.</p>
    <input class="field code" id="cd" inputmode="numeric" maxlength="4" placeholder="0000" autocomplete="off" value="${qcode || (sv ? esc(sv.code) : "")}">
    <input class="field" id="nm" maxlength="20" placeholder="First name" autocomplete="given-name" autocapitalize="words" value="${sv && (!qcode || sv.code === qcode) ? esc(sv.name) : ""}">
    <div class="err" id="er"></div><div class="row" id="dup" hidden></div><button class="btn main" id="go">Join</button></div>`;
  (qcode && !$("#nm").value) ? $("#nm").focus() : $("#cd").focus();
  const go = async () => {
    const code = $("#cd").value.trim(), name = cleanName($("#nm").value);
    if (!/^\d{4}$/.test(code)) { $("#er").textContent = "The code is 4 numbers."; return; }
    if (!name) { $("#er").textContent = "Type your first name."; return; }
    $("#go").disabled = true; $("#dup").hidden = true; $("#go").hidden = false;
    const r = await enterGame(N, code, name);
    if (r && r.dup) {
      $("#er").textContent = `${r.name} is already in this game.`;
      $("#dup").hidden = false; $("#go").hidden = true;
      $("#dup").innerHTML = `<button class="btn main" id="me">That's me</button><button class="btn" id="other">I'm a different ${esc(r.name)}</button>`;
      $("#me").onclick = async () => { const e = await enterGame(N, code, r.name, r.pid); if (e) { $("#er").textContent = e; } };
      $("#other").onclick = () => { $("#dup").hidden = true; $("#go").hidden = false; $("#nm").value = r.name + " "; $("#nm").focus();
        $("#er").textContent = `Add your last initial so you two show up separately, like "${r.name} M."`; $("#go").disabled = false; };
      return;
    }
    if (r) { $("#er").textContent = r; $("#go").disabled = false; }
  };
  $("#go").onclick = go; $("#nm").onkeydown = e => { if (e.key === "Enter") go(); };
}
function cleanName(v) {
  const parts = String(v || "").trim().replace(/\s+/g, " ").split(" ").filter(Boolean).slice(0, 2);
  return parts.map((w, i) => { w = w.charAt(0).toUpperCase() + w.slice(1); return i === 1 && /^[A-Za-z]\.?$/.test(w) ? w.charAt(0) + "." : w; }).join(" ");
}
async function enterGame(N, code, name, forcePid) {
  try {
    const g = await N.get("games/" + code);
    if (!g || g.game !== GAME) return "No Boss Moves game with that code. Check the board.";
    const norm = x => String(x || "").trim().toLowerCase().replace(/[.\s]+/g, " ").trim(), sv = loadSess();
    let pid = forcePid || (sv && sv.code === code && norm(sv.name) === norm(name) ? sv.pid : null);
    if (!pid && g.players) { const hit = Object.entries(g.players).find(([, p]) => norm(p.name) === norm(name)); if (hit) return { dup: true, pid: hit[0], name: hit[1].name }; }
    const rec = pid && g.players && g.players[pid];
    if (rec) { name = rec.name || name; await N.update(`games/${code}/players/${pid}`, { out: false }); }
    else { pid = "p" + Math.random().toString(36).slice(2, 10); await N.set(`games/${code}/players/${pid}`, { name, joined: Date.now() }); }
    saveSess({ code, pid, name });
    if (ME && ME.off) ME.off();
    const { state, players, ...meta } = g;
    ME = { N, code, pid, name, meta, c: { ...((rec && rec.c) || {}) }, v: { ...((rec && rec.v) || {}) }, draft: {}, mates: {}, st: null, rq: null };
    $("#who").textContent = name; $("#who").hidden = false;
    ME.off = N.on(`games/${code}/state`, s => { if (!ME) return; if (!s) return gameGone(); ME.st = s; stuRender(); });
    return null;
  } catch (e) { return "Couldn't connect. Try again."; }
}
function gameGone() { stopTick(); stopMates(); if (ME && ME.off) ME.off(); ME = null; try { localStorage.removeItem(SKEY); } catch (e) {}
  app.innerHTML = `<div class="wait"><h2>The game has ended</h2><p>Your teacher closed this game.</p><button class="btn main" id="h">OK</button></div>`; $("#h").onclick = home; }
const myTotal = st => (st.tot && st.tot[ME.pid]) || 0;
const mateNames = st => { const g = st.pairs[pairOf(st, ME.pid)] || []; return g.filter(p => p !== ME.pid).map(p => (st.names || {})[p] || "your partner"); };
const andList = a => a.length <= 1 ? (a[0] || "") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
// Watch my partner's record during Make the Call so both iPads show the same locked-in pick
function stopMates() { if (ME && ME.mateOff) { ME.mateOff.forEach(f => f()); ME.mateOff = null; } }
function watchMates(st) {
  stopMates(); ME.mates = {};
  const g = st.pairs[pairOf(st, ME.pid)] || [];
  ME.mateOff = g.filter(p => p !== ME.pid).map(p => ME.N.on(`games/${ME.code}/players/${p}`, v => { if (!ME) return; ME.mates[p] = v || {}; if (ME.st && ME.st.phase === "call") callSync(); }));
}
function stuRender() {
  const M = ME, st = M.st, meta = M.meta; if (!st) return;
  const pi = pairOf(st, M.pid), inPlay = pi >= 0 || st.phase === "lobby" || st.phase === "end";
  const key = st.phase + "|" + st.r + "|" + (st.phase === "seat" ? JSON.stringify(st.pairs) : "") + (st.phase === "vote" ? JSON.stringify(st.hid || []) : "");
  if (key === M.rq) return; M.rq = key;
  if (st.phase !== "call") stopMates();
  if (st.phase === "lobby") { app.innerHTML = `<div class="wait"><h2>You're in, ${esc(M.name)}!</h2><p>Watch the board. Your teacher will pair everyone up.</p></div>`; return; }
  if (st.phase === "end") return stuEnd();
  if (!inPlay) { stopTick(); app.innerHTML = `<div class="wait"><h2>You're in, ${esc(M.name)}</h2><p>This round already started. You'll get a partner next round.</p><div class="big">${num(myTotal(st))}</div><p>points</p></div>`; return; }
  if (st.phase === "seat") {
    stopTick(); const mates = mateNames(st);
    app.innerHTML = `<div class="wait seat"><div class="kick">Round ${st.r + 1} of ${meta.rounds}</div><p>${mates.length ? "Your partner" + (mates.length > 1 ? "s" : "") : "This round"}</p>
      <div class="tablebig mate">${mates.length ? esc(andList(mates)) : "Solo"}</div><p>Find ${mates.length > 1 ? "them" : mates.length ? "them" : "your teacher"} and sit together.</p><div class="tot">${num(myTotal(st))} points so far</div></div>`;
    return;
  }
  if (st.phase === "call") return stuCall();
  if (st.phase === "reveal") return stuReveal();
  if (st.phase === "vote") return stuVote();
  if (st.phase === "results") return stuResults();
}
/* ---------- Make the Call ---------- */
function pairNow() { // the pair's current locked-in call: mine or my partner's, whichever is newest
  const r = ME.st.r; let best = ME.c[r] ? { ...ME.c[r], by: ME.pid } : null;
  Object.entries(ME.mates).forEach(([p, v]) => { const c = v && v.c && v.c[r]; if (c && c.s && (!best || (c.at || 0) > (best.at || 0))) best = { ...c, by: p }; });
  return best;
}
function stuCall() {
  const M = ME, st = M.st, r = st.r, sc = scen(M.meta, r), secs = M.meta.csecs;
  watchMates(st);
  const now = pairNow();
  M.draft = { s: now ? now.s : null, t: now ? now.t || "" : "", dirty: false };
  // keep the clock in step with the board even if this iPad joined late
  const elapsed = st.t0 ? Math.max(0, (Date.now() - st.t0) / 1000) : 0;
  M.callT0 = performance.now() - Math.min(elapsed, secs) * 1000;
  const mates = mateNames(st);
  app.innerHTML = `<div class="buyhead"><div class="kick">Round ${r + 1} · Make the Call</div>${timerHTML(secs)}</div>
    ${caseHTML(sc, { ask: false })}
    <div class="partner">Partner: <b>${esc(andList(mates) || "none this round")}</b>. Decide together. One of you locks it in and it shows on both iPads.</div>
    <div class="step"><span>1</span>Pick the leadership style that fits</div>
    <div class="sopts">${B.optsFor(sc, M.meta.seed, r).map(id => `<button class="sopt" data-s="${id}"><b>${esc(B.STYLES[id].name)}</b><small>${esc(B.STYLES[id].tag)}</small></button>`).join("")}</div>
    <div class="step"><span>2</span>Write the statement you'd give your team</div>
    <textarea class="stmt" id="tx" maxlength="${MAXLEN}" rows="4" placeholder="Talk to your team like their manager. What do they need to hear from you?"></textarea>
    <div class="buybar"><div class="lockline" id="ll"></div><span class="note" id="cc"></span><button class="btn main" id="lock">Lock in for our pair</button></div>`;
  const tx = $("#tx");
  tx.value = M.draft.t;
  app.querySelectorAll(".sopt").forEach(b => b.onclick = () => { M.draft.s = b.dataset.s; M.draft.dirty = true; drawPick(); });
  tx.oninput = () => { M.draft.t = tx.value; M.draft.dirty = true; drawPick(); };
  $("#lock").onclick = () => callSubmit();
  drawPick();
  startTimer(app, secs, M.callT0, () => { if (M.draft.dirty && M.draft.s) callSubmit(true); else { stopTick(); timeUp(); } });
}
function drawPick() {
  const M = ME, now = pairNow(), d = M.draft;
  app.querySelectorAll(".sopt").forEach(b => b.classList.toggle("on", b.dataset.s === d.s));
  const cc = $("#cc"); if (cc) cc.textContent = `${d.t.length}/${MAXLEN}`;
  const same = now && now.s === d.s && (now.t || "") === d.t;
  const who = now ? (now.by === M.pid ? "You" : ((M.st.names || {})[now.by] || "Your partner")) : "";
  const ll = $("#ll");
  if (ll) ll.innerHTML = now ? `<b class="ok">✓ Locked in</b> by ${esc(who)}: ${esc(styleName(now.s))}${same ? "" : " <em>· you have unsaved changes</em>"}` : `<b>Not locked in yet.</b> ${d.s ? "" : "Pick a style first."}`;
  const lk = $("#lock"); if (lk) { lk.disabled = !d.s || same; lk.textContent = same ? "Locked in ✓" : now ? "Update our call" : "Lock in for our pair"; }
}
function callSync() { // my partner locked something in: show it here too, unless I'm in the middle of editing
  const M = ME, now = pairNow(); if (!now) return drawPick();
  if (!M.draft.dirty) { M.draft.s = now.s; M.draft.t = now.t || ""; const tx = $("#tx"); if (tx && document.activeElement !== tx) tx.value = M.draft.t; }
  drawPick();
}
function callSubmit(auto) {
  const M = ME, r = M.st.r, d = M.draft; if (!d.s) return;
  const c = { s: d.s, t: d.t.trim().slice(0, MAXLEN), at: Date.now() };
  M.c[r] = c; d.dirty = false; d.t = c.t;
  M.N.update(`games/${M.code}/players/${M.pid}`, { ["c/" + r]: c }).catch(() => {});
  if (auto) { stopTick(); timeUp(); } else { beep(660, .08); drawPick(); }
}
function timeUp() {
  const now = pairNow();
  app.innerHTML = `<div class="wait"><h2>Time's up</h2><p>${now ? `Your pair went with <b>${esc(styleName(now.s))}</b>.` : "Your pair didn't lock in a style this round."}</p><p>Watch the board.</p></div>`;
}
function myPick(st) { const pi = pairOf(st, ME.pid); return pi >= 0 && st.picks ? st.picks[pi] : null; }
function stuReveal() {
  stopTick(); const M = ME, st = M.st, sc = scen(M.meta, st.r), pk = myPick(st), pts = pk ? B.stylePts(sc, pk.s) : 0;
  app.innerHTML = `<div class="wait"><div class="kick">Round ${st.r + 1} · ${esc(sc.title)}</div>
    <h2 style="color:${pts === P.best ? "var(--good)" : pts ? "#9A6B00" : "var(--bad)"}">${pts === P.best ? "Best call!" : pts ? "Good fit" : pk ? "Not the best fit" : "No pick"}</h2>
    <div class="big">+${pts}</div>
    <p>You picked <b>${esc(pk ? styleName(pk.s) : "nothing")}</b>. The best style here is <b>${esc(styleName(sc.best))}</b>.</p>
    <p>Watch the board for the Perfect Statement. Voting opens next.</p></div>`;
}
function stuVote() {
  stopTick(); const M = ME, st = M.st, r = st.r, sc = scen(M.meta, r), mine = pairOf(st, M.pid), hid = new Set(st.hid || []);
  const list = st.stmts.filter(x => !hid.has(x.pi)), secs = M.meta.vsecs;
  if (M.vT0 == null || M.vR !== r) { M.vT0 = performance.now(); M.vR = r; }
  const draw = () => {
    const v = M.v[r];
    app.innerHTML = `<div class="buyhead"><div class="kick">Round ${r + 1} · Vote</div>${timerHTML(secs)}</div>
      ${perfectHTML(sc, { small: true })}
      <div class="step"><span>★</span>Which class statement comes closest? Tap to vote. You can change it until time runs out.</div>
      <div class="vlist">${list.map(x => { const own = x.pi === mine;
        return `<button class="vopt ${v === x.pi ? "on" : ""}" data-pi="${x.pi}" ${own ? "disabled" : ""}><div class="sk"><b>${esc(x.k)}</b><span>${esc(styleName(x.s))}</span>${own ? "<em>Yours</em>" : v === x.pi ? "<em>✓ Your vote</em>" : ""}</div><p>${esc(x.t)}</p></button>`; }).join("") || "<p class='note'>No statements to vote on this round.</p>"}</div>`;
    app.querySelectorAll(".vopt:not([disabled])").forEach(b => b.onclick = () => { const pi = +b.dataset.pi; M.v[r] = pi; M.N.update(`games/${M.code}/players/${M.pid}`, { ["v/" + r]: pi }).catch(() => {}); beep(660, .06); draw(); });
    startTimer(app, secs, M.vT0, () => { app.querySelectorAll(".vopt").forEach(b => b.disabled = true); });
  };
  draw();
}
function stuResults() {
  stopTick(); const M = ME, st = M.st, pi = pairOf(st, M.pid), x = st.res && st.res[pi]; if (!x) return;
  const list = standings(st), rank = list.findIndex(y => y.p === M.pid) + 1, last = st.r >= M.meta.rounds - 1;
  app.innerHTML = `<div class="wait"><div class="kick">Round ${st.r + 1} results</div><h2>+${num((st.rp || {})[M.pid] || 0)} this round</h2>
    <div class="stats"><div class="stat"><b>+${x.sp}</b><span>Style</span></div><div class="stat"><b>+${x.votes * P.vote}</b><span>${plural(x.votes, "vote")}</span></div>
      ${x.top ? `<div class="stat"><b>+${P.top}</b><span>Top statement</span></div>` : ""}<div class="stat"><b>+${st.cast && st.cast[M.pid] ? P.cast : 0}</b><span>Voting</span></div></div>
    <p style="margin-top:14px"><b>${num(myTotal(st))}</b> points total · ${rank ? ord(rank) + " of " + list.length : ""}</p>
    <p>${last ? "That was the last round. Watch the board for the final results." : "Next round you get a new partner."}</p></div>`;
}
function stuEnd() {
  stopTick(); const M = ME, st = M.st, list = standings(st), i = list.findIndex(x => x.p === M.pid);
  app.innerHTML = `<div class="wait"><div class="kick">Boss Moves · Final</div><h2>${i >= 0 ? `You finished ${ord(i + 1)} of ${list.length}` : "Game over"}</h2>
    <div class="big">${num(myTotal(st))}</div><p>total points</p></div>`;
  try { localStorage.removeItem(SKEY); } catch (e) {}
}

home();
