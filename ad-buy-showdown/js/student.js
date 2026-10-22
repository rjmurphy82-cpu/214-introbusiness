// Agency desk: students make a team from their first names (or join one), then build and lock in campaigns.
//   Live in Class: the teacher opens each round and launches every campaign at once.
//   Open Play: the team runs all six clients on its own and sends the report to the teacher.
import { api, poll, getToken, setToken } from "./api.js";
import { teamName, setTeamNames } from "./teams.js";
import { ROUNDS, NROUNDS, blankCampaign, cleanCampaign, totals } from "./model.js";
import { $, esc, money, roundBar, rulesHTML, briefHTML, builderHTML, sideHTML, bindBuilder, eventHTML, barsHTML, growBars, reportTableHTML, myResultHTML, standingsTableHTML, rankList, playLaunch, toast } from "./ui.js";

const S = { team: null, game: null, myBuy: null, prog: null, roster: [], view: "desk", draft: null, draftKey: null, busy: false, err: "",
  opRound: null, opDrafts: {}, animated: {}, open: null, confirmSend: false, playing: false };
let poller = null;

/* ---------- start: Live in Class or Open Play ---------- */
let lobbyTimer = null, lobbyGame = null, channel = null;
function resetToLogin() {
  if (poller) { poller.stop(); poller = null; }
  setToken(null); S.team = null; S.view = "desk"; S.draftKey = null; S.opRound = null; S.opDrafts = {};
  $("#tabs").hidden = true; $("#who").hidden = true; $("#yearbar").innerHTML = "";
  clearTimeout(lobbyTimer);
}

async function showLogin(err = "") {
  resetToLogin(); channel = null;
  let info = null;
  try { info = await api("lobby"); } catch (e) { err = err || e.message; }
  const cg = info && info.classGame;
  $("#app").innerHTML = `<div class="stack" style="max-width:860px;margin:28px auto;gap:18px">
    <div><span class="eyebrow">Ad Buy Showdown</span><h2 style="margin:0">How are you playing today?</h2></div>
    <div class="grid2">
      <div class="panel stack" style="gap:10px;border-top:6px solid var(--brown)"><span class="eyebrow">With your class</span><h3 style="margin:0">Live in Class</h3>
        <p style="margin:0">Join the game your teacher is running. Every agency launches at the same time, and the results go up on the board.</p>
        <p class="muted" style="margin:0;font-size:15px">${cg ? `Running now: <b>${esc(cg.name)}</b>` : "No class game is running right now."}</p>
        <div style="margin-top:auto"><button class="btn ${cg ? "" : "ghost"}" data-channel="class">Join class game</button></div></div>
      <div class="panel stack" style="gap:10px;border-top:6px solid var(--orange)"><span class="eyebrow">On your own</span><h3 style="margin:0">Open Play</h3>
        <p style="margin:0">Run campaigns for all six clients at your own pace. When you’re done, send your report to your teacher.</p>
        <p class="muted" style="margin:0;font-size:15px">Always open. No need to wait for anyone.</p>
        <div style="margin-top:auto"><button class="btn" data-channel="open">Start Open Play</button></div></div>
    </div>
    ${err ? `<p class="err">${esc(err)}</p>` : ""}
  </div>`;
  document.querySelectorAll("[data-channel]").forEach(b => b.onclick = () => showJoin(b.dataset.channel));
  lobbyTimer = setTimeout(() => { if (!channel && !poller) showLogin(); }, 8000);
}

