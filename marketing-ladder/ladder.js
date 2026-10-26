/* Marketing Ladder: a table-tournament review for the Unit 3 marketing unit.
   Every student plays on their own device but sits at a table of 3. Each round:
     1. Define It  - quick vocabulary questions (speed counts)
     2. Make the Buy - split $100,000 across segments, channels, platforms, or ad emotions
     3. Results    - the best buy, then each table's 1st / 2nd / 3rd
     4. Move       - 1sts sit together, 2nds together, 3rds together (or the ladder rule)
   Points add up across rounds. The teacher screen does all the scoring and writes it to the shared state;
   student devices only send their answers. Storage is the same /api/live store Ad Buy Live uses (codes under ibl:). */
"use strict";
const L = window.LADDER;
const $ = s => document.querySelector(s);
const app = $("#app");
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const money = n => (n < 0 ? "−$" : "$") + Math.abs(Math.round(n)).toLocaleString("en-US");
const num = n => Math.round(n).toLocaleString("en-US");
const ROLE = window.BRL_ROLE || "student";
const MOCK = /[?&]mock=1/.test(location.search);
const GAME = "ladder";
const COLORS = ["var(--c0)", "var(--c1)", "var(--c2)", "var(--c3)"], SHAPES = ["▲", "◆", "●", "■"];
const BONUS = [150, 75, 0, 0];               // finishing 1st or 2nd at your table
const PLACE = ["1st", "2nd", "3rd", "4th"];
const defPts = (ok, ms, secs) => (ok ? 100 + Math.round(50 * Math.max(0, 1 - ms / (secs * 1000))) : 0);
const ord = n => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th");
function beep(f, d) { try { const c = beep.c || (beep.c = new (window.AudioContext || window.webkitAudioContext)()); const o = c.createOscillator(), g = c.createGain(); o.frequency.value = f; g.gain.value = .06; o.connect(g); g.connect(c.destination); const t = c.currentTime; g.gain.exponentialRampToValueAtTime(.0001, t + d); o.start(t); o.stop(t + d); } catch (e) {} }

