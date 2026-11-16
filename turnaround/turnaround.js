/* The Turnaround: the Management unit's final project, live.
   Students sign up individually; the teacher screen pairs them at random (one group of 3 if odd). One year after Hire
   Power, every company is losing people. Each pair gets one company's case file and works in two timed stages:
     1 Investigate: 7 evidence cards (org chart, survey chart, exit interviews, manager's notebook, handbook, hiring
                    file, customer reviews). Tap a line and flag the management problem it shows (up to 10 flags).
     2 Fix:         spend a $15,000 budget on fixes.
   Then the teacher reveals each company: problems found and missed (with the unit concept), false alarms, what the
   fixes did, and a six-months-later chart of people quitting. Top 5 pairs, class results (most-missed concepts),
   and CSV. Each student's report stays on their device to use for the individual reflection worksheet.
   Scoring lives in data.js. Storage: /api/live (codes under ibl:). Games last 14 days. */
"use strict";
const K = window.KIT;
const { $, esc, plural, andList, ROLE } = K;
const app = $("#app");
const GAME = "turn", PATH = "/turnaround/", HOST_KEY = "taHost", MAXF = 10;
const STAGES = [
  { id: "inv", name: "Investigate", mins: 18, sub: "Go through every card. Tap a line that shows a management problem and name the problem." },
  { id: "fix", name: "Fix", mins: 8, sub: `You have $${(TA.BUDGET).toLocaleString()} and can't fix everything. Fix the biggest problems first.` }
];
const money = n => "$" + n.toLocaleString();
const pName = id => (TA.PROBLEMS.find(p => p.id === id) || {}).name || id;
const pConcept = id => (TA.PROBLEMS.find(p => p.id === id) || {}).c || "";

const hdr = () => `<h1 class="title">The <span>Turnaround.</span></h1>
  <p class="lede">${ROLE === "teacher"
    ? "Teacher screen. The Management unit's final project. Students sign up on their own devices and get random partners. One year after Hire Power, every company is losing people. Each pair digs through one company's case file, flags the management problems hiding in the evidence, and spends a limited budget on fixes. The reveal shows what they found, what they missed, and what happened six months later."
    : "One year later, your company is losing people and the owner wants answers. You and your partner are the turnaround team. Dig through the evidence, find what management is doing wrong, and spend your budget on the fixes that matter most."}</p>`;

/* ============================================================ PLAN HELPERS */
const caseOf = (st, gi) => { const perm = st.perm || HP.COMPANIES.map((c, i) => i); return perm[gi % perm.length]; };
function mergePlans(list) {
  const out = { f: {}, fx: null };
  list.forEach(p => { if (!p) return;
    Object.entries(p.f || {}).forEach(([id, v]) => { if (v && (!out.f[id] || (v.at || 0) > (out.f[id].at || 0))) out.f[id] = v; });
    if (p.fx && (!out.fx || (p.fx.at || 0) > (out.fx.at || 0))) out.fx = p.fx; });
  return out;
}
const flagsOf = plan => { const o = {}; Object.entries((plan && plan.f) || {}).forEach(([id, v]) => { if (v && v.p) o[id] = v.p; }); return o; };
const fixesOf = plan => ((plan && plan.fx) || {}).list || [];
const nFlags = plan => Object.keys(flagsOf(plan)).length;