async function showJoin(ch, err = "") {
  resetToLogin(); channel = ch;
  let lobby = null;
  try { lobby = await api("lobby?channel=" + ch); } catch (e) { err = err || e.message; }
  const back = `<button class="btn ghost small" id="backStart">← Back</button>`;
  if (!lobby || !lobby.game) {
    lobbyGame = null;
    $("#app").innerHTML = `<div class="login">${back}<span class="eyebrow">Live in Class</span><h2 style="margin:0">Waiting for your teacher</h2><p>No class game is running yet. This page opens the join screen as soon as your teacher starts one. Want to play now? Go back and pick Open Play.</p>${err ? `<p class="err">${esc(err)}</p>` : ""}</div>`;
    $("#backStart").onclick = () => showLogin();
    lobbyTimer = setTimeout(() => { if (channel === ch) showJoin(ch); }, 4000);
    return;
  }
  lobbyGame = lobby.game.id;
  const full = lobby.teams.length >= lobby.max, open = ch === "open";
  const list = open ? [...lobby.teams].reverse() : lobby.teams;
  $("#app").innerHTML = `<div class="stack" style="max-width:520px;margin:28px auto;gap:16px">
    <div>${back}</div>
    <div><span class="eyebrow">${open ? "Open Play · on your own" : "Live in Class · " + esc(lobby.game.name)}</span><h2 style="margin:0">Make your agency</h2>
      <p class="muted" style="margin:4px 0 0" id="count">${open ? "" : `${lobby.teams.length} of ${lobby.max} agencies made`}</p></div>
    <form class="login" id="newForm" style="margin:0" ${full ? "hidden" : ""}>
      <span class="eyebrow">New agency</span>
      <p style="margin:0">Type the <b>first name</b> of everyone at this computer. Your names become your agency name.</p>
      ${[1, 2, 3, 4].map(i => `<input type="text" id="nm${i}" placeholder="${i === 1 ? "First name" : "Teammate’s first name (optional)"}" maxlength="14" autocomplete="off" aria-label="First name ${i}">`).join("")}
      <p class="muted" id="preview" style="margin:0;font-size:15px"></p>
      <button class="btn" type="submit" id="goNew">Create agency</button>
    </form>
    <form class="login" id="joinForm" style="margin:0" ${lobby.teams.length ? "" : "hidden"}>
      <span class="eyebrow">${full ? `All ${lobby.max} agencies are made` : open ? "Already started? Pick up where you left off" : "Teammate already made it?"}</span>
      <p style="margin:0">${open ? "Pick your agency to keep going, or to join from a different computer." : "Join an agency from a different computer."}</p>
      <label for="team">Agency<select id="team"><option value="">Pick your agency</option>${list.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join("")}</select></label>
      <label for="jn">Your first name<input type="text" id="jn" maxlength="14" autocomplete="off"></label>
      <button class="btn ghost" type="submit" id="goJoin">Join agency</button>
    </form>
    <p class="err" id="err">${esc(err)}</p>
  </div>`;
  $("#backStart").onclick = () => showLogin();
  const label = () => {
    const n = [1, 2, 3, 4].map(i => $("#nm" + i).value.trim().split(/\s+/)[0]).filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1).toLowerCase());
    $("#preview").textContent = n.length ? "Agency name: " + (n.length === 1 ? n[0] : n.length === 2 ? n.join(" & ") : n.slice(0, -1).join(", ") + " & " + n[n.length - 1]) : "";
  };
  [1, 2, 3, 4].forEach(i => $("#nm" + i).addEventListener("input", label));
  $("#newForm").addEventListener("submit", async e => {
    e.preventDefault();
    const names = [1, 2, 3, 4].map(i => $("#nm" + i).value.trim()).filter(Boolean);
    if (!names.length) { $("#err").textContent = "Type at least one first name."; return; }
    $("#goNew").disabled = true; $("#err").textContent = "Creating your agency…";
    try { const r = await api("login", { channel: ch, mode: "new", names }); setToken(r.token); start(); }
    catch (er) { $("#err").textContent = er.message; $("#goNew").disabled = false; }
  });
  $("#joinForm").addEventListener("submit", async e => {
    e.preventDefault();
    const team = $("#team").value, name = $("#jn").value.trim();
    if (!team) { $("#err").textContent = "Pick your agency."; return; }
    if (!name) { $("#err").textContent = "Type your first name."; return; }
    $("#goJoin").disabled = true; $("#err").textContent = "Joining…";
    try { const r = await api("login", { channel: ch, mode: "join", team, name }); setToken(r.token); start(); }
    catch (er) { $("#err").textContent = er.message; $("#goJoin").disabled = false; }
  });
  lobbyTimer = setTimeout(refreshLobby, 4000);
}

async function refreshLobby() {
  if (poller || !$("#joinForm") || !channel) return;
  try {
    const lobby = await api("lobby?channel=" + channel);
    if (!lobby.game || lobby.game.id !== lobbyGame) { showJoin(channel); return; }
    const list = channel === "open" ? [...lobby.teams].reverse() : lobby.teams;
    const sel = $("#team"), keep = sel.value;
    sel.innerHTML = `<option value="">Pick your agency</option>` + list.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join("");
    sel.value = keep;
    $("#joinForm").hidden = !lobby.teams.length;
    $("#newForm").hidden = lobby.teams.length >= lobby.max;
    if (channel !== "open") $("#count").textContent = `${lobby.teams.length} of ${lobby.max} agencies made`;
  } catch {}
  lobbyTimer = setTimeout(refreshLobby, 4000);
}

