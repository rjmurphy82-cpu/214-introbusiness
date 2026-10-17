// Team desk: students make a team from their first names (or join one), then build lineups.
import { api, poll, getToken, setToken } from "./api.js";
import { teamName, setTeamNames } from "./teams.js";
import { ROUNDS, companyById, esc, money, moneyExact, wordCount, cleanLineup, scoreLineup, pctOfBest, bestLineup, briefHTML, rulesHTML, roundBar, builderHTML, emptyLineup, lineupComplete, lineupResultHTML, bestLineupHTML, resultsHTML, standingsHTML, finalHTML, coStats, coReportHTML, progressSummary, reportHTML, REFLECT } from "./game.js";

const $ = s => document.querySelector(s);
const S = { team: null, game: null, myBuy: null, prog: null, roster: [], draft: null, draftKey: null, seg: 0, view: "desk", saving: false,
  co: null, seenRules: false, showResult: null, seenBrief: {}, why: {}, reflect: {}, confirmSend: false };
let poller = null;

/* ---------- start: Live in Class or Open Play ---------- */
let lobbyTimer = null, lobbyGame = null, channel = null;
function resetToLogin() {
  if (poller) { poller.stop(); poller = null; }
  setToken(null); S.team = null; S.co = null; S.showResult = null; S.view = "desk"; S.draftKey = null;
  $("#tabs").hidden = true; $("#who").hidden = true; $("#yearbar").innerHTML = "";
  clearTimeout(lobbyTimer);
}

async function showLogin(err = "") {
  resetToLogin(); channel = null;
  let info = null;
  try { info = await api("lobby"); } catch (e) { err = err || e.message; }
  const cg = info && info.classGame;
  $("#app").innerHTML = `<div class="stack" style="max-width:860px;margin:28px auto;gap:18px">
    <div><span class="eyebrow">Build the Lineup</span><h2 style="margin:0">How are you playing today?</h2></div>
    <div class="grid2">
      <div class="panel stack" style="gap:10px;border-top:6px solid var(--brown)"><span class="eyebrow">With your class</span><h3 style="margin:0">Live in Class</h3>
        <p style="margin:0">Join the game your teacher is running right now.</p>
        <p class="muted" style="margin:0;font-size:15px">${cg ? `Running now: <b>${esc(cg.name)}</b>` : "No class game is running right now."}</p>
        <div style="margin-top:auto"><button class="btn ${cg ? "" : "ghost"}" data-channel="class">Join class game</button></div></div>
      <div class="panel stack" style="gap:10px;border-top:6px solid var(--orange)"><span class="eyebrow">On your own</span><h3 style="margin:0">Open Play</h3>
        <p style="margin:0">Work through twelve companies at your own pace. When you’re done, send your report to your teacher.</p>
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
    <div><span class="eyebrow">${open ? "Open Play · on your own" : "Live in Class · " + esc(lobby.game.name)}</span><h2 style="margin:0">Make your team</h2>
      <p class="muted" style="margin:4px 0 0" id="count">${open ? "" : `${lobby.teams.length} of ${lobby.max} teams made`}</p></div>
    <form class="login" id="newForm" style="margin:0" ${full ? "hidden" : ""}>
      <span class="eyebrow">New team</span>
      <p style="margin:0">Type the <b>first name</b> of everyone at this computer. Your names become your team name.</p>
      ${[1, 2, 3, 4].map(i => `<input type="text" id="nm${i}" placeholder="${i === 1 ? "First name" : "Teammate’s first name (optional)"}" maxlength="14" autocomplete="off" aria-label="First name ${i}">`).join("")}
      <p class="muted" id="preview" style="margin:0;font-size:15px"></p>
      <button class="btn" type="submit" id="goNew">Create team</button>
    </form>
    <form class="login" id="joinForm" style="margin:0" ${lobby.teams.length ? "" : "hidden"}>
      <span class="eyebrow">${full ? `All ${lobby.max} teams are made` : open ? "Already started? Pick up where you left off" : "Teammate already made it?"}</span>
      <p style="margin:0">${open ? "Pick your team to keep going, or to join from a different computer." : "Join a team on a different computer."}</p>
      <label for="team">Team<select id="team"><option value="">Pick your team</option>${list.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join("")}</select></label>
      <label for="jn">Your first name<input type="text" id="jn" maxlength="14" autocomplete="off"></label>
      <button class="btn ghost" type="submit" id="goJoin">Join team</button>
    </form>
    <p class="err" id="err">${esc(err)}</p>
  </div>`;
  $("#backStart").onclick = () => showLogin();
  const label = () => {
    const n = [1, 2, 3, 4].map(i => $("#nm" + i).value.trim().split(/\s+/)[0]).filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1).toLowerCase());
    $("#preview").textContent = n.length ? "Team name: " + (n.length === 1 ? n[0] : n.length === 2 ? n.join(" & ") : n.slice(0, -1).join(", ") + " & " + n[n.length - 1]) : "";
  };
  [1, 2, 3, 4].forEach(i => $("#nm" + i).addEventListener("input", label));
  $("#newForm").addEventListener("submit", async e => {
    e.preventDefault();
    const names = [1, 2, 3, 4].map(i => $("#nm" + i).value.trim()).filter(Boolean);
    if (!names.length) { $("#err").textContent = "Type at least one first name."; return; }
    $("#goNew").disabled = true; $("#err").textContent = "Creating your team…";
    try { const r = await api("login", { channel: ch, mode: "new", names }); setToken(r.token); start(); }
    catch (er) { $("#err").textContent = er.message; $("#goNew").disabled = false; }
  });
  $("#joinForm").addEventListener("submit", async e => {
    e.preventDefault();
    const team = $("#team").value, name = $("#jn").value.trim();
    if (!team) { $("#err").textContent = "Pick your team."; return; }
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
    sel.innerHTML = `<option value="">Pick your team</option>` + list.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join("");
    sel.value = keep;
    $("#joinForm").hidden = !lobby.teams.length;
    $("#newForm").hidden = lobby.teams.length >= lobby.max;
    if (channel !== "open") $("#count").textContent = `${lobby.teams.length} of ${lobby.max} teams made`;
  } catch {}
  lobbyTimer = setTimeout(refreshLobby, 4000);
}