/* ============================================================ SHARED VIEWS */
function quitChart(before, after) {
  const all = before.concat(after || []), W = 520, Hh = 200, L = 34, R = 10, T = 12, B = 30, n = all.length, mx = Math.max(4, Math.ceil(Math.max(...all) + 1));
  const x = i => L + (W - L - R) * i / (n - 1), y = v => T + (Hh - T - B) * (1 - v / mx);
  let g = "";
  for (let v = 0; v <= mx; v += Math.ceil(mx / 4)) g += `<line class="gl" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
  const pts = (arr, off) => arr.map((v, i) => `${x(i + off)},${y(v)}`).join(" ");
  g += `<polyline class="qb" points="${pts(before, 0)}"/>`;
  if (after && after.length) g += `<line class="now" x1="${x(before.length - 1)}" x2="${x(before.length - 1)}" y1="${T}" y2="${Hh - B}"/><polyline class="qa" points="${pts([before[before.length - 1]].concat(after), before.length - 1)}"/>
    <text x="${x(before.length - 1) + 4}" y="${T + 10}" class="lbl">Your fixes</text>`;
  g += `<text x="${L}" y="${Hh - 8}">12 months ago</text><text x="${x(before.length - 1)}" y="${Hh - 8}" text-anchor="${after && after.length ? "middle" : "end"}">Today</text>${after && after.length ? `<text x="${W - R}" y="${Hh - 8}" text-anchor="end">+6 months</text>` : ""}`;
  return `<svg class="qchart" viewBox="0 0 ${W} ${Hh}">${g}</svg>`;
}
function orgDiagram(cs) {
  const L = cs.planted.includes("levels"), S = cs.planted.includes("span"), v = cs.v;
  const rows = [["Owner"]];
  if (L) rows.push(["Regional Director"], ["District Manager"]);
  rows.push([`General Manager · ${v.mgr}`]);
  if (L) rows.push(["Assistant Manager"]);
  if (!S) rows.push(Array.from({ length: v.leads }, () => "Shift Lead"));
  rows.push([S ? `${v.span} employees, all reporting to ${v.mgr}` : `${v.size - v.leads - 2} employees`]);
  return `<div class="org">${rows.map(r => `<div class="orow">${r.map(b => `<span>${esc(b)}</span>`).join("")}</div>`).join('<div class="oline"></div>')}</div>`;
}
function reportHTML(ci, plan, names) {
  const cs = TA.build(ci), s = TA.score(ci, flagsOf(plan), fixesOf(plan)), byId = {}; s.lines.forEach(l => byId[l.id] = l);
  const lineText = id => TA.allLines(cs).find(l => l.id === id);
  const lt = l => l.pct != null ? `${l.pct}% agree: "${l.t}"` : l.t;
  const prob = pid => { const ls = TA.allLines(cs).filter(l => l.p === pid), found = s.found.includes(pid), fixed = fixesOf(plan).includes(pid);
    return `<div class="prob ${found ? "found" : "missed"}"><div class="ph"><b>${found ? "✓ Found" : "✗ Missed"}</b><span>${esc(pName(pid))}</span><em>${esc(pConcept(pid))}</em><i class="${fixed ? "fx" : ""}">${fixed ? "Fixed" : "Not fixed"}</i></div>
      ${ls.map(l => { const r = byId[l.id]; return `<p class="ev">${esc(lt(l))}${r.f ? ` <small>(you flagged: ${esc(pName(r.f))}${r.r === "close" ? ", close" : r.r === "wrong" ? ", wrong problem" : ""})</small>` : ""}</p>`; }).join("")}</div>`; };
  const alarms = s.lines.filter(l => l.r === "alarm");
  return `<div class="later tarep"><div class="lhead"><div><div class="kick">Turnaround report · ${esc(cs.comp.ind)}</div><h2>${esc(cs.comp.name)}</h2><p>${esc(andList(names || []))}</p></div>
      <div class="scorebox"><div><small>Investigation</small><b>${s.inv}</b></div><div><small>Fixes</small><b>${s.fixScore}</b></div><div class="tot"><small>Turnaround</small><b>${s.total}</b></div></div></div>
    <div class="tagrid"><div><div class="skh">The problems (${s.found.length} of ${cs.planted.length} found)</div>${cs.planted.slice().sort((a, b) => cs.weight[b] - cs.weight[a]).map(prob).join("")}
      ${alarms.length ? `<div class="skh">False alarms (${alarms.length})</div>${alarms.map(a => `<p class="ev alarm">${esc(lt(lineText(a.id)))} <small>(you flagged: ${esc(pName(a.f))})</small></p>`).join("")}` : ""}</div>
    <div><div class="skh">Six months later: people quitting each month</div>${quitChart(cs.quits, s.after)}
      <div class="skh">What your fixes did (${money(TA.spent(fixesOf(plan)))} of ${money(TA.BUDGET)})</div>
      ${s.story.length ? s.story.map(x => `<div class="quote ${x.good ? "" : "bad"}">${esc(x.t)}</div>`).join("") : `<div class="quote bad">No fixes were bought.</div>`}
      <p class="note">Problems with two pieces of evidence were the biggest. Fixing them did the most.</p></div></div></div>`;
}

/* ============================================================ HOST */
let H = null;
async function hostSetup() {
  const N = await K.net("taMock").catch(() => null); if (!N) return K.needSetup(hdr());
  let saved = null; try { const c = localStorage.getItem(HOST_KEY); if (c) { const g = await N.get("games/" + c); if (g && g.game === GAME) saved = { code: c, g }; } } catch (e) {}
  const mins = STAGES.map(s => s.mins);
  app.innerHTML = `${hdr()}${saved ? `<div class="panel resume"><h2>Pick up where you left off</h2><p>Game <b>${saved.code}</b> is still running (${esc(saved.g.state.phase)}). Students rejoin with the same code and first name.</p><button class="btn main" id="res">Resume game ${saved.code}</button></div>` : ""}
    <div class="panel wide-panel"><h2>Host a new game</h2>
    <p class="note"><b>Groups:</b> random pairs (one group of 3 if odd). Every pair gets a different company (${HP.COMPANIES.length} cases), and every case hides 6 of the 12 problems from the unit.</p>
    <div class="stmins hp2">${STAGES.map((s, i) => `<label><span>${i + 1}. ${esc(s.name)}</span><input type="number" min="3" max="40" value="${s.mins}" data-i="${i}"></label>`).join("")}</div>
    <p class="note">About 30 minutes of work plus the reveal. After the game, hand out the individual reflection worksheet; students use their Turnaround report (it stays on their device) to answer it.</p>
    <div class="err" id="er"></div><button class="btn main" id="go">Create game</button></div>`;
  app.querySelectorAll(".stmins input").forEach(inp => inp.onchange = () => mins[+inp.dataset.i] = Math.max(3, Math.min(40, +inp.value || STAGES[+inp.dataset.i].mins)));
  if (saved) $("#res").onclick = () => { const { state, players, ...meta } = saved.g; startHost(N, saved.code, meta, state, players || {}); };
  $("#go").onclick = async () => {
    $("#go").disabled = true;
    try {
      const code = await K.newCode(N), meta = { created: Date.now(), game: GAME, kind: "engagement", size: 2, mins };
      const state = { phase: "lobby", tot: {}, perm: K.shuffle(HP.COMPANIES.map((c, i) => i)) };
      await N.set("games/" + code, { ...meta, state }); try { localStorage.setItem(HOST_KEY, code); } catch (e) {}
      startHost(N, code, meta, state, {});
    } catch (e) { $("#er").textContent = "Couldn't reach the class game database."; $("#go").disabled = false; }
  };
}
function startHost(N, code, meta, state, players) { H = { N, code, meta, state, players }; H.off = N.on("games/" + code + "/players", v => { H.players = v || {}; hostRender(true); }); hostRender(); }
function hostSet(state) { K.stopTick(); H.state = state; H.rq = null; H.N.set("games/" + H.code + "/state", state).catch(() => {}); hostRender(); }
function hostSave() { clearTimeout(H.pt); H.pt = setTimeout(() => H.N.set("games/" + H.code + "/state", H.state).catch(() => {}), 500); }
function hostRender(fp) { ({ lobby: hostLobby, seat: hostSeat, build: hostBuild, reveal: hostReveal, end: hostEnd })[H.state.phase](fp); }
const liveGroups = st => st.groups.map((g, i) => i).filter(i => st.groups[i].length);
const hName = p => K.nameOf(H, p);
const namesOf = (st, gi, fn) => (st.groups[gi] || []).map(fn);
function keepGroups(groups, ids) {
  const act = new Set(ids), gs = groups.map(g => g.filter(p => act.has(p))), seated = new Set(gs.flat());
  ids.filter(p => !seated.has(p)).forEach(p => { const live = gs.filter(g => g.length), pool = live.length ? live : gs; const t = pool.slice().sort((a, b) => a.length - b.length)[0]; if (t) t.push(p); else gs.push([p]); });
  return gs;
}
function syncGroups() { const st = H.state, kept = keepGroups(st.groups, K.activeIds(H)); if (JSON.stringify(kept) !== JSON.stringify(st.groups)) { H.state = { ...st, groups: kept, names: K.namesMap(H) }; hostSave(); return true; } return false; }
function hostLobby() {
  app.innerHTML = K.lobbyHTML(H, "The Turnaround", PATH, "Random pairs (one group of 3 if odd) · every pair gets a different company's case file");
  $("#start").onclick = () => hostSet({ ...H.state, phase: "seat", groups: K.groupUp(K.activeIds(H), {}, 2), names: K.namesMap(H), prog: {} });
  $("#end").onclick = hostErase; K.fit();
}
function hostSeat(fp) {
  if (syncGroups()) H.rq = null; if (fp && H.rq === "seat") return; H.rq = "seat";
  app.innerHTML = K.seatHTML(H, { sub: "Sit with your partner. Your company's case file is on your devices.", go: "Open Stage 1: Investigate", mark: () => "" });
  app.querySelectorAll(".pcard .tn em").forEach(el => el.remove());
  app.querySelectorAll(".pcard .pp").forEach((el, i) => el.insertAdjacentHTML("afterbegin", `<div class="pco">${esc(HP.COMPANIES[caseOf(H.state, i)].name)}</div>`));
  const h2 = app.querySelector(".hostbar h2"); if (h2) h2.textContent = "Meet your turnaround partner";
  const k = app.querySelector(".hostbar .kick"); if (k) k.textContent = "The Turnaround";
  $("#go").onclick = () => openStage(0); K.bindRemove(H, () => { H.rq = null; hostSeat(); }); K.fit();
}
function openStage(i) { hostSet({ ...H.state, phase: "build", stage: i, endsAt: Date.now() + H.meta.mins[i] * 60000 }); }
function groupPlan(gi) { const g = H.state.groups[gi] || []; return mergePlans([...g.map(p => H.players[p] && H.players[p].ta), (H.state.prog || {})[gi]]); }
function hostBuild() {
  syncGroups();
  const st = H.state, s = st.stage, live = liveGroups(st), prog = {}; live.forEach(gi => prog[gi] = groupPlan(gi));
  if (JSON.stringify(prog) !== JSON.stringify(st.prog || {})) { H.state = { ...H.state, prog }; hostSave(); }
  if (H.rq !== "build" + s) {
    H.rq = "build" + s; const secs = H.meta.mins[s] * 60;
    app.innerHTML = `<div class="hostbar"><div><div class="kick">Stage ${s + 1} of 2 · ${esc(STAGES[s].name)}</div><h2>${esc(STAGES[s].sub)}</h2></div>
      <div class="clock"><div class="secs big">${K.clockText(secs)}</div><div class="count" id="cnt"></div></div></div>
      <div class="gprog" id="gp"></div>
      <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn" id="more">+2 minutes</button><button class="btn main" id="nx">${s === 0 ? "Open Stage 2: Fix →" : "Reveal the results →"}</button></div>`;
    K.startTimer(app, secs, st.endsAt, () => {});
    $("#more").onclick = () => hostSet({ ...H.state, endsAt: Math.max(Date.now(), H.state.endsAt) + 120000 });
    $("#nx").onclick = () => s === 0 ? openStage(1) : startReveal(); K.fit();
  }
  const nDone = live.filter(gi => s === 0 ? nFlags(prog[gi]) >= 5 : fixesOf(prog[gi]).length).length;
  $("#cnt").textContent = s === 0 ? `${nDone} of ${live.length} teams have 5+ flags` : `${nDone} of ${live.length} teams have bought fixes`;
  $("#gp").innerHTML = live.map(gi => { const p = prog[gi], nf = nFlags(p), sp = TA.spent(fixesOf(p));
    return `<div class="gp ${s === 0 ? (nf >= 5 ? "done" : "") : (sp ? "done" : "")}"><span class="pn">${gi + 1}</span><div class="gpt"><b>${nf} flags${s ? ` · ${money(sp)}` : ""}</b><small>${esc(HP.COMPANIES[caseOf(st, gi)].name)} · ${esc(namesOf(st, gi, hName).join(" & "))}</small></div></div>`; }).join("");
}
function results() { const st = H.state, res = {}; liveGroups(st).forEach(gi => { const p = st.prog[gi] || {}, s = TA.score(caseOf(st, gi), flagsOf(p), fixesOf(p)); res[gi] = { inv: s.inv, fix: s.fixScore, total: s.total, found: s.found, missed: s.missed, alarms: s.alarms }; }); return res; }
function startReveal() {
  const st = H.state, live = liveGroups(st), prog = {}; live.forEach(gi => prog[gi] = groupPlan(gi));
  H.state = { ...st, prog }; const res = results(), tot = {};
  live.forEach(gi => st.groups[gi].forEach(p => tot[p] = res[gi].total));
  hostSet({ ...H.state, phase: "reveal", res, tot, ri: 0, rorder: K.shuffle(live.slice()) });
}
function hostReveal() {
  if (H.rq === "rev" + H.state.ri) return; H.rq = "rev" + H.state.ri;
  const st = H.state, gi = st.rorder[st.ri];
  app.innerHTML = `${reportHTML(caseOf(st, gi), st.prog[gi], namesOf(st, gi, hName))}
    <div class="row" style="justify-content:center;margin-top:12px"><span class="note">${st.ri + 1} of ${st.rorder.length}</span>
    <button class="btn" id="sk">Skip to the leaderboard</button><button class="btn main" id="nx">${st.ri < st.rorder.length - 1 ? "Next company →" : "Top 5 →"}</button></div>`;
  $("#nx").onclick = () => st.ri < st.rorder.length - 1 ? hostSet({ ...st, ri: st.ri + 1 }) : hostSet({ ...st, phase: "end" });
  $("#sk").onclick = () => hostSet({ ...st, phase: "end" }); K.fit();
}
function hostEnd() { if (H.rq === "end") return; H.rq = "end"; K.finale(H, "The Turnaround · Final", "Top Turnaround Teams", classResults, hostErase, () => { cleanupHost(); home(); }); }
function csv() {
  const st = H.state, rows = [["Name", "Partner", "Company", "Turnaround score", "Investigation", "Fixes", "Problems found", "Of", "False alarms", "Missed concepts"]];
  liveGroups(st).forEach(gi => { const r = st.res[gi], g = st.groups[gi];
    g.forEach(p => rows.push([hName(p), g.filter(q => q !== p).map(hName).join(" & "), HP.COMPANIES[caseOf(st, gi)].name, r.total, r.inv, r.fix, r.found.length, r.found.length + r.missed.length, r.alarms, r.missed.map(pConcept).join("; ")])); });
  return rows.map(r => r.map(v => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v).join(",")).join("\n");
}
function classResults() {
  document.body.classList.remove("finale-on");
  const st = H.state, live = liveGroups(st), ranked = live.slice().sort((a, b) => st.res[b].total - st.res[a].total);
  const miss = TA.PROBLEMS.map(p => { const had = live.filter(gi => TA.build(caseOf(st, gi)).planted.includes(p.id)), m = had.filter(gi => st.res[gi].missed.includes(p.id)).length; return { p, had: had.length, m, rate: had.length ? m / had.length : 0 }; }).filter(x => x.had).sort((a, b) => b.rate - a.rate);
  app.innerHTML = `<div class="rep"><h2>Class results</h2><div class="endgrid">
    <div class="skills"><div class="skh">Which problems did the class miss most?</div>
      <div class="poplist">${miss.map(x => `<div><span>${esc(x.p.name)}<small>${esc(x.p.c)}</small></span><div class="pbar"><i style="width:${Math.max(3, 100 * x.rate)}%"></i></div><b>${x.m}/${x.had}</b></div>`).join("")}</div>
      <p class="note">Missed by / teams whose case had it. The top of this list is what to reteach before the unit test.</p>
      <div class="skh" style="margin-top:10px">Debrief</div>
      <ol class="debrief"><li>Which card gave away the most problems? Which card was mostly normal business?</li><li>What made a false alarm look like a problem?</li><li>Why did the quick fixes (pizza, posters, a bonus) not work? Use Herzberg to explain.</li><li>If you could fix only one problem in your case, which one, and why?</li></ol></div>
    <div class="skills"><div class="skh">Every company</div>
      <table class="htab small"><tr><th>Company</th><th>Found</th><th>Inv.</th><th>Fixes</th><th>Total</th></tr>
      ${ranked.map(gi => { const r = st.res[gi]; return `<tr><td><b>${esc(HP.COMPANIES[caseOf(st, gi)].name)}</b><small>${esc(namesOf(st, gi, hName).join(" & "))}</small></td><td>${r.found.length}/${r.found.length + r.missed.length}</td><td>${r.inv}</td><td>${r.fix}</td><td><b>${r.total}</b></td></tr>`; }).join("")}</table></div></div>
    <div class="row" style="justify-content:center;margin-top:14px"><button class="btn main" id="pod">Back to Top 5</button><button class="btn" id="csv">Download scores (CSV)</button><button class="btn" id="erase">Erase game</button></div></div>`;
  $("#pod").onclick = () => { H.rq = null; hostEnd(); }; $("#erase").onclick = hostErase;
  $("#csv").onclick = () => { const b = new Blob([csv()], { type: "text/csv" }), a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `turnaround-${H.code}.csv`; a.click(); };
  K.fit();
}
function cleanupHost() { K.stopTick(); if (H && H.off) H.off(); }
async function hostErase() { if (!H) return home(); cleanupHost(); try { await H.N.remove("games/" + H.code); } catch (e) {} try { localStorage.removeItem(HOST_KEY); } catch (e) {} H = null; home(); }

