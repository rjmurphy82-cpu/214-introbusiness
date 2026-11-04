/* Shift Manager: a live Situational Leadership simulation for the Management & Leadership unit.
   Students join with their first name and get new groups of 2 or 3 every round (the teacher picks the size).
   Each round one Sole Revival employee needs a manager. The group, on any of their devices:
     1. Diagnoses the development level (D1 to D4)
     2. Picks the leadership style (S1 to S4)
     3. Picks an opening line and sees how the employee reacts
     4. Picks a follow-up move and sees what happens
   Then the projector reveals the true level, how the class read the person, and every group's score.
   Points belong to each student and add up all game. The teacher screen does all the scoring and syncs each
   group's picks to every device in the group through the shared state; student devices only write their own record.
   Storage: /api/live (codes under ibl:), same as Boss Moves. */
"use strict";
const S = window.SHIFT, K = window.KIT;
const { $, esc, num, ord, plural, andList, ROLE } = K;
const app = $("#app");
const GAME = "shift";
const PATH = "/shift-manager/";

const hdr = () => `<h1 class="title">Shift <span>Manager.</span></h1>
  <p class="lede">${ROLE === "teacher"
    ? "Teacher screen for the projector. Students join on their own devices in groups of 2 or 3, new groups every round. Each group manages one Sole Revival employee: diagnose the development level, pick the leadership style, then choose what to say and see how the employee reacts."
    : "Join with your first name. Every round you and your group manage a different employee at Sole Revival. Read the person, pick the style, choose what to say, and see how they react. Your points add up all game."}</p>`;
const emp = (meta, r) => S.byId[meta.plan[r]];
const lvlTag = n => `${S.LEVELS[n].code} ${S.LEVELS[n].name}`;
const styTag = n => `${S.STYLES[n].code} ${S.STYLES[n].name}`;
function empHTML(e, o = {}) {
  return `<div class="case">
    <div class="chead"><div><div class="kind">Sole Revival · ${esc(e.role)}${e.twist ? ` · <span class="twist">Twist: ${esc(e.twist)}</span>` : ""}</div><h2>${esc(e.name)}</h2></div>${o.right || ""}</div>
    <div class="cbody one"><div class="cline sit"><b>What you see</b>${esc(e.see)}</div></div>
  </div>`;
}

function home() { K.stopTick(); document.body.classList.remove("wide", "finale-on"); app.style.zoom = ""; $("#who").hidden = true; ROLE === "teacher" ? hostSetup() : stuStart(); }