function start() {
  clearTimeout(lobbyTimer);
  $("#tabs").hidden = false; $("#who").hidden = false;
  $("#app").innerHTML = `<p class="muted">Connecting…</p>`;
  poller = poll(onState, () => showLogin("Your teacher started a new game or removed your team. Pick how you want to play."));
}

const toDraft = l => l.map(v => ({ f: [...v.f], p: v.p, n: v.n || "" }));
function onState(s) {
  if (s.role !== "team") { showLogin(); return; }
  S.team = s.team; S.game = s.game; S.myBuy = s.myBuy || null; S.prog = s.prog || null; S.roster = s.roster || [];
  setTeamNames(S.game ? S.game.teamNames : {});
  $("#who").innerHTML = `<span>${S.game && S.game.id === "openplay" ? "Open Play · " : ""}Team <b>${esc(teamName(S.team))}</b></span><button id="logout">Switch</button>`;
  $("#logout").onclick = () => showLogin();
  const self = S.game && S.game.mode === "self";
  document.querySelector('#tabs [data-view="standings"]').textContent = self ? "My Report" : "Standings";
  if (!self && S.game) {
    const key = S.game.id + ":" + S.game.round;
    if (key !== S.draftKey) {
      const prev = S.game.round > 0 && S.game.results && S.game.results[S.game.round - 1] && S.game.results[S.game.round - 1].teams[S.team];
      S.draft = S.myBuy ? toDraft(S.myBuy) : prev && prev.lineup ? toDraft(prev.lineup) : emptyLineup();
      S.draftKey = key; S.seg = 0;
    }
  }
  render();
}
const liveCo = () => companyById(S.game && S.game.company);
const entryOf = id => (S.prog && S.prog.companies && S.prog.companies[id]) || { rounds: [], reflect: null };

