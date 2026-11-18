/* Management Jeopardy (live): whole-unit review for the Management & Leadership unit.
   Students scan the QR code (or enter the code), type their first name, and the teacher screen sorts everyone into
   2 to 8 random teams. The teacher screen runs the board and does all the scoring; when a team answers wrong, the
   game spins and picks a random team that hasn't tried that clue yet to steal. Student devices show their team,
   the clue, and when their team is up.
   Storage: /api/live (codes under ibl:, game type "mjep"), so no new server function. Games last 4 hours. */
"use strict";
const ROLE = window.BRL_ROLE || "student";
const GAME = "mjep";
const MOCK = /[?&]mock=1/.test(location.search);
const PATH = "/mgmt-jeopardy/";
const $ = s => document.querySelector(s);
const app = $("#app");
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const money = n => (n < 0 ? "−$" : "$") + Math.abs(n).toLocaleString("en-US");
const ord = n => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th");

/* ============================================================ CLUES */
const CATS = [
  { name: "Levels & Skills", q: [
    ["This level of management includes CEOs, presidents, and owners.", "Top management"],
    ["Supervisors, shift leads, and team leaders who run daily operations work at this level.", "First-line management"],
    ["The management skill of knowing how to do the work itself.", "Technical skill"],
    ["Managers at this level, like department and regional managers, turn top-level goals into plans.", "Middle management"],
    ["Top managers need this skill most: seeing the big picture and planning for the future.", "Conceptual skill"] ]},
  { name: "P-O-L-C", q: [
    ["Maya sets a goal of 500 restorations this quarter. Which function is this?", "Planning"],
    ["Maya splits her restorers into an AM shift and a PM shift.", "Organizing"],
    ["Maya checks weekly totals and sends back 6 pairs that failed inspection.", "Controlling"],
    ["Maya holds a team meeting to explain why the new quality standard matters and cheers early wins.", "Leading"],
    ["Name all four functions of management, in order.", "Planning, Organizing, Leading, Controlling"] ]},
  { name: "Structure & Decisions", q: [
    ["The number of people who report directly to one manager.", "Span of control"],
    ["A company with few management layers, where employees decide without asking permission.", "Horizontal (flat) structure"],
    ["Groups of employees who plan, assign, and check their own work with no direct supervisor, like at Morning Star.", "Self-managed teams"],
    ["Reordering cleaner whenever stock drops below 10 bottles is this kind of decision.", "A programmed decision"],
    ["The sixth and final step of the decision-making process, which loops back to step 1.", "Review the results"] ]},
  { name: "Leadership Styles", q: [
    ["“What do you think? Let's vote before Friday.”", "Democratic"],
    ["“My call. Now.” This style is the best fit for emergencies like fire crews and the ER.", "Autocratic"],
    ["“Hit the goal, earn the bonus.”", "Transactional"],
    ["This hands-off style only works with highly trained, highly motivated experts.", "Laissez-faire"],
    ["This style puts people first, believing results will follow. It fits nonprofits, schools, and service teams.", "Servant leadership"] ]},
  { name: "Read the Person", q: [
    ["This situational style hands over both the work and the decisions.", "S4 Delegating"],
    ["A new employee who is excited but has no experience is at this development level.", "D1 Enthusiastic Beginner"],
    ["The style a manager should use with a D1 employee: tell what, how, and when, and check often.", "S1 Directing"],
    ["Tasha has some skill but low commitment after three pairs were sent back. Name her level AND the style she needs.", "D2 Disillusioned Learner, S2 Coaching"],
    ["According to The Ken Blanchard Companies, this percent of leaders use only ONE style, no matter the situation.", "50%"] ]},
  { name: "What Moves People", q: [
    ["Motivation that comes from inside, because the work itself feels worth doing.", "Intrinsic motivation"],
    ["The base level of Maslow's hierarchy: a paycheck that covers food and rent.", "Physiological needs"],
    ["In Herzberg's theory, pay, working conditions, and job security are examples of these.", "Hygiene factors"],
    ["This theory says people dislike work, so managers must watch them closely and use rules and punishment.", "Theory X"],
    ["Daniel Pink's three drivers of motivation.", "Autonomy, mastery, purpose"] ]},
];
const FINAL = { cat: "Organizational Culture",
  clue: "In the culture iceberg, this level sits deepest below the waterline: the unwritten rules people truly believe, like whether it's OK to make a mistake.",
  ans: "Shared assumptions (what people BELIEVE)" };