/* ============================================================ HOST */
let H = null;
async function hostSetup() {
  const N = await K.net("shiftMock").catch(() => null); if (!N) return K.needSetup(hdr());
  const cfg = { plan: S.DEFAULT.slice(), secs: 180, size: 2 };
  app.innerHTML = `${hdr()}<div class="panel wide-panel"><h2>Host a game</h2>
    <p>Group size:</p><div class="seg" data-k="size"><button data-v="2" aria-pressed="true">Groups of 2</button><button data-v="3">Groups of 3</button></div>
    <p>Rounds: each employee is one round, in this order. Tap to turn one off.</p>
    <div class="seg multi" id="sc">${S.EMPLOYEES.map(e => `<button data-v="${e.id}" aria-pressed="${cfg.plan.includes(e.id)}"><b>${esc(e.name)}${e.twist ? " (twist)" : ""}</b><small>${esc(e.twist || e.role)}</small></button>`).join("")}</div>
    <p class="note" id="rc"></p>
    <p>Time per round:</p><div class="seg" data-k="secs"><button data-v="120">2 min</button><button data-v="180" aria-pressed="true">3 min</button><button data-v="240">4 min</button></div>
    <p class="note">Scoring (10 per round): diagnosis 3, style 3, opening line 2, follow-up 2. Close picks get partial credit. Everyone in the group gets the group's points.</p>
    <div class="err" id="er"></div><button class="btn main" id="go">Create game</button></div>`;
  const note = () => { const n = cfg.plan.length; $("#rc").textContent = n ? `${plural(n, "round")}, about ${n * 6} minutes.` : "Pick at least one round."; $("#go").disabled = !n; };
  note();
  $("#sc").onclick = e => { const b = e.target.closest("button"); if (!b) return; b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true");
    cfg.plan = S.EMPLOYEES.map(x => x.id).filter(id => document.querySelector(`#sc [data-v="${id}"]`).getAttribute("aria-pressed") === "true"); note(); };
  app.querySelectorAll(".seg[data-k]").forEach(sg => sg.onclick = e => { const b = e.target.closest("button"); if (!b) return;
    [...sg.children].forEach(x => x.setAttribute("aria-pressed", x === b)); cfg[sg.dataset.k] = +b.dataset.v; });
  $("#go").onclick = async () => {
    $("#go").disabled = true;
    try {
      const code = await K.newCode(N);
      const meta = { created: Date.now(), game: GAME, seed: Math.floor(Math.random() * 1e9), plan: cfg.plan, rounds: cfg.plan.length, secs: cfg.secs, size: cfg.size };
      const state = { phase: "lobby", tot: {} };
      await N.set("games/" + code, { ...meta, state });
      H = { N, code, meta, state, players: {} };
      H.off = N.on("games/" + code + "/players", v => { H.players = v || {}; hostRender(true); });
      hostRender();
    } catch (e) { $("#er").textContent = "Couldn't reach the class game database."; $("#go").disabled = false; }
  };
}
function hostSet(state) { K.stopTick(); H.state = state; H.rq = null; H.N.set("games/" + H.code + "/state", state).catch(() => {}); hostRender(); }
function hostRender(fromPlayers) {
  const st = H.state;
  if (fromPlayers && !["lobby", "seat", "play"].includes(st.phase)) return;
  ({ lobby: hostLobby, seat: hostSeat, play: hostPlay, reveal: hostReveal, results: hostResults, end: hostEnd })[st.phase](fromPlayers);
}
function hostLobby() {
  app.innerHTML = K.lobbyHTML(H, "Shift Manager", PATH, `${plural(H.meta.rounds, "round")} · new group every round · points add up all game`);
  $("#start").onclick = () => hostSet({ phase: "seat", r: 0, groups: K.groupUp(K.activeIds(H), {}, H.meta.size), hist: {}, tot: {}, log: [], names: K.namesMap(H) });
  $("#end").onclick = hostErase;
  K.fit();
}
function hostSeat(fromPlayers) {
  const st = H.state, patched = K.patchGroups(st.groups, K.activeIds(H), H.meta.size);
  if (JSON.stringify(patched) !== JSON.stringify(st.groups)) return hostSet({ ...st, groups: patched, names: K.namesMap(H) });
  if (fromPlayers && H.rq === "seat") return;
  H.rq = "seat";
  app.innerHTML = K.seatHTML(H, { sub: st.r === 0 ? "Sit with your group. Any of you can tap; every device in the group shows the same picks." : "Everyone gets new teammates. Find your group and sit together.", go: `Everyone's with a group: start Round ${st.r + 1}` });
  $("#go").onclick = () => hostSet({ ...st, phase: "play", endsAt: Date.now() + H.meta.secs * 1000, prog: {}, hist: K.addHist(st.hist, st.groups), names: K.namesMap(H) });
  K.bindRemove(H, () => { H.rq = null; hostSeat(); });
  K.fit();
}
// a group's current picks: whichever member's record is newest
function groupPick(g, r, players) {
  let best = null;
  g.forEach(p => { const c = players[p] && players[p].sm && players[p].sm[r]; if (c && (!best || (c.at || 0) > (best.at || 0))) best = c; });
  return best;
}
const stepsDone = c => !c ? 0 : (c.d != null) + (c.s != null) + (c.o != null) + (c.f != null);
function hostPlay() {
  const st = H.state, e = emp(H.meta, st.r), secs = H.meta.secs;
  const picks = st.groups.map(g => groupPick(g, st.r, H.players)), done = picks.filter(c => stepsDone(c) === 4).length;
  // sync each group's picks to all of its devices (throttled)
  const prog = {}; picks.forEach((c, i) => { if (c) prog[i] = c; });
  if (JSON.stringify(prog) !== JSON.stringify(st.prog || {})) {
    H.state = { ...st, prog };
    clearTimeout(H.pt); H.pt = setTimeout(() => H.N.set("games/" + H.code + "/state", H.state).catch(() => {}), 600);
  }
  if (H.rq !== "play" + st.r) {
    H.rq = "play" + st.r;
    app.innerHTML = `<div class="kick" style="margin-bottom:6px">Round ${st.r + 1} of ${H.meta.rounds} · Manage the employee</div>`
      + empHTML(e, { right: `<div class="clock"><div class="secs big">${K.clockText(secs)}</div><div class="count" id="cnt"></div></div>` })
      + `<div class="stepkey"><span><b>1</b> Diagnose</span><span><b>2</b> Pick a style</span><span><b>3</b> Opening line</span><span><b>4</b> Follow-up</span></div>
      <div class="gprog" id="gp"></div>
      <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn" id="close">Close it now</button></div>`;
    $("#close").onclick = () => hostClose();
    K.startTimer(app, secs, st.endsAt, () => setTimeout(hostClose, 3000));
    K.fit();
  }
  $("#cnt").textContent = `${done} of ${st.groups.length} groups done`;
  $("#gp").innerHTML = st.groups.map((g, i) => { const n = stepsDone(picks[i]);
    return `<div class="gp ${n === 4 ? "done" : ""}"><span class="pn">${i + 1}</span><div class="pips">${[1, 2, 3, 4].map(k => `<i class="${k <= n ? "on" : ""}"></i>`).join("")}</div></div>`; }).join("");
  if (st.groups.length && done >= st.groups.length && !H.closing) { H.closing = setTimeout(() => { H.closing = null; if (H.state.phase === "play") hostClose(); }, 2500); }
}
async function hostClose() {
  if (H.state.phase !== "play" || H.closingNow) return; H.closingNow = true; K.stopTick(); clearTimeout(H.pt);
  try { H.players = (await H.N.get(`games/${H.code}/players`)) || H.players; } catch (e) {}
  const st = H.state, e = emp(H.meta, st.r);
  const picks = st.groups.map(g => groupPick(g, st.r, H.players));
  const res = picks.map(c => S.score(e, c));
  const tot = { ...(st.tot || {}) }, rp = {};
  st.groups.forEach((g, i) => g.forEach(p => { rp[p] = res[i].total; tot[p] = (tot[p] || 0) + res[i].total; }));
  const cnt = k => { const o = { 1: 0, 2: 0, 3: 0, 4: 0 }; picks.forEach(c => { if (c && c[k] != null) o[c[k]]++; }); return o; };
  const lineCnt = [0, 0, 0, 0]; picks.forEach(c => { if (c && c.o != null) lineCnt[c.o]++; });
  const log = [...(st.log || []), { r: st.r, id: e.id, n: picks.length, diagRight: picks.filter(c => c && c.d === e.d).length, styleRight: picks.filter(c => c && c.s === e.d).length, avg: res.reduce((a, x) => a + x.total, 0) / Math.max(1, res.length) }];
  H.closingNow = false;
  hostSet({ ...st, phase: "reveal", picks, res, rp, tot, dc: cnt("d"), sc: cnt("s"), lc: lineCnt, log, prog: {}, names: K.namesMap(H) });
}
function hostReveal() {
  const st = H.state, e = emp(H.meta, st.r);
  const best = e.lines.findIndex(l => l.s === e.d), bestF = e.follow.findIndex(f => f.pts === 2), n = st.groups.length;
  app.innerHTML = `<div class="hostbar"><div><div class="kick">Round ${st.r + 1} of ${H.meta.rounds} · The reveal</div><h2>${esc(e.name)} is ${esc(lvlTag(e.d))}</h2></div>
    <p>${esc(e.need)}</p></div>
    <div class="revgrid"><div>
      <div class="skh">How the class diagnosed ${esc(e.name)}</div>
      ${K.bars([1, 2, 3, 4].map(k => ({ label: S.LEVELS[k].code + " " + S.LEVELS[k].name, value: st.dc[k], max: n, text: plural(st.dc[k], "group"), hi: k === e.d })), { max: n })}
      <div class="skh" style="margin-top:10px">Style the class picked</div>
      ${K.bars([1, 2, 3, 4].map(k => ({ label: styTag(k), value: st.sc[k], max: n, text: plural(st.sc[k], "group"), hi: k === e.d })), { max: n })}
    </div><div>
      <div class="perfect small"><div class="ph"><span class="star">★</span>Best opening line<em>${esc(styTag(e.d))}</em></div><p>“${esc(e.lines[best].t)}”</p>
        <div class="react">${esc(e.name)}: ${esc(e.lines[best].react)}</div></div>
      <div class="perfect small" style="margin-top:10px"><div class="ph"><span class="star">★</span>Best follow-up</div><p>${esc(e.follow[bestF].t)}</p><div class="react">${esc(e.follow[bestF].react)}</div></div>
      <div class="skh" style="margin-top:10px">Group scores (out of ${S.MAX})</div>
      <div class="gscores">${st.groups.map((g, i) => `<div><span class="pn">${i + 1}</span><span class="gn">${esc(g.map(p => K.nameOf(H, p)).join(" & "))}</span><b>${st.res[i].total}</b></div>`).join("")}</div>
    </div></div>
    <div class="row" style="justify-content:center;margin-top:14px"><button class="btn main" id="nx">Leaderboard →</button></div>`;
  $("#nx").onclick = () => hostSet({ ...st, phase: "results" });
  K.fit();
}
function hostResults() {
  const st = H.state, last = st.r >= H.meta.rounds - 1, list = K.standings(st).slice(0, 10);
  app.innerHTML = `<div class="hostbar"><div><div class="kick">Round ${st.r + 1} of ${H.meta.rounds}</div><h2>Leaderboard</h2></div>
    <p>${last ? "Last round done. Points are final." : "Next round: new groups and a new employee."}</p></div>
    <div class="lbx">${list.map((x, i) => `<div><span class="r">${i + 1}</span><span class="n">${esc(K.nameOf(H, x.p))}</span><em>+${num((st.rp || {})[x.p] || 0)}</em><b>${num(x.s)}</b></div>`).join("")}</div>
    <div class="row" style="justify-content:center;margin-top:14px"><button class="btn main" id="nx">${last ? "Final results →" : `New groups for Round ${st.r + 2} →`}</button></div>`;
  $("#nx").onclick = () => last ? hostSet({ ...st, phase: "end" })
    : hostSet({ phase: "seat", r: st.r + 1, groups: K.groupUp(K.activeIds(H), st.hist || {}, H.meta.size), hist: st.hist, tot: st.tot, log: st.log, names: K.namesMap(H) });
  K.fit();
}
function hostEnd() {
  if (H.rq === "end") return; H.rq = "end";
  K.finale(H, "Shift Manager · Final", "Top 5 Managers", classResults, hostErase, () => { cleanupHost(); home(); });
}
function classResults() {
  document.body.classList.remove("finale-on");
  const st = H.state, list = K.standings(st);
  app.innerHTML = `<div class="rep"><h2>Class results</h2><div class="endgrid">
    <div class="skills"><div class="skh">Diagnosed the level correctly</div>${(st.log || []).map(x => { const e = S.byId[x.id], p = x.n ? x.diagRight / x.n : 0;
      return `<div class="sk"><span><b>${esc(e.name)}${e.twist ? " (" + esc(e.twist) + ")" : ""}</b><br><small>${esc(lvlTag(e.d))}</small></span><div class="bar"><i class="${p >= .7 ? "" : p >= .4 ? "mid" : "lo"}" style="width:${Math.max(4, p * 100)}%"></i></div><span class="v">${x.diagRight}/${x.n}</span></div>`; }).join("")}
      <div class="skh" style="margin-top:10px">Debrief</div>
      <ol class="debrief"><li>Which employee was hardest to read? What clue did groups miss?</li><li>Marcus was D4 in one round and D1 in another. What does that tell you about development levels?</li><li>Did the rush order make anyone more directive? Was that the right move?</li><li>Which opening line got the worst reaction? Why?</li></ol></div>
    <div class="skills"><div class="skh">Final standings</div><ol class="stand">${list.map(x => `<li><span>${esc(K.nameOf(H, x.p))}</span><em>${num(x.s)}</em></li>`).join("")}</ol></div></div>
    <div class="row" style="justify-content:center;margin-top:14px"><button class="btn main" id="pod">Back to Top 5</button><button class="btn" id="erase">Erase game</button></div></div>`;
  $("#pod").onclick = () => { H.rq = null; hostEnd(); }; $("#erase").onclick = hostErase;
  K.fit();
}
function cleanupHost() { K.stopTick(); if (H && H.off) H.off(); }
async function hostErase() { if (!H) return home(); cleanupHost(); try { await H.N.remove("games/" + H.code); } catch (e) {} H = null; home(); }

