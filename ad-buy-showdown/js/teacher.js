// Teacher console: make a class game per period, open each round, launch every campaign at once, and show results.
// The "Open Play" switch shows the always-on self-paced version and the reports teams send.
import { api, poll } from "./api.js";
import { teamName, setTeamNames } from "./teams.js";
import { ROUNDS, NROUNDS, totals, KEYS, keyResult, gradeCampaign, platformById } from "./model.js";
import { $, esc, money, roundBar, rulesHTML, briefHTML, eventHTML, barsHTML, growBars, reportTableHTML, standingsTableHTML, rankList, playLaunch, kpisHTML, detailHTML, toast, gradeTableHTML, pill, setupLine } from "./ui.js";

const S = { which: "class", view: "control", game: null, games: [], buys: [], progress: {}, members: {}, max: 15, activeId: null,
  confirm: false, removing: null, busy: false, briefRound: null, open: null, reportTeam: null, animated: {}, playing: false, rv: null, focus: null };
let poller = null;

function start() { $("#tabs").hidden = false; $("#app").innerHTML = `<p class="muted">Connecting…</p>`; watch(); }
function watch() {
  if (poller) poller.stop();
  S.game = null;
  poller = poll(onState, () => {}, 2500, "state?view=teacher" + (S.which === "open" ? "&game=openplay" : ""));
}
function onState(s) {
  S.game = s.game; S.games = s.games || []; S.buys = s.buys || []; S.progress = s.progress || {}; S.members = s.members || {}; S.max = s.max || 15; S.activeId = s.activeId || null;
  setTeamNames(S.game ? S.game.teamNames : {});
  if (!S.game && S.which === "class" && S.view === "control") S.view = "games";
  document.querySelector('#tabs [data-view="standings"]').textContent = S.which === "open" ? "Reports" : "Standings";
  render();
}