const VALUES = [100, 200, 300, 400, 500];
const COLORS = ["#C1102F", "#1F5FAD", "#9A6B00", "#23763A", "#6B3FA0", "#0E7C86", "#C2410C", "#475569"];
const clueOf = id => { const c = CATS[Math.floor(id / 5)], r = id % 5; return { cat: c.name, val: VALUES[r], text: c.q[r][0], ans: c.q[r][1] }; };

/* ============================================================ SOUND */
let AC = null;
function tone(seq) {
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); let t = AC.currentTime;
    seq.forEach(([f, d, ty]) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = ty || "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(.16, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d); t += d * .9; });
  } catch (e) {}
}
const sndRight = () => tone([[660, .12], [880, .25]]);
const sndWrong = () => tone([[180, .45, "sawtooth"]]);
const fanfare = () => tone([[523, .15], [659, .15], [784, .15], [1047, .5]]);

/* ============================================================ NETWORK (same as the other hub games) */
function mockNet() {
  const KEY = "mjepMock", bc = ("BroadcastChannel" in window) ? new BroadcastChannel(KEY) : null, subs = [];
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } };
  const write = t => { localStorage.setItem(KEY, JSON.stringify(t)); fire(); if (bc) bc.postMessage(1); };
  const at = (t, p) => p.split("/").filter(Boolean).reduce((o, k) => o == null ? undefined : o[k], t);
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
      const tick = async () => { if (stop) return;
        if (!document.hidden) { try { const v = (await call("get", p)).v ?? null, s = JSON.stringify(v); if (s !== last) { last = s; cb(v); } } catch (e) {} }
        if (!stop) t = setTimeout(tick, 1100); };
      tick(); return () => { stop = true; clearTimeout(t); }; } };
}
let NET = null;
async function net() { if (NET) return NET; NET = MOCK ? mockNet() : await vercelNet(); return NET; }
function needSetup() {
  app.innerHTML = `<div class="panel"><h2>${ROLE === "teacher" ? "Class games need a one-time setup" : "The class game isn't open yet"}</h2>
    <p>${ROLE === "teacher" ? "In Vercel, open this project, go to <b>Storage</b>, add <b>Upstash for Redis</b>, connect it, then redeploy." : "Wait for your teacher to start it, then reload this page."}</p>
    <button class="btn main" id="b">Reload</button></div>`; $("#b").onclick = () => location.reload();
}
function qrSvg(text) {
  try { if (!window.qrcode) return ""; const q = qrcode(0, "M"); q.addData(text); q.make(); const n = q.getModuleCount(), m = 2; let d = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + m} ${r + m}h1v1h-1z`;
    return `<svg viewBox="0 0 ${n + 2 * m} ${n + 2 * m}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#111"/></svg>`; } catch (e) { return ""; }
}
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ============================================================ HOST */
let H = null; // {N, code, st, players, off, qr, key}
const HKEY = "mjepHost";
function hostSave() { try { localStorage.setItem(HKEY, H.code); } catch (e) {} }
function push() { H.st.names = Object.fromEntries(Object.entries(H.players).map(([k, p]) => [k, p.name])); H.N.set(`games/${H.code}/state`, H.st).catch(() => {}); }
function setSt(patch) { Object.assign(H.st, patch); push(); hostRender(); }
const teamOf = pid => (H.st.teams || []).findIndex(t => t.m.includes(pid));
const pname = pid => (H.players[pid] && H.players[pid].name) || "?";

async function hostHome() {
  document.body.className = "host";
  const N = await net(); if (!N) return needSetup();
  let saved = null; try { saved = localStorage.getItem(HKEY); } catch (e) {}
  let old = null; if (saved) { try { old = await N.get("games/" + saved); } catch (e) {} }
  let nT = 4;
  app.innerHTML = `<div class="panel host-setup"><div class="kick">Management &amp; Leadership · Unit review</div><h2>Management Jeopardy</h2>
    <p>Students scan the QR code and type their first name. When everyone is in, the game sorts them into random teams. Wrong answers lose points, and the game picks a random team to steal.</p>
    <p class="lbl">Number of teams</p><div class="seg" id="nt">${[2, 3, 4, 5, 6, 7, 8].map(n => `<button data-v="${n}" aria-pressed="${n === nT}">${n}</button>`).join("")}</div>
    <div class="err" id="er"></div><button class="btn main" id="go">Create game</button>
    ${old && old.game === GAME ? `<button class="btn" id="res" style="margin-left:8px">Resume game ${esc(saved)}</button>` : ""}</div>`;
  $("#nt").onclick = e => { const b = e.target.closest("button"); if (!b) return; nT = +b.dataset.v; [...$("#nt").children].forEach(x => x.setAttribute("aria-pressed", x === b)); };
  $("#go").onclick = async () => {
    $("#go").disabled = true;
    try {
      let code; for (let t = 0; t < 20; t++) { code = String(Math.floor(1000 + Math.random() * 9000)); if (!(await N.get("games/" + code))) break; }
      const cols = shuffle([0, 1, 2, 3, 4, 5]).slice(0, 2), dd = cols.map(c => c * 5 + 2 + Math.floor(Math.random() * 3));
      const st = { phase: "lobby", nT, teams: [], used: [], dd, clue: null, final: null };
      await N.set("games/" + code, { created: Date.now(), game: GAME, state: st });
      startHost(N, code, st);
    } catch (e) { $("#er").textContent = "Couldn't reach the live database."; $("#go").disabled = false; }
  };
  if ($("#res")) $("#res").onclick = () => startHost(N, saved, old.state);
}
function startHost(N, code, st) {
  H = { N, code, st, players: {}, qr: null };
  hostSave();
  H.off = N.on(`games/${code}/players`, v => {
    H.players = v || {};
    // late joiners go to the smallest team once teams exist
    if (H.st.teams && H.st.teams.length && H.st.phase !== "lobby") {
      let changed = false;
      Object.keys(H.players).forEach(pid => { if (teamOf(pid) < 0) { const t = H.st.teams.reduce((a, b) => (b.m.length < a.m.length ? b : a)); t.m.push(pid); changed = true; } });
      if (changed) push();
    }
    if (!H.busy) hostRender();
  });
  hostRender();
}
function makeTeams() {
  const ids = shuffle(Object.keys(H.players)), n = H.st.nT;
  const teams = Array.from({ length: n }, (_, i) => ({ name: "Team " + (i + 1), score: 0, m: [] }));
  ids.forEach((pid, i) => teams[i % n].m.push(pid));
  setSt({ phase: "teams", teams });
}

function hostRender() {
  const st = H.st;
  document.body.className = "host" + (st.phase === "lobby" || st.phase === "teams" ? "" : " board-on");
  if (st.phase === "lobby") return hostLobby();
  if (st.phase === "teams") return hostTeams();
  if (st.phase === "end") return hostEnd();
  if (st.phase === "final") return; // final screens draw themselves
  if (st.phase === "clue" || st.phase === "dd") return; // clue screens draw themselves
  hostBoard();
}
function hostLobby() {
  const ps = Object.values(H.players);
  const url = location.origin + PATH + "?code=" + H.code;
  if (!H.qr) H.qr = qrSvg(url);
  app.innerHTML = `<div class="lobby"><div class="lobtop"><div class="lobleft"><div class="join">Scan the code, or go to <b>Management Jeopardy</b> on the Intro to Business site and enter</div>
    <div class="code">${H.code}</div><div class="url">${esc(url.replace(/^https?:\/\//, ""))}</div></div>
    ${H.qr ? `<div class="qr" aria-label="QR code to join">${H.qr}<span>Scan to join</span></div>` : ""}</div>
    <div class="count">${ps.length} player${ps.length === 1 ? "" : "s"} joined · ${H.st.nT} teams</div>
    <div class="names">${ps.map(p => `<span>${esc(p.name)}</span>`).join("") || '<span style="opacity:.5">Waiting for players…</span>'}</div>
    <button class="btn main" id="mk" ${ps.length >= 2 ? "" : "disabled"}>Make random teams</button> <button class="btn" id="end">Cancel</button></div>`;
  $("#mk").onclick = makeTeams; $("#end").onclick = hostErase;
}
function hostTeams() {
  const st = H.st, url = location.origin + PATH + "?code=" + H.code;
  app.innerHTML = `<div class="teams-head"><h2>Your teams</h2><div class="minijoin">${H.qr ? `<div class="qr mini">${H.qr}</div>` : ""}<div>Late? Join with code <b>${H.code}</b><br><span>You'll be added to the smallest team.</span></div></div></div>
    <div class="tgrid">${st.teams.map((t, i) => `<div class="tcard" style="--tc:${COLORS[i]}"><div class="tn" contenteditable="true" spellcheck="false" data-i="${i}">${esc(t.name)}</div>
      <div class="tm">${t.m.map(p => `<span>${esc(pname(p))}</span>`).join("") || "<em>No one yet</em>"}</div></div>`).join("")}</div>
    <div class="ctr"><button class="btn" id="re">Reshuffle</button> <button class="btn main" id="go">Start the board</button> <button class="btn" id="back">Back to lobby</button></div>`;
  app.querySelectorAll(".tn").forEach(x => x.onblur = () => { st.teams[+x.dataset.i].name = x.textContent.trim() || "Team " + (+x.dataset.i + 1); push(); });
  $("#re").onclick = makeTeams; $("#go").onclick = () => setSt({ phase: "board" }); $("#back").onclick = () => setSt({ phase: "lobby", teams: [] });
}
function scoresHTML() {
  const top = Math.max(...H.st.teams.map(t => t.score));
  return `<div class="scores">${H.st.teams.map((t, i) => `<div class="sc ${t.score === top && top > 0 ? "lead" : ""}" style="--tc:${COLORS[i]}">
    <div class="nm">${esc(t.name)}</div><div class="pt ${t.score < 0 ? "neg" : ""}">${money(t.score)}</div>
    <div class="adj"><button data-i="${i}" data-d="-100">−100</button><button data-i="${i}" data-d="100">+100</button></div></div>`).join("")}</div>`;
}
function wireScores() {
  app.querySelectorAll(".scores .adj button").forEach(x => x.onclick = () => { H.st.teams[+x.dataset.i].score += +x.dataset.d; push(); hostRender(); });
}
function hostBoard() {
  const st = H.st;
  let h = CATS.map(c => `<div class="cat">${esc(c.name)}</div>`).join("");
  VALUES.forEach((v, r) => CATS.forEach((c, ci) => { const id = ci * 5 + r; h += `<button class="tile" data-id="${id}" ${st.used.includes(id) ? "disabled" : ""}>$${v}</button>`; }));
  app.innerHTML = `<div class="bar"><span class="code-sm">Code <b>${H.code}</b></span><span class="sp"></span>
      <button class="btn" id="tm">Teams</button><button class="btn" id="fj">Final Jeopardy</button><button class="btn" id="fs">Full screen</button><button class="btn" id="end">End game</button></div>
    <div class="board">${h}</div>${scoresHTML()}`;
  app.querySelectorAll(".tile").forEach(t => t.onclick = () => openClue(+t.dataset.id));
  wireScores();
  $("#tm").onclick = () => setSt({ phase: "teams" });
  $("#fj").onclick = finalJ;
  $("#fs").onclick = () => { try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {}); } catch (e) {} };
  $("#end").onclick = () => setSt({ phase: "end" });
  if (st.used.length === 30 && !st.final) setTimeout(finalJ, 400);
}

/* ----- a clue ----- */
let keyFn = null;
document.addEventListener("keydown", e => { if (keyFn && !/INPUT|SELECT/.test(e.target.tagName) && !e.target.isContentEditable) keyFn(e); });
function clueShell(c, tag) {
  app.innerHTML = `<div class="clue-screen"><div class="tag">${tag}</div><div class="clue">${esc(c.text)}</div><div class="ans" id="ans"></div><div id="ctl"></div></div>`;
}
function openClue(id) {
  const st = H.st, c = clueOf(id);
  if (st.dd.includes(id)) return dailyDouble(id, c);
  const tried = [];
  st.phase = "clue"; st.clue = { id, cat: c.cat, val: c.val, text: c.text, ans: null, up: -1, steal: false, tried }; push();
  document.body.className = "host board-on";
  clueShell(c, `${esc(c.cat)} · $${c.val}`);
  const back = () => { keyFn = null; st.phase = "board"; st.clue = null; push(); hostRender(); };
  const finish = () => { keyFn = null; if (!st.used.includes(id)) st.used.push(id); st.phase = "board"; st.clue = null; push(); hostRender(); };
  const showAns = () => {
    $("#ans").textContent = c.ans; st.clue.ans = c.ans; st.clue.up = -1; push();
    $("#ctl").innerHTML = `<div class="row"><button class="btn main" id="done">Back to board</button></div>`;
    $("#done").onclick = finish; keyFn = e => { if (e.key === "Escape" || e.key === "Enter" || e.key === " ") { e.preventDefault(); finish(); } };
  };
  const chooseFirst = () => {
    $("#ctl").innerHTML = `<div class="ask">Who buzzed in first?</div>
      <div class="row">${st.teams.map((t, i) => `<button class="pickT" style="--tc:${COLORS[i]}" data-i="${i}">${esc(t.name)}</button>`).join("")}</div>
      <div class="row"><button class="btn main" id="rnd">Random team</button><button class="btn" id="skip">Nobody, show answer</button><button class="btn" id="bk">Back to board</button></div>`;
    app.querySelectorAll(".pickT").forEach(x => x.onclick = () => answering(+x.dataset.i, false));
    $("#rnd").onclick = () => spinTo(st.teams.map((_, i) => i), false);
    $("#skip").onclick = showAns; $("#bk").onclick = back;
    keyFn = e => { if (e.key === "Escape") back(); };
  };
  const spinTo = (pool, isSteal) => {
    keyFn = null; const pick = pool[Math.floor(Math.random() * pool.length)];
    $("#ctl").innerHTML = `${isSteal ? `<div class="steal">Steal chance</div>` : ""}<div class="now spin" id="spinner"></div>`;
    let n = 0; const steps = 14;
    const tick = () => {
      const i = n < steps ? pool[Math.floor(Math.random() * pool.length)] : pick;
      const el = $("#spinner"); if (!el) return;
      el.innerHTML = `<span style="color:${COLORS[i]}">${esc(st.teams[i].name)}</span>`;
      tone([[n < steps ? 520 + (n % 3) * 80 : 990, .06]]);
      if (n++ < steps) setTimeout(tick, 60 + n * 9); else setTimeout(() => answering(pick, isSteal), 450);
    };
    tick();
  };
  const answering = (i, isSteal) => {
    const t = st.teams[i]; st.clue.up = i; st.clue.steal = isSteal; push();
    $("#ctl").innerHTML = `${isSteal ? `<div class="steal">Steal chance</div>` : ""}<div class="now"><span style="color:${COLORS[i]}">${esc(t.name)}</span>, your answer?</div>
      <div class="row"><button class="btn ok" id="rt">Right (+${c.val})</button><button class="btn no" id="wr">Wrong (−${c.val})</button><button class="btn" id="sa">Show answer</button></div>
      <div class="hint">R = right · W = wrong</div>`;
    const right = () => { t.score += c.val; sndRight(); showAns(); };
    const wrong = () => {
      t.score -= c.val; sndWrong(); tried.push(i); push();
      const pool = st.teams.map((_, k) => k).filter(k => !tried.includes(k));
      if (!pool.length) return showAns();
      setTimeout(() => spinTo(pool, true), 600);
    };
    $("#rt").onclick = right; $("#wr").onclick = wrong; $("#sa").onclick = showAns;
    keyFn = e => { const k = e.key.toLowerCase(); if (k === "r") right(); else if (k === "w") wrong(); };
  };
  chooseFirst();
}
function dailyDouble(id, c) {
  const st = H.st; st.phase = "dd"; st.clue = { id, cat: c.cat, val: c.val, text: null, ans: null, up: -1, dd: true }; push();
  document.body.className = "host board-on";
  tone([[523, .1], [659, .1], [784, .1], [1047, .35]]);
  const maxW = t => Math.max(t.score, 500);
  app.innerHTML = `<div class="clue-screen"><div class="ddbig">Daily Double!</div><div class="tag">${esc(c.cat)}</div>
    <div class="row wager">Team <select id="ddT">${st.teams.map((t, i) => `<option value="${i}">${esc(t.name)}</option>`).join("")}</select>
    wagers $ <input id="ddW" type="number" min="0" step="100" value="${c.val}"></div><div class="hint" id="mx"></div>
    <div class="row"><button class="btn main" id="rnd">Pick a random team</button><button class="btn main" id="go">Show the clue</button></div></div>`;
  const upd = () => { $("#mx").textContent = `Max wager: ${money(maxW(st.teams[+$("#ddT").value]))} (your score, or $500 if you have less)`; };
  $("#ddT").onchange = upd; upd();
  $("#rnd").onclick = () => { $("#ddT").value = String(Math.floor(Math.random() * st.teams.length)); upd(); tone([[990, .1]]); };
  $("#go").onclick = () => {
    const ti = +$("#ddT").value, t = st.teams[ti]; let w = Math.round(+$("#ddW").value || 0); w = Math.max(0, Math.min(w, maxW(t)));
    st.clue.text = c.text; st.clue.up = ti; st.clue.wager = w; push();
    clueShell(c, `Daily Double · ${esc(t.name)} wagers ${money(w)}`);
    $("#ctl").innerHTML = `<div class="row"><button class="btn ok" id="r">Right (+${money(w)})</button><button class="btn no" id="wr">Wrong (−${money(w)})</button></div>`;
    const fin = s => {
      t.score += s * w; s > 0 ? sndRight() : sndWrong(); $("#ans").textContent = c.ans; st.clue.ans = c.ans; st.clue.up = -1; push();
      $("#ctl").innerHTML = `<div class="row"><button class="btn main" id="done">Back to board</button></div>`;
      $("#done").onclick = () => { st.used.push(id); st.phase = "board"; st.clue = null; push(); hostRender(); };
    };
    $("#r").onclick = () => fin(1); $("#wr").onclick = () => fin(-1);
  };
}

/* ----- final jeopardy ----- */
function finalJ() {
  const st = H.st; keyFn = null;
  st.phase = "final"; st.final = { step: "wager", cat: FINAL.cat }; push();
  document.body.className = "host board-on";
  app.innerHTML = `<div class="clue-screen"><div class="tag">Final Jeopardy</div><div class="clue fcat">${esc(FINAL.cat)}</div>
    <p class="hint big">Each team agrees on a secret wager (up to its score, or $0 if at or below zero). Enter the wagers.</p>
    <div class="fw">${st.teams.map((t, i) => `<div class="fwrow"><span style="color:${COLORS[i]}">${esc(t.name)}</span><span>${money(t.score)}</span><span>$ <input class="fwi" data-i="${i}" type="number" min="0" step="100" value="0"></span></div>`).join("")}</div>
    <div class="row"><button class="btn main" id="go">Show the clue</button><button class="btn" id="bk">Back to board</button></div></div>`;
  $("#bk").onclick = () => { st.phase = "board"; push(); hostRender(); };
  $("#go").onclick = () => {
    const w = [...app.querySelectorAll(".fwi")].map(x => { const t = st.teams[+x.dataset.i]; return Math.max(0, Math.min(Math.round(+x.value || 0), Math.max(t.score, 0))); });
    st.final = { step: "clue", cat: FINAL.cat, text: FINAL.clue }; push();
    app.innerHTML = `<div class="clue-screen"><div class="tag">Final Jeopardy · ${esc(FINAL.cat)}</div><div class="clue">${esc(FINAL.clue)}</div>
      <div class="timer" id="tm"></div><div class="ans" id="ans"></div>
      <div id="ctl"><div class="row"><button class="btn main" id="clock">Start 30-second clock</button><button class="btn" id="show">Show answer</button></div></div></div>`;
    let iv = null;
    $("#clock").onclick = () => { let s = 30; $("#tm").textContent = s; clearInterval(iv); iv = setInterval(() => { s--; $("#tm").textContent = s; if (s <= 0) { clearInterval(iv); tone([[440, .2], [440, .2], [330, .6]]); } }, 1000); };
    $("#show").onclick = () => {
      clearInterval(iv); $("#tm").textContent = ""; $("#ans").textContent = FINAL.ans; st.final.ans = FINAL.ans; push();
      const marks = {};
      $("#ctl").innerHTML = `<div class="fw">${st.teams.map((t, i) => `<div class="fwrow"><span style="color:${COLORS[i]}">${esc(t.name)}</span><span>wager ${money(w[i])}</span>
        <span><button class="btn ok" data-i="${i}" data-s="1">Right</button> <button class="btn no" data-i="${i}" data-s="-1">Wrong</button></span></div>`).join("")}</div>
        <div class="row"><button class="btn main" id="fin">Show the winner</button></div>`;
      app.querySelectorAll("[data-s]").forEach(x => x.onclick = () => { marks[x.dataset.i] = +x.dataset.s; x.parentNode.querySelectorAll("button").forEach(b => b.style.opacity = b === x ? 1 : .3); });
      $("#fin").onclick = () => { st.teams.forEach((t, i) => { t.score += (marks[i] || 0) * w[i]; }); setSt({ phase: "end" }); };
    };
  };
}
function hostEnd() {
  const st = H.st; fanfare();
  const order = st.teams.map((t, i) => ({ ...t, i })).sort((a, b) => b.score - a.score);
  const top = order[0].score, win = order.filter(t => t.score === top);
  app.innerHTML = `<div class="clue-screen"><div class="tag">Final scores</div><div class="ddbig win">${esc(win.map(t => t.name).join(" & "))} ${win.length > 1 ? "tie!" : "wins!"}</div>
    <div class="fw">${order.map((t, k) => `<div class="fwrow res"><span>${ord(k + 1)}</span><span style="color:${COLORS[t.i]}">${esc(t.name)}</span><span>${money(t.score)}</span></div>`).join("")}</div>
    <div class="row"><button class="btn" id="bk">Back to board</button><button class="btn" id="er">Erase game</button></div></div>`;
  $("#bk").onclick = () => setSt({ phase: "board" }); $("#er").onclick = hostErase;
}
async function hostErase() { if (!H) return hostHome(); if (H.off) H.off(); try { await H.N.remove("games/" + H.code); } catch (e) {} try { localStorage.removeItem(HKEY); } catch (e) {} H = null; hostHome(); }

/* ============================================================ STUDENT */
let ME = null;
const SKEY = "mjepSession";
const saveSess = o => { try { localStorage.setItem(SKEY, JSON.stringify(o)); } catch (e) {} };
const loadSess = () => { try { return JSON.parse(localStorage.getItem(SKEY) || "null"); } catch (e) { return null; } };
async function joinForm(msg) {
  const N = await net(); if (!N) return needSetup();
  const sv = loadSess(), qcode = (location.search.match(/[?&]code=(\d{4})/) || [])[1];
  app.innerHTML = `<div class="panel"><div class="kick">Management &amp; Leadership · Unit review</div><h2>Management Jeopardy</h2>
    <p>${qcode ? "Code filled in. Type your first name and last initial." : "Type the code on the board and your first name and last initial."} Your teacher will put you on a random team.</p>
    <input class="field code" id="cd" inputmode="numeric" maxlength="4" placeholder="0000" autocomplete="off" value="${qcode || (sv ? esc(sv.code) : "")}">
    <input class="field" id="nm" maxlength="24" placeholder="Jordan M." autocomplete="off" value="${sv && (!qcode || sv.code === qcode) ? esc(sv.name) : ""}">
    <div class="err" id="er">${msg ? esc(msg) : ""}</div><button class="btn main" id="go">Join</button></div>`;
  (qcode && !$("#nm").value) ? $("#nm").focus() : $("#cd").focus();
  const go = async () => {
    const code = $("#cd").value.trim(), name = $("#nm").value.trim();
    if (!/^\d{4}$/.test(code)) { $("#er").textContent = "The code is 4 numbers."; return; }
    if (!name) { $("#er").textContent = "Type your name."; return; }
    $("#go").disabled = true;
    const err = await enterGame(N, code, name); if (err) { $("#er").textContent = err; $("#go").disabled = false; }
  };
  $("#go").onclick = go; $("#nm").onkeydown = e => { if (e.key === "Enter") go(); };
}
async function enterGame(N, code, name) {
  try {
    const g = await N.get("games/" + code);
    if (!g || g.game !== GAME) return "No game with that code. Check the board.";
    const sv = loadSess(), norm = x => String(x || "").trim().toLowerCase().replace(/\s+/g, " ");
    let pid = sv && sv.code === code && norm(sv.name) === norm(name) ? sv.pid : null;
    if (!pid && g.players) { const hit = Object.entries(g.players).find(([, p]) => norm(p.name) === norm(name)); if (hit) pid = hit[0]; }
    if (!pid) { pid = "p" + Math.random().toString(36).slice(2, 10); await N.set(`games/${code}/players/${pid}`, { name, joined: Date.now() }); }
    saveSess({ code, pid, name });
    if (ME && ME.off) ME.off();
    ME = { N, code, pid, name, st: null };
    $("#who").textContent = name; $("#who").hidden = false;
    ME.off = N.on(`games/${code}/state`, st => { if (!ME) return; if (!st) { gone(); return; } ME.st = st; joinRender(); });
    return null;
  } catch (e) { return "Couldn't connect. Try again."; }
}
function gone() { if (ME && ME.off) ME.off(); ME = null; try { localStorage.removeItem(SKEY); } catch (e) {}
  app.innerHTML = `<div class="wait"><h2>The game has ended</h2><p>Your teacher closed this game.</p><button class="btn main" id="h">OK</button></div>`; $("#h").onclick = () => joinForm(); }
let lastUp = null;
function joinRender() {
  const st = ME.st, ti = (st.teams || []).findIndex(t => t.m.includes(ME.pid)), t = st.teams && st.teams[ti];
  document.body.className = "stu";
  if (st.phase === "lobby" || ti < 0) {
    app.innerHTML = `<div class="wait"><h2>You're in, ${esc(ME.name)}!</h2><p>Look at the board. Your teacher is about to make random teams.</p><div class="dots"><i></i><i></i><i></i></div></div>`; return;
  }
  const col = COLORS[ti], mates = t.m.filter(p => p !== ME.pid);
  const order = st.teams.map((x, i) => ({ s: x.score, i })).sort((a, b) => b.s - a.s), place = order.findIndex(o => o.i === ti) + 1;
  const card = `<div class="myteam" style="--tc:${col}"><div class="lbl">Your team</div><div class="nm">${esc(t.name)}</div>
    <div class="pt">${money(t.score)} <small>${ord(place)} of ${st.teams.length}</small></div></div>`;
  const matesHTML = `<div class="mates"><b>Teammates:</b> ${mates.length ? mates.map(p => esc(nameFromState(p))).join(", ") : "just you"}</div>`;
  let body = "";
  const c = st.clue;
  if ((st.phase === "clue" || st.phase === "dd") && c) {
    const mine = c.up === ti, other = c.up >= 0 && !mine;
    if (mine && lastUp !== ME.code + c.id + c.steal) { lastUp = ME.code + c.id + c.steal; tone([[880, .12], [1175, .25]]); try { navigator.vibrate && navigator.vibrate(200); } catch (e) {} }
    body = `<div class="sclue ${mine ? "up" : ""}" style="--tc:${col}">
      <div class="tag">${c.dd ? "Daily Double · " : ""}${esc(c.cat)} · $${c.val}</div>
      ${mine ? `<div class="upnow">${c.steal ? "STEAL! " : ""}Your team is up!</div>` : other ? `<div class="other"><b style="color:${COLORS[c.up]}">${esc(st.teams[c.up].name)}</b> ${c.steal ? "is trying to steal" : "is answering"}</div>` : ""}
      <div class="ct">${c.text ? esc(c.text) : "Waiting for the wager…"}</div>
      ${c.ans ? `<div class="ca">Answer: ${esc(c.ans)}</div>` : ""}</div>`;
  } else if (st.phase === "final" && st.final) {
    body = `<div class="sclue" style="--tc:${col}"><div class="tag">Final Jeopardy · ${esc(st.final.cat)}</div>
      <div class="ct">${st.final.text ? esc(st.final.text) : "Agree on a secret wager with your team. Tell your teacher."}</div>${st.final.ans ? `<div class="ca">Answer: ${esc(st.final.ans)}</div>` : ""}</div>`;
  } else if (st.phase === "end") {
    body = `<div class="sclue" style="--tc:${col}"><div class="tag">Game over</div><div class="ct">Your team finished ${ord(place)} of ${st.teams.length}.</div></div>`;
  } else {
    body = `<div class="hint stu-wait">Watch the board. When your team is up, this screen lights up.</div>`;
  }
  const board = `<div class="mini">${order.map(o => `<div style="--tc:${COLORS[o.i]}" class="${o.i === ti ? "me" : ""}"><span>${esc(st.teams[o.i].name)}</span><b>${money(o.s)}</b></div>`).join("")}</div>`;
  app.innerHTML = card + body + matesHTML + board;
}
const nameFromState = pid => { const n = ME.st.names && ME.st.names[pid]; return n || "teammate"; };

/* ============================================================ START */
if (ROLE === "teacher") hostHome();
else { const sv = loadSess(), q = (location.search.match(/[?&]code=(\d{4})/) || [])[1];
  if (sv && (!q || q === sv.code)) net().then(N => N ? enterGame(N, sv.code, sv.name).then(err => err && joinForm(err === "No game with that code. Check the board." ? "" : err)) : needSetup());
  else joinForm(); }