/* ============================================================ NETWORK (same store as Ad Buy Live) */
function mockNet() {
  const KEY = "ladderMock", bc = ("BroadcastChannel" in window) ? new BroadcastChannel(KEY) : null, subs = [];
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

/* ============================================================ SEATING */
// Tables of 3. Leftovers make one or two tables of 4 at the bottom (never a table of 1).
function sizes(n) {
  if (n <= 0) return [];
  if (n < 3) return [n];
  const t = Math.floor(n / 3), r = n % 3, a = new Array(t).fill(3);
  if (r === 1) a[t - 1] = 4;
  else if (r === 2) { if (t >= 2) { a[t - 1] = 4; a[t - 2] = 4; } else a.push(2); }
  return a;
}
function chunk(order) { const out = []; let i = 0; for (const s of sizes(order.length)) { out.push(order.slice(i, i + s)); i += s; } return out; }
// placed = each table's players sorted 1st, 2nd, 3rd... Returns the next seating order (top table first).
function nextOrder(placed, rule) {
  if (rule === "ladder") { // winner moves up one table, last place moves down one, the middle stays
    const nb = placed.map(() => []);
    placed.forEach((t, i) => t.forEach((p, j) => {
      let to = i;
      if (t.length > 1) { if (j === 0 && i > 0) to = i - 1; else if (j === t.length - 1 && i < placed.length - 1) to = i + 1; }
      nb[to].push(p);
    }));
    return nb.flat();
  }
  const order = [], mx = Math.max(0, ...placed.map(t => t.length)); // all 1sts (top table first), then all 2nds, then 3rds
  for (let j = 0; j < mx; j++) placed.forEach(t => { if (t[j]) order.push(t[j]); });
  return order;
}
function tableLabel(st, i) {
  if (i === 0) return "Top Table";
  if (st.r === 0 || st.rule === "ladder") return "";
  const tally = [0, 0, 0];
  st.tables[i].forEach(p => { const f = st.from && st.from[p]; if (f != null) tally[Math.min(2, f)]++; });
  const top = tally.indexOf(Math.max(...tally));
  return Math.max(...tally) ? ["Winners", "2nd places", "3rd places"][top] : "";
}
const tableOf = (st, pid) => (st.tables || []).findIndex(t => t.includes(pid));

/* ============================================================ SHARED VIEW PIECES */
const roundBuy = (meta, r) => L.buyById[meta.plan[r].buy];
const roundQ = (meta, r, qi) => L.question(meta.plan[r].defs[qi], meta.seed);
const secsLeft = (t0, secs) => Math.max(0, secs - (performance.now() - t0) / 1000);
let TICK = null;
function stopTick() { clearInterval(TICK); TICK = null; }
function startTimer(el, secs, t0, onEnd) {
  stopTick();
  const bar = el.querySelector(".timer i"), sec = el.querySelector(".secs"), tm = el.querySelector(".timer"); let last = null;
  TICK = setInterval(() => {
    const left = secsLeft(t0, secs), c = Math.ceil(left);
    if (bar) bar.style.transform = `scaleX(${left / secs})`;
    if (c !== last) { last = c; if (sec) sec.textContent = clockText(c); if (c <= 3 && c > 0 && ROLE !== "teacher") beep(880, .05); }
    if (tm) tm.classList.toggle("low", left <= Math.min(10, secs * .2));
    if (left <= 0) { stopTick(); onEnd && onEnd(); }
  }, 100);
}
const clockText = s => (s >= 60 ? Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0") : String(s));
const timerHTML = secs => `<div class="row tline"><div class="timer" style="flex:1"><i></i></div><span class="secs">${clockText(secs)}</span></div>`;
function qHTML(q, head, o = {}) {
  return `<div class="qwrap">
    <div class="qhead"><span class="rd">${esc(head)}</span><span class="num">${esc(o.num || "")}</span>${o.score != null ? `<span class="score">${num(o.score)} pts</span>` : ""}</div>
    ${o.timed ? timerHTML(o.secs) : ""}
    <div class="card"><div class="ask">${esc(q.ask)}</div><p class="prompt">${esc(q.mode === "d" ? "“" + q.p + "”" : q.p)}</p></div>
    <div class="opts">${q.opts.map((v, i) => `<button class="opt" data-i="${i}" style="--oc:${COLORS[i]}"><span class="sh">${SHAPES[i]}</span><span>${esc(v)}</span></button>`).join("")}</div>
    <div class="fbbox"></div></div>`;
}
function briefHTML(buy, o = {}) {
  return `<div class="brief">
    <div class="bhead"><div><div class="kind">${esc(buy.kind)}</div><h2>${esc(buy.client)}</h2><div class="what">${esc(buy.what)}</div></div>
      ${o.right || ""}</div>
    <p class="about">${esc(buy.about)}</p>
    ${buy.news ? `<div class="news"><b>News</b> ${esc(buy.news.replace(/^This year's news: /, ""))}</div>` : ""}
    <div class="askline">${esc(buy.ask)}</div>
    ${o.table === false ? "" : dataTable(buy, o)}
  </div>`;
}
function dataTable(buy, o = {}) {
  return `<div class="dtwrap"><table class="dt"><thead><tr><th>Option</th>${buy.cols.map(c => `<th>${esc(c)}</th>`).join("")}${o.extraHead || ""}</tr></thead>
    <tbody>${buy.opts.map((op, i) => `<tr><td><b>${esc(op.name)}</b>${op.note ? `<small>${esc(op.note)}</small>` : ""}</td>${op.cells.map(c => `<td>${esc(c)}</td>`).join("")}${o.extraCell ? o.extraCell(i) : ""}</tr>`).join("")}</tbody></table></div>`;
}
function bars(buy, rows) { // rows: [{label, alloc, cls}] blocks per option
  return `<div class="bars">${buy.opts.map((op, i) => `<div class="brow"><span class="bn">${esc(op.name)}</span><div class="bstack">${rows.map(r => {
    const v = +r.alloc[i] || 0; return `<div class="bline ${r.cls}"><i style="width:${v * 10}%"></i><span>${r.fmt ? r.fmt(v) : v + (v === 1 ? " block" : " blocks")}</span></div>`; }).join("")}</div></div>`).join("")}
    <div class="blegend">${rows.map(r => `<span class="${r.cls}"><i></i>${esc(r.label)}</span>`).join("")}</div></div>`;
}

/* ============================================================ FIT THE PROJECTOR */
function zoomApp() { const a = app; a.style.zoom = ""; const R = document.documentElement; let lo = .55, hi = 2.2;
  for (let i = 0; i < 12; i++) { const m = (lo + hi) / 2; a.style.zoom = m.toFixed(3); (R.scrollHeight <= innerHeight + 1 && R.scrollWidth <= innerWidth + 1) ? lo = m : hi = m; }
  a.style.zoom = lo.toFixed(3); }
function fit() { if (ROLE !== "teacher") return; document.body.classList.add("wide"); requestAnimationFrame(zoomApp); }
window.addEventListener("resize", () => { if (ROLE === "teacher") { clearTimeout(fit.t); fit.t = setTimeout(zoomApp, 150); } });

/* ============================================================ HOME */
const hdr = () => `<h1 class="title">Marketing <span>Ladder.</span></h1>
  <p class="lede">${ROLE === "teacher"
    ? "Teacher screen for the projector. Students join on their own devices and sit at tables of 3. Each round: vocabulary, then a $100,000 ad buy, then results. 1st places move together, 2nds together, 3rds together, and points add up all game."
    : "Each round you answer a few vocab questions, make a $100,000 ad buy, and see how you did against the two people at your table. Win your table and you move up. Every point counts toward your total."}</p>`;
function needSetup() {
  app.innerHTML = `${hdr()}<div class="panel"><h2>${ROLE === "teacher" ? "Class games need the database" : "The game isn't open yet"}</h2>
    <p>${ROLE === "teacher" ? "In Vercel, connect the Upstash for Redis database to this project, then redeploy. It's the same setup Ad Buy Live uses." : "Wait for your teacher to start it, then reload this page."}</p>
    <button class="btn main" id="b">Reload</button></div>`;
  $("#b").onclick = () => location.reload();
}
function home() { stopTick(); document.body.classList.remove("wide", "finale-on", "stu-live"); app.style.zoom = ""; $("#who").hidden = true; ROLE === "teacher" ? hostSetup() : joinForm(); }

/* ============================================================ HOST */
let H = null;
async function hostSetup() {
  const N = await net().catch(() => null); if (!N) return needSetup();
  const cfg = { rounds: 5, per: 3, qsecs: 20, bsecs: 150, rule: "place" };
  app.innerHTML = `${hdr()}<div class="panel wide-panel"><h2>Host a game</h2>
    <p>Rounds:</p><div class="seg" data-k="rounds"><button data-v="3">3</button><button data-v="4">4</button><button data-v="5" aria-pressed="true">5</button><button data-v="6">6</button></div>
    <p>Vocab questions each round:</p><div class="seg" data-k="per"><button data-v="2">2</button><button data-v="3" aria-pressed="true">3</button><button data-v="4">4</button></div>
    <p>Time per vocab question:</p><div class="seg" data-k="qsecs"><button data-v="15">15 sec</button><button data-v="20" aria-pressed="true">20 sec</button><button data-v="30">30 sec</button></div>
    <p>Time to make the buy:</p><div class="seg" data-k="bsecs"><button data-v="120">2 min</button><button data-v="150" aria-pressed="true">2½ min</button><button data-v="180">3 min</button><button data-v="240">4 min</button></div>
    <p>How students move after each round:</p><div class="seg" data-k="rule"><button data-v="place" aria-pressed="true">Regroup by place</button><button data-v="ladder">Ladder</button></div>
    <p class="note" id="rn"></p>
    <p class="note">About 7 to 9 minutes a round with 30 students. Six buys rotate in order: Rink Rats (segments), Hearthside Bakery (ad emotions), Lakefront Kayak (Chicago channels), Lakeview Soccer Camp (social platforms), Cornerstone Pizza (segments + news), Frontier Fest (channels).</p>
    <div class="err" id="er"></div><button class="btn main" id="go">Create game</button></div>`;
  const ruleNote = () => $("#rn").textContent = cfg.rule === "place"
    ? "Regroup by place: all 1st-place finishers sit together at the top tables, then all 2nds, then all 3rds. Table 1 is always the Top Table."
    : "Ladder: the winner moves up one table, last place moves down one table, and 2nd place stays put.";
  ruleNote();
  app.querySelectorAll(".seg").forEach(sg => sg.onclick = e => { const b = e.target.closest("button"); if (!b) return;
    [...sg.children].forEach(x => x.setAttribute("aria-pressed", x === b)); const k = sg.dataset.k; cfg[k] = k === "rule" ? b.dataset.v : +b.dataset.v; ruleNote(); });
  $("#go").onclick = async () => {
    $("#go").disabled = true;
    try {
      let code; for (let t = 0; t < 20; t++) { code = String(Math.floor(1000 + Math.random() * 9000)); if (!(await N.get("games/" + code))) break; }
      const seed = Math.floor(Math.random() * 1e9), plan = L.plan(cfg.rounds, cfg.per, seed);
      const meta = { created: Date.now(), game: GAME, seed, plan, ...cfg };
      const state = { phase: "lobby", rule: cfg.rule, tot: {} };
      await N.set("games/" + code, { ...meta, state });
      H = { N, code, meta, state, players: {} };
      H.off = N.on("games/" + code + "/players", v => { H.players = v || {}; hostRender(true); });
      hostRender();
    } catch (e) { $("#er").textContent = "Couldn't reach the class game database."; $("#go").disabled = false; }
  };
}
const active = () => Object.entries(H.players).filter(([, p]) => !p.out).map(([id]) => id);
const nameOf = pid => (H.players[pid] && H.players[pid].name) || (H.state.names && H.state.names[pid]) || "?";
const seated = () => (H.state.tables || []).flat();
function namesMap() { const o = {}; Object.entries(H.players).forEach(([id, p]) => o[id] = p.name); return o; }
function hostSet(state) { H.state = state; H.rq = null; H.N.set("games/" + H.code + "/state", state).catch(() => {}); hostRender(); }

function hostRender(fromPlayers) {
  const st = H.state, M = H.meta;
  if (fromPlayers && !["lobby", "seat", "q", "buy"].includes(st.phase)) return; // nothing on screen depends on players then
  if (st.phase === "lobby") return hostLobby();
  if (st.phase === "seat") return hostSeat(fromPlayers);
  if (st.phase === "q") return hostQuestion(fromPlayers);
  if (st.phase === "qrev") return hostReveal();
  if (st.phase === "buy") return hostBuy(fromPlayers);
  if (st.phase === "best") return hostBest();
  if (st.phase === "tables") return hostTables();
  if (st.phase === "end") return hostEnd();
}
function hostLobby() {
  const ps = active(), url = location.origin + "/marketing-ladder/?code=" + H.code;
  if (!H.qr) H.qr = qrSvg(url);
  app.innerHTML = `<div class="lobby"><div class="lobtop"><div class="lobleft"><div class="join">Scan the code, or open <b>Marketing Ladder</b> on the Intro to Business site and enter</div>
    <div class="code">${H.code}</div><div class="url">${esc(url.replace(/^https?:\/\//, ""))}</div></div>
    ${H.qr ? `<div class="qr">${H.qr}<span>Scan to join</span></div>` : ""}</div>
    <div class="count">${ps.length} player${ps.length === 1 ? "" : "s"} joined · ${sizes(ps.length).length} table${sizes(ps.length).length === 1 ? "" : "s"}</div>
    <div class="names">${ps.map(id => `<span>${esc(nameOf(id))}</span>`).join("") || '<span style="opacity:.5">Waiting for players…</span>'}</div>
    <p class="note">${H.meta.rounds} rounds · ${H.meta.per} vocab questions + 1 buy each · ${H.meta.rule === "place" ? "regroup by place" : "ladder moves"}</p>
    <div class="row" style="justify-content:center"><button class="btn main" id="start" ${ps.length >= 2 ? "" : "disabled"}>Seat the tables</button>
    <button class="btn" id="signs">Print table signs</button><button class="btn" id="end">Cancel</button></div></div>`;
  $("#start").onclick = () => { const order = L.shuffle(active(), Math.random); hostSet({ phase: "seat", r: 0, rule: H.meta.rule, tables: chunk(order), from: {}, tot: {}, names: namesMap() }); };
  $("#signs").onclick = printSigns; $("#end").onclick = hostErase;
  fit();
}
function printSigns() {
  const n = Math.max(12, sizes(active().length).length), w = window.open("", "_blank"); if (!w) return;
  w.document.write(`<!doctype html><title>Table signs</title><style>@page{size:letter landscape;margin:.5in}body{margin:0;font-family:Arial,sans-serif}
    .s{height:7.3in;display:flex;flex-direction:column;align-items:center;justify-content:center;page-break-after:always;border:6px solid #4C3629;border-radius:24px;box-sizing:border-box}
    .s small{font-size:40px;letter-spacing:.2em;color:#4C3629;font-weight:700}.s b{font-size:330px;line-height:1;color:#4C3629}.s em{font-style:normal;font-size:36px;color:#E26F39;font-weight:700}</style>
    ${Array.from({ length: n }, (_, i) => `<div class="s"><small>TABLE</small><b>${i + 1}</b>${i === 0 ? "<em>TOP TABLE</em>" : ""}</div>`).join("")}<script>print()<\/script>`);
  w.document.close();
}
function hostSeat(fromPlayers) {
  const st = H.state;
  // anyone new (or back from being removed) gets a seat at the bottom
  const inSeat = new Set(seated()), fresh = active().filter(p => !inSeat.has(p));
  const gone = seated().filter(p => H.players[p] && H.players[p].out);
  if (fresh.length || gone.length) {
    let tables = st.tables.map(t => t.filter(p => !gone.includes(p))).filter(t => t.length);
    fresh.forEach(p => { const last = tables[tables.length - 1]; if (last && last.length < 4) last.push(p); else tables.push([p]); });
    // never leave someone sitting alone
    const solo = tables.findIndex(t => t.length === 1);
    if (solo > 0 && tables.length > 1) { const p = tables[solo][0]; tables.splice(solo, 1); tables[tables.length - 1].push(p); }
    return hostSet({ ...st, tables, names: namesMap() });
  }
  if (fromPlayers && H.rq === "seat") return;
  H.rq = "seat";
  app.innerHTML = `<div class="hostbar"><div><div class="kick">Round ${st.r + 1} of ${H.meta.rounds}</div><h2>Find your table</h2></div>
    <p>${st.r === 0 ? "Tables are random this round. Sit with the two people on your screen." : H.meta.rule === "place" ? "1st places sit together, 2nds together, 3rds together. Your device shows your table number." : "Winners moved up a table, last places moved down."}</p></div>
    <div class="tgrid">${st.tables.map((t, i) => `<div class="tcard ${i === 0 ? "toptable" : ""}"><div class="th"><b>Table ${i + 1}</b>${tableLabel(st, i) ? `<span>${esc(tableLabel(st, i))}</span>` : ""}</div>
      ${t.map(p => `<div class="tn"><span>${esc(nameOf(p))}</span><em>${num((st.tot || {})[p] || 0)}</em><button class="x" data-p="${p}" title="Remove from the game">✕</button></div>`).join("")}</div>`).join("")}</div>
    <div class="row" style="justify-content:center;margin-top:14px"><button class="btn main" id="go">Everyone's seated: start Round ${st.r + 1}</button></div>
    <p class="note" style="text-align:center">✕ removes an absent student. If they come back, they rejoin with the same name and keep their points.</p>`;
  app.querySelectorAll(".x").forEach(b => b.onclick = async () => { const p = b.dataset.p; H.players[p] = { ...H.players[p], out: true }; await H.N.update(`games/${H.code}/players/${p}`, { out: true }).catch(() => {}); H.rq = null; hostSeat(); });
  $("#go").onclick = () => hostSet({ ...H.state, phase: "q", qi: 0, run: {} });
  fit();
}
const answeredQ = (r, qi) => seated().filter(p => H.players[p] && H.players[p].a && H.players[p].a[r + "." + qi]).length;
function hostQuestion(fromPlayers) {
  const st = H.state, q = roundQ(H.meta, st.r, st.qi), secs = H.meta.qsecs, total = seated().length, a = answeredQ(st.r, st.qi);
  if (H.rq !== "q" + st.r + "." + st.qi) {
    H.rq = "q" + st.r + "." + st.qi; H.t0 = performance.now();
    app.innerHTML = qHTML(q, `Round ${st.r + 1} · Define It`, { num: `Question ${st.qi + 1} of ${H.meta.per} · ${L.TOPICS[q.tp].short}`, timed: true, secs })
      + `<div class="row" style="justify-content:space-between;margin-top:10px"><span class="count" id="cnt"></span><button class="btn" id="skip">Show answer now</button></div>`;
    app.querySelectorAll(".opt").forEach(b => b.disabled = true);
    $("#skip").onclick = () => hostReveal(true);
    startTimer(app, secs + 1, H.t0, () => hostReveal(true));
    fit();
  }
  const c = $("#cnt"); if (c) c.textContent = `${a} of ${total} answered`;
  if (total && a >= total) hostReveal(true);
}
function scoreDefs(r, upto) { // round vocab points so far for every seated player
  const out = {};
  seated().forEach(p => { let s = 0, ms = 0; const A = (H.players[p] && H.players[p].a) || {};
    for (let qi = 0; qi <= upto; qi++) { const x = A[r + "." + qi], q = roundQ(H.meta, r, qi);
      if (x && x.c >= 0) { s += defPts(x.c === q.ans, x.ms, H.meta.qsecs); ms += x.ms; } else ms += H.meta.qsecs * 1000; }
    out[p] = { s, ms }; });
  return out;
}
async function hostReveal(go) {
  const st = H.state;
  if (go) { const key = st.r + "." + st.qi; if (st.phase !== "q" || H.revealing === key) return; H.revealing = key; stopTick(); try { H.players = (await H.N.get(`games/${H.code}/players`)) || H.players; } catch (e) {}
    const run = scoreDefs(st.r, st.qi); return hostSet({ ...st, phase: "qrev", run: Object.fromEntries(Object.entries(run).map(([p, v]) => [p, v.s])) }); }
  const q = roundQ(H.meta, st.r, st.qi), counts = [0, 0, 0, 0];
  seated().forEach(p => { const x = H.players[p] && H.players[p].a && H.players[p].a[st.r + "." + st.qi]; if (x && x.c >= 0) counts[x.c]++; });
  const mx = Math.max(1, ...counts), last = st.qi >= H.meta.per - 1, T = L.termById[q.id.slice(0, -1)];
  app.innerHTML = qHTML(q, `Round ${st.r + 1} · Define It`, { num: `Question ${st.qi + 1} of ${H.meta.per} · ${L.TOPICS[q.tp].short}` });
  app.querySelectorAll(".opt").forEach((b, i) => { b.disabled = true; b.classList.add(i === q.ans ? "right" : "dim"); });
  app.querySelector(".fbbox").innerHTML = `<div class="fb"><b>${esc(T.t)}: ${esc(T.d)}</b>Example: ${esc(T.ex)}</div>
    <div class="dist">${counts.map((n, i) => `<div class="${i === q.ans ? "ok" : "wrong"}" style="--oc:${COLORS[i]};--h:${Math.max(14, n / mx * 100)}%"><b>${i === q.ans ? "✓" : SHAPES[i]} ${n}</b></div>`).join("")}</div>
    <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn main" id="nx">${last ? "Make the buy →" : "Next question →"}</button></div>`;
  $("#nx").onclick = () => last ? hostSet({ ...st, phase: "buy" }) : hostSet({ ...st, phase: "q", qi: st.qi + 1 });
  fit();
}
const boughtCount = r => seated().filter(p => H.players[p] && H.players[p].b && H.players[p].b[r]).length;
function hostBuy(fromPlayers) {
  const st = H.state, buy = roundBuy(H.meta, st.r), secs = H.meta.bsecs, total = seated().length;
  if (H.rq !== "buy" + st.r) {
    H.rq = "buy" + st.r; H.t0 = performance.now();
    app.innerHTML = `<div class="kick" style="margin-bottom:6px">Round ${st.r + 1} · Make the Buy · $100,000 in $10,000 blocks</div>`
      + briefHTML(buy, { right: `<div class="clock"><div class="secs big">${clockText(secs)}</div><div class="count" id="cnt"></div></div>` })
      + `<div class="row" style="justify-content:space-between;margin-top:10px"><span class="note">Unspent blocks are kept, not lost. Every block you spend has to earn back more than $10,000.</span><button class="btn" id="close">Close buys now</button></div>`;
    $("#close").onclick = () => hostCloseBuy();
    startTimer(app, secs + 4, H.t0, () => hostCloseBuy()); // a few extra seconds so devices can send their auto-submit
    fit();
  }
  const b = boughtCount(st.r), c = $("#cnt"); if (c) c.textContent = `${b} of ${total} locked in`;
  if (total && b >= total && !H.closing) { H.closing = setTimeout(() => { H.closing = null; if (H.state.phase === "buy") hostCloseBuy(); }, 2500); }
}
async function hostCloseBuy() {
  if (H.state.phase !== "buy" || H.closingNow) return; H.closingNow = true; stopTick();
  try { H.players = (await H.N.get(`games/${H.code}/players`)) || H.players; } catch (e) {}
  const st = H.state, buy = roundBuy(H.meta, st.r), defs = scoreDefs(st.r, H.meta.per - 1), res = {}, tot = { ...(st.tot || {}) };
  const placed = st.tables.map((t, ti) => {
    const rows = t.map(p => { const al = ((H.players[p] && H.players[p].b && H.players[p].b[st.r]) || []).map(n => +n || 0);
      while (al.length < buy.opts.length) al.push(0);
      const bp = L.buyPoints(buy, al), pr = L.profit(buy, al);
      return { p, dp: defs[p] ? defs[p].s : 0, ms: defs[p] ? defs[p].ms : 0, bp, pr, al, sub: !!(H.players[p] && H.players[p].b && H.players[p].b[st.r]) }; });
    rows.sort((a, b) => (b.dp + b.bp) - (a.dp + a.bp) || b.pr - a.pr || a.ms - b.ms);
    rows.forEach((x, j) => { const bonus = BONUS[j] || 0, rp = x.dp + x.bp + bonus; tot[x.p] = (tot[x.p] || 0) + rp;
      res[x.p] = { t: ti, pl: j, n: rows.length, dp: x.dp, bp: x.bp, bonus, rp, pr: Math.round(x.pr), al: x.al, sub: x.sub }; });
    return rows.map(x => x.p);
  });
  const last = st.r >= H.meta.rounds - 1;
  let next = null, from = {};
  if (!last) { next = chunk(nextOrder(placed, H.meta.rule)); Object.entries(res).forEach(([p, x]) => from[p] = x.pl);
    next.forEach((t, i) => t.forEach(p => res[p].nx = i)); }
  H.closingNow = false;
  hostSet({ ...st, phase: "best", res, tot, placed, next, nextFrom: from, names: namesMap() });
}
function hostBest() {
  const st = H.state, buy = roundBuy(H.meta, st.r), B = L.best(buy), R = Object.values(st.res || {}).filter(x => x.sub);
  const avg = buy.opts.map((_, i) => R.length ? R.reduce((a, x) => a + (x.al[i] || 0), 0) / R.length : 0);
  const top = Object.entries(st.res || {}).sort((a, b) => b[1].pr - a[1].pr).slice(0, 3);
  app.innerHTML = `<div class="hostbar"><div><div class="kick">Round ${st.r + 1} · ${esc(buy.client)}</div><h2>The best buy</h2></div>
      <div class="bigstat"><b>${money(B.profit)}</b><span>best possible profit</span></div></div>
    <div class="bestgrid"><div>${bars(buy, [{ label: "Best buy", alloc: B.alloc, cls: "b1" }, { label: "Class average", alloc: avg, cls: "b2", fmt: v => v.toFixed(1) }])}</div>
      <div class="lessons"><div class="lesson"><b>Why</b>${esc(buy.lesson)}</div><div class="lesson math"><b>The math</b>${esc(buy.math)}</div>
      ${top.length ? `<div class="lesson"><b>Top profits in class</b>${top.map(([p, x], i) => `<div class="tp"><span>${i + 1}. ${esc(nameOf(p))}</span><em>${money(x.pr)}</em></div>`).join("")}</div>` : ""}</div></div>
    <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn main" id="nx">Table results →</button></div>`;
  $("#nx").onclick = () => hostSet({ ...st, phase: "tables" });
  fit();
}
function hostTables() {
  const st = H.state, last = st.r >= H.meta.rounds - 1;
  app.innerHTML = `<div class="hostbar"><div><div class="kick">Round ${st.r + 1} of ${H.meta.rounds}</div><h2>Table results</h2></div>
    <p>${last ? "Last round done. Points are final." : H.meta.rule === "place" ? "1st places move up together. 2nds together. 3rds together." : "Winners move up one table. Last places move down one."}</p></div>
    <div class="tgrid">${st.placed.map((t, i) => `<div class="tcard ${i === 0 ? "toptable" : ""}"><div class="th"><b>Table ${i + 1}</b>${i === 0 ? "<span>Top Table</span>" : ""}</div>
      ${t.map(p => { const x = st.res[p], mv = x.nx == null ? "" : x.nx < i ? `<i class="mv up">▲ T${x.nx + 1}</i>` : x.nx > i ? `<i class="mv dn">▼ T${x.nx + 1}</i>` : `<i class="mv st">T${x.nx + 1}</i>`;
        return `<div class="tn pl${x.pl}"><span class="pm">${PLACE[x.pl]}</span><span>${esc(nameOf(p))}</span><em>+${num(x.rp)}</em>${mv}</div>`; }).join("")}</div>`).join("")}</div>
    <div class="row" style="justify-content:center;margin-top:14px"><button class="btn main" id="nx">${last ? "Final results →" : `Seat Round ${st.r + 2} →`}</button></div>`;
  $("#nx").onclick = () => last ? hostSet({ ...st, phase: "end" })
    : hostSet({ phase: "seat", r: st.r + 1, rule: H.meta.rule, tables: st.next, from: st.nextFrom, tot: st.tot, names: namesMap() });
  fit();
}
function standings(st) { return Object.entries(st.tot || {}).map(([p, s]) => ({ p, s })).sort((a, b) => b.s - a.s); }
function hostEnd() {
  if (H.rq === "end") return; H.rq = "end";
  const st = H.state, list = standings(st), top = list.slice(0, 5), rk = []; let r = 0, prev = null;
  list.forEach((x, i) => { if (x.s !== prev) { r = i + 1; prev = x.s; } rk.push(r); });
  const champ = st.placed && st.placed[0] && st.placed[0][0];
  const slot = (x, i, cls) => x ? `<div class="pod ${cls}" data-i="${i}"><div class="who"><div class="medal">${rk[i]}</div><div class="nm">${esc(nameOf(x.p))}</div><div class="pts">${num(x.s)}</div></div><div class="block"><span>${ord(rk[i])}</span></div></div>` : `<div class="pod ${cls} empty"></div>`;
  document.body.classList.add("finale-on");
  app.style.zoom = "";
  app.innerHTML = `<div class="finale"><div class="rays"></div>
    <div class="fhead"><div class="kick">Marketing Ladder · Final</div><h2>Top 5</h2>${champ ? `<div class="champ">Top Table champion, last round: <b>${esc(nameOf(champ))}</b></div>` : ""}</div>
    <div class="podium">${slot(top[1], 1, "p2")}${slot(top[0], 0, "p1")}${slot(top[2], 2, "p3")}</div>
    <div class="rest">${top.slice(3).map((x, k) => `<div class="row45" data-i="${k + 3}"><span class="r">${rk[k + 3]}</span><span class="n">${esc(nameOf(x.p))}</span><span class="s">${num(x.s)}</span></div>`).join("")}</div>
    <div class="fbar"><button class="btn" id="cr">Class results</button><button class="btn" id="erase">Erase game</button><button class="btn" id="done">Done</button></div></div>`;
  [4, 3, 2, 1, 0].filter(i => top[i]).forEach((i, n) => setTimeout(() => { const el = app.querySelector(`.finale [data-i="${i}"]`); if (el) el.classList.add("in"); beep(i === 0 ? 1047 : 600, .2); }, 600 + n * 1000));
  $("#cr").onclick = classResults; $("#erase").onclick = hostErase; $("#done").onclick = () => { cleanupHost(); home(); };
}
async function classResults() {
  document.body.classList.remove("finale-on");
  try { H.players = (await H.N.get(`games/${H.code}/players`)) || H.players; } catch (e) {}
  const st = H.state, by = {};
  Object.keys(L.TOPICS).forEach(k => by[k] = { n: 0, r: 0 });
  Object.values(H.players).forEach(p => Object.entries(p.a || {}).forEach(([key, x]) => { const [r, qi] = key.split(".").map(Number); if (r >= H.meta.rounds) return;
    const q = roundQ(H.meta, r, qi); by[q.tp].n++; if (x.c === q.ans) by[q.tp].r++; }));
  const misses = {}; Object.values(H.players).forEach(p => Object.entries(p.a || {}).forEach(([key, x]) => { const [r, qi] = key.split(".").map(Number); const q = roundQ(H.meta, r, qi); if (x.c !== q.ans) misses[q.id.slice(0, -1)] = (misses[q.id.slice(0, -1)] || 0) + 1; }));
  const hard = Object.entries(misses).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([id]) => L.termById[id]);
  const list = standings(st);
  app.innerHTML = `<div class="rep"><h2>Class results</h2><div class="endgrid">
    <div class="skills"><div class="skh">Vocab by topic</div>${Object.entries(by).filter(([, v]) => v.n).map(([k, v]) => { const p = v.r / v.n; return `<div class="sk"><span><b>${esc(L.TOPICS[k].short)}</b></span><div class="bar"><i class="${p >= .85 ? "" : p >= .6 ? "mid" : "lo"}" style="width:${Math.max(4, p * 100)}%"></i></div><span class="v">${Math.round(p * 100)}%</span></div>`; }).join("")}
      <div class="skh" style="margin-top:10px">Missed most</div>${hard.map(t => `<div class="tipline"><b>${esc(t.t)}:</b> ${esc(t.d)}</div>`).join("") || "<p class='note'>Nothing missed. Nice.</p>"}</div>
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
const SKEY = "ladderSession";
const saveSess = o => { try { localStorage.setItem(SKEY, JSON.stringify(o)); } catch (e) {} };
const loadSess = () => { try { return JSON.parse(localStorage.getItem(SKEY) || "null"); } catch (e) { return null; } };
async function joinForm() {
  const N = await net().catch(() => null); if (!N) return needSetup();
  const sv = loadSess(), qcode = (location.search.match(/[?&]code=(\d{4})/) || [])[1];
  app.innerHTML = `${hdr()}<div class="panel"><h2>Join the game</h2><p>${qcode ? "Code filled in. Type your first name and last initial." : "Type the code on the board and your first name and last initial."} Closed the page? Join again with the same name and you keep your points.</p>
    <input class="field code" id="cd" inputmode="numeric" maxlength="4" placeholder="0000" autocomplete="off" value="${qcode || (sv ? esc(sv.code) : "")}">
    <input class="field" id="nm" maxlength="24" placeholder="Jordan M." autocomplete="off" value="${sv && (!qcode || sv.code === qcode) ? esc(sv.name) : ""}">
    <div class="err" id="er"></div><button class="btn main" id="go">Join</button></div>`;
  (qcode && !$("#nm").value) ? $("#nm").focus() : $("#cd").focus();
  const go = async () => {
    const code = $("#cd").value.trim(), name = $("#nm").value.trim();
    if (!/^\d{4}$/.test(code)) { $("#er").textContent = "The code is 4 numbers."; return; }
    if (!name) { $("#er").textContent = "Type your name."; return; }
    $("#go").disabled = true; const err = await enterGame(N, code, name); if (err) { $("#er").textContent = err; $("#go").disabled = false; }
  };
  $("#go").onclick = go; $("#nm").onkeydown = e => { if (e.key === "Enter") go(); };
}
async function enterGame(N, code, name, forcePid) {
  try {
    const g = await N.get("games/" + code);
    if (!g || g.game !== GAME) return "No Marketing Ladder game with that code. Check the board.";
    const norm = x => String(x || "").trim().toLowerCase().replace(/\s+/g, " "), sv = loadSess();
    let pid = forcePid || (sv && sv.code === code && norm(sv.name) === norm(name) ? sv.pid : null);
    if (!pid && g.players) { const hit = Object.entries(g.players).find(([, p]) => norm(p.name) === norm(name)); if (hit) pid = hit[0]; }
    const rec = pid && g.players && g.players[pid];
    if (rec) { name = rec.name || name; await N.update(`games/${code}/players/${pid}`, { out: false }); }
    else { pid = "p" + Math.random().toString(36).slice(2, 10); await N.set(`games/${code}/players/${pid}`, { name, joined: Date.now() }); }
    saveSess({ code, pid, name });
    if (ME && ME.off) ME.off();
    const { state, players, ...meta } = g;
    ME = { N, code, pid, name, meta, a: { ...((rec && rec.a) || {}) }, b: { ...((rec && rec.b) || {}) }, draft: {}, st: null, rq: null };
    $("#who").textContent = name; $("#who").hidden = false;
    ME.off = N.on(`games/${code}/state`, s => { if (!ME) return; if (!s) return gameGone(); ME.st = s; stuRender(); });
    return null;
  } catch (e) { return "Couldn't connect. Try again."; }
}
function gameGone() { stopTick(); document.body.classList.remove("stu-live"); if (ME && ME.off) ME.off(); ME = null; try { localStorage.removeItem(SKEY); } catch (e) {}
  app.innerHTML = `<div class="wait"><h2>The game has ended</h2><p>Your teacher closed this game.</p><button class="btn main" id="h">OK</button></div>`; $("#h").onclick = home; }
const myTotal = st => (st.tot && st.tot[ME.pid]) || 0;
function tableStrip(st, label) { // my table's names and points this round so far
  const ti = tableOf(st, ME.pid); if (ti < 0) return "";
  const t = st.tables[ti].map(p => ({ p, s: (st.run && st.run[p]) || 0 })).sort((a, b) => b.s - a.s);
  return `<div class="strip"><div class="sl">${esc(label || `Table ${ti + 1} this round`)}</div>${t.map(x => `<div class="${x.p === ME.pid ? "me" : ""}"><span>${esc((st.names || {})[x.p] || "?")}</span><b>${num(x.s)}</b></div>`).join("")}</div>`;
}
function stuRender() {
  const M = ME, st = M.st, meta = M.meta; if (!st) return;
  if (st.phase !== "q") document.body.classList.remove("stu-live");
  const ti = tableOf(st, M.pid), inPlay = ti >= 0 || st.phase === "lobby" || st.phase === "end";
  const key = st.phase + "|" + st.r + "|" + st.qi + "|" + (st.phase === "qrev" ? JSON.stringify(st.run || {}) : "") + "|" + (st.phase === "seat" ? JSON.stringify(st.tables) : "");
  if (key === M.rq) return; M.rq = key;
  if (st.phase === "lobby") { app.innerHTML = `<div class="wait"><h2>You're in, ${esc(M.name)}!</h2><p>Watch the board. Your teacher will seat the tables.</p></div>`; return; }
  if (st.phase === "end") return stuEnd();
  if (!inPlay) { stopTick(); app.innerHTML = `<div class="wait"><h2>You're in, ${esc(M.name)}</h2><p>This round already started. You'll get a table when the next round is seated.</p><div class="big">${num(myTotal(st))}</div><p>points</p></div>`; return; }
  if (st.phase === "seat") {
    stopTick(); const mates = st.tables[ti].filter(p => p !== M.pid).map(p => (st.names || {})[p] || "?"), lab = tableLabel(st, ti);
    app.innerHTML = `<div class="wait seat"><div class="kick">Round ${st.r + 1} of ${meta.rounds}</div><p>Go to</p><div class="tablebig">TABLE ${ti + 1}</div>${lab ? `<div class="lab">${esc(lab)}</div>` : ""}
      <p>Sit with <b>${mates.map(esc).join("</b> and <b>") || "the group on the board"}</b></p><div class="tot">${num(myTotal(st))} points so far</div></div>`;
    return;
  }
  if (st.phase === "q") return stuQuestion();
  if (st.phase === "qrev") return stuReveal();
  if (st.phase === "buy") return stuBuy();
  if (st.phase === "best") return stuBest();
  if (st.phase === "tables") return stuTables();
}
function stuQuestion() {
  const M = ME, st = M.st, q = roundQ(M.meta, st.r, st.qi), k = st.r + "." + st.qi, secs = M.meta.qsecs;
  if (M.a[k]) { app.innerHTML = `<div class="wait"><h2>Answer locked in</h2><p>Waiting for everyone else…</p></div>`; return; }
  document.body.classList.add("stu-live");
  app.innerHTML = qHTML(q, `Round ${st.r + 1} · Define It`, { num: `${st.qi + 1} of ${M.meta.per}`, timed: true, secs, score: myTotal(st) });
  const t0 = performance.now(); let done = false;
  const pick = i => { if (done) return; done = true; stopTick(); const ms = Math.round(performance.now() - t0);
    document.body.classList.remove("stu-live");
    if (i < 0) { app.innerHTML = `<div class="wait"><h2>Time's up</h2><p>Waiting for the answer…</p></div>`; return; }
    M.a[k] = { c: i, ms }; M.N.update(`games/${M.code}/players/${M.pid}`, { ["a/" + k]: { c: i, ms } }).catch(() => {});
    app.innerHTML = `<div class="wait"><h2>Answer locked in</h2><p>Waiting for everyone else…</p></div>`; };
  app.querySelectorAll(".opt").forEach(b => b.onclick = () => pick(+b.dataset.i));
  startTimer(app, secs, t0, () => pick(-1));
}
function stuReveal() {
  stopTick(); const M = ME, st = M.st, q = roundQ(M.meta, st.r, st.qi), x = M.a[st.r + "." + st.qi], T = L.termById[q.id.slice(0, -1)];
  const ok = x && x.c === q.ans, pts = x ? defPts(ok, x.ms, M.meta.qsecs) : 0;
  app.innerHTML = `<div class="wait"><h2 style="color:${ok ? "var(--good)" : "var(--bad)"}">${ok ? "Correct!" : x ? "Not quite" : "No answer"}</h2><div class="big">+${pts}</div>
    <p><b>${esc(T.t)}:</b> ${esc(T.d)}</p>${tableStrip(st)}</div>`;
}
/* ---------- the buy ---------- */
function stuBuy() {
  const M = ME, st = M.st, r = st.r, buy = roundBuy(M.meta, r), secs = M.meta.bsecs;
  if (!M.draft[r]) M.draft[r] = (M.b[r] || buy.opts.map(() => 0)).slice();
  if (M.buyT0 == null || M.buyR !== r) { M.buyT0 = performance.now(); M.buyR = r; }
  const al = M.draft[r];
  const draw = () => {
    const used = al.reduce((a, b) => a + b, 0), locked = !!M.b[r] && JSON.stringify(M.b[r]) === JSON.stringify(al);
    app.innerHTML = `<div class="buyhead"><div class="kick">Round ${r + 1} · Make the Buy</div>${timerHTML(secs)}</div>
      ${briefHTML(buy, { table: false })}
      <div class="ocards">${buy.opts.map((op, i) => `<div class="ocard ${al[i] ? "on" : ""}"><div class="on1"><b>${esc(op.name)}</b>${op.note ? `<small>${esc(op.note)}</small>` : ""}</div>
        <dl>${buy.cols.map((c, j) => `<div><dt>${esc(c)}</dt><dd>${esc(op.cells[j])}</dd></div>`).join("")}</dl>
        <div class="stepper"><button class="mn" data-i="${i}" ${al[i] ? "" : "disabled"} aria-label="Remove a block">−</button><span><b>${al[i]}</b> ${al[i] === 1 ? "block" : "blocks"} · ${money(al[i] * L.BLOCK)}</span><button class="pl" data-i="${i}" ${used >= L.BLOCKS ? "disabled" : ""} aria-label="Add a block">+</button></div></div>`).join("")}</div>
      <div class="buybar"><div class="meter"><div class="blocks">${Array.from({ length: L.BLOCKS }, (_, i) => `<i class="${i < used ? "f" : ""}"></i>`).join("")}</div>
        <span>${money(used * L.BLOCK)} of $100,000 spent${used < L.BLOCKS ? ` · ${money((L.BLOCKS - used) * L.BLOCK)} kept` : ""}</span></div>
        <button class="btn main" id="lock" ${used ? "" : "disabled"}>${locked ? "Locked in ✓" : M.b[r] ? "Update my buy" : "Lock in my buy"}</button></div>`;
    app.querySelectorAll(".pl").forEach(b => b.onclick = () => { if (al.reduce((a, c) => a + c, 0) < L.BLOCKS) { al[+b.dataset.i]++; draw(); } });
    app.querySelectorAll(".mn").forEach(b => b.onclick = () => { if (al[+b.dataset.i] > 0) { al[+b.dataset.i]--; draw(); } });
    $("#lock").onclick = () => submit();
    startTimer(app, secs, M.buyT0, () => { if (!M.b[r] || JSON.stringify(M.b[r]) !== JSON.stringify(al)) submit(true); });
  };
  const submit = auto => { M.b[r] = al.slice(); M.N.update(`games/${M.code}/players/${M.pid}`, { ["b/" + r]: al.slice() }).catch(() => {});
    if (auto) { stopTick(); app.innerHTML = `<div class="wait"><h2>Time's up</h2><p>Your buy was sent as it was.</p></div>`; } else draw(); };
  draw();
}
function stuBest() {
  stopTick(); const M = ME, st = M.st, buy = roundBuy(M.meta, st.r), x = (st.res || {})[M.pid], B = L.best(buy);
  if (!x) { app.innerHTML = `<div class="wait"><h2>Buys are closed</h2><p>Watch the board.</p></div>`; return; }
  app.innerHTML = `<div class="rep"><div class="kick">Round ${st.r + 1} · ${esc(buy.client)}</div><h2>${x.pr >= 0 ? "Profit" : "Loss"}: ${money(x.pr)}</h2>
    <div class="stats"><div class="stat"><b>+${num(x.bp)}</b><span>Buy points</span></div><div class="stat"><b>+${num(x.dp)}</b><span>Vocab points</span></div><div class="stat"><b>${money(B.profit)}</b><span>Best possible</span></div></div>
    ${bars(buy, [{ label: "Your buy", alloc: x.al, cls: "b2" }, { label: "Best buy", alloc: B.alloc, cls: "b1" }])}
    <div class="lesson"><b>Why</b>${esc(buy.lesson)}</div></div>`;
}
function stuTables() {
  stopTick(); const M = ME, st = M.st, x = (st.res || {})[M.pid]; if (!x) return;
  const last = st.r >= M.meta.rounds - 1, mv = x.nx == null ? "" : x.nx < x.t ? "up" : x.nx > x.t ? "dn" : "st";
  app.innerHTML = `<div class="wait"><div class="kick">Round ${st.r + 1} · Table ${x.t + 1}</div><h2>You finished ${PLACE[x.pl]}</h2>
    <div class="place ${x.pl < 3 ? "podium-" + (x.pl + 1) : ""}"><span>Round</span><b>+${num(x.rp)}</b>${x.bonus ? `<span>includes +${x.bonus} table bonus</span>` : ""}</div>
    <p style="margin-top:14px"><b>${num(myTotal(st))}</b> points total</p>
    ${last ? "<p>That was the last round. Watch the board for the final results.</p>" : `<div class="nextt ${mv}"><span>Next round</span><b>TABLE ${x.nx + 1}</b><em>${mv === "up" ? "▲ moving up" : mv === "dn" ? "▼ moving down" : "same table"}</em></div>`}</div>`;
}
function stuEnd() {
  stopTick(); const M = ME, st = M.st, list = standings(st), i = list.findIndex(x => x.p === M.pid);
  app.innerHTML = `<div class="wait"><div class="kick">Marketing Ladder · Final</div><h2>${i >= 0 ? `You finished ${ord(i + 1)} of ${list.length}` : "Game over"}</h2>
    <div class="big">${num(myTotal(st))}</div><p>total points</p>
    <div class="links">Keep practicing: <a href="/media-buy/">Million Dollar Media Buy</a> · <a href="/windy-city/">Windy City Ad Buy</a> · <a href="/ad-buy-showdown/">Ad Buy Showdown</a></div></div>`;
  try { localStorage.removeItem(SKEY); } catch (e) {}
}

home();
