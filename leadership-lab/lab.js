/* Leadership Lab: a live leadership-style experiment with a real paper tower build.
   Students join with their first name and get new groups of 2 or 3 every round (the teacher picks the size).
   Each round:
     1. Brief   - one person in each group becomes the leader and gets a SECRET leadership style on their device
     2. Build   - groups build the tallest freestanding paper tower; the leader must lead in their secret style
     3. Report  - everyone privately rates the round; builders guess the leader's style; someone enters the height
     4. Reveal  - the projector shows every group's style, height, satisfaction, and stress, plus a scatter chart
   Points: up to 10 for height (compared with the tallest tower that round), +3 for guessing the style,
   and the leader gets +2 for every teammate who guessed it (they stayed in character).
   The teacher screen does all the scoring; student devices only write their own record.
   Storage: /api/live (codes under ibl:), same as Boss Moves. */
"use strict";
const L = window.LAB, K = window.KIT;
const { $, esc, num, ord, plural, andList, ROLE } = K;
const app = $("#app");
const GAME = "lab";
const PATH = "/leadership-lab/";
const sty = id => L.STYLES[id];

const hdr = () => `<h1 class="title">Leadership <span>Lab.</span></h1>
  <p class="lede">${ROLE === "teacher"
    ? "Teacher screen for the projector. Groups of 2 or 3 build a paper tower each round while one person leads with a secret leadership style from their device. Then everyone reports how it felt, guesses the style, and the class compares the data."
    : "Join with your first name. Each round your group builds a paper tower and one of you leads with a secret leadership style. Rate how it felt, guess the style, and see what the data says."}</p>`;

function home() { K.stopTick(); document.body.classList.remove("wide", "finale-on"); app.style.zoom = ""; $("#who").hidden = true; ROLE === "teacher" ? hostSetup() : stuStart(); }

// leaders: whoever in the group has led the fewest times; styles: dealt from a shuffled deck so the class sees a spread
function assignRoles(groups, led, prevLeaders, prevStyles) {
  const deck = []; while (deck.length < groups.length) deck.push(...K.shuffle(L.ORDER));
  return {
    leaders: groups.map((g, i) => (prevLeaders && g.includes(prevLeaders[i])) ? prevLeaders[i] : K.shuffle(g).sort((a, b) => (led[a] || 0) - (led[b] || 0))[0]),
    styles: groups.map((g, i) => (prevStyles && prevStyles[i]) || deck[i])
  };
}