/* ---------- screens ---------- */
function render() {
  if (S.playing) return;
  if (S.view === "games" && document.activeElement && document.activeElement.closest && document.activeElement.closest("#newGame")) { refreshGameList(); return; }
  document.querySelectorAll("#tabs button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.view === S.view)));
  const g = S.game, self = g && g.mode === "self";
  $("#yearbar").innerHTML = g && !self ? roundBar(g.round, (g.results || []).filter(Boolean).length, g.phase) : "";
  const y = window.scrollY, app = $("#app");
  const bar = `<div class="row noprint" style="margin-bottom:16px;gap:8px"><span class="eyebrow" style="margin-right:4px">Viewing</span>
    <button class="btn small ${S.which === "class" ? "" : "ghost"}" data-which="class">Class game</button>
    <button class="btn small ${S.which === "open" ? "" : "ghost"}" data-which="open">Open Play</button></div>`;
  if (S.view === "review") app.innerHTML = reviewHTML();
  else if (S.view === "brief") app.innerHTML = teacherBriefHTML();
  else if (S.view === "standings") app.innerHTML = !g ? `<p class="muted">No active game.</p>` : self ? reportsHTML() : standingsHTML();
  else if (S.view === "games" || !g) app.innerHTML = gamesHTML();
  else app.innerHTML = self ? selfControlHTML() : controlHTML();
  app.insertAdjacentHTML("afterbegin", bar);
  bind();
  window.scrollTo(0, y);
  growBars();
}

const statusText = g => g.phase === "lobby" ? "Not started" : g.phase === "final" ? "Finished" : g.phase === "open" ? `Round ${g.round + 1} open` : `Round ${g.round + 1} results`;
function gameListHTML() {
  return S.games.length ? `<div class="tablewrap"><table><thead><tr><th>Game</th><th>Status</th><th></th></tr></thead><tbody>${S.games.map(g => `<tr><td><b>${esc(g.name)}</b></td><td>${statusText(g)}</td><td class="r">${g.id === S.activeId ? `<span class="pill ok">Active</span>` : `<button class="btn ghost small" data-activate="${g.id}">Make active</button>`}</td></tr>`).join("")}</tbody></table></div>` : `<p class="muted">No games yet.</p>`;
}
function refreshGameList() { const el = $("#gameList"); if (el) { el.innerHTML = gameListHTML(); bind(); } }

function gamesHTML() {
  return `<div class="stack">
  <div><span class="eyebrow">Class periods</span><h2>Games</h2><p class="lede">Make one game per class period. Agencies always join whichever game is active.</p></div>
  <div class="grid2">
    <div class="stack" style="gap:18px">
      <div class="panel stack" style="gap:8px;border-top:6px solid var(--orange)"><h3 style="margin:0">Open Play is always on</h3>
        <p style="margin:0">Students can pick <b>Open Play</b> on the start screen any time and run all six clients on their own. Switch to <b>Open Play</b> at the top to see their progress and reports.</p></div>
      <form class="panel stack" id="newGame" style="gap:14px"><h3>New class game</h3>
        <label for="gname" style="display:flex;flex-direction:column;gap:4px;font-family:var(--data);text-transform:uppercase;letter-spacing:.08em;font-size:14px;color:var(--muted)">Name<input type="text" id="gname" placeholder="Period 3" required maxlength="30"></label>
        <p class="muted" style="margin:0">Six rounds, one client each. Students make their own agencies (up to 15) from their first names. You open each round, then launch every campaign at once on the projector.</p>
        <div class="row"><button class="btn" type="submit">Create and make active</button></div>
      </form>
    </div>
    <div class="panel"><h3>Saved games</h3><div id="gameList">${gameListHTML()}</div></div>
  </div></div>`;
}

function teacherBriefHTML() {
  const g = S.game, cur = S.briefRound ?? (g && g.mode !== "self" ? g.round : 0);
  return `<div class="stack"><div class="row noprint" style="gap:6px">${ROUNDS.map((R, r) => `<button class="btn small ${r === cur ? "" : "ghost"}" data-brief="${r}">R${r + 1} · ${esc(R.title)}</button>`).join("")}</div>${briefHTML(cur)}</div>`;
}

function teamsPanel(g) {
  return `<div class="panel stack" style="gap:12px"><h3>${g.teams.length} of ${S.max} agencies</h3>
    ${g.teams.length ? `<div class="statusgrid">${g.teams.map(id => `<div class="done"><b>${esc(teamName(id))}</b><span>${esc((S.members[id] || []).join(", "))}</span>${S.removing === id ? `<span><button class="btn small" data-remove="${id}">Remove</button> <button class="btn ghost small" data-keep>Keep</button></span>` : `<button class="btn ghost small" data-askremove="${id}" style="align-self:flex-start;margin-top:4px">Remove</button>`}</div>`).join("")}</div>` : `<p class="muted" style="margin:0">Waiting for the first agency.</p>`}
  </div>`;
}

function roundList(g, r) {
  const rr = g.results[r];
  return g.teams.map(id => ({ id, name: teamName(id), camp: rr && rr.teams[id] ? rr.teams[id].camp : null, res: rr && rr.teams[id] ? rr.teams[id].res : null }))
    // teams removed after a round still count in that round's results
    .concat(rr ? Object.keys(rr.teams).filter(id => !g.teams.includes(id)).map(id => ({ id, name: "Removed agency", camp: rr.teams[id].camp, res: rr.teams[id].res })) : []);
}

/* ---------- live control ---------- */
function controlHTML() {
  const g = S.game, r = g.round, R = ROUNDS[r];
  if (g.phase === "lobby") return `<div class="stack">
    <div><span class="eyebrow">${esc(g.name)} · Live</span><h2>Agencies are joining</h2><p class="lede">Students go to the main link, pick <b>Ad Buy Showdown</b>, choose Live in Class, and type their first names. Open Round 1 when everyone is in.</p></div>
    <div class="grid2"><div class="panel"><h3>How it works</h3>${rulesHTML()}</div>${teamsPanel(g)}</div>
    <div class="row"><button class="btn" data-act="open" ${g.teams.length && !S.busy ? "" : "disabled"}>Open Round 1</button><button class="btn ghost small" data-view="brief">Preview the client briefs</button></div></div>`;
  if (g.phase === "open") {
    const ready = g.teams.filter(id => S.buys.includes(id)), missing = g.teams.filter(id => !ready.includes(id));
    return `<div class="stack">
      <div><span class="eyebrow">Round ${r + 1} of ${NROUNDS} · ${esc(R.client)}</span><h2>${esc(R.title)}: campaigns coming in</h2>
        <p class="muted" style="margin:0">${ready.length} of ${g.teams.length} agencies locked in. Campaigns stay hidden until launch. Teams can still change theirs until you launch.</p></div>
      <div class="statusgrid">${g.teams.map(id => `<div class="${ready.includes(id) ? "done" : ""}"><b>${esc(teamName(id))}</b><span>${ready.includes(id) ? "Locked in" : "Building"}</span></div>`).join("")}</div>
      ${S.confirm ? `<div class="confirm"><span>${missing.length} agenc${missing.length === 1 ? "y hasn’t" : "ies haven’t"} locked in: ${missing.map(id => esc(teamName(id))).join(", ")}. They earn $0 this round.</span><button class="btn small" data-act="reveal">Launch anyway</button><button class="btn ghost small" data-cancel>Keep waiting</button></div>` : ""}
      <div class="row"><button class="btn" id="tryReveal" ${S.busy ? "disabled" : ""}>${S.busy ? "Running campaigns…" : "Close and launch"}</button><button class="btn ghost small" data-view="brief">Show the client brief</button></div>
      <details class="panel"><summary style="cursor:pointer;font-family:var(--display);text-transform:uppercase;color:var(--brown);letter-spacing:.04em">Agencies (${g.teams.length})</summary><div style="margin-top:12px">${teamsPanel(g)}</div></details>
    </div>`;
  }
  if (g.phase === "revealed") {
    const list = roundList(g, r), last = r >= NROUNDS - 1;
    return `<div class="stack">
      <div class="row" style="justify-content:space-between;align-items:flex-end"><div><span class="eyebrow">Round ${r + 1} of ${NROUNDS} · Results</span><h2 style="margin:0">${esc(R.title)}</h2></div>
        <div class="row"><button class="btn" data-act="${last ? "final" : "open"}" ${S.busy ? "disabled" : ""}>${last ? "Show final standings" : "Open Round " + (r + 2)}</button></div></div>
      ${eventHTML(r)}
      <section class="panel"><h3>Profit this round</h3>${barsHTML(rankList(list).map(o => ({ id: o.id, name: o.name, value: o.res ? o.res.profit : 0 })))}</section>
      <section class="panel"><h3>Ad report</h3>${reportTableHTML(r, list, { open: S.open })}</section>
      <div class="row"><button class="btn dark small" data-review="${r}">Review every buy</button><button class="btn ghost small" data-view="standings">Standings so far</button><button class="btn ghost small" data-replay>Replay launch</button></div>
    </div>`;
  }
  return `<div class="stack">${standingsHTML()}<div class="row"><button class="btn ghost" data-view="games">Start a new game</button></div></div>`;
}

function standingsHTML() {
  const g = S.game, done = (g.results || []).filter(Boolean).length;
  const ids = [...new Set([...g.teams, ...(g.results || []).filter(Boolean).flatMap(rr => Object.keys(rr.teams))])];
  const tot = totals(ids, g.results || []);
  const rows = ids.map(id => ({ id, name: g.teams.includes(id) ? teamName(id) : "Removed agency", per: tot[id].per, sum: tot[id].sum }));
  const sorted = rows.slice().sort((a, b) => b.sum - a.sum);
  return `<div class="stack"><div><span class="eyebrow">${esc(g.name)} · ${g.phase === "final" ? "Final results" : `After ${done} of ${NROUNDS} rounds`}</span><h2>${g.phase === "final" && sorted[0] ? esc(sorted[0].name) + " wins the account" : "Standings"}</h2><p class="muted" style="margin:0">Ranked by total profit earned for clients.</p></div>
    ${done ? `<section class="panel">${barsHTML(sorted.map(o => ({ id: o.id, name: o.name, value: o.sum })))}</section><section class="panel">${standingsTableHTML(rows)}</section>` : `<p class="muted">No rounds have been launched yet.</p>`}</div>`;
}


/* ---------- review: every agency's buy, graded decision by decision ---------- */
const DKEYS = [["obj", "Objective"], ["geo", "Location"], ["segs", "Age groups"], ["interest", "Interest"], ["fmt", "Creative format"], ["budget", "Budget split"]];
function reviewRounds() { const g = S.game; return ROUNDS.map((_, r) => !!(g && g.results && g.results[r])); }
function reviewList(r) { return rankList(roundList(S.game, r)); }
function reviewHTML() {
  const g = S.game;
  if (!g) return `<p class="muted">No active game.</p>`;
  if (g.mode === "self") return `<div class="panel stack" style="gap:8px"><h3 style="margin:0">Open Play reviews live on the Reports tab</h3><p style="margin:0">Click <b>View</b> on any agency to see every client they ran, graded decision by decision.</p><div><button class="btn small" data-view="standings">Go to Reports</button></div></div>`;
  const done = reviewRounds();
  if (!done.some(Boolean)) return `<div class="stack"><div><span class="eyebrow">${esc(g.name)}</span><h2>Review every buy</h2></div><div class="banner wait">No rounds launched yet. After you launch a round, every agency's campaign shows up here, graded decision by decision.</div></div>`;
  let r = S.rv != null && done[S.rv] ? S.rv : done.lastIndexOf(true);
  S.rv = r;
  const list = reviewList(r), live = list.filter(o => o.camp && o.res);
  if (S.focus) return focusHTML(r, live);
  const grades = Object.fromEntries(live.map(o => [o.id, gradeCampaign(r, o.camp, o.res)]));
  const tally = DKEYS.map(([k, label]) => { const t = { good: 0, ok: 0, bad: 0 }; live.forEach(o => t[grades[o.id].find(x => x.key === k).v]++); return { k, label, t }; });
  const n = live.length || 1;
  const kres = keyResult(r);
  return `<div class="stack">
    <div class="row noprint" style="gap:6px">${ROUNDS.map((R, i) => `<button class="btn small ${i === r ? "" : "ghost"}" data-rv="${i}" ${done[i] ? "" : "disabled"}>R${i + 1}</button>`).join("")}</div>
    <div><span class="eyebrow">${esc(g.name)} · Round ${r + 1} · ${esc(ROUNDS[r].client)}</span><h2 style="margin:0">Review: ${esc(ROUNDS[r].title)}</h2>
      <p class="muted" style="margin:0">Click any agency to put its buy on the board and talk it through. Arrow keys move between agencies.</p></div>
    <div class="rvtop">
      <section class="panel"><h3>Where the class went wrong</h3>
        <div class="mist">${tally.map(({ label, t }) => `<div class="mrow"><span class="ml">${label}</span><div class="mbar">${["good", "ok", "bad"].map(v => t[v] ? `<i class="${v}" style="width:${t[v] / n * 100}%">${t[v]}</i>` : "").join("")}</div></div>`).join("")}</div>
        <div class="row small muted" style="gap:14px;margin-top:10px"><span><span class="sw good"></span>Correct</span><span><span class="sw ok"></span>Partly</span><span><span class="sw bad"></span>Incorrect</span></div>
      </section>
      <button class="panel keycard" data-focus="key">
        <span class="eyebrow">Model answer</span>
        <div class="kc-profit ${kres.profit >= 0 ? "pos" : "neg"}">${money(kres.profit)}</div>
        <p class="small muted" style="margin:0 0 8px">profit from one strong campaign</p>
        <p class="small" style="margin:0">${setupLine(r, KEYS[r].camp)}</p>
        <span class="go">Talk it through →</span>
      </button>
    </div>
    <div class="rvgrid">${list.map((o, k) => {
      if (!o.camp || !o.res) return `<div class="panel rvcard off"><div class="rvh"><span class="rank">${k + 1}</span><b>${esc(o.name)}</b></div><p class="muted small" style="margin:0">Did not launch this round. $0.</p></div>`;
      const gr = grades[o.id], right = gr.filter(x => x.v === "good").length;
      return `<button class="panel rvcard" data-focus="${o.id}">
        <div class="rvh"><span class="rank">${k + 1}</span><b>${esc(o.name)}</b><span class="num ${o.res.profit >= 0 ? "pos" : "neg"}">${money(o.res.profit)}</span></div>
        <div class="rvscore small muted">${right} of 6 decisions correct · ROAS ${o.res.roas.toFixed(2)}x</div>
        <ul class="rvlist">${gr.map(x => `<li class="${x.v}"><span class="dot"></span><span class="lab">${x.label}</span><span class="pk">${esc(x.key === "budget" ? x.rows.map(w => w.name).join(", ") || "None" : x.pick)}</span></li>`).join("")}</ul>
      </button>`; }).join("")}</div>
  </div>`;
}
function focusHTML(r, live) {
  const R = ROUNDS[r], ids = live.map(o => o.id);
  const nav = (label) => `<div class="row noprint" style="justify-content:space-between"><button class="btn ghost small" data-rvback>← All agencies</button><span class="muted small">${label}</span><div class="row" style="gap:6px"><button class="btn ghost small" data-step="-1" aria-label="Previous">‹ Prev</button><button class="btn ghost small" data-step="1" aria-label="Next">Next ›</button></div></div>`;
  if (S.focus === "key") {
    const k = KEYS[r], x = keyResult(r);
    return `<div class="stack">${nav("Model answer")}
      <div><span class="eyebrow">Round ${r + 1} · Model answer</span><h2 style="margin:0">${esc(R.title)}</h2><p class="muted" style="margin:0">${setupLine(r, k.camp)}</p></div>
      <section class="panel"><h3>Why it works</h3><ol class="rules">${k.why.map(w => `<li><span>${esc(w)}</span></li>`).join("")}</ol></section>
      ${kpisHTML(x)}
      <section class="panel">${gradeTableHTML(r, k.camp, x, { compare: false })}</section>
    </div>`;
  }
  const o = live.find(t => t.id === S.focus);
  if (!o) { S.focus = null; return reviewHTML(); }
  const pos = ids.indexOf(o.id) + 1;
  return `<div class="stack">${nav(`Agency ${pos} of ${ids.length}`)}
    <div class="row" style="justify-content:space-between;align-items:flex-end"><div><span class="eyebrow">Round ${r + 1} · ${esc(R.title)}</span><h2 style="margin:0">${esc(o.name)}</h2><p class="muted" style="margin:0">${setupLine(r, o.camp)}</p></div>
      <div style="text-align:right"><span class="eyebrow">Profit</span><div class="kc-profit ${o.res.profit >= 0 ? "pos" : "neg"}">${money(o.res.profit)}</div></div></div>
    <section class="panel">${gradeTableHTML(r, o.camp, o.res)}</section>
    ${kpisHTML(o.res)}
    <section class="panel"><span class="eyebrow">Analyst notes</span><ul class="notes" style="margin-top:6px">${(o.res.notes || []).map(nn => `<li class="${nn.t}">${esc(nn.m)}</li>`).join("") || `<li class="info">Clean campaign. No major issues found.</li>`}</ul></section>
  </div>`;
}
function stepFocus(d) {
  const live = reviewList(S.rv).filter(o => o.camp && o.res), ids = ["key", ...live.map(o => o.id)];
  const i = ids.indexOf(S.focus); S.focus = ids[(i + d + ids.length) % ids.length]; render(); window.scrollTo(0, 0);
}
document.addEventListener("keydown", e => {
  if (S.view !== "review" || !S.focus || e.target.closest("input,textarea,select")) return;
  if (e.key === "ArrowRight") stepFocus(1); else if (e.key === "ArrowLeft") stepFocus(-1); else if (e.key === "Escape") { S.focus = null; render(); }
});

/* ---------- Open Play ---------- */
function progressTable() {
  const g = S.game;
  if (!g.teams.length) return `<p class="muted">No agencies yet.</p>`;
  return `<div class="tablewrap"><table class="rep"><thead><tr><th>Agency</th><th></th>${ROUNDS.map((_, r) => `<th>R${r + 1}</th>`).join("")}<th>Total</th><th>Report</th><th></th></tr></thead><tbody>
    ${g.teams.map(id => {
      const p = S.progress[id] || { rounds: {} }, vals = ROUNDS.map((_, r) => p.rounds[r] ? p.rounds[r].res.profit : null), sum = vals.reduce((a, b) => a + (b || 0), 0);
      return `<tr><td class="tn">${esc(teamName(id))}</td><td></td>${vals.map(v => `<td class="td ${v == null ? "muted" : v >= 0 ? "pos" : "neg"}">${v == null ? "–" : money(v)}</td>`).join("")}
        <td class="td p ${sum >= 0 ? "pos" : "neg"}">${money(sum)}</td>
        <td>${p.sentAt ? `<span class="pill ok">Sent</span>` : `<span class="pill idle">Not sent</span>`}</td>
        <td class="r" style="white-space:nowrap"><button class="btn ghost small" data-report="${id}">View</button> ${S.removing === id ? `<button class="btn small" data-remove="${id}">Confirm remove</button> <button class="btn ghost small" data-keep>Keep</button>` : `<button class="btn ghost small" data-askremove="${id}" title="Remove this agency" aria-label="Remove ${esc(teamName(id))}">✕</button>`}</td></tr>`; }).join("")}
  </tbody></table></div>`;
}
function selfControlHTML() {
  const g = S.game, sent = g.teams.filter(id => S.progress[id] && S.progress[id].sentAt).length;
  return `<div class="stack">
    <div><span class="eyebrow">Open Play · always on</span><h2>${g.phase === "final" ? "Open Play is closed" : g.teams.length ? "Agencies are working" : "Waiting for agencies"}</h2>
      <p class="muted" style="margin:0">${sent} of ${g.teams.length} agencies have sent a report. This updates on its own.</p></div>
    <div class="panel">${progressTable()}</div>
    <div class="row">${g.phase !== "final" ? `<button class="btn ghost" data-act="close">Close Open Play</button>` : `<button class="btn" data-act="reopen">Reopen Open Play</button>`}</div>
  </div>`;
}
function reportHTML(id) {
  const p = S.progress[id] || { rounds: {} }, sum = Object.values(p.rounds).reduce((a, x) => a + x.res.profit, 0);
  return `<div class="stack"><div><span class="eyebrow">Open Play report</span><h2 style="margin:0">${esc(teamName(id))}</h2>
    <p class="muted" style="margin:0">${esc((S.members[id] || []).join(", "))} · ${Object.keys(p.rounds).length} of ${NROUNDS} clients · total profit <b class="${sum >= 0 ? "pos" : "neg"}">${money(sum)}</b>${p.sentAt ? " · sent " + new Date(p.sentAt).toLocaleString() : ""}</p></div>
    ${ROUNDS.map((R, r) => p.rounds[r] ? `<section class="panel stack" style="gap:12px"><div><span class="eyebrow">Client ${r + 1}</span><h3 style="margin:0">${esc(R.title)}</h3></div>${kpisHTML(p.rounds[r].res)}${gradeTableHTML(r, p.rounds[r].camp, p.rounds[r].res)}${detailHTML(r, p.rounds[r].camp, p.rounds[r].res)}</section>` : "").join("")}</div>`;
}
function reportsHTML() {
  if (S.reportTeam && S.game.teams.includes(S.reportTeam)) return `<div class="stack"><div class="row noprint"><button class="btn ghost small" data-allreports>← All reports</button><button class="btn small" data-print>Print this report</button></div>${reportHTML(S.reportTeam)}</div>`;
  return `<div class="stack"><div><span class="eyebrow">Open Play</span><h2 style="margin:0">Reports</h2></div><div class="panel">${progressTable()}</div></div>`;
}

/* ---------- actions ---------- */
async function act(data) {
  S.busy = true; S.confirm = false; render();
  let out = null;
  try { out = await api("teacher", S.which === "open" && !["create", "activate"].includes(data.action) ? { ...data, gameId: "openplay" } : data); }
  catch (e) { toast(e.message); }
  S.busy = false;
  if (data.action === "reveal" && out && out.game) { S.game.results = out.game.results; S.game.phase = out.game.phase; launchShow(out.game.round); }
  if (poller) await poller.now(); else render();
  if (data.action !== "remove") window.scrollTo(0, 0);
}
function launchShow(r) {
  const rr = S.game.results[r];
  if (!rr) return;
  S.animated[S.game.id + ":" + r] = true; S.open = null; S.playing = true; window.scrollTo(0, 0);
  playLaunch($("#app"), r, Object.values(rr.teams).map(t => t.res), () => { S.playing = false; render(); window.scrollTo(0, 0); });
}

function bind() {
  document.querySelectorAll("[data-view]").forEach(b => b.onclick = () => {
    if (b.dataset.view === "games" && S.which === "open") { S.which = "class"; S.view = "games"; watch(); return; }
    S.view = b.dataset.view; S.confirm = false; S.reportTeam = null; S.briefRound = null; render(); window.scrollTo(0, 0);
  });
  document.querySelectorAll("[data-which]").forEach(b => b.onclick = () => { if (S.which === b.dataset.which) return; S.which = b.dataset.which; S.view = "control"; S.reportTeam = null; $("#app").innerHTML = `<p class="muted">Loading…</p>`; watch(); });
  document.querySelectorAll("[data-activate]").forEach(b => b.onclick = async () => { S.view = "control"; await act({ action: "activate", id: b.dataset.activate }); });
  document.querySelectorAll("[data-act]").forEach(b => b.onclick = () => act({ action: b.dataset.act }));
  document.querySelectorAll("[data-brief]").forEach(b => b.onclick = () => { S.briefRound = +b.dataset.brief; render(); });
  document.querySelectorAll("[data-askremove]").forEach(b => b.onclick = () => { S.removing = b.dataset.askremove; render(); });
  document.querySelectorAll("[data-remove]").forEach(b => b.onclick = () => { const id = b.dataset.remove; S.removing = null; act({ action: "remove", team: id }); });
  document.querySelectorAll("[data-keep]").forEach(b => b.onclick = () => { S.removing = null; render(); });
  document.querySelectorAll("[data-cancel]").forEach(b => b.onclick = () => { S.confirm = false; render(); });
  document.querySelectorAll("[data-report]").forEach(b => b.onclick = () => { S.view = "standings"; S.reportTeam = b.dataset.report; render(); window.scrollTo(0, 0); });
  document.querySelectorAll("[data-allreports]").forEach(b => b.onclick = () => { S.reportTeam = null; render(); });
  document.querySelectorAll("[data-print]").forEach(b => b.onclick = () => window.print());
  document.querySelectorAll("[data-replay]").forEach(b => b.onclick = () => launchShow(S.game.round));
  document.querySelectorAll("[data-review]").forEach(b => b.onclick = () => { S.view = "review"; S.rv = +b.dataset.review; S.focus = null; render(); window.scrollTo(0, 0); });
  document.querySelectorAll("[data-rv]").forEach(b => b.onclick = () => { S.rv = +b.dataset.rv; S.focus = null; render(); });
  document.querySelectorAll("[data-focus]").forEach(b => b.onclick = () => { S.focus = b.dataset.focus; render(); window.scrollTo(0, 0); });
  document.querySelectorAll("[data-rvback]").forEach(b => b.onclick = () => { S.focus = null; render(); window.scrollTo(0, 0); });
  document.querySelectorAll("[data-step]").forEach(b => b.onclick = () => stepFocus(+b.dataset.step));
  document.querySelectorAll("[data-open]").forEach(tr => {
    const go = () => { S.open = S.open === tr.dataset.open ? null : tr.dataset.open; render(); };
    tr.onclick = go; tr.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } };
  });
  const tr = $("#tryReveal");
  if (tr) tr.onclick = () => { const g = S.game; if (g.teams.some(id => !S.buys.includes(id))) { S.confirm = true; render(); } else act({ action: "reveal" }); };
  const ng = $("#newGame");
  if (ng) ng.onsubmit = async e => {
    e.preventDefault();
    const name = $("#gname").value.trim();
    if (document.activeElement) document.activeElement.blur();
    S.view = "control"; await act({ action: "create", name });
  };
}

document.querySelectorAll("#tabs button").forEach(b => b.onclick = () => {
  if (b.dataset.view === "games" && S.which === "open") { S.which = "class"; S.view = "games"; watch(); return; }
  S.view = b.dataset.view; S.confirm = false; S.reportTeam = null; S.briefRound = null; S.open = null; render(); window.scrollTo(0, 0);
});
start();