/* ---------- screens ---------- */
function render() {
  const ae = document.activeElement, keepId = ae && ae.id && (ae.tagName === "TEXTAREA" || (ae.tagName === "INPUT" && ae.type === "text")) ? ae.id : null;
  const caret = keepId ? ae.selectionStart : 0;
  const y = window.scrollY;
  document.querySelectorAll("#tabs button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.view === S.view)));
  $("#yearbar").innerHTML = S.game ? roundBar(S.game) : "";
  const app = $("#app"), self = S.game && S.game.mode === "self";
  if (S.view === "brief") app.innerHTML = self ? selfBriefHTML() : briefHTML(liveCo());
  else if (S.view === "standings") app.innerHTML = self ? myReportHTML() : `<div class="stack"><div><span class="eyebrow">Live</span><h2>Standings</h2></div><div class="panel">${S.game ? standingsHTML(S.game, S.game.results || [], S.team) : `<p class="muted">No game yet.</p>`}</div></div>`;
  else app.innerHTML = self ? selfDeskHTML() : deskHTML();
  bind();
  if (keepId) { const el = document.getElementById(keepId); if (el) { el.focus({ preventScroll: true }); try { el.setSelectionRange(caret, caret); } catch {} } }
  window.scrollTo(0, y);
}

/* ---------- live (teacher-paced) mode ---------- */
function deskHTML() {
  const g = S.game;
  if (!g) return `<div class="stack"><div class="banner wait">No game is running yet. Hang tight.</div><div class="panel"><h3>How it works</h3>${rulesHTML()}</div></div>`;
  const results = g.results || [], co = liveCo();
  if (g.phase === "lobby") return `<div class="stack"><div class="banner wait">Your teacher will open Launch 1 soon. Read the case file while you wait.</div>
    <div class="grid2"><div class="panel"><h3>How it works</h3>${rulesHTML()}</div><div class="panel stack" style="gap:10px"><h3>Your company</h3><p>You are the product team for <b>${esc(co.name)}</b>. Study the three segments before you build anything.</p><button class="btn" data-view="brief">Read the case file</button></div></div></div>`;
  if (g.phase === "final") return myLiveResult(g, results[g.round], true) + finalHTML(g, results, S.team);
  if (g.phase === "revealed" && results[g.round]) return myLiveResult(g, results[g.round], false) + resultsHTML(g, results[g.round], S.team);
  return liveBuildHTML(g);
}

function liveBuildHTML(g) {
  const co = liveCo(), d = S.draft, ready = lineupComplete(d);
  const same = S.myBuy && JSON.stringify(cleanLineup(co, d.map(v => ({ ...v, p: v.p ?? -1 })))) === JSON.stringify(S.myBuy);
  let banner = "";
  if (S.myBuy && same) banner = `<div class="banner ok">Lineup launched. You can still change it until your teacher closes Launch ${g.round + 1}.</div>`;
  else if (S.myBuy) banner = `<div class="banner wait">You changed your lineup. Launch again to save the new version.</div>`;
  else if (g.round > 0) banner = `<div class="banner wait">Launch 2: your Launch 1 lineup is loaded. Fix what went wrong.</div>`;
  const after = `<div class="row"><button class="btn" id="submitBuy" ${ready && !S.saving && !same ? "" : "disabled"}>${S.saving ? "Saving…" : S.myBuy ? "Launch the new lineup" : "Launch our lineup"}</button>
      <span class="pill ${ready ? "ok" : "idle"}">${ready ? "Ready" : "Price all three versions"}</span></div>`;
  return `<div class="stack">${banner}
    <div><span class="eyebrow">${esc(co.name)} · Launch ${g.round + 1} of ${ROUNDS}</span><h2 style="margin:0">Build your lineup</h2>
      <p class="muted" style="margin:4px 0 0">One version per segment. Switch segments with the tabs. <button class="btn ghost small" data-view="brief">Case file</button></p></div>
    <div class="panel stack" style="gap:14px">${builderHTML(co, d, S.seg, { after })}</div>
    <details class="panel"><summary><b>Rules</b></summary>${rulesHTML()}</details></div>`;
}

function myLiveResult(g, res, final) {
  const co = liveCo(), mine = res && res.teams[S.team];
  if (!mine) return "";
  const order = g.teams.map(id => ({ id, t: res.teams[id] ? res.teams[id].total : 0 })).sort((a, b) => b.t - a.t);
  const rank = order.findIndex(t => t.id === S.team) + 1;
  return `<div class="stack" style="margin-bottom:22px"><div class="panel reveal" style="border-top:6px solid var(--orange)"><span class="eyebrow">Your Launch ${res.round + 1} result</span>
    <div class="row" style="gap:28px;margin:6px 0 4px"><div><div class="big">${money(mine.total)}</div><div class="muted">total profit</div></div><div><div class="big">#${rank}</div><div class="muted">of ${order.length} teams</div></div><div><div class="big">${pctOfBest(co, mine.total)}%</div><div class="muted">of the best possible</div></div></div>
    ${mine.missing ? `<p class="err">No lineup was launched, so your team earned $0.</p>` : ""}</div>
    ${mine.missing ? "" : lineupResultHTML(co, mine.lineup, { best: final })}</div>`;
}

/* ---------- self-paced mode ---------- */
function selfDeskHTML() {
  const g = S.game;
  if (g.phase === "final") return `<div class="stack"><div class="banner wait">Your teacher closed this activity. Here is your report.</div>${reportHTML(g, S.team, S.prog, S.roster)}</div>`;
  if (!S.co) return (S.seenRules ? "" : rulesIntroHTML()) + pickerHTML();
  const co = companyById(S.co), entry = entryOf(co.id), r = entry.rounds.length;
  if (S.showResult !== null && entry.rounds[S.showResult]) return roundResultHTML(co, entry, S.showResult);
  if (r === 0 && !S.seenBrief[co.id]) return `<div class="stack">${backBar()}${briefHTML(co)}<div class="row"><button class="btn" data-startco="${co.id}">Start building</button></div></div>`;
  if (r < ROUNDS) return selfBuildHTML(co, entry, r);
  if (!Array.isArray(entry.reflect)) return reflectHTML(co, entry);
  return `<div class="stack">${backBar()}<div class="banner ok">${esc(co.name)} is finished.</div>${coReportHTML(co, entry)}${bestLineupHTML(co)}<div class="row"><button class="btn" data-back>Back to companies</button></div></div>`;
}

const backBar = () => `<div><button class="btn ghost small" data-back>← All companies</button></div>`;

function rulesIntroHTML() {
  return `<div class="panel stack" style="gap:10px;margin-bottom:18px;border-top:6px solid var(--orange)"><span class="eyebrow">How to play</span>
    <h3 style="margin:0">You’re the product team</h3>
    <p style="margin:0">Each company sells to three different segments. Instead of one product for everyone, build <b>three versions</b>, one for each segment, and set each one’s price. Read the survey data, launch your lineup, see the profit, then fix it for Launch 2.</p>
    ${rulesHTML()}
    <div><button class="btn small" id="gotRules">Got it</button></div></div>`;
}

function pickerHTML() {
  const g = S.game, sum = progressSummary(g, S.prog), sent = S.prog && S.prog.sentAt;
  return `<div class="stack">
    <div><span class="eyebrow">${esc(g.name)} · Work at your own pace</span><h2>Your companies</h2>
      <p class="lede">Pick a company, read its case file, and build a lineup of three versions. Finish as many as you can, then send your report.</p></div>
    <div class="grid3">${sum.stats.map((st, i) => {
      const status = st.finished ? `<span class="pill ok">Finished · ${st.pct}%</span>` : st.done ? `<span class="pill idle">Launch ${Math.min(st.done + 1, ROUNDS)} of ${ROUNDS}${st.done >= ROUNDS ? " · reflect" : ""}</span>` : `<span class="pill idle">Not started</span>`;
      return `<div class="segcard"><span class="tag">Case ${String(i + 1).padStart(2, "0")} · ${esc(st.co.industry)}</span><h4>${esc(st.co.name)}</h4><span class="facts">${esc(st.co.product)}</span>
        <div class="row" style="justify-content:space-between;margin-top:auto;padding-top:8px">${status}<button class="btn small ${st.finished ? "ghost" : ""}" data-openco="${st.co.id}">${st.finished ? "Review" : st.done ? "Continue" : "Start"}</button></div></div>`; }).join("")}</div>
    <div class="panel stack" style="gap:10px"><h3 style="margin:0">Your report</h3>
      <p style="margin:0">${sum.finishedCount} of ${sum.total} companies finished${sum.avg !== null ? ` · average ${sum.avg}% of the best possible` : ""}.${sent ? " Sent to your teacher. If you finish more, send it again to update it." : ""}</p>
      ${S.confirmSend ? `<div class="confirm"><span>You’ve finished ${sum.finishedCount} of ${sum.total}. Send the report anyway?</span><button class="btn small" id="sendNow">Send it</button><button class="btn ghost small" id="cancelSend">Keep working</button></div>` : ""}
      <div class="row"><button class="btn" id="sendReport" ${S.saving ? "disabled" : ""}>${sent ? "Send updated report" : "Send report to teacher"}</button><button class="btn ghost small" data-view="standings">Preview report</button></div>
    </div>
  </div>`;
}

function selfBuildHTML(co, entry, r) {
  const key = co.id + ":" + r;
  if (S.draftKey !== key) { S.draft = r > 0 ? toDraft(entry.rounds[r - 1].lineup) : emptyLineup(); S.draftKey = key; S.seg = 0; }
  const d = S.draft, why = S.why[key] || "", wc = wordCount(why), ready = lineupComplete(d) && wc >= 8;
  const after = `<label for="why" class="stack" style="gap:6px"><b>Why this lineup?</b><span class="muted" style="font-size:15px">Point to the survey data. At least one full sentence.</span>
      <textarea id="why" rows="3" maxlength="600" placeholder="Segment A gets ___ because ___ of them require it.">${esc(why)}</textarea>
      <span class="muted" id="wc" style="font-size:14px">${wc} word${wc === 1 ? "" : "s"}${wc < 8 ? " · need 8+" : ""}</span></label>
    <div class="row"><button class="btn" id="selfLaunch" ${ready && !S.saving ? "" : "disabled"}>${S.saving ? "Running the numbers…" : "Launch " + (r + 1)}</button>
      <span class="pill ${ready ? "ok" : lineupComplete(d) ? "no" : "idle"}" id="readyPill">${ready ? "Ready" : lineupComplete(d) ? "Explain your lineup" : "Price all three versions"}</span></div>
    <p class="muted" style="margin:0;font-size:14px">Once you launch, you can’t change it.</p>`;
  return `<div class="stack">${backBar()}
    <div><span class="eyebrow">${esc(co.name)} · Launch ${r + 1} of ${ROUNDS}</span><h2 style="margin:0">${r ? "Fix your lineup" : "Build your lineup"}</h2>
      <p class="muted" style="margin:4px 0 0">${r ? `Launch 1 earned <b>${moneyExact(entry.rounds[0].total)}</b>. Your Launch 1 lineup is loaded. ` : ""}One version per segment. <button class="btn ghost small" data-view="brief">Case file</button></p></div>
    <div class="panel stack" style="gap:14px">${builderHTML(co, d, S.seg, { after })}</div></div>`;
}

function roundResultHTML(co, entry, r) {
  const res = entry.rounds[r], last = r === ROUNDS - 1;
  const prev = r > 0 ? entry.rounds[r - 1].total : null;
  return `<div class="stack">
    <div class="panel reveal" style="border-top:6px solid var(--orange)"><span class="eyebrow">${esc(co.name)} · Launch ${r + 1} result</span>
      <div class="row" style="gap:28px;margin:6px 0 4px"><div><div class="big">${moneyExact(res.total)}</div><div class="muted">total profit</div></div><div><div class="big">${pctOfBest(co, res.total)}%</div><div class="muted">of the best possible</div></div>
      ${prev !== null ? `<div><div class="big">${res.total >= prev ? "+" : "−"}${money(Math.abs(res.total - prev))}</div><div class="muted">vs. Launch 1</div></div>` : ""}</div></div>
    ${lineupResultHTML(co, res.lineup, { best: last })}
    ${last ? bestLineupHTML(co) : ""}
    <div class="row"><button class="btn" id="nextStep">${last ? "Finish: reflection questions" : "Go to Launch 2"}</button></div>
  </div>`;
}

function reflectHTML(co, entry) {
  const st = coStats(co, entry), ans = S.reflect[co.id] || ["", "", ""], ok = ans.every(a => wordCount(a) >= 5);
  return `<div class="stack">${backBar()}
    <div class="panel" style="border-top:6px solid var(--orange)"><span class="eyebrow">${esc(co.name)} · Both launches done</span>
      <div class="row" style="gap:28px;margin:6px 0 4px"><div><div class="big">${moneyExact(st.last)}</div><div class="muted">Launch 2 profit</div></div><div><div class="big">${st.pct}%</div><div class="muted">of the best possible</div></div></div></div>
    <div class="panel stack" style="gap:14px"><h3 style="margin:0">Reflection</h3><p class="muted" style="margin:0">Answer all three to finish this company. These go in your report.</p>
      ${REFLECT.map((q, i) => `<label for="rf${i}" class="stack" style="gap:6px"><b>${i + 1}. ${esc(q)}</b>
        <textarea id="rf${i}" data-rf="${i}" rows="3" maxlength="800">${esc(ans[i])}</textarea></label>`).join("")}
      <div class="row"><button class="btn" id="saveReflect" ${ok && !S.saving ? "" : "disabled"}>Finish ${esc(co.name)}</button><span class="muted" id="rfHint" style="font-size:14px">${ok ? "" : "5+ words for each answer"}</span></div>
    </div>
    ${coReportHTML(co, entry)}
  </div>`;
}

function selfBriefHTML() {
  if (S.co) return `<div class="stack"><div><button class="btn ghost small" data-view="desk">← Back to my desk</button></div>${briefHTML(companyById(S.co))}</div>`;
  return `<div class="stack"><p class="lede">Pick a company on <b>My Desk</b> to read its case file.</p><div><button class="btn" data-view="desk">Go to My Desk</button></div></div>`;
}
function myReportHTML() {
  return `<div class="stack"><div class="row" style="justify-content:space-between"><h2 style="margin:0">My report</h2><button class="btn ghost small" data-view="desk">Back to my desk</button></div>${reportHTML(S.game, S.team, S.prog, S.roster)}</div>`;
}

/* ---------- events ---------- */
async function play(data) {
  S.saving = true; render();
  try { const r = await api("play", data); S.prog = r.prog; return r; }
  catch (e) { toast(e.status === 401 ? "Your teacher started a new game. Join again." : e.message); return null; }
  finally { S.saving = false; render(); }
}
const toTop = () => window.scrollTo(0, 0);

function bind() {
  document.querySelectorAll("[data-view]").forEach(b => b.onclick = () => { S.view = b.dataset.view; render(); toTop(); });
  document.querySelectorAll("[data-back]").forEach(b => b.onclick = () => { S.co = null; S.showResult = null; S.view = "desk"; render(); toTop(); });
  document.querySelectorAll("[data-openco]").forEach(b => b.onclick = () => { S.co = b.dataset.openco; S.showResult = null; render(); toTop(); });
  document.querySelectorAll("[data-startco]").forEach(b => b.onclick = () => { S.seenBrief[b.dataset.startco] = true; render(); toTop(); });

  // builder
  document.querySelectorAll("[data-seg]").forEach(b => b.onclick = () => { S.seg = +b.dataset.seg; render(); });
  document.querySelectorAll("[data-feat]").forEach(c => c.onchange = () => {
    const v = S.draft[S.seg], f = +c.dataset.feat;
    v.f = c.checked ? [...new Set([...v.f, f])].sort((a, b) => a - b) : v.f.filter(x => x !== f);
    render();
  });
  document.querySelectorAll("[data-price]").forEach(b => b.onclick = () => { S.draft[S.seg].p = +b.dataset.price; render(); });
  const vn = $("#vname"); if (vn) vn.oninput = () => { S.draft[S.seg].n = vn.value; };

  const sb = $("#submitBuy");
  if (sb) sb.onclick = async () => {
    S.saving = true; render();
    try { const r = await api("buy", { lineup: S.draft }); S.myBuy = r.lineup; }
    catch (e) { toast(e.status === 401 ? "Your login expired. Join again." : e.message); }
    S.saving = false; render();
    if (poller) poller.now();
  };

  const why = $("#why");
  if (why) why.oninput = () => {
    const co = companyById(S.co), key = co.id + ":" + entryOf(co.id).rounds.length;
    S.why[key] = why.value;
    const wc = wordCount(why.value), done = lineupComplete(S.draft), ready = done && wc >= 8;
    $("#wc").textContent = `${wc} word${wc === 1 ? "" : "s"}${wc < 8 ? " · need 8+" : ""}`;
    $("#selfLaunch").disabled = !ready || S.saving;
    const pill = $("#readyPill"); pill.className = "pill " + (ready ? "ok" : done ? "no" : "idle"); pill.textContent = ready ? "Ready" : done ? "Explain your lineup" : "Price all three versions";
  };
  const sl = $("#selfLaunch");
  if (sl) sl.onclick = async () => {
    const co = companyById(S.co), key = co.id + ":" + entryOf(co.id).rounds.length;
    const r = await play({ action: "launch", company: co.id, lineup: S.draft, why: S.why[key] || "" });
    if (r) { S.showResult = r.round; delete S.why[key]; S.draftKey = null; render(); toTop(); }
  };
  const next = $("#nextStep");
  if (next) next.onclick = () => { S.showResult = null; render(); toTop(); };

  document.querySelectorAll("[data-rf]").forEach(t => t.oninput = () => {
    const a = S.reflect[S.co] || (S.reflect[S.co] = ["", "", ""]); a[+t.dataset.rf] = t.value;
    const ok = a.every(x => wordCount(x) >= 5);
    $("#saveReflect").disabled = !ok || S.saving; $("#rfHint").textContent = ok ? "" : "5+ words for each answer";
  });
  const gr = $("#gotRules"); if (gr) gr.onclick = () => { S.seenRules = true; render(); };
  const sr = $("#saveReflect");
  if (sr) sr.onclick = async () => {
    const r = await play({ action: "reflect", company: S.co, answers: S.reflect[S.co] || [] });
    if (r) { delete S.reflect[S.co]; render(); toTop(); }
  };

  const send = $("#sendReport");
  if (send) send.onclick = async () => {
    const sum = progressSummary(S.game, S.prog);
    if (sum.finishedCount < sum.total && !S.confirmSend) { S.confirmSend = true; render(); return; }
    S.confirmSend = false; const r = await play({ action: "send" }); if (r) toast("Report sent to your teacher.");
  };
  const sn = $("#sendNow"); if (sn) sn.onclick = async () => { S.confirmSend = false; const r = await play({ action: "send" }); if (r) toast("Report sent to your teacher."); };
  const cs = $("#cancelSend"); if (cs) cs.onclick = () => { S.confirmSend = false; render(); };
}
function toast(t) {
  const el = document.createElement("div"); el.className = "banner wait"; el.textContent = t;
  el.style.cssText = "position:fixed;left:16px;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:9;box-shadow:0 6px 20px rgba(0,0,0,.2)";
  document.body.appendChild(el); setTimeout(() => el.remove(), 5000);
}

getToken() ? start() : showLogin();