/* ============================================================ STUDENT */
let ME = null;
const SESS = K.sess("shiftSession");
async function stuStart() {
  const N = await K.net("shiftMock").catch(() => null); if (!N) return K.needSetup(hdr());
  K.joinForm({ N, game: GAME, title: "Shift Manager", sessKey: "shiftSession", hdr: hdr(), onJoined: ctx => {
    if (ME && ME.off) ME.off();
    ME = { N, ...ctx, sm: { ...((ctx.rec && ctx.rec.sm) || {}) }, st: null, rq: null };
    ME.off = N.on(`games/${ctx.code}/state`, s => { if (!ME) return; if (!s) return gameGone(); ME.st = s; stuRender(); });
  } });
}
function gameGone() { K.stopTick(); if (ME && ME.off) ME.off(); ME = null; SESS.clear();
  app.innerHTML = `<div class="wait"><h2>The game has ended</h2><p>Your teacher closed this game.</p><button class="btn main" id="h">OK</button></div>`; $("#h").onclick = home; }
const myTotal = st => (st.tot && st.tot[ME.pid]) || 0;
const mateNames = st => { const g = st.groups[K.groupOf(st, ME.pid)] || []; return g.filter(p => p !== ME.pid).map(p => (st.names || {})[p] || "a teammate"); };
function stuRender() {
  const M = ME, st = M.st; if (!st) return;
  const gi = st.groups ? K.groupOf(st, M.pid) : -1, inPlay = gi >= 0 || st.phase === "lobby" || st.phase === "end";
  const key = st.phase + "|" + st.r + "|" + (st.phase === "seat" ? JSON.stringify(st.groups) : "");
  if (key === M.rq) { if (st.phase === "play") playSync(); return; }
  M.rq = key;
  if (st.phase === "lobby") { app.innerHTML = `<div class="wait"><h2>You're in, ${esc(M.name)}!</h2><p>Watch the board. Your teacher will put everyone in groups.</p></div>`; return; }
  if (st.phase === "end") return stuEnd();
  if (!inPlay) { K.stopTick(); app.innerHTML = `<div class="wait"><h2>You're in, ${esc(M.name)}</h2><p>This round already started. You'll join a group next round.</p><div class="big">${num(myTotal(st))}</div><p>points</p></div>`; return; }
  if (st.phase === "seat") {
    K.stopTick(); const mates = mateNames(st);
    app.innerHTML = `<div class="wait seat"><div class="kick">Round ${st.r + 1} of ${M.meta.rounds}</div><p>Your group</p>
      <div class="tablebig mate">${mates.length ? esc(andList(mates)) : "Solo"}</div><p>Find them and sit together. One device is enough, but any of you can tap.</p><div class="tot">${num(myTotal(st))} points so far</div></div>`;
    return;
  }
  if (st.phase === "play") { M.pick = mergedPick(); return drawPlay(true); }
  if (st.phase === "reveal") return stuReveal();
  if (st.phase === "results") return stuResults();
}
// my local picks, or my group's newer picks from the teacher screen's sync
function mergedPick() {
  const st = ME.st, gi = K.groupOf(st, ME.pid), mine = ME.sm[st.r] || null, grp = st.prog && st.prog[gi];
  if (grp && (!mine || (grp.at || 0) > (mine.at || 0))) return { ...grp };
  return mine ? { ...mine } : {};
}
function playSync() { const p = mergedPick(); if (JSON.stringify(p) !== JSON.stringify(ME.pick)) { ME.pick = p; drawPlay(false); } }
function savePick(patch) {
  const r = ME.st.r; ME.pick = { ...ME.pick, ...patch, at: Date.now() }; ME.sm[r] = ME.pick;
  ME.N.update(`games/${ME.code}/players/${ME.pid}`, { ["sm/" + r]: ME.pick }).catch(() => {});
  drawPlay(false);
}
function drawPlay(fresh) {
  const M = ME, st = M.st, r = st.r, e = emp(M.meta, r), p = M.pick || {}, secs = M.meta.secs;
  const mates = mateNames(st), lockedTop = p.o != null, doneAll = p.f != null;
  const lo = S.lineOrder(M.meta.seed, r), fo = S.followOrder(M.meta.seed, r);
  const opt = (k, n, on, dis, small) => `<button class="sopt ${on ? "on" : ""}" data-k="${k}" data-v="${n}" ${dis ? "disabled" : ""}><b>${esc(small[0])}</b><small>${esc(small[1])}</small></button>`;
  const html = `<div class="kick">Round ${r + 1} of ${M.meta.rounds}${mates.length ? ` · with ${esc(andList(mates))}` : ""}</div>
    ${K.timerHTML(secs)}
    ${empHTML(e)}
    <div class="step"><span>1</span>Diagnose: what's ${esc(e.name)}'s development level for this task?</div>
    <div class="sopts four">${[1, 2, 3, 4].map(n => opt("d", n, p.d === n, lockedTop, [S.LEVELS[n].code + " " + S.LEVELS[n].name, S.LEVELS[n].sub])).join("")}</div>
    ${p.d != null ? `<div class="step"><span>2</span>Pick your leadership style</div>
    <div class="sopts four">${[1, 2, 3, 4].map(n => opt("s", n, p.s === n, lockedTop, [S.STYLES[n].code + " " + S.STYLES[n].name, S.STYLES[n].sub])).join("")}</div>` : ""}
    ${p.s != null ? `<div class="step"><span>3</span>What do you say first?</div>
    <div class="vlist">${lo.map(i => `<button class="vopt line ${p.o === i ? "on" : ""}" data-k="o" data-v="${i}" ${lockedTop ? "disabled" : ""}><p>“${esc(e.lines[i].t)}”</p></button>`).join("")}</div>
    ${!lockedTop ? `<p class="note">Your first two picks lock once you speak.</p>` : `<div class="react big">${esc(e.name)}: ${esc(e.lines[p.o].react)}</div>`}` : ""}
    ${lockedTop ? `<div class="step"><span>4</span>Your follow-up move</div>
    <div class="vlist">${fo.map(i => `<button class="vopt ${p.f === i ? "on" : ""}" data-k="f" data-v="${i}" ${doneAll ? "disabled" : ""}><p>${esc(e.follow[i].t)}</p></button>`).join("")}</div>
    ${doneAll ? `<div class="react big">${esc(e.follow[p.f].react)}</div><div class="fb"><b>Locked in</b>Watch the board for the reveal.</div>` : ""}` : ""}`;
  const y = window.scrollY;
  app.innerHTML = `<div class="qwrap play">${html}</div>`;
  if (!fresh) window.scrollTo(0, y);
  app.querySelectorAll("[data-k]").forEach(b => b.onclick = () => {
    const k = b.dataset.k, v = +b.dataset.v;
    if (k === "d") savePick({ d: v }); else if (k === "s") savePick({ s: v }); else if (k === "o") savePick({ o: v }); else savePick({ f: v });
    if (k === "o" || k === "f") setTimeout(() => { const all = app.querySelectorAll(".react.big"), el = all[all.length - 1]; if (el) el.scrollIntoView({ behavior: "smooth", block: "center" }); }, 50);
  });
  K.startTimer(app, secs, st.endsAt, () => { const t = app.querySelector(".secs"); if (t) t.textContent = "Time"; });
}
function stuReveal() {
  K.stopTick(); const M = ME, st = M.st, e = emp(M.meta, st.r), gi = K.groupOf(st, M.pid), p = (st.picks && st.picks[gi]) || {}, x = (st.res && st.res[gi]) || { diag: 0, style: 0, line: 0, follow: 0, total: 0 };
  const row = (label, yours, right, pts, max) => `<div class="cmp"><span class="cl">${label}</span><span class="cy ${pts === max ? "ok" : pts ? "mid" : "no"}">${esc(yours)}</span><span class="cr">${esc(right)}</span><b>+${pts}</b></div>`;
  app.innerHTML = `<div class="wait rv"><div class="kick">Round ${st.r + 1} · The reveal</div><h2>${esc(e.name)} is ${esc(S.LEVELS[e.d].code)}</h2><p>${esc(e.need)}</p>
    <div class="cmpwrap"><div class="cmp head"><span></span><span>Your group</span><span>Best</span><b>Pts</b></div>
      ${row("Level", p.d ? S.LEVELS[p.d].code : "No pick", S.LEVELS[e.d].code, x.diag, 3)}
      ${row("Style", p.s ? styTag(p.s) : "No pick", styTag(e.d), x.style, 3)}
      ${row("Opening", p.o != null ? S.STYLES[e.lines[p.o].s].name + " line" : "No pick", S.STYLES[e.d].name + " line", x.line, 2)}
      ${row("Follow-up", p.f != null ? ["Weak", "OK", "Best"][e.follow[p.f].pts] : "No pick", "Best", x.follow, 2)}</div>
    <div class="big">+${x.total}</div><p>out of ${S.MAX} · ${num(myTotal(st))} total</p></div>`;
}
function stuResults() {
  const M = ME, st = M.st, list = K.standings(st), rank = list.findIndex(y => y.p === M.pid) + 1, last = st.r >= M.meta.rounds - 1;
  app.innerHTML = `<div class="wait"><div class="kick">Round ${st.r + 1} results</div><h2>+${num((st.rp || {})[M.pid] || 0)} this round</h2>
    <p style="margin-top:14px"><b>${num(myTotal(st))}</b> points total${rank ? " · " + ord(rank) + " of " + list.length : ""}</p>
    <p>${last ? "That was the last round. Watch the board for the final results." : "Next round you get a new group."}</p></div>`;
}
function stuEnd() {
  K.stopTick(); const M = ME, st = M.st, list = K.standings(st), i = list.findIndex(x => x.p === M.pid);
  app.innerHTML = `<div class="wait"><div class="kick">Shift Manager · Final</div><h2>${i >= 0 ? `You finished ${ord(i + 1)} of ${list.length}` : "Game over"}</h2>
    <div class="big">${num(myTotal(st))}</div><p>total points</p></div>`;
  SESS.clear();
}

home();
