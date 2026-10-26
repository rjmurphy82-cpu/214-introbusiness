/* Brand Crisis: live class simulation. Shared by the student page (iPads) and the teacher screen (projector).
   Each round: a crisis hits Strider Sneakers -> every student locks in one of 8 responses -> the teacher draws a random
   twist ("what happened next") -> the reveal shows what each response did. Trust, sales, and cash carry from round to round.
   Student devices only send their pick; scores are replayed from picks + twists, so every screen agrees.
   Storage: the same /api/live store as Ad Buy Live and Marketing Ladder (codes under ibl:). */
"use strict";
const K = window.CRISIS;
const $ = s => document.querySelector(s);
const app = $("#app");
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ROLE = window.BRL_ROLE || "student";
const MOCK = /[?&]mock=1/.test(location.search);
const GAME = "crisis";
const LET = "ABCDEFGH";
const m$ = n => { const a = Math.abs(n), s = n < 0 ? "−" : ""; return a >= 1e6 ? `${s}$${(a / 1e6).toFixed(1)}M` : a >= 1e3 ? `${s}$${Math.round(a / 1e3)}K` : `${s}$${Math.round(a)}`; };
const sgn = (n, suf = "") => (n > 0 ? "+" : n < 0 ? "−" : "±") + Math.abs(n) + suf;
const ord = n => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th");
function beep(f, d) { try { const c = beep.c || (beep.c = new (window.AudioContext || window.webkitAudioContext)()); const o = c.createOscillator(), g = c.createGain(); o.frequency.value = f; g.gain.value = .06; o.connect(g); g.connect(c.destination); const t = c.currentTime; g.gain.exponentialRampToValueAtTime(.0001, t + d); o.start(t); o.stop(t + d); } catch (e) {} }

/* ============================================================ NETWORK */
function mockNet() {
  const KEY = "crisisMock", bc = ("BroadcastChannel" in window) ? new BroadcastChannel(KEY) : null, subs = [];
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } };
  const write = t => { localStorage.setItem(KEY, JSON.stringify(t)); fire(); if (bc) bc.postMessage(1); };
  const at = (t, p) => p.split("/").filter(Boolean).reduce((o, k) => (o == null ? undefined : o[k]), t);
  const put = (t, p, v) => { const ks = p.split("/").filter(Boolean); let o = t; ks.slice(0, -1).forEach(k => { if (typeof o[k] !== "object" || o[k] === null) o[k] = {}; o = o[k]; }); if (v === null) delete o[ks[ks.length - 1]]; else o[ks[ks.length - 1]] = v; };
  const fire = () => { const t = read(); subs.forEach(s => { const v = JSON.stringify(at(t, s.p) ?? null); if (v !== s.last) { s.last = v; s.cb(JSON.parse(v)); } }); };
  if (bc) bc.onmessage = fire; window.addEventListener("storage", e => { if (e.key === KEY) fire(); });
  return { get: async p => at(read(), p) ?? null, set: async (p, v) => { const t = read(); put(t, p, v); write(t); },
    update: async (p, o) => { const t = read(); Object.entries(o).forEach(([k, v]) => put(t, p + "/" + k, v)); write(t); },
    remove: async p => { const t = read(); put(t, p, null); write(t); },
    on: (p, cb) => { const s = { p, cb, last: undefined }; subs.push(s); setTimeout(fire, 0); return () => { const i = subs.indexOf(s); if (i >= 0) subs.splice(i, 1); }; } };
}
async function vercelNet() {
  const call = async (op, path, v) => { const r = await fetch("/api/live", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op, path, v }) });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || r.status); return j; };
  try { const p = await call("ping"); if (!p.ok) return null; } catch (e) { return null; }
  return { get: async p => (await call("get", p)).v ?? null, set: (p, v) => call("set", p, v), update: (p, o) => call("update", p, o), remove: p => call("remove", p),
    on: (p, cb) => { let last, stop = false, t;
      const tick = async () => { if (stop) return; if (!document.hidden) { try { const v = (await call("get", p)).v ?? null, s = JSON.stringify(v); if (s !== last) { last = s; cb(v); } } catch (e) {} } if (!stop) t = setTimeout(tick, 1200); };
      tick(); return () => { stop = true; clearTimeout(t); }; } };
}
let NET = null;
async function net() { if (NET) return NET; NET = MOCK ? mockNet() : await vercelNet(); return NET; }

