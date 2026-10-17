// Teacher console: create a game per class period.
//   Live mode: one company on the projector, open Launch 1, reveal, open Launch 2, reveal, final.
//   Self-paced mode: teams work through the companies on their own; reports show up here.
import { api, poll } from "./api.js";
import { teamName, setTeamNames } from "./teams.js";
import { COMPANIES, companyById, ROUNDS, esc, cleanLineup, briefHTML, rulesHTML, roundBar, resultsHTML, standingsHTML, finalHTML, progressSummary, reportHTML, bestLineupHTML } from "./game.js";

const $ = s => document.querySelector(s);
const S = { which: "class", activeId: null, view: "control", game: null, games: [], buys: {}, progress: {}, members: {}, max: 15, confirm: false, removing: null, busy: false, briefCo: null, reportTeam: null, printAll: false, showKey: false };
let poller = null;

function start() { $("#tabs").hidden = false; $("#app").innerHTML = `<p class="muted">Connecting…</p>`; watch(); }
function watch() {
  if (poller) poller.stop();
  S.game = null;
  poller = poll(onState, () => {}, 2500, "state?view=teacher" + (S.which === "open" ? "&game=openplay" : ""));
}
function onState(s) {
  S.game = s.game; S.games = s.games || []; S.buys = s.buys || {}; S.progress = s.progress || {}; S.members = s.members || {}; S.max = s.max || 15; S.activeId = s.activeId || null;
  setTeamNames(S.game ? S.game.teamNames : {});
  if (!S.game && S.which === "class" && S.view === "control") S.view = "games";
  const self = S.game && S.game.mode === "self";
  document.querySelector('#tabs [data-view="standings"]').textContent = self ? "Reports" : "Standings";
  render();
}