function start() {
  clearTimeout(lobbyTimer);
  $("#tabs").hidden = false; $("#who").hidden = false;
  $("#app").innerHTML = `<p class="muted">Connecting…</p>`;
  poller = poll(onState, () => showLogin("Your teacher started a new game or removed your agency. Pick how you want to play."));
}

const clone = o => JSON.parse(JSON.stringify(o));
const isSelf = () => S.game && S.game.mode === "self";
function onState(s) {
  if (s.role !== "team") { showLogin(); return; }
  S.team = s.team; S.game = s.game; S.myBuy = s.myBuy || null; S.prog = s.prog || null; S.roster = s.roster || [];
  setTeamNames(S.game ? S.game.teamNames : {});
  $("#who").innerHTML = `<span>${isSelf() ? "Open Play · " : ""}Agency <b>${esc(teamName(S.team))}</b></span><button id="logout">Switch</button>`;
  $("#logout").onclick = () => showLogin();
  document.querySelector('#tabs [data-view="standings"]').textContent = isSelf() ? "My Report" : "Standings";
  if (!isSelf() && S.game) {
    const key = S.game.id + ":" + S.game.round;
    if (key !== S.draftKey) { S.draft = S.myBuy ? clone(S.myBuy) : blankCampaign(); S.draftKey = key; S.err = ""; }
    else if (S.myBuy && !dirty()) S.draft = clone(S.myBuy); // a teammate updated it from another computer
  }
  if (S.playing) return; // the launch animation re-renders when it finishes
  render();
}
const dirty = () => !S.myBuy || JSON.stringify(cleanCampaign(S.game.round, S.draft)) !== JSON.stringify(S.myBuy);