/* ============================================================ SHARED VIEWS */
let TICK = null;
function stopTick() { clearInterval(TICK); TICK = null; }
function startTimer(el, secs, t0, onEnd) {
  stopTick(); const bar = el.querySelector(".timer i"); let last = null;
  TICK = setInterval(() => { const left = Math.max(0, secs - (performance.now() - t0) / 1000), c = Math.ceil(left);
    if (bar) bar.style.transform = `scaleX(${left / secs})`; if (c !== last) { last = c; el.querySelectorAll(".secs").forEach(x => x.textContent = c); }
    const tm = el.querySelector(".timer"); if (tm) tm.classList.toggle("low", left <= 10);
    if (left <= 0) { stopTick(); onEnd && onEnd(); } }, 100);
}
const timerHTML = secs => `<div class="row tline"><div class="timer" style="flex:1"><i></i></div><span class="secs">${secs}</span></div>`;
function meters(b, prev) {
  const v = K.value(b), pv = prev ? K.value(prev) : null;
  const d = (a, c, f) => (prev ? `<em class="${a > c ? "up" : a < c ? "dn" : ""}">${f(a - c)}</em>` : "");
  return `<div class="meters">
    <div class="mt trust"><span>Trust</span><b>${Math.round(b.trust)}</b>${d(b.trust, prev && prev.trust, x => sgn(Math.round(x)))}<div class="tbar"><i style="width:${b.trust}%"></i></div></div>
    <div class="mt"><span>Weekly sales</span><b>${m$(b.sales)}</b>${d(b.sales, prev && prev.sales, x => (x >= 0 ? "+" : "") + m$(x))}</div>
    <div class="mt"><span>Crisis budget</span><b>${m$(b.cash)}</b>${d(b.cash, prev && prev.cash, x => (x >= 0 ? "+" : "") + m$(x))}</div>
    <div class="mt big"><span>Brand value</span><b>${m$(v)}</b>${d(v, pv, x => (x >= 0 ? "+" : "") + m$(x))}</div></div>`;
}
const effects = o => `<span class="fx"><i class="${o.tr > 0 ? "up" : o.tr < 0 ? "dn" : ""}">Trust ${sgn(o.tr)}</i><i class="${o.sa > 0 ? "up" : o.sa < 0 ? "dn" : ""}">Sales ${sgn(o.sa, "%")}</i><i>${o.cost ? "Costs " + m$(o.cost) : "Free"}</i></span>`;
function zoomApp() { app.style.zoom = ""; const R = document.documentElement; let lo = .5, hi = 2.2;
  for (let i = 0; i < 12; i++) { const m = (lo + hi) / 2; app.style.zoom = m.toFixed(3); (R.scrollHeight <= innerHeight + 1 && R.scrollWidth <= innerWidth + 1) ? lo = m : hi = m; }
  app.style.zoom = lo.toFixed(3); }
function fit() { if (ROLE !== "teacher") return; document.body.classList.add("wide"); requestAnimationFrame(zoomApp); }
window.addEventListener("resize", () => { if (ROLE === "teacher" && !document.body.classList.contains("finale-on")) { clearTimeout(fit.t); fit.t = setTimeout(zoomApp, 150); } });
const hdr = () => `<h1 class="title">Brand <span>Crisis.</span></h1>
  <p class="lede">${ROLE === "teacher"
    ? "Teacher screen for the projector. Students play in pairs, one iPad per team, and every team runs Strider Sneakers. Each crisis gives them 8 ways to respond; they lock in, you draw a random twist, and the reveal shows what each choice did. Trust, sales, and budget carry over, the highest brand value wins, and each game's top 3 teams can make the Hall of Fame."
    : "You and your partner are the marketing team for Strider Sneakers. When a crisis hits, talk it over, pick one of 8 responses, and lock it in before time runs out. Trust multiplies everything, so protect it, and watch your crisis budget."}</p>`;
function needSetup() {
  app.innerHTML = `${hdr()}<div class="panel"><h2>${ROLE === "teacher" ? "Class games need the database" : "The game isn't open yet"}</h2><p>${ROLE === "teacher" ? "Connect the Upstash for Redis database to this Vercel project, then redeploy (same setup as Ad Buy Live)." : "Wait for your teacher to start it, then reload."}</p><button class="btn main" id="b">Reload</button></div>`;
  $("#b").onclick = () => location.reload();
}
function home() { stopTick(); document.body.classList.remove("wide", "finale-on"); app.style.zoom = ""; $("#who").hidden = true; ROLE === "teacher" ? hostSetup() : ROLE === "board" ? boardPage() : joinForm(); }