/* ============================================================ HOST */
let H = null;
async function hostSetup() {
  const N = await K.net("labMock").catch(() => null); if (!N) return K.needSetup(hdr());
  const cfg = { rounds: 2, build: 480, size: 3 };
  app.innerHTML = `${hdr()}<div class="panel wide-panel"><h2>Host a game</h2>
    <p>Group size:</p><div class="seg" data-k="size"><button data-v="2">Groups of 2</button><button data-v="3" aria-pressed="true">Groups of 3</button></div>
    <p>Rounds (a new leader and a new style each round):</p><div class="seg" data-k="rounds"><button data-v="1">1</button><button data-v="2" aria-pressed="true">2</button><button data-v="3">3</button><button data-v="4">4</button></div>
    <p>Build time:</p><div class="seg" data-k="build"><button data-v="300">5 min</button><button data-v="480" aria-pressed="true">8 min</button><button data-v="600">10 min</button></div>
    <p class="note"><b>Materials:</b> ${esc(L.MATERIALS)} Hand out fresh materials each round.</p>
    <p class="note">Scoring: up to ${L.PTS.height} for height (the tallest tower gets ${L.PTS.height}), +${L.PTS.guess} for guessing the leader's style, and the leader gets +${L.PTS.leader} for each teammate who guessed it.</p>
    <div class="err" id="er"></div><button class="btn main" id="go">Create game</button></div>`;
  app.querySelectorAll(".seg[data-k]").forEach(sg => sg.onclick = e => { const b = e.target.closest("button"); if (!b) return;
    [...sg.children].forEach(x => x.setAttribute("aria-pressed", x === b)); cfg[sg.dataset.k] = +b.dataset.v; });
  $("#go").onclick = async () => {
    $("#go").disabled = true;
    try {
      const code = await K.newCode(N);
      const meta = { created: Date.now(), game: GAME, rounds: cfg.rounds, build: cfg.build, size: cfg.size };
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
  if (fromPlayers && !["lobby", "seat", "report"].includes(st.phase)) return;
  ({ lobby: hostLobby, seat: hostSeat, brief: hostBrief, build: hostBuild, report: hostReport, reveal: hostReveal, results: hostResults, end: hostEnd })[st.phase](fromPlayers);
}
function newRound(r, prev) {
  const groups = K.groupUp(K.activeIds(H), prev.hist || {}, H.meta.size), roles = assignRoles(groups, prev.led || {});
  return { phase: "seat", r, groups, leaders: roles.leaders, styles: roles.styles, hist: prev.hist || {}, led: prev.led || {}, tot: prev.tot || {}, log: prev.log || [], names: K.namesMap(H) };
}
function hostLobby() {
  app.innerHTML = K.lobbyHTML(H, "Leadership Lab", PATH, `${plural(H.meta.rounds, "round")} · new group and new leader every round · bring paper and tape`);
  $("#start").onclick = () => hostSet(newRound(0, {}));
  $("#end").onclick = hostErase;
  K.fit();
}
function hostSeat(fromPlayers) {
  const st = H.state, patched = K.patchGroups(st.groups, K.activeIds(H), H.meta.size);
  if (JSON.stringify(patched) !== JSON.stringify(st.groups)) {
    const roles = assignRoles(patched, st.led || {}, st.leaders, st.styles);
    return hostSet({ ...st, groups: patched, leaders: roles.leaders, styles: roles.styles, names: K.namesMap(H) });
  }
  if (fromPlayers && H.rq === "seat") return;
  H.rq = "seat";
  app.innerHTML = K.seatHTML(H, { sub: "Sit together and grab your materials. The person with the crown leads this round.", go: "Everyone's ready: leaders, read your secret card",
    mark: (p, i) => st.leaders[i] === p ? "👑" : "" });
  $("#go").onclick = () => {
    const led = { ...(st.led || {}) }; st.leaders.forEach(p => led[p] = (led[p] || 0) + 1);
    hostSet({ ...st, phase: "brief", led, hist: K.addHist(st.hist, st.groups), names: K.namesMap(H) });
  };
  K.bindRemove(H, () => { H.rq = null; hostSeat(); });
  K.fit();
}
const rulesHTML = () => `<div class="rules"><div class="skh">The rules</div><ol>${L.RULES.map(r => `<li>${esc(r)}</li>`).join("")}</ol></div>`;
function hostBrief() {
  const st = H.state;
  app.innerHTML = `<div class="hostbar"><div><div class="kick">Round ${st.r + 1} of ${H.meta.rounds} · Brief</div><h2>Leaders: read your secret card</h2></div>
    <p>Leaders, keep your screen to yourself. Builders, watch closely: you'll guess your leader's style at the end.</p></div>
    ${rulesHTML()}
    <div class="row" style="justify-content:center;margin-top:16px"><button class="btn main" id="go">Start the ${K.clockText(H.meta.build)} build</button></div>`;
  $("#go").onclick = () => hostSet({ ...st, phase: "build", endsAt: Date.now() + H.meta.build * 1000 });
  K.fit();
}
function hostBuild() {
  const st = H.state;
  app.innerHTML = `<div class="buildscreen"><div class="kick">Round ${st.r + 1} of ${H.meta.rounds} · Build</div>
    <div class="megaclock secs">${K.clockText(H.meta.build)}</div>${K.timerHTML(H.meta.build)}
    ${rulesHTML()}
    <div class="row" style="justify-content:center;margin-top:12px"><button class="btn" id="stop">Stop the build now</button></div></div>`;
  const toReport = () => { if (H.state.phase === "build") hostSet({ ...H.state, phase: "report" }); };
  $("#stop").onclick = toReport;
  K.startTimer(app, H.meta.build, st.endsAt, () => {
    K.beep(523, .4); const m = app.querySelector(".megaclock"); if (m) m.textContent = "Hands off!";
    const sub = document.createElement("p"); sub.className = "note"; sub.style.textAlign = "center"; sub.textContent = "Towers must stand for 10 seconds. Reports open in 12 seconds.";
    app.querySelector(".buildscreen").appendChild(sub); setTimeout(toReport, 12000);
  });
  K.fit();
}
const rec = (p, r) => (H.players[p] && H.players[p].ll && H.players[p].ll[r]) || null;
function groupHeight(g, r) { let best = null; g.forEach(p => { const x = rec(p, r); if (x && x.h != null && (!best || (x.at || 0) > (best.at || 0))) best = x; }); return best ? best.h : null; }
function hostReport() {
  const st = H.state, r = st.r;
  const status = st.groups.map(g => ({ done: g.filter(p => (rec(p, r) || {}).done).length, n: g.length, h: groupHeight(g, r) }));
  const all = status.every(s => s.done >= s.n);
  if (H.rq !== "report" + r) {
    H.rq = "report" + r;
    app.innerHTML = `<div class="hostbar"><div><div class="kick">Round ${r + 1} of ${H.meta.rounds} · Report</div><h2>Measure, rate, and guess</h2></div>
      <p>One person enters the tower height (0 if it fell). Everyone rates the round privately. Builders guess the style. No talking about the style yet!</p></div>
      <div class="gprog" id="gp"></div>
      <div class="row" style="justify-content:center;margin-top:14px"><button class="btn main" id="rv">Reveal the results</button></div>`;
    $("#rv").onclick = hostReveal0;
    K.fit();
  }
  $("#gp").innerHTML = status.map((s, i) => `<div class="gp ${s.done >= s.n ? "done" : ""}"><span class="pn">${i + 1}</span><div class="gpt"><b>${s.h != null ? s.h + " cm" : "No height yet"}</b><small>${s.done} of ${s.n} reported</small></div></div>`).join("");
  if (all && !H.closing) { H.closing = setTimeout(() => { H.closing = null; if (H.state.phase === "report") hostReveal0(); }, 2500); }
}
async function hostReveal0() {
  if (H.state.phase !== "report" || H.closingNow) return; H.closingNow = true;
  try { H.players = (await H.N.get(`games/${H.code}/players`)) || H.players; } catch (e) {}
  const st = H.state, r = st.r;
  const rows = st.groups.map((g, i) => {
    const lead = st.leaders[i], s = st.styles[i], h = Math.max(0, Math.min(500, +groupHeight(g, r) || 0));
    const builders = g.filter(p => p !== lead), br = builders.map(p => rec(p, r) || {}), lr = rec(lead, r) || {};
    const avg = a => { const v = a.filter(x => x != null); return v.length ? v.reduce((x, y) => x + y, 0) / v.length : null; };
    const right = builders.filter(p => (rec(p, r) || {}).g === s);
    return { i, lead, s, h, sat: avg(br.map(x => x.sat)), str: avg([...br, lr].map(x => x.str)), nat: lr.nat ?? null, ideas: avg(br.map(x => x.ideas)), right, nb: builders.length, guesses: Object.fromEntries(builders.map(p => [p, (rec(p, r) || {}).g || null])) };
  });
  const maxH = Math.max(0, ...rows.map(x => x.h));
  const tot = { ...(st.tot || {}) }, rp = {};
  const add = (p, v) => { rp[p] = (rp[p] || 0) + v; tot[p] = (tot[p] || 0) + v; };
  rows.forEach(x => { const hp = maxH > 0 ? Math.round(L.PTS.height * x.h / maxH) : 0; x.hp = hp;
    st.groups[x.i].forEach(p => add(p, hp)); x.right.forEach(p => add(p, L.PTS.guess)); add(x.lead, L.PTS.leader * x.right.length); });
  const log = [...(st.log || []), ...rows.map(x => ({ r, s: x.s, h: x.h, sat: x.sat, str: x.str, nat: x.nat, right: x.right.length, nb: x.nb }))];
  H.closingNow = false;
  hostSet({ ...st, phase: "reveal", rows, maxH, rp, tot, log, names: K.namesMap(H) });
}
const f1 = v => v == null ? "–" : (Math.round(v * 10) / 10).toFixed(1);
function scatter(points, maxH) {
  const W = 560, Hh = 300, pl = 46, pb = 40, pt = 30, pr = 30, xm = Math.max(10, Math.ceil(maxH * 1.1 / 10) * 10);
  const X = h => pl + (h / xm) * (W - pl - pr), Y = s => pt + (1 - (s - 1) / 4) * (Hh - pt - pb);
  const grid = [1, 2, 3, 4, 5].map(s => `<line x1="${pl}" x2="${W - pr}" y1="${Y(s)}" y2="${Y(s)}" class="gl"/><text x="${pl - 10}" y="${Y(s) + 5}" text-anchor="end">${s}</text>`).join("");
  const xt = [0, .25, .5, .75, 1].map(f => `<text x="${X(f * xm)}" y="${Hh - pb + 20}" text-anchor="middle">${Math.round(f * xm)}</text>`).join("");
  const dots = points.filter(p => p.sat != null).map(p => `<g><circle cx="${X(p.h)}" cy="${Y(p.sat)}" r="9" class="dot"/><text x="${X(p.h)}" y="${Y(p.sat) - 14}" text-anchor="middle" class="dl">${esc(p.label)}</text></g>`).join("");
  return `<svg class="scatter" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Tower height versus team satisfaction">
    ${grid}${xt}<line x1="${pl}" x2="${W - pr}" y1="${Hh - pb}" y2="${Hh - pb}" class="ax"/><line x1="${pl}" x2="${pl}" y1="${pt}" y2="${Hh - pb}" class="ax"/>
    <text x="${(W + pl) / 2}" y="${Hh - 4}" text-anchor="middle" class="at">Tower height (cm)</text>
    <text x="12" y="${(Hh - pb) / 2}" text-anchor="middle" class="at" transform="rotate(-90 12 ${(Hh - pb) / 2})">Satisfaction</text>${dots}</svg>`;
}
function hostReveal() {
  const st = H.state;
  app.innerHTML = `<div class="hostbar"><div><div class="kick">Round ${st.r + 1} of ${H.meta.rounds} · The reveal</div><h2>What each leader was doing</h2></div>
    <p>Look for patterns: which styles built tall, and which ones kept the team happy?</p></div>
    <div class="labrev"><div><table class="labtable"><thead><tr><th>#</th><th>Leader</th><th>Secret style</th><th>Height</th><th>Satisfied</th><th>Stress</th><th>Guessed</th></tr></thead>
      <tbody>${st.rows.map(x => `<tr><td><span class="pn">${x.i + 1}</span></td><td>${esc(K.nameOf(H, x.lead))}</td><td><b>${esc(sty(x.s).name)}</b></td><td>${x.h} cm</td><td>${f1(x.sat)}</td><td>${f1(x.str)}</td><td>${x.right.length}/${x.nb}</td></tr>`).join("")}</tbody></table>
      <p class="note">Satisfied and Stress are averages on a 1 to 5 scale. Satisfaction is builders only; stress includes the leader.</p></div>
      <div><div class="skh">Height vs. satisfaction</div>${scatter(st.rows.map(x => ({ h: x.h, sat: x.sat, label: (x.i + 1) + " " + sty(x.s).short })), st.maxH)}</div></div>
    <div class="row" style="justify-content:center;margin-top:14px"><button class="btn main" id="nx">Leaderboard →</button></div>`;
  $("#nx").onclick = () => hostSet({ ...st, phase: "results" });
  K.fit();
}
function hostResults() {
  const st = H.state, last = st.r >= H.meta.rounds - 1, list = K.standings(st).slice(0, 10);
  app.innerHTML = `<div class="hostbar"><div><div class="kick">Round ${st.r + 1} of ${H.meta.rounds}</div><h2>Leaderboard</h2></div>
    <p>${last ? "Last round done. Points are final." : "Next round: new groups, a new leader, and fresh materials."}</p></div>
    <div class="lbx">${list.map((x, i) => `<div><span class="r">${i + 1}</span><span class="n">${esc(K.nameOf(H, x.p))}</span><em>+${num((st.rp || {})[x.p] || 0)}</em><b>${num(x.s)}</b></div>`).join("")}</div>
    <div class="row" style="justify-content:center;margin-top:14px"><button class="btn main" id="nx">${last ? "Final results →" : `New groups for Round ${st.r + 2} →`}</button></div>`;
  $("#nx").onclick = () => last ? hostSet({ ...st, phase: "end" }) : hostSet(newRound(st.r + 1, st));
  K.fit();
}
function hostEnd() {
  if (H.rq === "end") return; H.rq = "end";
  K.finale(H, "Leadership Lab · Final", "Top 5 Builders", classResults, hostErase, () => { cleanupHost(); home(); });
}
function styleSummary(log) {
  const by = {}; (log || []).forEach(x => { const o = by[x.s] || (by[x.s] = { n: 0, h: 0, sat: [], str: [] }); o.n++; o.h += x.h; if (x.sat != null) o.sat.push(x.sat); if (x.str != null) o.str.push(x.str); });
  const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
  return Object.entries(by).map(([s, o]) => ({ s, n: o.n, h: o.h / o.n, sat: avg(o.sat), str: avg(o.str) }));
}
function classResults() {
  document.body.classList.remove("finale-on");
  const st = H.state, sum = styleSummary(st.log), list = K.standings(st);
  const byH = sum.slice().sort((a, b) => b.h - a.h), bySat = sum.slice().sort((a, b) => b.sat - a.sat);
  app.innerHTML = `<div class="rep"><h2>Class data by style</h2><div class="endgrid">
    <div class="skills"><div class="skh">Average tower height (cm)</div>${K.bars(byH.map(x => ({ label: sty(x.s).name, sub: plural(x.n, "tower"), value: x.h, text: f1(x.h) })))}
      <div class="skh" style="margin-top:10px">Average satisfaction (1 to 5)</div>${K.bars(bySat.map(x => ({ label: sty(x.s).name, value: x.sat, max: 5, text: f1(x.sat) })), { max: 5 })}</div>
    <div class="skills"><div class="skh">Debrief</div><ol class="debrief">
      <li>Did the tallest towers come from the happiest groups? Use the data.</li>
      <li>Which style would you pick if the tower had to be done in 3 minutes? In a week?</li>
      <li>Your groups had never built towers. Which style should have won, according to situational leadership? Did it?</li>
      <li>Leaders: how did it feel to lead in a style that isn't natural for you?</li></ol>
      <div class="skh" style="margin-top:10px">Final standings</div><ol class="stand">${list.map(x => `<li><span>${esc(K.nameOf(H, x.p))}</span><em>${num(x.s)}</em></li>`).join("")}</ol></div></div>
    <div class="row" style="justify-content:center;margin-top:14px"><button class="btn main" id="pod">Back to Top 5</button><button class="btn" id="erase">Erase game</button></div></div>`;
  $("#pod").onclick = () => { H.rq = null; hostEnd(); }; $("#erase").onclick = hostErase;
  K.fit();
}
function cleanupHost() { K.stopTick(); if (H && H.off) H.off(); }
async function hostErase() { if (!H) return home(); cleanupHost(); try { await H.N.remove("games/" + H.code); } catch (e) {} H = null; home(); }

/* ============================================================ STUDENT */
let ME = null;
const SESS = K.sess("labSession");
async function stuStart() {
  const N = await K.net("labMock").catch(() => null); if (!N) return K.needSetup(hdr());
  K.joinForm({ N, game: GAME, title: "Leadership Lab", sessKey: "labSession", hdr: hdr(), onJoined: ctx => {
    if (ME && ME.off) ME.off();
    ME = { N, ...ctx, ll: { ...((ctx.rec && ctx.rec.ll) || {}) }, st: null, rq: null };
    ME.off = N.on(`games/${ctx.code}/state`, s => { if (!ME) return; if (!s) return gameGone(); ME.st = s; stuRender(); });
  } });
}
function gameGone() { K.stopTick(); if (ME && ME.off) ME.off(); ME = null; SESS.clear();
  app.innerHTML = `<div class="wait"><h2>The game has ended</h2><p>Your teacher closed this game.</p><button class="btn main" id="h">OK</button></div>`; $("#h").onclick = home; }
const myTotal = st => (st.tot && st.tot[ME.pid]) || 0;
const gi = () => K.groupOf(ME.st, ME.pid);
const amLeader = () => { const i = gi(); return i >= 0 && ME.st.leaders && ME.st.leaders[i] === ME.pid; };
const leaderName = () => { const i = gi(), p = ME.st.leaders && ME.st.leaders[i]; return (ME.st.names || {})[p] || "your leader"; };
const mateNames = () => { const g = ME.st.groups[gi()] || []; return g.filter(p => p !== ME.pid).map(p => (ME.st.names || {})[p] || "a teammate"); };
const cardHTML = (s, compact) => `<div class="secret ${compact ? "compact" : ""}"><div class="sh">Your secret style<span>Don't show anyone</span></div><h2>${esc(sty(s).name)}</h2>
  <ol>${sty(s).card.map(c => `<li>${esc(c)}</li>`).join("")}</ol>${compact ? "" : `<p>Stay in character the whole build. You earn +${L.PTS.leader} for every teammate who guesses your style.</p>`}</div>`;
function stuRender() {
  const M = ME, st = M.st; if (!st) return;
  const i = st.groups ? gi() : -1, inPlay = i >= 0 || st.phase === "lobby" || st.phase === "end";
  const key = st.phase + "|" + st.r + "|" + (st.phase === "seat" ? JSON.stringify(st.groups) + JSON.stringify(st.leaders) : "");
  if (key === M.rq) return; M.rq = key;
  K.stopTick();
  if (st.phase === "lobby") { app.innerHTML = `<div class="wait"><h2>You're in, ${esc(M.name)}!</h2><p>Watch the board. Your teacher will put everyone in groups.</p></div>`; return; }
  if (st.phase === "end") return stuEnd();
  if (!inPlay) { app.innerHTML = `<div class="wait"><h2>You're in, ${esc(M.name)}</h2><p>This round already started. You'll join a group next round.</p><div class="big">${num(myTotal(st))}</div><p>points</p></div>`; return; }
  const mates = mateNames();
  if (st.phase === "seat") {
    app.innerHTML = `<div class="wait seat"><div class="kick">Round ${st.r + 1} of ${M.meta.rounds}</div><p>Your group</p>
      <div class="tablebig mate">${mates.length ? esc(andList(mates)) : "Solo"}</div>
      <div class="rolebadge ${amLeader() ? "lead" : ""}">${amLeader() ? "👑 You are the leader this round" : `👑 ${esc(leaderName())} leads this round`}</div>
      <p>Find your group and grab your materials.</p><div class="tot">${num(myTotal(st))} points so far</div></div>`;
    return;
  }
  if (st.phase === "brief") {
    app.innerHTML = amLeader() ? `<div class="wait"><div class="kick">Round ${st.r + 1} · Brief</div>${cardHTML(st.styles[gi()])}</div>`
      : `<div class="wait"><div class="kick">Round ${st.r + 1} · Brief</div><h2>${esc(leaderName())} is reading a secret card</h2><p>Your leader has a secret leadership style. Watch how they lead during the build. You'll guess the style at the end and earn +${L.PTS.guess} if you're right.</p></div>`;
    return;
  }
  if (st.phase === "build") {
    app.innerHTML = `<div class="wait"><div class="kick">Round ${st.r + 1} · Build</div>${K.timerHTML(M.meta.build)}
      ${amLeader() ? cardHTML(st.styles[gi()], true) : `<h2>Build!</h2><p>Tallest freestanding tower wins. Notice how ${esc(leaderName())} is leading: who decides, how much freedom you get, and what they say.</p>`}</div>`;
    K.startTimer(app, M.meta.build, st.endsAt, () => { const s = app.querySelector(".secs"); if (s) s.textContent = "Time"; });
    return;
  }
  if (st.phase === "report") return stuReport();
  if (st.phase === "reveal") return stuReveal();
  if (st.phase === "results") return stuResults();
}
function stuReport() {
  const M = ME, st = M.st, r = st.r, lead = amLeader(), d = { ...(M.ll[r] || {}) };
  if (d.done) { app.innerHTML = `<div class="wait"><h2>Report sent</h2><p>Watch the board for the reveal. No telling anyone your guess yet!</p></div>`; return; }
  const scale = (k, lo, hi) => `<div class="scale" data-k="${k}">${[1, 2, 3, 4, 5].map(n => `<button data-v="${n}" aria-pressed="${d[k] === n}">${n}</button>`).join("")}</div><div class="scalekey"><span>${esc(lo)}</span><span>${esc(hi)}</span></div>`;
  const draw = () => {
    const ok = lead ? (d.h != null && d.nat && d.str) : (d.sat && d.str && d.ideas != null && d.g);
    app.innerHTML = `<div class="qwrap report"><div class="kick">Round ${r + 1} · Report${lead ? " · You led" : ""}</div>
      <div class="step"><span>1</span>Tower height in cm${lead ? "" : " (if your leader already entered it, skip this)"}</div>
      <input class="field" id="h" type="number" inputmode="numeric" min="0" max="500" placeholder="0 if it fell" value="${d.h ?? ""}">
      ${lead ? `<div class="step"><span>2</span>How natural did that style feel for you?</div>${scale("nat", "Not me at all", "Totally me")}
        <div class="step"><span>3</span>Your stress level during the build</div>${scale("str", "Calm", "Very stressed")}`
      : `<div class="step"><span>2</span>How much did you like working this way?</div>${scale("sat", "Hated it", "Loved it")}
        <div class="step"><span>3</span>Your stress level during the build</div>${scale("str", "Calm", "Very stressed")}
        <div class="step"><span>4</span>How many of YOUR ideas were used?</div><div class="scale" data-k="ideas">${[0, 1, 2, 3].map(n => `<button data-v="${n}" aria-pressed="${d.ideas === n}">${n === 3 ? "3+" : n}</button>`).join("")}</div>
        <div class="step"><span>5</span>Guess ${esc(leaderName())}'s secret style</div>
        <div class="sopts">${L.ORDER.map(s => `<button class="sopt ${d.g === s ? "on" : ""}" data-g="${s}"><b>${esc(sty(s).name)}</b></button>`).join("")}</div>`}
      <div class="err" id="er"></div><button class="btn main" id="send" ${ok ? "" : "disabled"}>Send my report</button></div>`;
    const y = window.scrollY;
    $("#h").oninput = e => { const v = e.target.value.trim(); d.h = v === "" ? null : Math.max(0, Math.min(500, Math.round(+v))); $("#send").disabled = !(lead ? (d.h != null && d.nat && d.str) : (d.sat && d.str && d.ideas != null && d.g)); };
    app.querySelectorAll(".scale[data-k] button").forEach(b => b.onclick = () => { d[b.parentElement.dataset.k] = +b.dataset.v; const yy = window.scrollY; draw(); window.scrollTo(0, yy); });
    app.querySelectorAll("[data-g]").forEach(b => b.onclick = () => { d.g = b.dataset.g; const yy = window.scrollY; draw(); window.scrollTo(0, yy); });
    $("#send").onclick = async () => {
      $("#send").disabled = true; const out = { ...d, done: true, at: Date.now() }; if (out.h == null) delete out.h;
      try { await M.N.update(`games/${M.code}/players/${M.pid}`, { ["ll/" + r]: out }); M.ll[r] = out; M.rq = null; stuReport(); }
      catch (e) { $("#er").textContent = "Couldn't send. Try again."; $("#send").disabled = false; }
    };
    window.scrollTo(0, y);
  };
  draw();
}
function stuReveal() {
  const M = ME, st = M.st, i = gi(), x = (st.rows || [])[i]; if (!x) return;
  const lead = x.lead === M.pid, myG = x.guesses && x.guesses[M.pid], right = myG && myG === x.s;
  app.innerHTML = `<div class="wait rv"><div class="kick">Round ${st.r + 1} · The reveal</div>
    <p>${lead ? "You led as" : esc(leaderName()) + " was leading as"}</p><h2>${esc(sty(x.s).name)}</h2>
    <div class="stats"><div class="stat"><b>${x.h} cm</b><span>Your tower</span></div><div class="stat"><b>+${x.hp}</b><span>Height points</span></div>
      ${lead ? `<div class="stat"><b>+${L.PTS.leader * x.right.length}</b><span>${x.right.length} of ${x.nb} guessed you</span></div>`
      : `<div class="stat"><b>${right ? "+" + L.PTS.guess : "+0"}</b><span>${right ? "You guessed it!" : myG ? "You guessed " + sty(myG).name : "No guess"}</span></div>`}</div>
    <p><b>+${num((st.rp || {})[M.pid] || 0)}</b> this round · ${num(myTotal(st))} total</p></div>`;
}
function stuResults() {
  const M = ME, st = M.st, list = K.standings(st), rank = list.findIndex(y => y.p === M.pid) + 1, last = st.r >= M.meta.rounds - 1;
  app.innerHTML = `<div class="wait"><div class="kick">Round ${st.r + 1} results</div><h2>${num(myTotal(st))} points</h2>
    <p>${rank ? ord(rank) + " of " + list.length : ""}</p><p>${last ? "That was the last round. Watch the board for the final results." : "Next round: new group, new leader, fresh materials."}</p></div>`;
}
function stuEnd() {
  const M = ME, st = M.st, list = K.standings(st), i = list.findIndex(x => x.p === M.pid);
  app.innerHTML = `<div class="wait"><div class="kick">Leadership Lab · Final</div><h2>${i >= 0 ? `You finished ${ord(i + 1)} of ${list.length}` : "Game over"}</h2>
    <div class="big">${num(myTotal(st))}</div><p>total points</p></div>`;
  SESS.clear();
}

home();