/* ---------- screens ---------- */
function render() {
  if (S.view === "games" && document.activeElement && document.activeElement.closest && document.activeElement.closest("#newGame")) { refreshGameList(); return; }
  document.querySelectorAll("#tabs button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.view === S.view)));
  $("#yearbar").innerHTML = S.game ? roundBar(S.game) : "";
  const app = $("#app"), g = S.game, self = g && g.mode === "self";
  const bar = `<div class="row noprint" style="margin-bottom:16px;gap:8px"><span class="eyebrow" style="margin-right:4px">Viewing</span>
    <button class="btn small ${S.which === "class" ? "" : "ghost"}" data-which="class">Class game</button>
    <button class="btn small ${S.which === "open" ? "" : "ghost"}" data-which="open">Open Play</button></div>`;
  if (S.view === "brief") app.innerHTML = teacherBriefHTML();
  else if (S.view === "standings") app.innerHTML = !g ? `<p class="muted">No active game.</p>` : self ? reportsHTML() : `<div class="stack"><div><span class="eyebrow">${esc(g.name)}</span><h2>Standings</h2></div><div class="panel">${standingsHTML(g, g.results || [])}</div></div>`;
  else if (S.view === "games" || !g) app.innerHTML = gamesHTML();
  else app.innerHTML = self ? selfControlHTML() : controlHTML();
  if (!(S.view === "standings" && S.printAll)) app.insertAdjacentHTML("afterbegin", bar);
  bind();
}

const modeText = g => g.mode === "self" ? `Self-paced · ${(g.companies || []).length} companies` : `Live · ${esc(companyById(g.company).name)}`;
const statusText = g => g.mode === "self" ? (g.phase === "final" ? "Closed" : "Open") : g.phase === "lobby" ? "Not started" : g.phase === "final" ? "Finished" : g.phase === "open" ? `Launch ${g.round + 1} open` : `Launch ${g.round + 1} results`;
function gameListHTML() {
  return S.games.length ? `<div class="tablewrap"><table><thead><tr><th>Game</th><th>Status</th><th></th></tr></thead><tbody>${S.games.map(g => `<tr><td><b>${esc(g.name)}</b><div class="muted" style="font-size:14px">${modeText(g)}</div></td><td>${statusText(g)}</td><td class="r">${g.id === S.activeId ? `<span class="pill ok">Active</span>` : `<button class="btn ghost small" data-activate="${g.id}">Make active</button>`}</td></tr>`).join("")}</tbody></table></div>` : `<p class="muted">No games yet. Create one to start.</p>`;
}
function refreshGameList() { const el = $("#gameList"); if (el) { el.innerHTML = gameListHTML(); bind(); } }

function gamesHTML() {
  return `<div class="stack">
  <div><span class="eyebrow">Class periods</span><h2>Games</h2><p class="lede">Make one game per class period. Teams always join whichever game is active.</p></div>
  <div class="grid2">
    <div class="stack" style="gap:18px">
    <div class="panel stack" style="gap:8px;border-top:6px solid var(--orange)"><h3 style="margin:0">Open Play is always on</h3>
      <p style="margin:0">Students can pick <b>Open Play</b> on the start screen any time and work through all twelve companies on their own. Switch to <b>Open Play</b> at the top to see their progress and reports. The games below are for class time.</p></div>
    <form class="panel stack" id="newGame" style="gap:16px"><h3>New class game</h3>
      <div class="opts"><label for="gname">Name<input type="text" id="gname" placeholder="Period 8" required maxlength="30"></label></div>
      <fieldset style="border:1px solid var(--line);border-radius:4px;padding:12px 14px;display:flex;flex-direction:column;gap:8px"><legend class="eyebrow" style="padding:0 6px">How it runs</legend>
        <label class="check" for="modeSelf"><input type="radio" name="mode" id="modeSelf" value="self" checked> <span><b>Self-paced.</b> Teams work through the companies on their own and send you a report.</span></label>
        <label class="check" for="modeLive"><input type="radio" name="mode" id="modeLive" value="live"> <span><b>Live.</b> Everyone builds a lineup for one company. You reveal Launch 1, then Launch 2, on the projector.</span></label>
      </fieldset>
      <div id="selfCos"><div class="row" style="justify-content:space-between"><span class="eyebrow">Companies to work through</span><button type="button" class="btn ghost small" id="toggleAll">Clear all</button></div>
        <div class="checks" style="margin-top:6px">${COMPANIES.map(c => `<label class="check" for="co_${c.id}"><input type="checkbox" id="co_${c.id}" data-co="${c.id}" checked> ${esc(c.name)}</label>`).join("")}</div></div>
      <label for="liveCo" id="liveCoWrap" hidden style="display:flex;flex-direction:column;gap:4px;font-family:var(--data);text-transform:uppercase;letter-spacing:.08em;font-size:14px;color:var(--muted)">Company<select id="liveCo">${COMPANIES.map(c => `<option value="${c.id}">${esc(c.name)} · ${esc(c.industry)}</option>`).join("")}</select></label>
      <p class="muted" style="margin:0">Students make their own teams (up to 15) from their first names when they join.</p>
      <div class="row"><button class="btn" type="submit" id="createBtn">Create and make active</button></div>
    </form>
    </div>
    <div class="panel"><h3>Saved games</h3><div id="gameList">${gameListHTML()}</div></div>
  </div></div>`;
}

function teacherBriefHTML() {
  const g = S.game, ids = g ? (g.mode === "self" ? g.companies : [g.company]) : COMPANIES.map(c => c.id);
  const cur = S.briefCo && ids.includes(S.briefCo) ? S.briefCo : ids[0];
  return `<div class="stack">${ids.length > 1 ? `<div class="row">${ids.map(id => `<button class="btn small ${id === cur ? "" : "ghost"}" data-briefco="${id}">${esc(companyById(id).name)}</button>`).join("")}</div>` : ""}
    ${briefHTML(companyById(cur))}
    <div class="noprint"><button class="btn ghost small" id="keyBtn">${S.showKey ? "Hide" : "Show"} the answer key (teacher only)</button></div>
    ${S.showKey ? bestLineupHTML(companyById(cur)) : ""}</div>`;
}

function teamsPanel(g, startLabel) {
  return `<div class="panel stack" style="gap:12px"><h3>${g.teams.length} of ${S.max} teams</h3>
      ${g.teams.length ? `<div class="statusgrid">${g.teams.map(id => `<div class="done"><b>${esc(teamName(id))}</b>${S.removing === id ? `<span><button class="btn small" data-remove="${id}">Remove</button> <button class="btn ghost small" id="keepTeam">Keep</button></span>` : `<button class="btn ghost small" data-askremove="${id}" style="align-self:flex-start;margin-top:4px">Remove</button>`}</div>`).join("")}</div>` : `<p class="muted">No teams yet. They appear here as students join.</p>`}
    <div class="row"><button class="btn" data-act="open" ${g.teams.length ? "" : "disabled"}>${startLabel}</button><button class="btn ghost small" data-view="brief">Show the case file</button></div></div>`;
}

/* ---------- live control ---------- */
function controlHTML() {
  const g = S.game, r = g.round, results = g.results || [], co = companyById(g.company);
  if (g.phase === "lobby") return `<div class="stack">
    <div><span class="eyebrow">${esc(g.name)} · Live · ${esc(co.name)}</span><h2>Teams are joining</h2><p class="lede">Students go to the main link, pick Live in Class, and type their first names. Open Launch 1 when everyone is in.</p></div>
    <div class="grid2"><div class="panel"><h3>Rules</h3>${rulesHTML()}</div>${teamsPanel(g, "Open Launch 1")}</div></div>`;
  if (g.phase === "open") {
    const ready = g.teams.filter(id => S.buys[id] && cleanLineup(co, S.buys[id]));
    const missing = g.teams.filter(id => !ready.includes(id));
    return `<div class="stack">
      <div><span class="eyebrow">${esc(co.name)} · Launch ${r + 1} of ${ROUNDS}</span><h2>Lineups coming in</h2><p class="muted" style="margin:0">${ready.length} of ${g.teams.length} teams launched. Lineups stay hidden until the reveal.</p></div>
      <div class="statusgrid">${g.teams.map(id => `<div class="${ready.includes(id) ? "done" : ""}"><b>${esc(teamName(id))}</b><span>${ready.includes(id) ? "Launched" : "Building"}</span></div>`).join("")}</div>
      ${S.confirm ? `<div class="confirm"><span>${missing.length} team(s) haven’t launched: ${missing.map(id => esc(teamName(id))).join(", ")}. They will earn $0 this launch.</span><button class="btn small" data-act="reveal">Reveal anyway</button><button class="btn ghost small" id="cancel">Keep waiting</button></div>` : ""}
      <div class="row"><button class="btn" id="tryReveal" ${S.busy ? "disabled" : ""}>${S.busy ? "Scoring…" : "Close and reveal"}</button><button class="btn ghost small" data-view="brief">Show the case file</button></div></div>`;
  }
  if (g.phase === "revealed") {
    const last = r >= ROUNDS - 1;
    return `<div class="stack">${results[r] ? resultsHTML(g, results[r]) : ""}
      <div class="row"><button class="btn" data-act="${last ? "final" : "open"}" ${S.busy ? "disabled" : ""}>${last ? "Show final standings" : "Open Launch " + (r + 2)}</button><button class="btn ghost small" data-view="standings">Standings so far</button></div>
      ${last ? "" : `<p class="muted" style="margin:0;font-size:15px">Each team sees its own coaching notes now. Give them a few minutes to fix their lineups before you open Launch 2.</p>`}</div>`;
  }
  return `<div class="stack">${finalHTML(g, results)}<div class="row"><button class="btn ghost" data-view="games">Start a new game</button></div></div>`;
}

/* ---------- self-paced control ---------- */
function progressTable() {
  const g = S.game, cos = g.companies.map(companyById);
  if (!g.teams.length) return `<p class="muted">No teams yet.</p>`;
  return `<div class="tablewrap"><table><thead><tr><th>Team</th>${cos.map(c => `<th class="r" style="font-size:12px">${esc(c.name)}</th>`).join("")}<th class="r">Average</th><th>Report</th><th></th></tr></thead><tbody>
    ${g.teams.map(id => {
      const p = S.progress[id], sum = progressSummary(g, p);
      return `<tr><td><b>${esc(teamName(id))}</b></td>${sum.stats.map(st => `<td class="r num">${st.finished ? `${st.pct}%` : st.done ? `<span class="muted">L${st.done}/${ROUNDS}</span>` : `<span class="muted">—</span>`}</td>`).join("")}
        <td class="r num" style="font-size:19px">${sum.avg === null ? "—" : sum.avg + "%"}</td>
        <td>${p && p.sentAt ? `<span class="pill ok">Sent</span>` : `<span class="pill idle">Not sent</span>`}</td>
        <td class="r" style="white-space:nowrap"><button class="btn ghost small" data-report="${id}">View</button> ${S.removing === id ? `<button class="btn small" data-remove="${id}">Confirm remove</button> <button class="btn ghost small" id="keepTeam">Keep</button>` : `<button class="btn ghost small" data-askremove="${id}" title="Remove this team">✕</button>`}</td></tr>`; }).join("")}
  </tbody></table></div>
  <p class="muted" style="font-size:14px;margin:8px 0 0">Percent = their better launch compared with the best possible lineup. “L1/2” means they are still working on that company.</p>`;
}

function selfControlHTML() {
  const g = S.game, sentCount = g.teams.filter(id => S.progress[id] && S.progress[id].sentAt).length;
  return `<div class="stack">
    <div><span class="eyebrow">${esc(g.name)} · Self-paced</span><h2>${g.phase === "final" ? "Activity closed" : g.teams.length ? "Teams are working" : "Waiting for teams"}</h2>
      <p class="muted" style="margin:0">${sentCount} of ${g.teams.length} teams have sent a report. This updates on its own.</p></div>
    <div class="panel">${progressTable()}</div>
    <div class="row">${g.phase !== "final" ? `<button class="btn" data-act="close">Close the activity</button>` : `<button class="btn ghost" data-act="reopen">Reopen</button>`}<button class="btn ghost small" data-view="standings">All reports</button></div>
    ${g.phase !== "final" ? `<p class="muted" style="font-size:14px;margin:0">Teams can join and start any time. Closing stops all teams from launching more lineups. Their reports show what they finished.</p>` : ""}
  </div>`;
}

function reportsHTML() {
  const g = S.game;
  if (S.printAll) return `<div class="stack"><div class="row noprint"><button class="btn" id="doPrint">Print</button><button class="btn ghost small" id="closeAll">Back</button></div>
    ${g.teams.map(id => `<div class="pagebreak">${reportHTML(g, id, S.progress[id], S.members[id])}</div>`).join("")}</div>`;
  if (S.reportTeam && g.teams.includes(S.reportTeam)) return `<div class="stack"><div class="row noprint"><button class="btn ghost small" id="allReports">← All reports</button><button class="btn small" id="doPrint">Print this report</button></div>
    ${reportHTML(g, S.reportTeam, S.progress[S.reportTeam], S.members[S.reportTeam])}</div>`;
  return `<div class="stack"><div class="row" style="justify-content:space-between"><div><span class="eyebrow">${esc(g.name)}</span><h2 style="margin:0">Reports</h2></div><button class="btn small" id="printAllBtn" ${g.teams.length ? "" : "disabled"}>Print all reports</button></div>
    <div class="panel">${progressTable()}</div></div>`;
}

/* ---------- actions ---------- */
async function act(data) {
  S.busy = true; S.confirm = false; render();
  try { await api("teacher", S.which === "open" && !["create", "activate"].includes(data.action) ? { ...data, gameId: "openplay" } : data); }
  catch (e) { toast(e.message); }
  S.busy = false;
  if (poller) await poller.now(); else render();
  window.scrollTo(0, 0);
}

function bind() {
  document.querySelectorAll("[data-view]").forEach(b => b.onclick = () => { if (b.dataset.view === "games" && S.which === "open") { S.which = "class"; S.view = "games"; watch(); return; } S.view = b.dataset.view; S.confirm = false; S.reportTeam = null; S.printAll = false; render(); window.scrollTo(0, 0); });
  document.querySelectorAll("[data-activate]").forEach(b => b.onclick = async () => { S.view = "control"; await act({ action: "activate", id: b.dataset.activate }); });
  document.querySelectorAll("[data-act]").forEach(b => b.onclick = () => act({ action: b.dataset.act }));
  document.querySelectorAll("[data-briefco]").forEach(b => b.onclick = () => { S.briefCo = b.dataset.briefco; S.showKey = false; render(); });
  const kb = $("#keyBtn"); if (kb) kb.onclick = () => { S.showKey = !S.showKey; render(); };
  document.querySelectorAll("[data-report]").forEach(b => b.onclick = () => { S.view = "standings"; S.reportTeam = b.dataset.report; render(); window.scrollTo(0, 0); });
  const ar = $("#allReports"); if (ar) ar.onclick = () => { S.reportTeam = null; render(); };
  const pa = $("#printAllBtn"); if (pa) pa.onclick = () => { S.printAll = true; render(); window.scrollTo(0, 0); };
  const ca = $("#closeAll"); if (ca) ca.onclick = () => { S.printAll = false; render(); };
  const dp = $("#doPrint"); if (dp) dp.onclick = () => window.print();
  document.querySelectorAll("[data-which]").forEach(b => b.onclick = () => { if (S.which === b.dataset.which) return; S.which = b.dataset.which; S.view = "control"; S.reportTeam = null; S.printAll = false; $("#app").innerHTML = `<p class="muted">Loading…</p>`; watch(); });
  const ng = $("#newGame");
  if (ng) {
    const sync = () => { const live = $("#modeLive").checked; $("#selfCos").hidden = live; $("#liveCoWrap").hidden = !live; };
    $("#modeLive").onchange = sync; $("#modeSelf").onchange = sync;
    const ta = $("#toggleAll");
    ta.onclick = () => { const boxes = [...document.querySelectorAll("[data-co]")], any = boxes.some(c => c.checked); boxes.forEach(c => c.checked = !any); ta.textContent = any ? "Select all" : "Clear all"; };
    ng.onsubmit = async e => {
      e.preventDefault();
      const mode = $("#modeLive").checked ? "live" : "self";
      const companies = [...document.querySelectorAll("[data-co]")].filter(c => c.checked).map(c => c.dataset.co);
      if (mode === "self" && !companies.length) { toast("Pick at least one company."); return; }
      const data = { action: "create", name: $("#gname").value.trim(), mode, companies, company: $("#liveCo").value };
      if (document.activeElement) document.activeElement.blur();
      S.view = "control"; await act(data);
    };
  }
  document.querySelectorAll("[data-askremove]").forEach(b => b.onclick = () => { S.removing = b.dataset.askremove; render(); });
  document.querySelectorAll("[data-remove]").forEach(b => b.onclick = () => { const id = b.dataset.remove; S.removing = null; act({ action: "remove", team: id }); });
  const kt = $("#keepTeam"); if (kt) kt.onclick = () => { S.removing = null; render(); };
  const tr = $("#tryReveal");
  if (tr) tr.onclick = () => {
    const g = S.game, co = companyById(g.company), missing = g.teams.filter(id => !(S.buys[id] && cleanLineup(co, S.buys[id])));
    if (missing.length) { S.confirm = true; render(); } else act({ action: "reveal" });
  };
  const cn = $("#cancel"); if (cn) cn.onclick = () => { S.confirm = false; render(); };
}

function toast(t) {
  const el = document.createElement("div"); el.className = "banner wait"; el.textContent = t;
  el.style.cssText = "position:fixed;left:16px;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:9;box-shadow:0 6px 20px rgba(0,0,0,.2)";
  document.body.appendChild(el); setTimeout(() => el.remove(), 5000);
}

start();