/* ============================================================ HALL OF FAME (all-time leaderboard of winning teams) */
const MOCKB = "crisisBoardMock";
const Board = {
  async get() {
    if (MOCK) { try { return JSON.parse(localStorage.getItem(MOCKB) || "[]"); } catch (e) { return []; } }
    try { const r = await fetch("/api/crisis-board", { cache: "no-store" }); return (await r.json()).list || []; } catch (e) { return []; }
  },
  // The server re-scores the finished game itself from what's saved, so browsers can't send fake scores.
  async post(code, label, localTop) {
    if (MOCK) { const b = (await Board.get()).concat(localTop).sort((a, z) => z.value - a.value).slice(0, 100); localStorage.setItem(MOCKB, JSON.stringify(b)); return { list: b, added: localTop }; }
    try { const r = await fetch("/api/crisis-board", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, label }) }); return await r.json(); } catch (e) { return { error: "offline" }; }
  }
};
function boardHTML(list, crises, mark) {
  const counts = [...new Set(list.map(e => e.crises))].sort((a, b) => b - a);
  if (!counts.includes(crises) && counts.length) crises = counts[0];
  const rows = list.filter(e => e.crises === crises).slice(0, 20);
  return `<div class="hof"><div class="hofhead"><div><div class="kick">All classes · all time</div><h2>Hall of Fame</h2></div>
    ${counts.length > 1 ? `<div class="seg" id="hofc">${counts.map(n => `<button data-v="${n}" aria-pressed="${n === crises}">${n} crises</button>`).join("")}</div>` : ""}</div>
    ${rows.length ? `<ol class="hofl">${rows.map((e, i) => { const me = mark && mark(e);
      return `<li class="${i < 3 ? "m" + (i + 1) : ""} ${me ? "me" : ""}"><span class="rk">${i + 1}</span><span class="nm"><b>${esc(e.name)}</b><small>${esc([e.label, e.date].filter(Boolean).join(" · "))}${e.place === 1 ? " · won their game" : ""}</small></span><span class="v">${m$(e.value)}<small>Trust ${e.trust}</small></span>${me ? '<i class="new">NEW</i>' : ""}</li>`; }).join("")}</ol>`
      : `<p class="note">No winners yet. The top 3 teams from every finished game land here.</p>`}</div>`;
}
function wireBoard(el, list, mark) { const g = el.querySelector("#hofc"); if (g) g.onclick = e => { const b = e.target.closest("button"); if (!b) return; el.innerHTML = boardHTML(list, +b.dataset.v, mark); wireBoard(el, list, mark); }; }
async function boardPage() {
  app.innerHTML = `<p class="lede">The best brand values ever posted in Brand Crisis. The top 3 teams from every class game make the list.</p><div id="bd"><p class="note">Loading…</p></div>
    <p class="links"><a href="/brand-crisis/">Join a game</a> · <a href="/">All games</a></p>`;
  const list = await Board.get(), el = $("#bd"); el.innerHTML = boardHTML(list, 6); wireBoard(el, list);
}

