/* Shift Manager: a live Situational Leadership simulation for the Management & Leadership unit.
   Students sign up individually with their first name. The teacher screen pairs everyone up (one group of 3 if the
   class has an odd number) and keeps those partners for two rounds, then rotates to new partners.
   Each round one Sole Revival employee needs a manager. The group, on any of their devices:
     1. Diagnoses the development level (D1 to D4)
     2. Picks the leadership style (S1 to S4)
     3. Picks an opening line and sees how the employee reacts
     4. Picks a follow-up move and sees what happens
     5. Writes its own one-liner to motivate the employee
   Then the projector reveals the true level, how the class read the person, and the Perfect Line.
   Everyone votes for the class one-liner closest to the Perfect Line (not their own group's), like Boss Moves.
   Points belong to each student and add up all game. The teacher screen does all the scoring and syncs each
   group's picks to every device in the group through the shared state; student devices only write their own record.
   Storage: /api/live (codes under ibl:), same as Boss Moves. */
"use strict";
const S = window.SHIFT, K = window.KIT;
const { $, esc, num, ord, plural, andList, ROLE } = K;
const app = $("#app");
const GAME = "shift";
const PATH = "/shift-manager/";
const MAXLEN = 200;
const LET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const VP = S.PTS;

const hdr = () => `<h1 class="title">Shift <span>Manager.</span></h1>
  <p class="lede">${ROLE === "teacher"
    ? "Teacher screen for the projector. Students sign up on their own devices and get paired up (one group of 3 if there's an odd number), with new partners every two rounds. Each pair manages one Sole Revival employee: diagnose the development level, pick the leadership style, choose what to say, and write a one-liner to motivate them. Then the class votes for the line closest to the Perfect Line."
    : "Join with your first name. You'll get a partner (new partners every two rounds), and every round you manage a different employee at Sole Revival. Read the person, pick the style, choose what to say, then write your own line to motivate them. The class votes on whose line comes closest to the Perfect Line. Your points add up all game."}</p>`;
const emp = (meta, r) => S.byId[meta.plan[r]];
const lvlTag = n => `${S.LEVELS[n].code} ${S.LEVELS[n].name}`;
const styTag = n => `${S.STYLES[n].code} ${S.STYLES[n].name}`;
function empHTML(e, o = {}) {
  return `<div class="case">
    <div class="chead"><div><div class="kind">Sole Revival · ${esc(e.role)}${e.twist ? ` · <span class="twist">Twist: ${esc(e.twist)}</span>` : ""}</div><h2>${esc(e.name)}</h2></div>${o.right || ""}</div>
    <div class="cbody one"><div class="cline sit"><b>What you see</b>${esc(e.see)}</div></div>
  </div>`;
}
function perfectHTML(e, o = {}) {
  return `<div class="perfect ${o.small ? "small" : ""}"><div class="ph"><span class="star">★</span>The Perfect Line<em>${esc(styTag(e.d))}</em></div>
    <p>“${esc(e.perfect)}”</p></div>`;
}

function home() { K.stopTick(); document.body.classList.remove("wide", "finale-on"); app.style.zoom = ""; $("#who").hidden = true; ROLE === "teacher" ? hostSetup() : stuStart(); }