/* ---------- screens ---------- */
function render() {
  if (S.playing) return;
  const ae = document.activeElement, keepId = ae && ae.id && ae.tagName === "INPUT" && ae.type === "text" ? ae.id : null;
  const caret = keepId ? ae.selectionStart : 0, y = window.scrollY;
  document.querySelectorAll("#tabs button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.view === S.view)));
  const g = S.game;
  if (g && !isSelf()) $("#yearbar").innerHTML = roundBar(g.round, (g.results || []).filter(Boolean).length, g.phase);
  else if (g) $("#yearbar").innerHTML = ROUNDS.map((_, i) => `<i class="${i === S.opRound ? "on" : ""} ${S.prog && S.prog.rounds[i] ? "done" : ""}">R${i + 1}</i>`).join("");
  const app = $("#app");
  if (S.view === "brief") app.innerHTML = briefHTML(isSelf() ? (S.opRound ?? 0) : (g ? g.round : 0));
  else if (S.view === "standings") app.innerHTML = isSelf() ? myReportHTML() : standingsHTML();
  else app.innerHTML = isSelf() ? selfDeskHTML() : deskHTML();
  bind();
  if (keepId) { const el = document.getElementById(keepId); if (el) { el.focus({ preventScroll: true }); try { el.setSelectionRange(caret, caret); } catch {} } }
  window.scrollTo(0, y);
  growBars();
}

function roundList(r) {
  const rr = S.game.results[r];
  return S.game.teams.map(id => ({ id, name: teamName(id), camp: rr && rr.teams[id] ? rr.teams[id].camp : null, res: rr && rr.teams[id] ? rr.teams[id].res : null }));
}

/* ---------- live (teacher-paced) ---------- */
function deskHTML() {
  const g = S.game;
  if (!g) return `<div class="stack"><div class="banner wait">No game is running yet. Hang tight.</div><div class="panel"><h3>How it works</h3>${rulesHTML()}</div></div>`;
  const r = g.round, R = ROUNDS[r];
  if (g.phase === "lobby") return `<div class="stack"><div class="banner wait">You’re in. Your teacher will open Round 1 soon.</div>
    <div class="grid2"><div class="panel"><h3>How it works</h3>${rulesHTML()}</div><div class="panel"><h3>Your agency</h3><p style="font-size:20px;margin:0"><b>${esc(teamName(S.team))}</b></p><p class="muted">${S.roster.length} ${S.roster.length === 1 ? "person" : "people"}: ${esc(S.roster.join(", "))}</p></div></div></div>`;
  if (g.phase === "open") {
    const locked = !!S.myBuy, d = dirty();
    const status = locked && !d ? `<div class="banner ok" style="margin-top:12px;font-size:15px">Locked in. You can still change it until your teacher launches.</div>`
      : locked ? `<div class="banner warn" style="margin-top:12px;font-size:15px">You have changes that are not saved yet.</div>` : "";
    return `<div class="stack">
      <div class="row" style="justify-content:space-between;align-items:flex-end"><div><span class="eyebrow">Round ${r + 1} of ${NROUNDS} · ${esc(R.client)}</span><h2 style="margin:0">${esc(R.title)}</h2>
        <p class="muted" style="margin:0">${money(R.budget)} budget · ${money(R.margin)} profit per sale · ${R.inventory >= 100000 ? "no sales limit" : int0(R.inventory) + " available"}</p></div>
        <button class="btn ghost small" data-goto="brief">Read the client brief</button></div>
      ${builderHTML(r, S.draft, { submitLabel: locked ? (d ? "Save changes" : "Saved") : "Lock in campaign", statusHTML: status, busy: S.busy, err: S.err, locked: false })}
    </div>`;
  }
  if (g.phase === "revealed" || g.phase === "final") {
    const rr = g.results[r];
    const list = roundList(r), ranked = rankList(list), mine = rr && rr.teams[S.team];
    const place = ranked.findIndex(o => o.id === S.team) + 1;
    return `<div class="stack">
      ${g.phase === "final" ? `<div class="banner ok">That was the last round. Check Standings for the final results.</div>` : `<div class="banner wait">Results are in. Your teacher will open Round ${r + 2} soon.</div>`}
      ${eventHTML(r)}
      ${mine && mine.res ? myResultHTML(r, mine.camp, mine.res, place, list.length) : `<div class="panel"><h3>Your agency did not launch this round</h3><p class="muted" style="margin:0">No campaign was locked in, so you earned $0. Lock in early next round.</p></div>`}
      <section class="panel"><h3>Profit this round</h3>${barsHTML(ranked.map(o => ({ id: o.id, name: o.name, value: o.res ? o.res.profit : 0 })), S.team)}</section>
      <section class="panel"><h3>Ad report: every agency</h3>${reportTableHTML(r, list, { me: S.team })}</section>
    </div>`;
  }
  return "";
}
const int0 = n => Math.round(n).toLocaleString();

function standingsHTML() {
  const g = S.game;
  if (!g || !g.teams) return `<p class="muted">No game yet.</p>`;
  const tot = totals(g.teams, g.results || []);
  const rows = g.teams.map(id => ({ id, name: teamName(id), per: tot[id].per, sum: tot[id].sum }));
  const sorted = rows.slice().sort((a, b) => b.sum - a.sum);
  const done = (g.results || []).filter(Boolean).length;
  return `<div class="stack"><div><span class="eyebrow">${g.phase === "final" ? "Final results" : `After ${done} of ${NROUNDS} rounds`}</span><h2>${g.phase === "final" && sorted[0] ? esc(sorted[0].name) + " wins the account" : "Standings"}</h2></div>
    ${done ? `<section class="panel">${barsHTML(sorted.map(o => ({ id: o.id, name: o.name, value: o.sum })), S.team)}</section><section class="panel">${standingsTableHTML(rows, S.team)}</section>` : `<p class="muted">No rounds have been launched yet.</p>`}</div>`;
}

/* ---------- Open Play ---------- */
const opDraft = r => S.opDrafts[r] || (S.opDrafts[r] = blankCampaign());
function selfDeskHTML() {
  const g = S.game, prog = S.prog || { rounds: {} };
  if (g.phase === "final") return `<div class="stack"><div class="banner wait">Your teacher closed Open Play for now. Your report still shows what you finished.</div>${myReportHTML()}</div>`;
  if (S.opRound == null) {
    const done = Object.keys(prog.rounds).length, total = Object.values(prog.rounds).reduce((a, x) => a + x.res.profit, 0);
    return `<div class="stack">
      <div><span class="eyebrow">Open Play</span><h2>Pick a client</h2><p class="lede">Each client gets one campaign. Read the brief, build the buy, and launch it. ${done ? `You’ve run <b>${done} of ${NROUNDS}</b> so far for <b class="${total >= 0 ? "pos" : "neg"}">${money(total)}</b> in total profit.` : "Start with any client."}</p></div>
      <div class="clients">${ROUNDS.map((R, r) => { const x = prog.rounds[r]; return `<button class="client ${x ? "done" : ""}" data-op="${r}"><small>Client ${r + 1} · ${esc(R.tag)}</small><b>${esc(R.title)}</b><span class="muted small">${money(R.budget)} budget</span>${x ? `<span class="num ${x.res.profit >= 0 ? "pos" : "neg"}" style="font-size:20px">${money(x.res.profit)} profit</span>` : `<span class="small" style="color:var(--orange);font-weight:600">Build campaign →</span>`}</button>`; }).join("")}</div>
      <div class="panel"><h3>How it works</h3>${rulesHTML()}</div>
    </div>`;
  }
  const r = S.opRound, R = ROUNDS[r], x = prog.rounds[r];
  const nav = `<div class="row"><button class="btn ghost small" data-op="back">← All clients</button>${x && nextOpen() != null ? `<button class="btn small" data-op="${nextOpen()}">Next client →</button>` : ""}${x && nextOpen() == null ? `<button class="btn small" data-goto="standings">See my report →</button>` : ""}</div>`;
  if (x) return `<div class="stack">${nav}${eventHTML(r)}${myResultHTML(r, x.camp, x.res)}</div>`;
  return `<div class="stack">${nav}${briefHTML(r)}
    <div><span class="eyebrow">Your campaign</span><h2 style="margin:0">Build the buy</h2><p class="muted" style="margin:0">One launch per client. Make it count.</p></div>
    ${builderHTML(r, opDraft(r), { submitLabel: "Launch campaign", busy: S.busy, err: S.err })}</div>`;
}
function nextOpen() { const p = S.prog || { rounds: {} }; for (let i = 0; i < NROUNDS; i++) if (!p.rounds[i]) return i; return null; }

function myReportHTML() {
  const prog = S.prog || { rounds: {} }, done = Object.keys(prog.rounds).length;
  const total = Object.values(prog.rounds).reduce((a, x) => a + x.res.profit, 0);
  return `<div class="stack">
    <div><span class="eyebrow">Open Play · ${esc(teamName(S.team))}</span><h2>My report</h2><p class="muted" style="margin:0">${S.roster.length ? esc(S.roster.join(", ")) : ""}</p></div>
    <section class="panel"><div class="tablewrap"><table class="rep"><thead><tr><th>#</th><th>Client</th><th>Spend</th><th>Sales</th><th>Revenue</th><th>ROAS</th><th>Profit</th></tr></thead><tbody>
      ${ROUNDS.map((R, r) => { const x = prog.rounds[r]; return `<tr><td class="rank">${r + 1}</td><td class="tn">${esc(R.title)}</td>${x ? `<td class="td">${money(x.res.spend)}</td><td class="td">${int0(x.res.conv)}</td><td class="td">${money(x.res.revenue)}</td><td class="td">${x.res.roas.toFixed(2)}x</td><td class="td p ${x.res.profit >= 0 ? "pos" : "neg"}">${money(x.res.profit)}</td>` : `<td colspan="5" class="muted">Not run yet</td>`}</tr>`; }).join("")}
      <tr class="top"><td></td><td class="tn">Total</td><td colspan="4"></td><td class="td p ${total >= 0 ? "pos" : "neg"}">${money(total)}</td></tr>
    </tbody></table></div></section>
    <div class="row">${prog.sentAt ? `<span class="pill ok">Sent to your teacher</span><span class="muted small">You can keep playing. Your teacher sees updates automatically.</span>`
      : S.confirmSend ? `<div class="confirm"><span>Send this report with ${done} of ${NROUNDS} clients done?</span><button class="btn small" id="sendYes">Send it</button><button class="btn ghost small" id="sendNo">Not yet</button></div>`
      : `<button class="btn" id="sendBtn" ${done ? "" : "disabled"}>Send report to my teacher</button>${done < NROUNDS ? `<span class="muted small">${NROUNDS - done} client${NROUNDS - done === 1 ? "" : "s"} left.</span>` : ""}`}</div>
  </div>`;
}

/* ---------- actions ---------- */
async function submitLive() {
  const c = cleanCampaign(S.game.round, S.draft);
  if (c.error) { S.err = c.error; render(); return; }
  S.busy = true; S.err = ""; render();
  try { const r = await api("buy", { camp: c }); S.myBuy = r.camp; S.draft = clone(r.camp); }
  catch (e) { S.err = e.message; }
  S.busy = false; render();
  if (poller) poller.now();
}
async function launchOpen() {
  const r = S.opRound, c = cleanCampaign(r, opDraft(r));
  if (c.error) { S.err = c.error; render(); return; }
  S.busy = true; S.err = ""; render();
  try {
    const out = await api("play", { action: "launch", round: r, camp: c });
    S.prog = out.prog; S.busy = false; S.playing = true; window.scrollTo(0, 0);
    playLaunch($("#app"), r, [out.prog.rounds[r].res], () => { S.playing = false; render(); window.scrollTo(0, 0); if (poller) poller.now(); });
    return;
  } catch (e) { S.err = e.message; }
  S.busy = false; render();
}

function bind() {
  const g = S.game;
  document.querySelectorAll("[data-goto]").forEach(b => b.onclick = () => { S.view = b.dataset.goto; render(); window.scrollTo(0, 0); });
  if (g && !isSelf() && g.phase === "open" && S.view === "desk") {
    bindBuilder(g.round, () => S.draft, full => { if (full) render(); else refreshSide(g.round, S.draft); });
    const sb = $("#submitCamp"); if (sb) { if (S.myBuy && !dirty()) sb.disabled = true; sb.onclick = submitLive; }
  }
  if (isSelf() && S.view === "desk" && S.opRound != null && !(S.prog && S.prog.rounds[S.opRound])) {
    const r = S.opRound;
    bindBuilder(r, () => opDraft(r), full => { if (full) render(); else refreshSide(r, opDraft(r)); });
    const sb = $("#submitCamp"); if (sb) sb.onclick = launchOpen;
  }
  document.querySelectorAll("[data-op]").forEach(b => b.onclick = () => { S.opRound = b.dataset.op === "back" ? null : +b.dataset.op; S.err = ""; S.view = "desk"; render(); window.scrollTo(0, 0); });
  document.querySelectorAll("[data-open]").forEach(tr => {
    const go = () => { S.open = S.open === tr.dataset.open ? null : tr.dataset.open; render(); };
    tr.onclick = go; tr.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } };
  });
  const sendBtn = $("#sendBtn"); if (sendBtn) sendBtn.onclick = () => { S.confirmSend = true; render(); };
  const sendNo = $("#sendNo"); if (sendNo) sendNo.onclick = () => { S.confirmSend = false; render(); };
  const sendYes = $("#sendYes"); if (sendYes) sendYes.onclick = async () => {
    try { const out = await api("play", { action: "send" }); S.prog = out.prog; toast("Report sent to your teacher."); } catch (e) { toast(e.message); }
    S.confirmSend = false; render();
  };
  // Live: play the launch sequence once per round on this computer when results first arrive
  if (g && !isSelf() && (g.phase === "revealed") && S.view === "desk") {
    const key = g.id + ":" + g.round;
    if (!S.animated[key]) {
      S.animated[key] = true;
      try { if (sessionStorage.getItem("abs-anim-" + key)) return; sessionStorage.setItem("abs-anim-" + key, "1"); } catch {}
      const rr = g.results[g.round];
      S.playing = true; window.scrollTo(0, 0);
      playLaunch($("#app"), g.round, Object.values(rr.teams).map(t => t.res), () => { S.playing = false; render(); window.scrollTo(0, 0); });
    }
  }
}
// Budget changes only touch the sidebar, so the box being typed in keeps focus.
function refreshSide(r, c) {
  const side = document.querySelector("#builder .side");
  if (!side) return;
  const ae = document.activeElement;
  if (ae && side.contains(ae)) return;
  const live = !isSelf();
  const locked = live && !!S.myBuy, d = live ? dirty() : true;
  const status = !live ? "" : locked && !d ? `<div class="banner ok" style="margin-top:12px;font-size:15px">Locked in. You can still change it until your teacher launches.</div>` : locked ? `<div class="banner warn" style="margin-top:12px;font-size:15px">You have changes that are not saved yet.</div>` : "";
  side.innerHTML = sideHTML(r, c, { submitLabel: live ? (locked ? (d ? "Save changes" : "Saved") : "Lock in campaign") : "Launch campaign", statusHTML: status, busy: S.busy, err: S.err });
  const sb = $("#submitCamp");
  if (sb) { if (live && locked && !d) sb.disabled = true; sb.onclick = live ? submitLive : launchOpen; }
}

document.querySelectorAll("#tabs button").forEach(b => b.onclick = () => { S.view = b.dataset.view; S.open = null; render(); window.scrollTo(0, 0); });
if (getToken()) start(); else showLogin();