/* ============================================================ HOST */
let H = null;
async function hostSetup() {
  const N = await net().catch(() => null); if (!N) return needSetup();
  const cfg = { ids: K.CRISES.map(c => c.id), secs: 60, label: "" };
  app.innerHTML = `${hdr()}<div class="panel wide-panel"><h2>Host a game</h2>
    <p>Crises (one per round, in this order). Tap to turn one off.</p>
    <div class="seg multi" id="cr">${K.CRISES.map(c => `<button data-v="${c.id}" aria-pressed="true"><b>${esc(c.title)}</b><small>${esc(c.story.split(". ")[0])}.</small></button>`).join("")}</div>
    <p>Time to decide:</p><div class="seg" id="sc"><button data-v="45">45 sec</button><button data-v="60" aria-pressed="true">60 sec</button><button data-v="90">90 sec</button></div>
    <p class="note" id="rc"></p>
    <p>Class name for the Hall of Fame (optional):</p><input class="field small" id="lb" maxlength="30" placeholder="Period 3">
    <div class="err" id="er"></div><button class="btn main" id="go">Create game</button></div>`;
  $("#lb").oninput = e => cfg.label = e.target.value.trim();
  const note = () => { const n = cfg.ids.length; $("#rc").textContent = n ? `${n} crises, about ${n * 3} to ${n * 4} minutes.` : "Pick at least one crisis."; $("#go").disabled = !n; };
  $("#cr").onclick = e => { const b = e.target.closest("button"); if (!b) return; b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true");
    cfg.ids = K.CRISES.map(c => c.id).filter(id => $(`#cr [data-v="${id}"]`).getAttribute("aria-pressed") === "true"); note(); };
  $("#sc").onclick = e => { const b = e.target.closest("button"); if (!b) return; [...$("#sc").children].forEach(x => x.setAttribute("aria-pressed", x === b)); cfg.secs = +b.dataset.v; };
  note();
  $("#go").onclick = async () => {
    $("#go").disabled = true;
    try {
      let code; for (let t = 0; t < 20; t++) { code = String(Math.floor(1000 + Math.random() * 9000)); if (!(await N.get("games/" + code))) break; }
      const meta = { created: Date.now(), game: GAME, ...cfg }, state = { phase: "lobby", tw: [] };
      await N.set("games/" + code, { ...meta, state });
      H = { N, code, meta, state, players: {} };
      H.off = N.on("games/" + code + "/players", v => { H.players = v || {}; hostRender(true); });
      hostRender();
    } catch (e) { $("#er").textContent = "Couldn't reach the class game database."; $("#go").disabled = false; }
  };
}
const active = () => Object.entries(H.players).filter(([, p]) => !p.out).map(([id]) => id);
const nameOf = pid => (H.players[pid] && H.players[pid].name) || "?";
const pickOf = (pid, r) => { const p = H.players[pid]; const x = p && p.p && p.p[r]; return x == null ? null : +x; };
function hostSet(state) { H.state = state; H.rq = null; H.N.set("games/" + H.code + "/state", state).catch(() => {}); hostRender(); }
function hostRender(fromPlayers) {
  const st = H.state;
  if (fromPlayers && !["lobby", "crisis"].includes(st.phase)) return;
  if (st.phase === "lobby") return hostLobby();
  if (st.phase === "crisis") return hostCrisis();
  if (st.phase === "twist") return hostTwist();
  if (st.phase === "reveal") return hostReveal();
  if (st.phase === "end") return hostEnd();
}
function hostLobby() {
  const ps = active(), url = location.origin + "/brand-crisis/?code=" + H.code;
  if (!H.qr) H.qr = qrSvg(url);
  app.innerHTML = `<div class="lobby"><div class="lobtop"><div class="lobleft"><div class="join">Scan the code, or open <b>Brand Crisis</b> on the Intro to Business site and enter</div>
    <div class="code">${H.code}</div><div class="url">${esc(url.replace(/^https?:\/\//, ""))}</div></div>${H.qr ? `<div class="qr">${H.qr}<span>Scan to join</span></div>` : ""}</div>
    <div class="count">${ps.length} team${ps.length === 1 ? "" : "s"} joined · one iPad per pair</div>
    <div class="names">${ps.map(id => `<span>${esc(nameOf(id))}</span>`).join("") || '<span style="opacity:.5">Waiting for players…</span>'}</div>
    <div class="row" style="justify-content:center"><button class="btn main" id="start" ${ps.length ? "" : "disabled"}>Start: first crisis</button><button class="btn" id="end">Cancel</button></div></div>`;
  $("#start").onclick = () => hostSet({ phase: "crisis", r: 0, tw: [] }); $("#end").onclick = hostErase;
  fit();
}
function hostCrisis() {
  const st = H.state, c = K.byId[H.meta.ids[st.r]], secs = H.meta.secs, ps = active(), locked = ps.filter(p => pickOf(p, st.r) != null).length;
  if (H.rq !== "c" + st.r) {
    H.rq = "c" + st.r; H.t0 = performance.now(); beep(220, .4);
    app.innerHTML = `<div class="alert"><span class="siren">⚠</span><div><div class="kick">Crisis ${st.r + 1} of ${H.meta.ids.length} · ${esc(K.BRAND.name)}</div><h2>${esc(c.title)}</h2></div><div class="clock"><div class="secs">${secs}</div><div class="count" id="cnt"></div></div></div>
      <p class="story">${esc(c.story)}</p>
      <div class="hopts">${c.opts.map((o, i) => `<div class="hopt"><span class="lt">${LET[i]}</span><span class="tx">${esc(o.t)}</span><span class="cost">${o.cost ? m$(o.cost) : "Free"}</span></div>`).join("")}</div>
      <div class="row" style="justify-content:space-between;margin-top:10px"><span class="note">No answer = you stayed quiet.</span><button class="btn" id="close">Close voting now</button></div>`;
    $("#close").onclick = () => hostClose();
    startTimer(app, secs + 2, H.t0, () => hostClose());
    fit();
  }
  const cnt = $("#cnt"); if (cnt) cnt.textContent = `${locked} of ${ps.length} locked in`;
  if (ps.length && locked >= ps.length && !H.closing) H.closing = setTimeout(() => { H.closing = null; if (H.state.phase === "crisis") hostClose(); }, 1500);
}
async function hostClose() {
  if (H.state.phase !== "crisis" || H.closingNow) return; H.closingNow = true; stopTick();
  try { H.players = (await H.N.get(`games/${H.code}/players`)) || H.players; } catch (e) {}
  const st = H.state, c = K.byId[H.meta.ids[st.r]], tw = st.tw.slice(); tw[st.r] = Math.floor(Math.random() * c.twists.length);
  H.closingNow = false;
  hostSet({ ...st, phase: "twist", tw });
}
function hostTwist() {
  const st = H.state, c = K.byId[H.meta.ids[st.r]], T = c.twists[st.tw[st.r]];
  app.innerHTML = `<div class="twistwrap"><div class="kick">Crisis ${st.r + 1} · ${esc(c.title)}</div><h2 class="what">What happened next…</h2>
    <div class="tcardx" id="tc"><div class="front">?</div><div class="back"><b>${esc(T.t)}</b><span>${esc(T.note)}</span></div></div>
    <div class="row" style="justify-content:center;margin-top:18px"><button class="btn main" id="nx">See the results →</button></div></div>`;
  setTimeout(() => { const el = $("#tc"); if (el) { el.classList.add("flip"); beep(660, .2); } }, 900);
  $("#nx").onclick = () => hostSet({ ...st, phase: "reveal" });
  fit();
}
function standings(r) {
  return active().map(p => { const picks = {}; for (let k = 0; k <= r; k++) picks[k] = pickOf(p, k);
    const now = K.run(H.meta.ids, picks, H.state.tw, r), prev = r > 0 ? K.run(H.meta.ids, picks, H.state.tw, r - 1).value : K.value(K.BRAND.start);
    return { p, v: now.value, prev, last: now.log[r] }; }).sort((a, b) => b.v - a.v);
}
function hostReveal() {
  const st = H.state, c = K.byId[H.meta.ids[st.r]], tw = st.tw[st.r], ps = active(), last = st.r >= H.meta.ids.length - 1;
  const counts = new Array(8).fill(0); ps.forEach(p => { const x = pickOf(p, st.r); counts[x == null ? K.SILENT(c) : x]++; });
  const best = K.bestFor(c, tw, K.BRAND.start), list = standings(st.r);
  const before = {}; [...list].sort((a, b) => b.prev - a.prev).forEach((x, i) => before[x.p] = i + 1);
  const ranks = {}; list.forEach((x, i) => ranks[x.p] = [i + 1, before[x.p]]);
  if (H.rk !== st.r) { H.rk = st.r; H.state = { ...st, ranks, n: list.length }; H.N.set("games/" + H.code + "/state", H.state).catch(() => {}); }
  const mx = Math.max(1, ...counts);
  app.innerHTML = `<div class="revgrid"><div>
      <div class="kick">Crisis ${st.r + 1} · ${esc(c.title)}</div><div class="twline"><b>Twist:</b> ${esc(c.twists[tw].t)}</div>
      <div class="ropts">${c.opts.map((o, i) => { const out = K.outcome(c, i, tw);
        return `<div class="ropt ${i === best ? "best" : ""}"><span class="lt">${LET[i]}</span><div class="mid"><span class="tx">${esc(o.t)}</span>${effects(out)}</div>
          <div class="votes"><div class="vb"><i style="width:${counts[i] / mx * 100}%"></i></div><b>${counts[i]}</b></div>${i === best ? '<span class="star">Best move</span>' : ""}</div>`; }).join("")}</div></div>
    <aside class="sb"><div class="sbh"><span>Brand value</span><small>${ps.length} teams</small></div>
      <div class="sbrows">${list.slice(0, 10).map((x, i) => { const mv = before[x.p] - (i + 1);
        return `<div class="sbr r${i + 1}"><span class="rk">${i + 1}</span><span class="nm"><b>${esc(nameOf(x.p))}</b>${mv > 0 ? `<i class="mv up">▲ ${mv}</i>` : mv < 0 ? `<i class="mv dn">▼ ${-mv}</i>` : ""}</span>
          <span class="sc"><b>${m$(x.v)}</b><em class="${x.v - x.prev >= 0 ? "" : "neg"}">${x.v - x.prev >= 0 ? "+" : ""}${m$(x.v - x.prev)}</em></span></div>`; }).join("")}</div>
      <button class="btn main" id="nx">${last ? "Final results" : "Next crisis"} →</button></aside></div>`;
  $("#nx").onclick = () => last ? hostSet({ ...H.state, phase: "end" }) : hostSet({ phase: "crisis", r: st.r + 1, tw: st.tw });
  fit();
}
function hostEnd() {
  if (H.rq === "end") return; H.rq = "end";
  const list = standings(H.meta.ids.length - 1), top = list.slice(0, 5);
  const slot = (x, i, cls) => x ? `<div class="pod ${cls}" data-i="${i}"><div class="who"><div class="medal">${i + 1}</div><div class="nm">${esc(nameOf(x.p))}</div><div class="pts">${m$(x.v)}</div></div><div class="block"><span>${ord(i + 1)}</span></div></div>` : `<div class="pod ${cls} empty"></div>`;
  document.body.classList.add("finale-on"); app.style.zoom = "";
  app.innerHTML = `<div class="finale"><div class="rays"></div><div class="fhead"><div class="kick">Brand Crisis · Final brand value</div><h2>Top 5</h2></div>
    <div class="podium">${slot(top[1], 1, "p2")}${slot(top[0], 0, "p1")}${slot(top[2], 2, "p3")}</div>
    <div class="rest">${top.slice(3).map((x, k) => `<div class="row45" data-i="${k + 3}"><span class="r">${k + 4}</span><span class="n">${esc(nameOf(x.p))}</span><span class="s">${m$(x.v)}</span></div>`).join("")}</div>
    <div class="fbar"><button class="btn" id="cr">Class results</button><button class="btn" id="hf">Hall of Fame</button><button class="btn" id="erase">Erase game</button><button class="btn" id="done">Done</button></div></div>`;
  [4, 3, 2, 1, 0].filter(i => top[i]).forEach((i, n) => setTimeout(() => { const el = app.querySelector(`.finale [data-i="${i}"]`); if (el) el.classList.add("in"); beep(i === 0 ? 1047 : 600, .2); }, 600 + n * 1000));
  $("#cr").onclick = classResults; $("#hf").onclick = hostBoard; $("#erase").onclick = hostErase; $("#done").onclick = () => { cleanupHost(); home(); };
  if (!H.posted) { // send this game's results to the Hall of Fame once
    H.posted = Board.post(H.code, H.meta.label, list.slice(0, 3).map((x, i) => ({ name: nameOf(x.p), value: Math.round(x.v), trust: Math.round(K.run(H.meta.ids, Object.fromEntries(H.meta.ids.map((_, r) => [r, pickOf(x.p, r)])), H.state.tw, H.meta.ids.length - 1).b.trust),
      crises: H.meta.ids.length, label: H.meta.label || "", date: new Date().toISOString().slice(0, 10), code: H.code, place: i + 1, of: list.length })));
  }
}
async function hostBoard() {
  document.body.classList.remove("finale-on");
  app.innerHTML = `<div id="bd"><p class="note">Loading the Hall of Fame…</p></div><div class="row" style="justify-content:center;margin-top:14px"><button class="btn main" id="pod">Back to Top 5</button><button class="btn" id="cr2">Class results</button></div>`;
  $("#pod").onclick = () => { H.rq = null; hostEnd(); }; $("#cr2").onclick = classResults;
  const res = await (H.posted || Promise.resolve({})), list = (res && res.list) || await Board.get(), el = $("#bd"); if (!el) return;
  const mark = e => e.code === H.code && String(e.date) === new Date().toISOString().slice(0, 10);
  el.innerHTML = boardHTML(list, H.meta.ids.length, mark) + (res && res.error ? `<p class="note">Couldn't post this game: ${esc(res.error)}</p>` : "");
  wireBoard(el, list, mark); fit();
}
function classResults() {
  document.body.classList.remove("finale-on");
  const st = H.state, ps = active(), list = standings(H.meta.ids.length - 1);
  const rows = H.meta.ids.map((id, r) => { const c = K.byId[id], counts = new Array(8).fill(0); ps.forEach(p => { const x = pickOf(p, r); counts[x == null ? K.SILENT(c) : x]++; });
    const pop = counts.indexOf(Math.max(...counts)), best = K.bestFor(c, st.tw[r], K.BRAND.start);
    return `<div class="crow"><b>${esc(c.title)}</b><span>Most picked: <b>${LET[pop]}</b> (${counts[pop]})</span><span class="${pop === best ? "ok" : ""}">Best move: <b>${LET[best]}</b></span><small>${esc(c.opts[best].t)}</small></div>`; }).join("");
  app.innerHTML = `<div class="rep"><h2>Class results</h2><div class="endgrid">
    <div class="skills"><div class="skh">Crisis by crisis</div>${rows}
      <p class="note">Talk about it: which responses cost little but kept trust? When did saying nothing work, and when did it blow up?</p></div>
    <div class="skills"><div class="skh">Final brand value</div><ol class="stand">${list.map(x => `<li><span>${esc(nameOf(x.p))}</span><em>${m$(x.v)}</em></li>`).join("")}</ol></div></div>
    <div class="row" style="justify-content:center;margin-top:14px"><button class="btn main" id="pod">Back to Top 5</button><button class="btn" id="hf2">Hall of Fame</button><button class="btn" id="erase">Erase game</button></div></div>`;
  $("#pod").onclick = () => { H.rq = null; hostEnd(); }; $("#hf2").onclick = hostBoard; $("#erase").onclick = hostErase;
  fit();
}
function cleanupHost() { stopTick(); if (H && H.off) H.off(); }
async function hostErase() { if (!H) return home(); cleanupHost(); try { await H.N.remove("games/" + H.code); } catch (e) {} H = null; home(); }
function qrSvg(text) {
  try { if (!window.qrcode) return ""; const q = qrcode(0, "M"); q.addData(text); q.make(); const n = q.getModuleCount(), m = 2; let d = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + m} ${r + m}h1v1h-1z`;
    return `<svg viewBox="0 0 ${n + 2 * m} ${n + 2 * m}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#111"/></svg>`; } catch (e) { return ""; }
}

/* ============================================================ STUDENT (iPad) */
let ME = null;
const SKEY = "crisisSession";
const saveSess = o => { try { localStorage.setItem(SKEY, JSON.stringify(o)); } catch (e) {} };
const loadSess = () => { try { return JSON.parse(localStorage.getItem(SKEY) || "null"); } catch (e) { return null; } };
function cleanName(v) {
  const parts = String(v || "").trim().replace(/\s+/g, " ").split(" ").filter(Boolean).slice(0, 2);
  return parts.map((w, i) => { w = w.charAt(0).toUpperCase() + w.slice(1); return i === 1 && /^[A-Za-z]\.?$/.test(w) ? w.charAt(0) + "." : w; }).join(" ");
}
async function joinForm() {
  const N = await net().catch(() => null); if (!N) return needSetup();
  const sv = loadSess(), qcode = (location.search.match(/[?&]code=(\d{4})/) || [])[1];
  const old = sv && (!qcode || sv.code === qcode) ? String(sv.name).split(" & ") : [];
  app.innerHTML = `${hdr()}<div class="panel"><h2>Join with your partner</h2><p>${qcode ? "Code filled in." : "Type the code on the board."} One iPad per team. Closed the page? Join again with the same two names and you keep your brand.</p>
    <input class="field code" id="cd" inputmode="numeric" maxlength="4" placeholder="0000" autocomplete="off" value="${qcode || (sv ? esc(sv.code) : "")}">
    <label class="lab">Your first name</label><input class="field" id="n1" maxlength="20" placeholder="First name" autocomplete="off" autocapitalize="words" value="${esc(old[0] || "")}">
    <label class="lab">Your partner's first name</label><input class="field" id="n2" maxlength="20" placeholder="Partner's first name" autocomplete="off" autocapitalize="words" value="${esc(old[1] || "")}">
    <div class="err" id="er"></div><div class="row" id="dup" hidden></div><button class="btn main" id="go">Join as a team</button>
    <p class="links"><a href="/brand-crisis/winners">See the Hall of Fame</a></p></div>`;
  (qcode && !$("#n1").value) ? $("#n1").focus() : $("#cd").focus();
  const go = async () => {
    const code = $("#cd").value.trim(), a = cleanName($("#n1").value), b = cleanName($("#n2").value);
    if (!/^\d{4}$/.test(code)) { $("#er").textContent = "The code is 4 numbers."; return; }
    if (!a) { $("#er").textContent = "Type your first name."; return; }
    if (!b && !$("#go").dataset.solo) { $("#er").textContent = "Type your partner's first name. Working alone? Tap Join again."; $("#go").dataset.solo = "1"; return; }
    const name = b ? `${a} & ${b}` : a;
    $("#go").disabled = true; $("#dup").hidden = true;
    const r = await enterGame(N, code, name);
    if (r && r.dup) {
      $("#er").textContent = `${r.name} is already in this game.`; $("#dup").hidden = false; $("#go").hidden = true;
      $("#dup").innerHTML = `<button class="btn main" id="me">That's us</button><button class="btn" id="other">We're a different team</button>`;
      $("#me").onclick = async () => { const e = await enterGame(N, code, r.name, r.pid); if (e) $("#er").textContent = e; };
      $("#other").onclick = () => { $("#dup").hidden = true; $("#go").hidden = false; $("#go").disabled = false; $("#n1").focus(); $("#er").textContent = `Add a last initial to one name, like "${a} M."`; };
      return;
    }
    if (r) { $("#er").textContent = r; $("#go").disabled = false; }
  };
  $("#go").onclick = go; $("#n2").onkeydown = e => { if (e.key === "Enter") go(); };
}
async function enterGame(N, code, name, forcePid) {
  try {
    const g = await N.get("games/" + code);
    if (!g || g.game !== GAME) return "No Brand Crisis game with that code. Check the board.";
    const norm = x => String(x || "").trim().toLowerCase().replace(/[.\s]+/g, " ").trim(), sv = loadSess();
    let pid = forcePid || (sv && sv.code === code && norm(sv.name) === norm(name) ? sv.pid : null);
    if (!pid && g.players) { const hit = Object.entries(g.players).find(([, p]) => norm(p.name) === norm(name)); if (hit) return { dup: true, pid: hit[0], name: hit[1].name }; }
    const rec = pid && g.players && g.players[pid];
    if (rec) { name = rec.name || name; await N.update(`games/${code}/players/${pid}`, { out: false }); }
    else { pid = "p" + Math.random().toString(36).slice(2, 10); await N.set(`games/${code}/players/${pid}`, { name, joined: Date.now() }); }
    saveSess({ code, pid, name });
    if (ME && ME.off) ME.off();
    const { state, players, ...meta } = g;
    ME = { N, code, pid, name, meta, p: { ...((rec && rec.p) || {}) }, sel: null, st: null, rq: null };
    $("#who").textContent = name; $("#who").hidden = false;
    ME.off = N.on(`games/${code}/state`, s => { if (!ME) return; if (!s) return gone(); ME.st = s; stuRender(); });
    return null;
  } catch (e) { return "Couldn't connect. Try again."; }
}
function gone() { stopTick(); if (ME && ME.off) ME.off(); ME = null; try { localStorage.removeItem(SKEY); } catch (e) {}
  app.innerHTML = `<div class="wait"><h2>The game has ended</h2><p>Your teacher closed this game.</p><button class="btn main" id="h">OK</button></div>`; $("#h").onclick = home; }
// my brand after round r (only rounds whose twist is known count)
function myRun(st, upto) { return upto < 0 ? { b: { ...K.BRAND.start }, log: [] } : K.run(ME.meta.ids, ME.p, st.tw, upto); }
function stuRender() {
  const M = ME, st = M.st; if (!st) return;
  const key = st.phase + "|" + st.r + "|" + (st.phase === "reveal" ? JSON.stringify(st.ranks && st.ranks[M.pid]) : "");
  if (key === M.rq) return; M.rq = key;
  if (st.phase === "lobby") { app.innerHTML = `<div class="wait"><h2>You're in, ${esc(M.name)}!</h2><p>You're the new marketing team for <b>${esc(K.BRAND.name)}</b>.</p><p>${esc(K.BRAND.about)}</p>${meters(K.BRAND.start)}<p>Watch the board. The first crisis is coming.</p></div>`; return; }
  if (st.phase === "crisis") return stuCrisis();
  if (st.phase === "twist") { stopTick(); const c = K.byId[M.meta.ids[st.r]], T = c.twists[st.tw[st.r]];
    app.innerHTML = `<div class="wait"><div class="kick">What happened next…</div><div class="tcardx flip small"><div class="back"><b>${esc(T.t)}</b><span>${esc(T.note)}</span></div></div><p>Watch the board for the results.</p></div>`; return; }
  if (st.phase === "reveal") return stuReveal();
  if (st.phase === "end") return stuEnd();
}
function stuCrisis() {
  const M = ME, st = M.st, r = st.r, c = K.byId[M.meta.ids[r]], b = myRun(st, r - 1).b, secs = M.meta.secs;
  if (M.selR !== r) { M.sel = M.p[r] != null ? +M.p[r] : null; M.selR = r; M.t0 = performance.now(); }
  const draw = () => {
    const locked = M.p[r] != null;
    app.innerHTML = `<div class="sthead"><div><div class="kick">Crisis ${r + 1} of ${M.meta.ids.length}</div><h2>${esc(c.title)}</h2></div>${timerHTML(secs)}</div>
      ${meters(b)}<p class="story">${esc(c.story)}</p>
      <div class="sopts">${c.opts.map((o, i) => { const broke = o.cost > b.cash;
        return `<button class="sopt ${M.sel === i ? "sel" : ""}" data-i="${i}" ${broke || locked ? "disabled" : ""}><span class="lt">${LET[i]}</span><span class="tx">${esc(o.t)}</span><span class="cost">${broke ? "Not enough budget" : o.cost ? m$(o.cost) : "Free"}</span></button>`; }).join("")}</div>
      <div class="lockbar"><span class="secs mini">${secs}</span>${locked ? `<b>Locked in: ${LET[M.p[r]]}</b><span class="msg">Waiting for the rest of the class…</span>` : `<span class="msg">${M.sel == null ? "Tap a response, then lock it in." : `You picked <b>${LET[M.sel]}</b>.`}</span><button class="btn main" id="lock" ${M.sel == null ? "disabled" : ""}>Lock in</button>`}</div>`;
    app.querySelectorAll(".sopt").forEach(el => el.onclick = () => { M.sel = +el.dataset.i; draw(); });
    const L = $("#lock"); if (L) L.onclick = () => { M.p[r] = M.sel; M.N.update(`games/${M.code}/players/${M.pid}`, { ["p/" + r]: M.sel }).catch(() => {}); beep(880, .08); draw(); };
    startTimer(app, secs, M.t0, () => { if (M.p[r] == null) { app.querySelector(".lockbar").innerHTML = `<b>Time's up.</b><span>No answer means you stayed quiet.</span>`; app.querySelectorAll(".sopt").forEach(x => x.disabled = true); } });
  };
  draw();
}
function stuReveal() {
  stopTick(); const M = ME, st = M.st, r = st.r, c = K.byId[M.meta.ids[r]], R = myRun(st, r), prev = myRun(st, r - 1).b, x = R.log[r];
  const best = K.bestFor(c, st.tw[r], K.BRAND.start), rk = st.ranks && st.ranks[M.pid];
  app.innerHTML = `<div class="rep stu"><div class="kick">Crisis ${r + 1} · ${esc(c.title)}</div>
    <h2>${x.quiet ? "You stayed quiet" : `You chose ${LET[x.i]}`}</h2><p class="pick">${esc(c.opts[x.i].t)}</p>${effects(x.out)}
    ${meters(R.b, prev)}
    ${x.i !== best ? `<div class="lesson"><b>Best move this time: ${LET[best]}</b>${esc(c.opts[best].t)}</div>` : `<div class="lesson good"><b>You made the best move.</b>Nice crisis management.</div>`}
    ${rk ? `<div class="place ${rk[0] <= 3 ? "podium-" + rk[0] : ""}"><span>You're</span><b>${ord(rk[0])}</b><span>of ${st.n}</span>${rk[1] - rk[0] > 0 ? `<i class="mv up">▲ ${rk[1] - rk[0]}</i>` : rk[1] - rk[0] < 0 ? `<i class="mv dn">▼ ${rk[0] - rk[1]}</i>` : ""}</div>` : ""}</div>`;
}
function stuEnd() {
  stopTick(); const M = ME, st = M.st, R = myRun(st, M.meta.ids.length - 1);
  app.innerHTML = `<div class="wait"><div class="kick">Brand Crisis · Final</div><h2>Your brand is worth ${m$(R.value)}</h2>${meters(R.b, K.BRAND.start)}
    <p>You started at ${m$(K.value(K.BRAND.start))}. Watch the board for the Top 5.</p><div id="hofme"></div>
    <p class="links"><a href="/brand-crisis/winners">See the Hall of Fame</a></p></div>`;
  try { localStorage.removeItem(SKEY); } catch (e) {}
  // did we make the Hall of Fame? (the teacher screen posts it a moment after the game ends)
  const code = M.code, name = M.name;
  [3000, 8000, 15000].forEach(ms => setTimeout(async () => {
    const el = $("#hofme"); if (!el || el.dataset.done) return;
    const list = await Board.get(), crises = M.meta.ids.length, same = list.filter(e => e.crises === crises);
    const i = same.findIndex(e => e.code === code && e.name === name);
    if (i >= 0 && i < 20) { el.dataset.done = 1; el.innerHTML = `<div class="place podium-1"><span>Hall of Fame</span><b>#${i + 1}</b><span>all time</span></div>`; beep(1047, .3); }
  }, ms));
}

home();