/* ============================================================ HOST */
let H = null;
async function hostSetup() {
  const N = await K.net("shiftMock").catch(() => null); if (!N) return K.needSetup(hdr());
  const cfg = { plan: S.DEFAULT.slice(), secs: 240, vsecs: 60, size: 2 }; // pairs; an odd one out makes one group of 3
  app.innerHTML = `${hdr()}<div class="panel wide-panel"><h2>Host a game</h2>
    <p class="note"><b>Groups:</b> everyone signs up on their own device. The game pairs them up (one group of 3 if there's an odd number) and rotates partners every two rounds.</p>
    <p>Rounds: each employee is one round, in this order. Tap to turn one off.</p>
    <div class="seg multi" id="sc">${S.EMPLOYEES.map(e => `<button data-v="${e.id}" aria-pressed="${cfg.plan.includes(e.id)}"><b>${esc(e.name)}${e.twist ? " (twist)" : ""}</b><small>${esc(e.twist || e.role)}</small></button>`).join("")}</div>
    <p class="note" id="rc"></p>
    <p>Time to manage the employee and write the one-liner:</p><div class="seg" data-k="secs"><button data-v="180">3 min</button><button data-v="240" aria-pressed="true">4 min</button><button data-v="300">5 min</button></div>
    <p>Time to vote:</p><div class="seg" data-k="vsecs"><button data-v="45">45 sec</button><button data-v="60" aria-pressed="true">60 sec</button><button data-v="90">90 sec</button></div>
    <p class="note">Scoring: diagnosis 3, style 3, opening line 2, follow-up 2 (close picks get partial credit). Then the vote: +${VP.vote} for each vote your group's one-liner gets, +${VP.top} for the top line, and +${VP.cast} for voting. Everyone in the group gets the group's points.</p>
    <div class="err" id="er"></div><button class="btn main" id="go">Create game</button></div>`;
  const note = () => { const n = cfg.plan.length; $("#rc").textContent = n ? `${plural(n, "round")}, about ${n * 8} minutes.` : "Pick at least one round."; $("#go").disabled = !n; };
  note();
  $("#sc").onclick = e => { const b = e.target.closest("button"); if (!b) return; b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true");
    cfg.plan = S.EMPLOYEES.map(x => x.id).filter(id => document.querySelector(`#sc [data-v="${id}"]`).getAttribute("aria-pressed") === "true"); note(); };
  app.querySelectorAll(".seg[data-k]").forEach(sg => sg.onclick = e => { const b = e.target.closest("button"); if (!b) return;
    [...sg.children].forEach(x => x.setAttribute("aria-pressed", x === b)); cfg[sg.dataset.k] = +b.dataset.v; });
  $("#go").onclick = async () => {
    $("#go").disabled = true;
    try {
      const code = await K.newCode(N);
      const meta = { created: Date.now(), game: GAME, seed: Math.floor(Math.random() * 1e9), plan: cfg.plan, rounds: cfg.plan.length, secs: cfg.secs, vsecs: cfg.vsecs, size: cfg.size };
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
  if (fromPlayers && !["lobby", "seat", "play", "vote"].includes(st.phase)) return;
  ({ lobby: hostLobby, seat: hostSeat, play: hostPlay, reveal: hostReveal, vote: hostVote, results: hostResults, end: hostEnd })[st.phase](fromPlayers);
}
function hostLobby() {
  app.innerHTML = K.lobbyHTML(H, "Shift Manager", PATH, `${plural(H.meta.rounds, "round")} · pairs (one group of 3 if odd) · new partners every two rounds · points add up all game`);
  $("#start").onclick = () => hostSet({ phase: "seat", r: 0, groups: K.groupUp(K.activeIds(H), {}, H.meta.size), hist: {}, tot: {}, log: [], names: K.namesMap(H) });
  $("#end").onclick = hostErase;
  K.fit();
}
function hostSeat(fromPlayers) {
  const st = H.state, patched = K.patchGroups(st.groups, K.activeIds(H), H.meta.size);
  if (JSON.stringify(patched) !== JSON.stringify(st.groups)) return hostSet({ ...st, groups: patched, names: K.namesMap(H) });
  if (fromPlayers && H.rq === "seat") return;
  H.rq = "seat";
  const fresh = st.r % 2 === 0;
  app.innerHTML = K.seatHTML(H, { sub: st.r === 0 ? "Sit with your partner. Any of you can tap; every device in the group shows the same picks. You keep this partner for two rounds."
      : fresh ? "New partners! Find your new partner and sit together. You keep them for two rounds." : "Same partner as last round. Stay together for one more round.",
    go: `Everyone's with a partner: start Round ${st.r + 1}` });
  const h2 = app.querySelector(".hostbar h2"); if (h2) h2.textContent = st.r === 0 ? "Find your partner" : fresh ? "New partners" : "Same partners";
  $("#go").onclick = () => hostSet({ ...st, phase: "play", endsAt: Date.now() + H.meta.secs * 1000, prog: {}, hist: st.r % 2 === 0 ? K.addHist(st.hist, st.groups) : st.hist, names: K.namesMap(H) });
  K.bindRemove(H, () => { H.rq = null; hostSeat(); });
  K.fit();
}
// a group's current picks: whichever member's record is newest
function groupPick(g, r, players) {
  let best = null;
  g.forEach(p => { const c = players[p] && players[p].sm && players[p].sm[r]; if (c && (!best || (c.at || 0) > (best.at || 0))) best = c; });
  return best;
}
const stepsDone = c => !c ? 0 : (c.d != null) + (c.s != null) + (c.o != null) + (c.f != null) + (!!(c.t && String(c.t).trim()));
function hostPlay() {
  const st = H.state, e = emp(H.meta, st.r), secs = H.meta.secs;
  const picks = st.groups.map(g => groupPick(g, st.r, H.players)), done = picks.filter(c => stepsDone(c) === 5).length;
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
      + `<div class="stepkey"><span><b>1</b> Diagnose</span><span><b>2</b> Pick a style</span><span><b>3</b> Opening line</span><span><b>4</b> Follow-up</span><span><b>5</b> Write a one-liner</span></div>
      <div class="gprog" id="gp"></div>
      <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn" id="close">Close it now</button></div>`;
    $("#close").onclick = () => hostClose();
    K.startTimer(app, secs, st.endsAt, () => setTimeout(hostClose, 3000));
    K.fit();
  }
  $("#cnt").textContent = `${done} of ${st.groups.length} groups done`;
  $("#gp").innerHTML = st.groups.map((g, i) => { const n = stepsDone(picks[i]);
    return `<div class="gp ${n === 5 ? "done" : ""}"><span class="pn">${i + 1}</span><div class="pips">${[1, 2, 3, 4, 5].map(k => `<i class="${k <= n ? "on" : ""}"></i>`).join("")}</div></div>`; }).join("");
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
  // the class one-liners, shuffled and lettered for the vote
  const withText = st.groups.map((_, i) => i).filter(i => picks[i] && String(picks[i].t || "").trim());
  const stmts = K.shuffle(withText).map((gi, k) => ({ k: LET[k % 26] + (k >= 26 ? Math.floor(k / 26) + 1 : ""), gi, t: String(picks[gi].t).trim().slice(0, MAXLEN) }));
  const log = [...(st.log || []), { r: st.r, id: e.id, n: picks.length, diagRight: picks.filter(c => c && c.d === e.d).length, styleRight: picks.filter(c => c && c.s === e.d).length }];
  H.closingNow = false;
  hostSet({ ...st, phase: "reveal", picks: picks.map(c => c ? { d: c.d, s: c.s, o: c.o, f: c.f } : null), res, rp, tot, dc: cnt("d"), sc: cnt("s"), stmts, hid: [], log, prog: {}, names: K.namesMap(H) });
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
      <div class="skh" style="margin-top:10px">Group scores so far (out of ${S.MAX})</div>
      <div class="gscores">${st.groups.map((g, i) => `<div><span class="pn">${i + 1}</span><span class="gn">${esc(g.map(p => K.nameOf(H, p)).join(" & "))}</span><b>${st.res[i].total}</b></div>`).join("")}</div>
    </div></div>
    <div class="row" style="justify-content:center;margin-top:14px"><button class="btn main" id="nx">${st.stmts.length ? "The Perfect Line and the vote →" : "Leaderboard →"}</button></div>`;
  $("#nx").onclick = () => st.stmts.length ? hostSet({ ...st, phase: "vote", vEnds: Date.now() + H.meta.vsecs * 1000 }) : hostCloseVote(true);
  K.fit();
}
const seated = () => (H.state.groups || []).flat();
const votedCount = r => seated().filter(p => H.players[p] && H.players[p].sv && H.players[p].sv[r] != null).length;
function hostVote(fromPlayers) {
  const st = H.state, e = emp(H.meta, st.r), total = seated().length, v = votedCount(st.r);
  const hid = new Set(st.hid || []), shown = st.stmts.filter(x => !hid.has(x.gi));
  const key = "vote" + st.r + "|" + (st.hid || []).join(",");
  if (H.rq !== key) {
    H.rq = key;
    app.innerHTML = `<div class="votehead"><div class="kick">Round ${st.r + 1} · Vote</div>${K.timerHTML(H.meta.vsecs)}<span class="count" id="cnt"></span></div>
      ${perfectHTML(e, { small: true })}
      <div class="sgrid ${shown.length > 9 ? "dense" : ""}">${shown.map(x => `<div class="scard"><div class="sk"><b>${esc(x.k)}</b><span>Group line</span><button class="x" data-gi="${x.gi}" title="Hide this line">✕</button></div><p>“${esc(x.t)}”</p></div>`).join("") || "<p class='note'>No lines came in this round.</p>"}</div>
      <div class="row" style="justify-content:space-between;margin-top:10px"><span class="note">Vote for the line closest to the Perfect Line. You can't vote for your own group. ✕ hides a line.</span><button class="btn" id="close">Close voting now</button></div>`;
    app.querySelectorAll(".x[data-gi]").forEach(b => b.onclick = () => hostSet({ ...H.state, hid: [...(H.state.hid || []), +b.dataset.gi] }));
    $("#close").onclick = () => hostCloseVote();
    K.startTimer(app, H.meta.vsecs, st.vEnds, () => setTimeout(hostCloseVote, 2500));
    K.fit();
  }
  const c = $("#cnt"); if (c) c.textContent = `${v} of ${total} voted`;
  if (total && v >= total && !H.vclosing) { H.vclosing = setTimeout(() => { H.vclosing = null; if (H.state.phase === "vote") hostCloseVote(); }, 2500); }
}
async function hostCloseVote(skip) {
  if (!skip && H.state.phase !== "vote") return;
  if (H.closingNow) return; H.closingNow = true; K.stopTick();
  try { H.players = (await H.N.get(`games/${H.code}/players`)) || H.players; } catch (e) {}
  const st = H.state, hid = new Set(st.hid || []), live = new Set((st.stmts || []).map(x => x.gi).filter(gi => !hid.has(gi)));
  const votes = st.groups.map(() => 0), cast = {};
  if (!skip) seated().forEach(p => { const v = H.players[p] && H.players[p].sv && H.players[p].sv[st.r];
    if (v == null) return; cast[p] = true; if (live.has(v) && v !== K.groupOf(st, p)) votes[v]++; });
  const mx = Math.max(0, ...votes);
  const vres = st.groups.map((g, i) => ({ votes: votes[i], top: mx > 0 && votes[i] === mx && live.has(i) }));
  const tot = { ...(st.tot || {}) }, rp = { ...(st.rp || {}) };
  st.groups.forEach((g, i) => g.forEach(p => {
    const add = vres[i].votes * VP.vote + (vres[i].top ? VP.top : 0) + (cast[p] ? VP.cast : 0);
    rp[p] = (rp[p] || 0) + add; tot[p] = (tot[p] || 0) + add; }));
  const log = (st.log || []).slice(); const last = log[log.length - 1];
  if (last && last.r === st.r) last.top = (st.stmts || []).filter(x => live.has(x.gi) && mx > 0 && votes[x.gi] === mx).map(x => ({ t: x.t, who: st.groups[x.gi].map(p => K.nameOf(H, p)).join(" & "), v: mx }));
  H.closingNow = false;
  hostSet({ ...st, phase: "results", vres, cast, rp, tot, log, names: K.namesMap(H) });
}
function hostResults() {
  const st = H.state, e = emp(H.meta, st.r), last = st.r >= H.meta.rounds - 1, list = K.standings(st).slice(0, 10), hid = new Set(st.hid || []);
  const ranked = (st.stmts || []).filter(x => !hid.has(x.gi)).map(x => ({ ...x, v: (st.vres[x.gi] || {}).votes || 0 })).sort((a, b) => b.v - a.v).slice(0, 3);
  app.innerHTML = `<div class="hostbar"><div><div class="kick">Round ${st.r + 1} of ${H.meta.rounds} · ${esc(e.name)}</div><h2>Round results</h2></div>
    <p>${last ? "Last round done. Points are final." : (st.r + 1) % 2 === 0 ? "Next round: new partners and a new employee." : "Next round: same partners, new employee."}</p></div>
    <div class="revgrid"><div>${perfectHTML(e, { small: true })}<div class="skh" style="margin-top:10px">Class favorites</div>${ranked.map((x, i) => `<div class="scard win ${i === 0 && x.v ? "first" : ""}"><div class="sk"><b>${esc(x.k)}</b><span>Group line</span><em>${plural(x.v, "vote")}${i === 0 && x.v ? ` · +${VP.top} bonus` : ""}</em></div>
        <p>“${esc(x.t)}”</p><div class="by">${esc(st.groups[x.gi].map(p => K.nameOf(H, p)).join(" & "))}</div></div>`).join("") || "<p class='note'>No votes this round.</p>"}</div>
      <div><div class="skh">Leaderboard</div><div class="lbx">${list.map((x, i) => `<div><span class="r">${i + 1}</span><span class="n">${esc(K.nameOf(H, x.p))}</span><em>+${num((st.rp || {})[x.p] || 0)}</em><b>${num(x.s)}</b></div>`).join("")}</div></div></div>
    <div class="row" style="justify-content:center;margin-top:14px"><button class="btn main" id="nx">${last ? "Final results →" : (st.r + 1) % 2 === 0 ? `New partners for Round ${st.r + 2} →` : `Round ${st.r + 2}, same partners →`}</button></div>`;
  // partners rotate every two rounds: rounds 1-2, 3-4, 5-6 share partners
  const nextGroups = () => (st.r + 1) % 2 === 0 ? K.groupUp(K.activeIds(H), st.hist || {}, 2) : K.patchGroups(st.groups, K.activeIds(H), 2);
  $("#nx").onclick = () => last ? hostSet({ ...st, phase: "end" })
    : hostSet({ phase: "seat", r: st.r + 1, groups: nextGroups(), hist: st.hist, tot: st.tot, log: st.log, names: K.namesMap(H) });
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
      <div class="skh" style="margin-top:10px">Top one-liner each round</div>${(st.log || []).map(x => (x.top || []).slice(0, 1).map(t => `<div class="tipline"><b>${esc(S.byId[x.id].name)}:</b> “${esc(t.t)}” <small>${esc(t.who)}</small></div>`).join("")).join("")}
      <div class="skh" style="margin-top:10px">Debrief</div>
      <ol class="debrief"><li>Which employee was hardest to read? What clue did groups miss?</li><li>Marcus was D4 in one round and D1 in another. What does that tell you about development levels?</li><li>Did the rush order make anyone more directive? Was that the right move?</li><li>What made the winning one-liners feel motivating?</li></ol></div>
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
    ME = { N, ...ctx, sm: { ...((ctx.rec && ctx.rec.sm) || {}) }, sv: { ...((ctx.rec && ctx.rec.sv) || {}) }, st: null, rq: null };
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
  const key = st.phase + "|" + st.r + "|" + (st.phase === "seat" ? JSON.stringify(st.groups) : "") + (st.phase === "vote" ? JSON.stringify(st.hid || []) : "");
  if (key === M.rq) { if (st.phase === "play") playSync(); return; }
  M.rq = key;
  if (st.phase === "lobby") { app.innerHTML = `<div class="wait"><h2>You're in, ${esc(M.name)}!</h2><p>Watch the board. Your teacher will put everyone in groups.</p></div>`; return; }
  if (st.phase === "end") return stuEnd();
  if (!inPlay) { K.stopTick(); app.innerHTML = `<div class="wait"><h2>You're in, ${esc(M.name)}</h2><p>This round already started. You'll join a group next round.</p><div class="big">${num(myTotal(st))}</div><p>points</p></div>`; return; }
  if (st.phase === "seat") {
    K.stopTick(); const mates = mateNames(st);
    const same = st.r % 2 === 1;
    app.innerHTML = `<div class="wait seat"><div class="kick">Round ${st.r + 1} of ${M.meta.rounds}</div><p>${same ? "Same partner as last round" : mates.length > 1 ? "Your partners" : "Your partner"}</p>
      <div class="tablebig mate">${mates.length ? esc(andList(mates)) : "Solo"}</div><p>${same ? "Stay together for one more round." : "Find them and sit together. You'll work together for two rounds."} One device is enough, but any of you can tap.</p><div class="tot">${num(myTotal(st))} points so far</div></div>`;
    return;
  }
  if (st.phase === "play") { M.pick = mergedPick(); return drawPlay(true); }
  if (st.phase === "reveal") return stuReveal();
  if (st.phase === "vote") return stuVote();
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
  // keep whatever someone is typing in the one-liner box through a redraw
  const ta = $("#oneliner"), typing = ta && document.activeElement === ta, draft = ta ? ta.value : null, sel = ta ? [ta.selectionStart, ta.selectionEnd] : null;
  const opt = (k, n, on, dis, small) => `<button class="sopt ${on ? "on" : ""}" data-k="${k}" data-v="${n}" ${dis ? "disabled" : ""}><b>${esc(small[0])}</b><small>${esc(small[1])}</small></button>`;
  const locked = p.t && String(p.t).trim();
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
    ${doneAll ? `<div class="react big">${esc(e.follow[p.f].react)}</div>` : ""}` : ""}
    ${doneAll ? `<div class="step"><span>5</span>Write one line to motivate ${esc(e.name)}</div>
    <p class="note">Say it the way your style would say it. The class will vote on whose line comes closest to the Perfect Line.</p>
    <textarea class="stmt" id="oneliner" maxlength="${MAXLEN}" rows="3" placeholder="What would you say to ${esc(e.name)}?">${esc(locked || "")}</textarea>
    <div class="row" style="margin-top:8px"><span class="lockline" id="ll">${locked ? `<span class="ok">✓ Locked in.</span> You can edit and lock again until time runs out.` : "<em>Not locked in yet.</em>"}</span><span class="note" id="cc"></span><button class="btn main" id="lock">Lock in our line</button></div>
    ${locked ? `<div class="fb"><b>All set</b>Watch the board for the reveal.</div>` : ""}` : ""}`;
  const y = window.scrollY;
  app.innerHTML = `<div class="qwrap play">${html}</div>`;
  if (!fresh) window.scrollTo(0, y);
  const box = $("#oneliner");
  if (box) {
    if (draft != null && draft !== (locked || "")) box.value = draft;
    if (typing) { box.focus(); try { box.setSelectionRange(sel[0], sel[1]); } catch (er) {} }
    const cc = () => { $("#cc").textContent = `${box.value.length}/${MAXLEN}`; };
    box.oninput = cc; cc();
    $("#lock").onclick = () => { const t = box.value.trim().slice(0, MAXLEN); if (!t) { $("#ll").innerHTML = "<em>Write your line first.</em>"; return; } box.blur(); savePick({ t }); K.beep(660, .06); };
  }
  app.querySelectorAll("[data-k]").forEach(b => b.onclick = () => {
    const k = b.dataset.k, v = +b.dataset.v;
    if (k === "d") savePick({ d: v }); else if (k === "s") savePick({ s: v }); else if (k === "o") savePick({ o: v }); else savePick({ f: v });
    if (k === "o" || k === "f") setTimeout(() => { const all = app.querySelectorAll(".react.big"), el = all[all.length - 1]; if (el) el.scrollIntoView({ behavior: "smooth", block: "center" }); }, 50);
  });
  K.startTimer(app, secs, st.endsAt, () => {
    const t = app.querySelector(".secs"); if (t) t.textContent = "Time";
    // time's up: send an unlocked draft so the group still has a line in the vote
    const b2 = $("#oneliner"); if (b2 && b2.value.trim() && b2.value.trim() !== String(ME.pick.t || "").trim()) savePick({ t: b2.value.trim().slice(0, MAXLEN) });
  });
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
    <div class="big">+${x.total}</div><p>out of ${S.MAX} · the vote on your one-liner is next</p></div>`;
}
function stuVote() {
  K.stopTick(); const M = ME, st = M.st, r = st.r, e = emp(M.meta, r), mine = K.groupOf(st, M.pid), hid = new Set(st.hid || []);
  const list = (st.stmts || []).filter(x => !hid.has(x.gi));
  const draw = () => {
    const v = M.sv[r];
    app.innerHTML = `<div class="qwrap"><div class="kick">Round ${r + 1} · Vote</div>${K.timerHTML(M.meta.vsecs)}
      ${perfectHTML(e, { small: true })}
      <div class="step"><span>★</span>Which class line comes closest to the Perfect Line? Tap to vote. You can change it until time runs out.</div>
      <div class="vlist">${list.map(x => { const own = x.gi === mine;
        return `<button class="vopt ${v === x.gi ? "on" : ""}" data-gi="${x.gi}" ${own ? "disabled" : ""}><div class="sk"><b>${esc(x.k)}</b><span>Group line</span>${own ? "<em>Yours</em>" : v === x.gi ? "<em>✓ Your vote</em>" : ""}</div><p>“${esc(x.t)}”</p></button>`; }).join("") || "<p class='note'>No lines to vote on this round.</p>"}</div></div>`;
    app.querySelectorAll(".vopt:not([disabled])").forEach(b => b.onclick = () => { const g = +b.dataset.gi; M.sv[r] = g; M.N.update(`games/${M.code}/players/${M.pid}`, { ["sv/" + r]: g }).catch(() => {}); K.beep(660, .06); const y = window.scrollY; draw(); window.scrollTo(0, y); });
    K.startTimer(app, M.meta.vsecs, st.vEnds, () => { app.querySelectorAll(".vopt").forEach(b => b.disabled = true); });
  };
  draw();
}
function stuResults() {
  K.stopTick(); const M = ME, st = M.st, gi = K.groupOf(st, M.pid), list = K.standings(st), rank = list.findIndex(y => y.p === M.pid) + 1, last = st.r >= M.meta.rounds - 1;
  const x = (st.res && st.res[gi]) || { total: 0 }, vr = (st.vres && st.vres[gi]) || { votes: 0, top: false };
  app.innerHTML = `<div class="wait"><div class="kick">Round ${st.r + 1} results</div><h2>+${num((st.rp || {})[M.pid] || 0)} this round</h2>
    <div class="stats"><div class="stat"><b>+${x.total}</b><span>Managing</span></div><div class="stat"><b>+${vr.votes * VP.vote}</b><span>${plural(vr.votes, "vote")}</span></div>
      ${vr.top ? `<div class="stat"><b>+${VP.top}</b><span>Top line</span></div>` : ""}<div class="stat"><b>+${st.cast && st.cast[M.pid] ? VP.cast : 0}</b><span>Voting</span></div></div>
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