/* ============================================================ STUDENT */
let ME = null;
const SESS = K.sess("taSession");
async function stuJoin() {
  const N = await K.net("taMock").catch(() => null); if (!N) return K.needSetup(hdr());
  K.joinForm({ N, game: GAME, title: "The Turnaround", sessKey: "taSession", hdr: hdr(), onJoined: ctx => {
    if (ME && ME.off) ME.off();
    ME = { N, ...ctx, ta: JSON.parse(JSON.stringify((ctx.rec && ctx.rec.ta) || { f: {} })), st: null, rq: null, card: "org", pick: null };
    if (!ME.ta.f) ME.ta.f = {};
    ME.off = N.on(`games/${ctx.code}/state`, s => { if (!ME) return; if (!s) return gameGone(); ME.st = s; stuRender(); });
  } });
}
function gameGone() { K.stopTick(); if (ME && ME.off) ME.off(); ME = null; SESS.clear(); app.innerHTML = `<div class="wait"><h2>The game has ended</h2><p>Your teacher closed this game.</p><button class="btn main" id="h">OK</button></div>`; $("#h").onclick = home; }
const sName = p => ((ME.st && ME.st.names) || {})[p] || "a teammate";
function myPlan() { const st = ME.st, gi = K.groupOf(st, ME.pid); return mergePlans([ME.ta, (st.prog || {})[gi]]); }
function stuRender() {
  const M = ME, st = M.st; if (!st) return;
  const gi = st.groups ? K.groupOf(st, M.pid) : -1;
  const key = [st.phase, st.stage, gi, st.phase === "seat" ? JSON.stringify(st.groups) : "", st.phase === "reveal" || st.phase === "end" ? "r" : ""].join("|");
  if (st.phase === "build" && key === M.rq) { const p = myPlan(); if (JSON.stringify(p) !== JSON.stringify(M.plan)) { M.plan = p; drawBuild(false); } return; }
  if (key === M.rq) return; M.rq = key;
  if (st.phase === "lobby") { app.innerHTML = `<div class="wait"><h2>You're in, ${esc(M.name)}!</h2><p>Watch the board. Your teacher will pair everyone up at random.</p></div>`; return; }
  if (gi < 0) { app.innerHTML = `<div class="wait"><h2>You're in, ${esc(M.name)}</h2><p>Hang on. The teacher's screen will put you on a team in a few seconds.</p></div>`; return; }
  const ci = caseOf(st, gi), comp = HP.COMPANIES[ci], mates = st.groups[gi].filter(p => p !== M.pid).map(sName);
  if (st.phase === "seat") { app.innerHTML = `<div class="wait seat"><div class="kick">${esc(comp.name)} · ${esc(comp.ind)}</div><p>${mates.length > 1 ? "Your partners" : "Your partner"}</p><div class="tablebig mate">${esc(andList(mates)) || "Solo"}</div><p>Sit together. You're the turnaround team for ${esc(comp.name)}. Either of you can flag evidence; your devices stay in sync, so split up the cards.</p></div>`; return; }
  if (st.phase === "build") { M.plan = myPlan(); return drawBuild(true); }
  K.stopTick();
  const plan = (st.prog || {})[gi] || myPlan();
  app.innerHTML = `${reportHTML(ci, plan, st.groups[gi].map(sName))}
    <div class="row" style="justify-content:center;margin-top:12px"><button class="btn main" id="pr">Print my report</button></div>
    <p class="note" style="text-align:center">Keep this open. You'll need it for your reflection.</p>`;
  $("#pr").onclick = () => { document.body.classList.add("printing-rep"); setTimeout(() => { window.print(); document.body.classList.remove("printing-rep"); }, 100); };
}
function setFlag(id, p) {
  const v = { p, at: Date.now() }; ME.ta.f[id] = v; ME.plan = mergePlans([ME.plan, { f: { [id]: v } }]);
  ME.N.update(`games/${ME.code}/players/${ME.pid}`, { ["ta/f/" + id]: v }).catch(() => {}); ME.pick = null; drawBuild(false);
}
function setFixes(list) {
  const v = { list, at: Date.now() }; ME.ta.fx = v; ME.plan = { ...ME.plan, fx: v };
  ME.N.update(`games/${ME.code}/players/${ME.pid}`, { "ta/fx": v }).catch(() => {}); drawBuild(false);
}
function drawBuild(fresh) {
  const M = ME, st = M.st, gi = K.groupOf(st, M.pid), ci = caseOf(st, gi), cs = TA.build(ci), plan = M.plan, y = scrollY;
  const mates = st.groups[gi].filter(p => p !== M.pid).map(sName), fl = flagsOf(plan), stage = STAGES[st.stage];
  let body = "";
  if (stage.id === "inv") {
    const card = TA.CARDS.find(c => c.id === M.card), lines = cs.cards[card.id], cnt = {};
    TA.CARDS.forEach(c => cnt[c.id] = cs.cards[c.id].filter(l => fl[l.id]).length);
    body = `<div class="cocard"><div class="nk">${esc(cs.comp.ind)} · ${cs.size} employees</div><h3>${esc(cs.comp.name)}</h3><p>${esc(cs.intro)}</p>
        <div class="minichart"><small>People quitting each month, last 12 months</small>${quitChart(cs.quits)}</div></div>
      <div class="flagbar"><b>${nFlags(plan)} of ${MAXF} flags used</b><span>A flag on normal business costs points. Flag what the evidence shows.</span></div>
      <div class="cardtabs">${TA.CARDS.map(c => `<button data-c="${c.id}" class="${c.id === M.card ? "on" : ""}"><i>${c.icon}</i>${esc(c.name)}${cnt[c.id] ? `<em>${cnt[c.id]}</em>` : ""}</button>`).join("")}</div>
      <div class="evcard"><div class="evh"><h3>${esc(card.name)}</h3><span>${esc(card.sub)}</span></div>
        ${card.id === "org" ? orgDiagram(cs) : ""}
        ${lines.map(l => { const f = fl[l.id];
          return `<div class="evl ${f ? "flagged" : ""} ${card.id === "survey" ? "bar" : ""}" data-l="${l.id}">
            ${card.id === "survey" ? `<div class="bq"><span>${esc(l.t)}</span><div class="bt"><i style="width:${l.pct}%"></i><b>${l.pct}%</b></div></div>` : `<p>${esc(l.t)}</p>`}
            <button class="flagbtn">${f ? "⚑ " + esc(pName(f)) : "⚐ Flag"}</button></div>`; }).join("")}</div>
      ${M.pick ? pickerHTML(M.pick, fl[M.pick], nFlags(plan)) : ""}`;
  } else {
    const fx = fixesOf(plan), sp = TA.spent(fx), flagged = [...new Set(Object.values(fl))];
    let a = 11 + ci * 7; const opts = TA.FIXES.map(f => ({ f, r: (a = (a * 9301 + 49297) % 233280) })).sort((x, y) => x.r - y.r).map(x => x.f);
    body = `<div class="budget one"><div><small>Budget spent</small><b>${money(sp)} of ${money(TA.BUDGET)}</b><div class="bbar"><i style="width:${100 * sp / TA.BUDGET}%"></i></div></div></div>
      <div class="want"><small>Problems you flagged</small><div class="skrow">${flagged.length ? flagged.map(p => `<span class="sk">${esc(pName(p))}</span>`).join("") : "<i>No flags. Go back to your evidence.</i>"}</div></div>
      <div class="levers">${opts.map(f => { const on = fx.includes(f.id), can = on || sp + f.cost <= TA.BUDGET;
        return `<button class="lever step ${on ? "on" : ""}" data-f="${f.id}" ${can ? "" : "disabled"}><div class="lt"><b>${esc(f.name)}</b><em>${money(f.cost)}</em></div><span class="tick">${on ? "✓" : "+"}</span></button>`; }).join("")}</div>`;
  }
  app.innerHTML = `<div class="kick">${esc(cs.comp.name)}${mates.length ? ` · with ${esc(andList(mates))}` : ""}</div>${K.timerHTML(M.meta.mins[st.stage] * 60)}
    <div class="sthead"><h2>${st.stage + 1}. ${esc(stage.name)}</h2><p>${esc(stage.sub)}</p></div>${body}`;
  K.startTimer(app, M.meta.mins[st.stage] * 60, st.endsAt, () => {});
  if (stage.id === "inv") {
    app.querySelectorAll(".cardtabs button").forEach(b => b.onclick = () => { M.card = b.dataset.c; M.pick = null; drawBuild(true); });
    app.querySelectorAll(".evl .flagbtn").forEach(b => b.onclick = () => { M.pick = b.closest(".evl").dataset.l; drawBuild(false); });
    const pk = app.querySelector(".picker"); if (pk) {
      pk.querySelector("#pkx").onclick = () => { M.pick = null; drawBuild(false); };
      const rm = pk.querySelector("#pkr"); if (rm) rm.onclick = () => setFlag(M.pick, null);
      pk.querySelectorAll("[data-p]").forEach(b => b.onclick = () => setFlag(M.pick, b.dataset.p));
    }
  } else app.querySelectorAll(".lever.step").forEach(b => b.onclick = () => { const fx = fixesOf(M.plan).slice(), id = b.dataset.f;
    if (fx.includes(id)) setFixes(fx.filter(x => x !== id)); else if (TA.spent(fx) + TA.fixById(id).cost <= TA.BUDGET) setFixes([...fx, id]); });
  if (fresh) scrollTo(0, 0); else scrollTo(0, y);
}
function pickerHTML(lineId, cur, n) {
  const full = !cur && n >= MAXF;
  return `<div class="picker"><div class="pkin"><div class="pkh"><b>What problem does this show?</b><button class="btn" id="pkx">Cancel</button></div>
    ${full ? `<p class="note">You've used all ${MAXF} flags. Remove one first.</p>` : ""}
    <div class="pkl">${TA.PROBLEMS.map(p => `<button data-p="${p.id}" class="${cur === p.id ? "on" : ""}" ${full ? "disabled" : ""}><b>${esc(p.name)}</b><small>${esc(p.c)}</small></button>`).join("")}</div>
    ${cur ? `<button class="btn" id="pkr">Remove this flag</button>` : ""}</div></div>`;
}

function home() { K.stopTick(); document.body.classList.remove("wide", "finale-on"); app.style.zoom = ""; $("#who").hidden = true; ROLE === "teacher" ? hostSetup() : stuJoin(); }
home();
