/* Hire Power: the hiring simulation for the Management unit, live.
   Students sign up individually; the teacher screen pairs them at random (one group of 3 if odd). Every pair is the
   CEO and HR director of a different company and builds a hiring plan in four timed stages the teacher opens:
     1 Who we hire: three traits and a "We hire people who..." sentence
     2 Skills:      the 3 skills and the experience level for each of 4 jobs
     3 Interview:   up to 6 hours of interview steps
     4 Hire:        rank the 4 candidates for each job
   The game builds a 9-slide deck as they go. Pairs present from the teacher screen (they can change slides from their
   own device) while every other student grades them on a 5-row rubric on their device.
   The twist: the graders are graded. The engine in data.js scores every plan, and each grader's score is how close
   their ratings came to the engine's. The verdict screen shows engine vs. class for every shop, then the Top 5 graders.
   Games last 14 days so building and presenting can happen on different days; the teacher screen can resume.
   Storage: /api/live (codes under ibl:). */
"use strict";
const K = window.KIT;
const { $, esc, num, plural, andList, ROLE } = K;
const app = $("#app");
const GAME = "hire", PATH = "/hire-power/", HOST_KEY = "hpHost";
const STAGES = [
  { id: "type", name: "Who we hire", mins: 6, sub: "Read about your company. What kind of employee fits here?" },
  { id: "skills", name: "Skills", mins: 10, sub: "For each job, pick the 3 skills and the experience you're looking for." },
  { id: "intv", name: "Interview", mins: 6, sub: `Design your interview process. You have ${HP.HOURS} hours per candidate.` },
  { id: "hire", name: "Hire", mins: 12, sub: "Rank the four candidates for each job, 1 to 4." }
];
const ROLES = ["CEO", "HR Director", "Hiring Manager"];

const hdr = () => `<h1 class="title">Hire <span>Power.</span></h1>
  <p class="lede">${ROLE === "teacher"
    ? "Teacher screen. Students sign up on their own devices and get random partners. Each pair is the CEO and HR director of a different company: they decide what kind of employee fits, pick the skills and experience for four jobs, design an interview process, and rank four candidates for each job. The game builds their slideshow as they go. They present, and the class grades them. The twist: the graders get the grade. The engine scores every plan, and each student is scored on how close their grades came to the engine's."
    : "You and your partner are the CEO and HR director of a company that needs to hire four people. Decide what kind of employee fits, pick the skills for each job, design your interview, and rank the candidates. The game builds your slideshow as you go. Then you grade everyone else, and here's the twist: your grade is how well you grade them."}</p>`;

/* ============================================================ PLAN HELPERS */
const compOf = (st, gi) => { const perm = st.perm || HP.COMPANIES.map((c, i) => i); return perm[gi % perm.length]; };
const SECS = ["type", "s0", "s1", "s2", "s3", "intv", "h0", "h1", "h2", "h3"];
function mergePlans(list) { // newest section wins
  const out = {};
  SECS.forEach(k => { let best = null; list.forEach(p => { const s = p && p[k]; if (s && (!best || (s.at || 0) > (best.at || 0))) best = s; }); if (best) out[k] = best; });
  return out;
}
// flat sections -> the shape the engine wants
function engPlan(plan) {
  const out = { type: plan.type || {}, intv: plan.intv || {}, skills: {}, hire: {} };
  [0, 1, 2, 3].forEach(j => { out.skills["j" + j] = plan["s" + j] || {}; const h = { ...(plan["h" + j] || {}) }; delete h.at; out.hire["j" + j] = h; });
  return out;
}
const jobDone = (plan, kind, j) => {
  if (kind === "s") { const p = plan["s" + j] || {}; return (p.s || []).length === 3 && p.e != null; }
  const h = plan["h" + j] || {}, v = [0, 1, 2, 3].map(k => h[k]); return v.every(x => x) && new Set(v).size === 4;
};
function done(plan, k) {
  if (k === "type") { const p = plan.type || {}; return (p.traits || []).length === 3 && (p.text || "").trim().length >= 10; }
  if (k === "skills") return [0, 1, 2, 3].every(j => jobDone(plan, "s", j));
  if (k === "intv") return ((plan.intv || {}).steps || []).length > 0;
  if (k === "hire") return [0, 1, 2, 3].every(j => jobDone(plan, "h", j));
  return false;
}
const tName = id => (HP.traitById[id] || {}).name || id;
const pills = (list, cls) => list.map(x => `<span class="sk ${cls || ""}">${esc(x)}</span>`).join("");
const steps = plan => (plan.intv || {}).steps || [];
// candidates for job j in the order the hiring team ranked them (unranked last, in display order)
function ranked(plan, ci, j) {
  const pj = HP.pool(ci)[j], h = plan["h" + j] || {};
  return pj.show.map(k => pj.cands[k]).sort((a, b) => (h[a.k] || 9) - (h[b.k] || 9));
}

/* ============================================================ SLIDES */
const NSLIDES = 9;
function slideHTML(plan, info, i) {
  const ci = info.ci, comp = HP.COMPANIES[ci], t = plan.type || {}, names = info.names || [];
  const shell = (cls, inner) => `<div class="sl ${cls}"><div class="slin">${inner}<div class="slfoot"><span>${esc(comp.name)} · Hiring Plan</span><span>${i + 1} / ${NSLIDES}</span></div></div></div>`;
  const miss = x => `<div class="slmiss">${esc(x)}</div>`;
  if (i === 0) return shell("dark title", `<div class="slk">Hiring Plan</div><h1>${esc(comp.name)}</h1><div class="tchip">${esc(comp.ind)}</div>
    <p class="slnames">${names.map((n, k) => `<span class="role">${esc(ROLES[k] || "Hiring team")}</span> ${esc(n)}`).join(" &nbsp;·&nbsp; ")}</p>`);
  if (i === 1) return shell("", `<div class="slk">Who we are and who we hire</div><h2>The Employee We're Looking For</h2>
    <div class="hp2"><div class="bigcard"><small>The company</small><p class="hpdesc">${esc(comp.desc)}</p></div>
    <div class="hpcol"><div class="trrow">${(t.traits || []).map(x => `<div class="vcard"><b>${esc(tName(x))}</b><small>${esc((HP.traitById[x] || {}).sub || "")}</small></div>`).join("") || miss("No traits chosen yet")}</div>
    ${t.text ? `<div class="bigcard dark"><small>We hire people who...</small><p>${esc(t.text)}</p></div>` : ""}</div></div>`);
  if (i >= 2 && i <= 5) { const j = i - 2, job = comp.jobs[j], s = plan["s" + j] || {}, st = steps(plan), list = ranked(plan, ci, j), h = plan["h" + j] || {};
    return shell("", `<div class="slk">Job ${j + 1} of 4</div><h2>${esc(job.t)}</h2>
      <div class="hpjob"><div class="hpcol"><div class="bigcard"><small>The job</small><ul class="resp">${job.r.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
        <div class="bigcard dark"><small>What we want</small><div class="skrow">${(s.s || []).length ? pills(s.s) : "<i>No skills yet</i>"}</div><p class="exp">${s.e != null ? esc(HP.EXP[s.e]) + " · " + esc(HP.EXP_SUB[s.e]) : ""}</p></div></div>
      <div class="rkl">${list.map(c => { const v = HP.view(c, st), r = h[c.k];
        return `<div class="rkr ${r === 1 ? "first" : ""}"><span class="rn">${r || "?"}</span><div><b>${esc(c.name)}</b><em>${esc(HP.yrsText(c.yrs))} · ${esc(c.bg)}</em>
          <div class="skrow">${v.skills.map(x => `<span class="sk ${x.bad ? "bad" : ""}">${esc(x.n)}</span>`).join("")}${v.traits.map(x => `<span class="sk tr ${x.rev ? "rev" : ""}">${esc(tName(x.id))}</span>`).join("")}</div>
          ${v.notes.filter(n => n.bad).map(n => `<p class="flagn">${esc(n.s)}: ${esc(n.t)}</p>`).join("")}</div></div>`; }).join("")}</div></div>`); }
  if (i === 6) { const st = steps(plan);
    return shell("", `<div class="slk">How we interview</div><h2>Our Interview Process</h2>
      <div class="sltot"><span><b>${HP.hours(st)}</b> of ${HP.HOURS} hours per candidate</span><span><b>${st.length}</b> ${st.length === 1 ? "step" : "steps"}</span></div>
      <div class="stepcards">${st.map((id, k) => { const x = HP.stepById[id]; return `<div class="vcard"><span>${k + 1}</span><b>${esc(x.name)}</b><small>${esc(x.does)} · ${plural(x.hrs, "hour")}</small></div>`; }).join("") || miss("No interview steps yet")}</div>`); }
  if (i === 7) return shell("", `<div class="slk">Does anyone double up?</div><h2>Our Team Skill Map</h2>
    <div class="ptab map">${comp.jobs.map((job, j) => { const top = ranked(plan, ci, j).find(c => (plan["h" + j] || {})[c.k] === 1), s = (plan["s" + j] || {}).s || [];
      return `<div><span>${esc(job.t)}</span><span class="mw">${s.length ? pills(s) : "<i>?</i>"}</span><b>${top ? esc(top.name) : "?"}</b><span class="mw">${top ? HP.view(top, steps(plan)).skills.map(x => `<span class="sk ${x.bad ? "bad" : ""}">${esc(x.n)}</span>`).join("") : ""}</span></div>`; }).join("")}
    <div class="mh"><span>Job</span><span>Skills we asked for</span><b>Our #1 hire</b><span>Skills they bring</span></div></div>`);
  return shell("dark title", `<div class="slk">Meet the new team</div><h1 class="mid">${esc(comp.name)}</h1>
    <div class="teamrow">${comp.jobs.map((job, j) => { const top = ranked(plan, ci, j).find(c => (plan["h" + j] || {})[c.k] === 1); return `<div><small>${esc(job.t)}</small><b>${top ? esc(top.name) : "?"}</b></div>`; }).join("")}</div>
    <p class="slnames">Questions?</p>`);
}
function deckViewer(plan, info, start, onClose) {
  let i = start || 0; const ov = document.createElement("div"); ov.className = "deckov"; document.body.appendChild(ov);
  const draw = () => { ov.innerHTML = `<div class="deckbar"><button class="btn" id="dvx">✕ Close</button><span>${i + 1} / ${NSLIDES}</span><button class="btn" id="dvp">Print all slides</button></div>
    <div class="deckstage">${slideHTML(plan, info, i)}</div><div class="decknav"><button class="btn" id="dvl" ${i ? "" : "disabled"}>◀ Back</button><button class="btn main" id="dvr" ${i < NSLIDES - 1 ? "" : "disabled"}>Next ▶</button></div>`;
    ov.querySelector("#dvl").onclick = () => { if (i) { i--; draw(); } }; ov.querySelector("#dvr").onclick = () => { if (i < NSLIDES - 1) { i++; draw(); } };
    ov.querySelector("#dvx").onclick = close; ov.querySelector("#dvp").onclick = () => printDeck(plan, info); };
  const key = e => { if (e.key === "ArrowRight" || e.key === " ") { if (i < NSLIDES - 1) { i++; draw(); } } else if (e.key === "ArrowLeft") { if (i) { i--; draw(); } } else if (e.key === "Escape") close(); };
  const close = () => { document.removeEventListener("keydown", key); ov.remove(); if (onClose) onClose(); };
  document.addEventListener("keydown", key); draw();
}
function printDeck(plan, info) {
  let pd = $("#printdeck"); if (!pd) { pd = document.createElement("div"); pd.id = "printdeck"; document.body.appendChild(pd); }
  pd.innerHTML = Array.from({ length: NSLIDES }, (_, i) => `<div class="pslide">${slideHTML(plan, info, i)}</div>`).join("");
  document.body.classList.add("printing-deck"); setTimeout(() => { window.print(); document.body.classList.remove("printing-deck"); }, 150);
}

/* ============================================================ VERDICT (shared) */
function verdictHTML(r, info) {
  const comp = HP.COMPANIES[info.ci];
  return `<div class="later"><div class="lhead"><div><div class="kick">The verdict · ${esc(comp.ind)}</div><h2>${esc(comp.name)}</h2><p>${esc(andList(info.names || []))}</p></div>
      <div class="scorebox"><div class="tot"><small>Hiring score</small><b>${r.total}</b></div><div><small>Class avg</small><b>${r.aud && r.aud.n ? r.aud.pct : "-"}</b></div></div></div>
    <div class="vtab"><div class="vh"><span>Rubric row</span><span>Engine</span><span>Class</span><span>Why</span></div>
    ${HP.RUBRIC.map(c => { const e = r.bands[c.id], a = r.aud && r.aud.n ? r.aud.c[c.id] : null, gap = a == null ? null : Math.abs(a - e);
      return `<div class="vr"><b>${esc(c.name)}</b><span class="band b${e}">${e}<small>${r.d[c.id]}</small></span>
        <span class="band cls ${gap == null ? "" : gap < 0.75 ? "near" : gap < 1.5 ? "mid" : "far"}">${a == null ? "-" : a.toFixed(1)}</span>
        <div class="why">${(r.notes[c.id] || []).map(x => `<p>${esc(x)}</p>`).join("")}</div></div>`; }).join("")}</div>
    ${r.missed && r.missed.length ? `<div class="skh">What the interview missed</div>${r.missed.map(x => `<div class="quote bad"><small>Six months later</small>${esc(x)}</div>`).join("")}` : `<div class="quote"><small>Six months later</small>No surprises. Every top hire turned out to be who the team thought they were.</div>`}
    <p class="note">Engine: 4 = 85 and up, 3 = 65 to 84, 2 = 40 to 64, 1 = under 40. Graders earn 100 for matching the engine's number, 60 for one off, 20 for two off.</p></div>`;
}
function myGrading(rt, st, pid) {
  const gi = K.groupOf(st, pid), rows = [];
  Object.keys(st.res || {}).forEach(g => { g = +g; if (g === gi) return; const r = st.res[g], mine = (rt || {})[g] || {};
    const full = HP.RUBRIC.every(c => mine[c.id]); rows.push({ g, ci: compOf(st, g), full, acc: full ? Math.round(HP.RUBRIC.reduce((t, c) => t + HP.acc(mine[c.id], r.d[c.id]), 0) / HP.RUBRIC.length) : 0, mine, r }); });
  return rows;
}
function gradingHTML(rows, score) {
  return `<div class="later"><div class="lhead"><div><div class="kick">Your grade</div><h2>How well did you grade?</h2><p>${rows.filter(x => x.full).length} of ${rows.length} shops rated</p></div>
    <div class="scorebox"><div class="tot"><small>Grader score</small><b>${score}</b></div></div></div>
    <div class="vtab gtab"><div class="vh"><span>Company</span>${HP.RUBRIC.map(c => `<span>${esc(c.name)}</span>`).join("")}<span>Score</span></div>
    ${rows.map(x => `<div class="vr"><b>${esc(HP.COMPANIES[x.ci].name)}</b>${HP.RUBRIC.map(c => { const e = x.r.bands[c.id], m = x.mine[c.id];
      return `<span class="gcell ${!m ? "" : +m === e ? "near" : Math.abs(m - e) === 1 ? "mid" : "far"}">${m || "-"}<small>/${e}</small></span>`; }).join("")}<b>${x.full ? x.acc : 0}</b></div>`).join("")}</div>
    <p class="note">Each cell: your score / the engine's. Green is a match, yellow is one off, red is two or more off. A shop you didn't finish rating counts 0.</p></div>`;
}

/* ============================================================ HOST */
let H = null;
async function hostSetup() {
  const N = await K.net("hpMock").catch(() => null); if (!N) return K.needSetup(hdr());
  let saved = null; try { const c = localStorage.getItem(HOST_KEY); if (c) { const g = await N.get("games/" + c); if (g && g.game === GAME) saved = { code: c, g }; } } catch (e) {}
  const mins = STAGES.map(s => s.mins);
  app.innerHTML = `${hdr()}${saved ? `<div class="panel resume"><h2>Pick up where you left off</h2><p>Game <b>${saved.code}</b> is still running (${esc(phaseLabel(saved.g.state))}). Students rejoin with the same code and their same first name.</p><button class="btn main" id="res">Resume game ${saved.code}</button></div>` : ""}
    <div class="panel wide-panel"><h2>Host a new game</h2>
    <p class="note"><b>Groups:</b> random pairs (one group of 3 if odd), and every pair gets a different company (${HP.COMPANIES.length} companies). The game lasts 14 days, so you can build one day and present the next.</p>
    <p>Minutes for each stage (you open each one, and you can add time):</p>
    <div class="stmins hp4">${STAGES.map((s, i) => `<label><span>${i + 1}. ${esc(s.name)}</span><input type="number" min="2" max="25" value="${s.mins}" data-i="${i}"></label>`).join("")}</div>
    <p class="note">Building takes about 35 minutes. Presentations take about 2 to 3 minutes per pair. Pairs earn a hiring score from the engine, but the grade goes to the graders: each student's score is how close their rubric ratings came to the engine's (100 for the same number, 60 for one off, 20 for two off).</p>
    <div class="err" id="er"></div><button class="btn main" id="go">Create game</button></div>`;
  app.querySelectorAll(".stmins input").forEach(inp => inp.onchange = () => mins[+inp.dataset.i] = Math.max(2, Math.min(25, +inp.value || STAGES[+inp.dataset.i].mins)));
  if (saved) $("#res").onclick = () => { const { state, players, ...meta } = saved.g; startHost(N, saved.code, meta, state, players || {}); };
  $("#go").onclick = async () => {
    $("#go").disabled = true;
    try {
      const code = await K.newCode(N);
      const meta = { created: Date.now(), game: GAME, kind: "engagement", size: 2, mins };
      const state = { phase: "lobby", tot: {}, perm: K.shuffle(HP.COMPANIES.map((c, i) => i)) };
      await N.set("games/" + code, { ...meta, state });
      try { localStorage.setItem(HOST_KEY, code); } catch (e) {}
      startHost(N, code, meta, state, {});
    } catch (e) { $("#er").textContent = "Couldn't reach the class game database."; $("#go").disabled = false; }
  };
}
function phaseLabel(st) { if (!st) return "lobby"; return st.phase === "build" ? `stage ${st.stage + 1}: ${STAGES[st.stage].name}` : st.phase === "present" ? "presentations" : st.phase === "reveal" ? "the verdict" : st.phase; }
function startHost(N, code, meta, state, players) {
  H = { N, code, meta, state, players };
  H.off = N.on("games/" + code + "/players", v => { H.players = v || {}; hostRender(true); });
  hostRender();
}
function hostSet(state) { K.stopTick(); H.state = state; H.rq = null; H.N.set("games/" + H.code + "/state", state).catch(() => {}); hostRender(); }
function hostSave() { clearTimeout(H.pt); H.pt = setTimeout(() => H.N.set("games/" + H.code + "/state", H.state).catch(() => {}), 500); }
function hostRender(fromPlayers) {
  ({ lobby: hostLobby, seat: hostSeat, build: hostBuild, present: hostPresent, reveal: hostReveal, end: hostEnd })[H.state.phase](fromPlayers);
}
function keepGroups(groups, ids) {
  const act = new Set(ids), gs = groups.map(g => g.filter(p => act.has(p))), seated = new Set(gs.flat());
  ids.filter(p => !seated.has(p)).forEach(p => { const live = gs.filter(g => g.length), pool = live.length ? live : gs;
    const t = pool.slice().sort((a, b) => a.length - b.length)[0]; if (t) t.push(p); else gs.push([p]); });
  return gs;
}
const liveGroups = st => st.groups.map((g, i) => i).filter(i => st.groups[i].length);
const namesOf = (st, gi, nameFn) => (st.groups[gi] || []).map(p => nameFn(p));
const hName = p => K.nameOf(H, p);
function hostLobby() {
  app.innerHTML = K.lobbyHTML(H, "Hire Power", PATH, "Random pairs (one group of 3 if odd) · every pair gets a different company to hire for");
  $("#start").onclick = () => { const groups = K.groupUp(K.activeIds(H), {}, 2); hostSet({ ...H.state, phase: "seat", groups, names: K.namesMap(H), prog: {} }); };
  $("#end").onclick = hostErase; K.fit();
}
function syncGroups() {
  const st = H.state, kept = keepGroups(st.groups, K.activeIds(H));
  if (JSON.stringify(kept) !== JSON.stringify(st.groups)) { H.state = { ...st, groups: kept, names: K.namesMap(H) }; hostSave(); return true; }
  return false;
}
function hostSeat(fromPlayers) {
  if (syncGroups()) H.rq = null;
  if (fromPlayers && H.rq === "seat") return; H.rq = "seat";
  app.innerHTML = K.seatHTML(H, { sub: "Sit with your partner. You're the CEO and HR director of the company on your screen.", go: "Open Stage 1: Who we hire", mark: () => "" });
  app.querySelectorAll(".pcard .tn em").forEach(el => el.remove());
  app.querySelectorAll(".pcard .pp").forEach((el, i) => el.insertAdjacentHTML("afterbegin", `<div class="pco">${esc(HP.COMPANIES[compOf(H.state, i)].name)}</div>`));
  const h2 = app.querySelector(".hostbar h2"); if (h2) h2.textContent = "Meet your hiring partner";
  const k = app.querySelector(".hostbar .kick"); if (k) k.textContent = "Hire Power";
  $("#go").onclick = () => openStage(0);
  K.bindRemove(H, () => { H.rq = null; hostSeat(); }); K.fit();
}
function openStage(i) { hostSet({ ...H.state, phase: "build", stage: i, endsAt: Date.now() + H.meta.mins[i] * 60000 }); }
function groupPlan(gi) {
  const st = H.state, g = st.groups[gi] || [];
  return mergePlans([...(g.map(p => H.players[p] && H.players[p].hp)), (st.prog || {})[gi]]);
}
function hostBuild() {
  syncGroups();
  const st = H.state, s = st.stage, live = liveGroups(st);
  const prog = {}; live.forEach(gi => prog[gi] = groupPlan(gi));
  if (JSON.stringify(prog) !== JSON.stringify(st.prog || {})) { H.state = { ...H.state, prog }; hostSave(); }
  const nDone = live.filter(gi => done(prog[gi], STAGES[s].id)).length;
  if (H.rq !== "build" + s) {
    H.rq = "build" + s; const secs = H.meta.mins[s] * 60;
    app.innerHTML = `<div class="hostbar"><div><div class="kick">Stage ${s + 1} of 4 · ${esc(STAGES[s].name)}</div><h2>${esc(STAGES[s].sub)}</h2></div>
      <div class="clock"><div class="secs big">${K.clockText(secs)}</div><div class="count" id="cnt"></div></div></div>
      <div class="stagebar">${STAGES.map((x, i) => `<span class="${i < s ? "past" : i === s ? "now" : ""}"><b>${i + 1}</b>${esc(x.name)}</span>`).join("")}</div>
      <div class="gprog" id="gp"></div>
      <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn" id="more">+2 minutes</button>${s < 3 ? `<button class="btn main" id="nx">Open Stage ${s + 2}: ${esc(STAGES[s + 1].name)} →</button>` : `<button class="btn main" id="nx">Start presentations →</button>`}</div>`;
    K.startTimer(app, secs, st.endsAt, () => {});
    $("#more").onclick = () => hostSet({ ...H.state, endsAt: Math.max(Date.now(), H.state.endsAt) + 120000 });
    $("#nx").onclick = () => s < 3 ? openStage(s + 1) : startPresent();
    K.fit();
  }
  $("#cnt").textContent = `${nDone} of ${live.length} teams done`;
  $("#gp").innerHTML = live.map(gi => { const p = prog[gi];
    return `<div class="gp ${done(p, STAGES[s].id) ? "done" : ""}"><span class="pn">${gi + 1}</span><div class="gpt"><b>${STAGES.map(x => `<i class="dotk ${done(p, x.id) ? "on" : ""}" title="${esc(x.name)}"></i>`).join("")}</b><small>${esc(HP.COMPANIES[compOf(st, gi)].name)} · ${esc(namesOf(st, gi, hName).join(" & "))}</small></div></div>`; }).join("");
}
function startPresent() {
  const st = H.state, live = liveGroups(st), order = K.shuffle(live.slice());
  const prog = {}; live.forEach(gi => prog[gi] = groupPlan(gi));
  hostSet({ ...st, prog, phase: "present", order, pi: 0, slide: 0 });
}
function ratingsFor(gi) {
  const st = H.state, mine = new Set(st.groups[gi] || []), out = [];
  Object.entries(H.players || {}).forEach(([pid, p]) => { if (mine.has(pid) || p.out) return; const r = p.rt && p.rt[gi]; if (r && HP.RUBRIC.every(c => r[c.id])) out.push(r); });
  return out;
}
function hostPresent(fromPlayers) {
  const st = H.state, gi = st.order[st.pi];
  if (fromPlayers) { let best = null; (st.groups[gi] || []).forEach(p => { const r = H.players[p] && H.players[p].rm; if (r && r.g === gi && (!best || r.at > best.at)) best = r; });
    if (best && best.at > (H.rmAt || 0)) { H.rmAt = best.at; if (best.i !== st.slide && best.i >= 0 && best.i < NSLIDES) { H.state = { ...st, slide: best.i }; hostSave(); H.rq = null; } } }
  const n = ratingsFor(gi).length, voters = K.activeIds(H).filter(p => !(st.groups[gi] || []).includes(p)).length;
  if (H.rq === "pres" + st.pi + "|" + H.state.slide) { const c = $("#rc"); if (c) c.textContent = `${n} of ${voters} grades in`; return; }
  H.rq = "pres" + st.pi + "|" + H.state.slide;
  const info = { ci: compOf(st, gi), names: namesOf(st, gi, hName) };
  app.innerHTML = `<div class="presbar"><div><div class="kick">Presentation ${st.pi + 1} of ${st.order.length}</div><b>${esc(HP.COMPANIES[info.ci].name)}: ${esc(info.names.join(" & "))}</b></div>
    <div class="row"><span class="rc" id="rc">${n} of ${voters} grades in</span><button class="btn" id="pv">◀</button><span>${H.state.slide + 1} / ${NSLIDES}</span><button class="btn" id="nv">▶</button>
    <button class="btn main" id="nxg">${st.pi < st.order.length - 1 ? "Next company →" : "The verdict →"}</button></div></div>
    <div class="deckstage host">${slideHTML(st.prog[gi] || {}, info, H.state.slide)}</div>`;
  const go = d => { const v = Math.max(0, Math.min(NSLIDES - 1, H.state.slide + d)); if (v !== H.state.slide) { H.state = { ...H.state, slide: v }; hostSave(); H.rq = null; hostPresent(); } };
  $("#pv").onclick = () => go(-1); $("#nv").onclick = () => go(1);
  document.onkeydown = e => { if (H.state.phase !== "present") return; if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); go(1); } if (e.key === "ArrowLeft") go(-1); };
  $("#nxg").onclick = () => { if (st.pi < st.order.length - 1) hostSet({ ...H.state, pi: st.pi + 1, slide: 0 }); else startReveal(); };
}
function results() {
  const st = H.state, res = {};
  liveGroups(st).forEach(gi => { const r = HP.score(engPlan(st.prog[gi] || {}), compOf(st, gi)), rs = ratingsFor(gi), c = {};
    HP.RUBRIC.forEach(k => c[k.id] = rs.length ? rs.reduce((t, x) => t + +x[k.id], 0) / rs.length : 0);
    const avg = rs.length ? HP.RUBRIC.reduce((t, k) => t + c[k.id], 0) / HP.RUBRIC.length : 0;
    res[gi] = { ...r, aud: { n: rs.length, c, pct: Math.round(avg / 4 * 100) } }; });
  return res;
}
function graderScores(res) {
  const st = H.state, tot = {}, gacc = {};
  K.activeIds(H).forEach(p => { const rows = myGrading((H.players[p] || {}).rt, { ...st, res }, p);
    const sc = rows.length ? Math.round(rows.reduce((t, x) => t + x.acc, 0) / rows.length) : 0;
    tot[p] = sc; gacc[p] = { score: sc, n: rows.filter(x => x.full).length, of: rows.length }; });
  return { tot, gacc };
}
function startReveal() {
  document.onkeydown = null;
  const res = results(), { tot, gacc } = graderScores(res);
  hostSet({ ...H.state, phase: "reveal", res, tot, gacc, ri: 0, rorder: H.state.order });
}
function hostReveal() {
  if (H.rq === "rev" + H.state.ri) return; H.rq = "rev" + H.state.ri;
  const st = H.state, gi = st.rorder[st.ri], r = st.res[gi];
  app.innerHTML = `${verdictHTML(r, { ci: compOf(st, gi), names: namesOf(st, gi, hName) })}
    <div class="row" style="justify-content:center;margin-top:12px"><span class="note">${st.ri + 1} of ${st.rorder.length}</span><button class="btn" id="rs">Rescore with late grades</button><button class="btn main" id="nx">${st.ri < st.rorder.length - 1 ? "Next company →" : "Sharpest graders →"}</button></div>`;
  $("#nx").onclick = () => st.ri < st.rorder.length - 1 ? hostSet({ ...st, ri: st.ri + 1 }) : hostSet({ ...st, phase: "end" });
  $("#rs").onclick = () => { const res = results(), g = graderScores(res); hostSet({ ...st, res, ...g }); };
  K.fit();
}
function hostEnd() {
  if (H.rq === "end") return; H.rq = "end";
  K.finale(H, "Hire Power · Final", "Sharpest Graders", classResults, hostErase, () => { cleanupHost(); home(); });
}
function scatter(pts) {
  const W = 520, Hh = 340, L = 50, R = 16, T = 16, B = 46, x = v => L + (W - L - R) * v / 100, y = v => T + (Hh - T - B) * (1 - v / 100);
  let g = "";
  [0, 25, 50, 75, 100].forEach(v => g += `<line class="gl" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text><text x="${x(v)}" y="${Hh - 26}" text-anchor="middle">${v}</text>`);
  g += `<line class="diag" x1="${x(0)}" y1="${y(0)}" x2="${x(100)}" y2="${y(100)}"/>`;
  g += `<text class="at" x="${(L + W - R) / 2}" y="${Hh - 6}" text-anchor="middle">Hiring score (the engine)</text><text class="at" transform="translate(14 ${(T + Hh - B) / 2}) rotate(-90)" text-anchor="middle">Class grade</text>`;
  pts.forEach(p => g += `<circle class="dot" cx="${x(p.x)}" cy="${y(p.y)}" r="10"/><text class="dl" x="${x(p.x)}" y="${y(p.y) + 4}" text-anchor="middle" fill="#fff">${p.l}</text>`);
  return `<svg class="scatter" viewBox="0 0 ${W} ${Hh}">${g}</svg>`;
}
function csv() {
  const st = H.state, rows = [["Name", "Partner", "Company", "Grader score", "Companies graded", "Of", "Team hiring score", ...HP.RUBRIC.map(c => "Engine: " + c.name), "Class grade %"]];
  liveGroups(st).forEach(gi => { const r = st.res[gi], g = st.groups[gi];
    g.forEach(p => { const ga = (st.gacc || {})[p] || { score: 0, n: 0, of: 0 };
      rows.push([hName(p), g.filter(q => q !== p).map(hName).join(" & "), HP.COMPANIES[compOf(st, gi)].name, ga.score, ga.n, ga.of, r.total, ...HP.RUBRIC.map(c => r.d[c.id]), r.aud.pct]); }); });
  return rows.map(r => r.map(v => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v).join(",")).join("\n");
}
function classResults() {
  document.body.classList.remove("finale-on");
  const st = H.state, live = liveGroups(st), ranked = live.slice().sort((a, b) => st.res[b].total - st.res[a].total);
  const graders = K.activeIds(H).map(p => ({ p, ...((st.gacc || {})[p] || { score: 0, n: 0, of: 0 }) })).sort((a, b) => b.score - a.score);
  const rowGap = {}; HP.RUBRIC.forEach(c => { const xs = live.filter(gi => st.res[gi].aud.n).map(gi => Math.abs(st.res[gi].aud.c[c.id] - st.res[gi].bands[c.id])); rowGap[c.id] = xs.length ? xs.reduce((t, v) => t + v, 0) / xs.length : 0; });
  app.innerHTML = `<div class="rep"><h2>Class results</h2><div class="endgrid">
    <div class="skills"><div class="skh">Did the class grade like the engine?</div>${scatter(live.map(gi => ({ x: st.res[gi].total, y: st.res[gi].aud.pct, l: gi + 1 })))}
      <p class="note">Each dot is a company (the number matches the list). On the diagonal, the class and the engine agreed. Above it, the class was more generous than the engine. Below it, the class was tougher.</p>
      <div class="skh" style="margin-top:10px">Hardest rubric row to grade</div>
      <div class="poplist">${HP.RUBRIC.map(c => `<div><span>${esc(c.name)}</span><div class="pbar"><i style="width:${Math.max(3, 100 * rowGap[c.id] / 3)}%"></i></div><b>${rowGap[c.id].toFixed(1)}</b></div>`).join("")}</div>
      <p class="note">How far off the class average was from the engine on each row, on the 1-to-4 scale. Longer bar = harder to judge.</p>
      <div class="skh" style="margin-top:10px">Debrief</div>
      <ol class="debrief"><li>Which rubric row was hardest to grade? What would you need to see on a slide to grade it better?</li><li>Find a company the class graded higher than the engine. What made the plan sound better than it was?</li><li>Which interview step caught the most problems? Which ones felt useful but caught nothing?</li><li>When the "star" candidate brings skills another hire already has, is the star still the best choice?</li></ol></div>
    <div class="skills"><div class="skh">Every company</div>
      <table class="htab small"><tr><th>#</th><th>Company</th><th>Hiring</th><th>Class</th></tr>
        ${ranked.map(gi => `<tr><td>${gi + 1}</td><td><b>${esc(HP.COMPANIES[compOf(st, gi)].name)}</b><small>${esc(namesOf(st, gi, hName).join(" & "))}</small></td><td><b>${st.res[gi].total}</b></td><td>${st.res[gi].aud.pct}</td></tr>`).join("")}</table>
      <div class="skh" style="margin-top:10px">Every grader</div>
      <table class="htab small"><tr><th>Student</th><th>Graded</th><th>Score</th></tr>
        ${graders.map(x => `<tr><td><b>${esc(hName(x.p))}</b></td><td>${x.n} of ${x.of}</td><td><b>${x.score}</b></td></tr>`).join("")}</table></div></div>
    <div class="row" style="justify-content:center;margin-top:14px"><button class="btn main" id="pod">Back to Top 5</button><button class="btn" id="csv">Download scores (CSV)</button><button class="btn" id="erase">Erase game</button></div></div>`;
  $("#pod").onclick = () => { H.rq = null; hostEnd(); }; $("#erase").onclick = hostErase;
  $("#csv").onclick = () => { const b = new Blob([csv()], { type: "text/csv" }), a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `hire-power-${H.code}.csv`; a.click(); };
  K.fit();
}
function cleanupHost() { K.stopTick(); document.onkeydown = null; if (H && H.off) H.off(); }
async function hostErase() { if (!H) return home(); cleanupHost(); try { await H.N.remove("games/" + H.code); } catch (e) {} try { localStorage.removeItem(HOST_KEY); } catch (e) {} H = null; home(); }

/* ============================================================ STUDENT */
let ME = null;
const SESS = K.sess("hpSession");
async function stuJoin() {
  const N = await K.net("hpMock").catch(() => null); if (!N) return K.needSetup(hdr());
  K.joinForm({ N, game: GAME, title: "Hire Power", sessKey: "hpSession", hdr: hdr(), onJoined: ctx => {
    if (ME && ME.off) ME.off();
    ME = { N, ...ctx, hp: { ...((ctx.rec && ctx.rec.hp) || {}) }, rt: { ...((ctx.rec && ctx.rec.rt) || {}) }, st: null, rq: null, tab: null, jt: 0 };
    ME.off = N.on(`games/${ctx.code}/state`, s => { if (!ME) return; if (!s) return gameGone(); ME.st = s; stuRender(); });
  } });
}
function gameGone() { K.stopTick(); if (ME && ME.off) ME.off(); ME = null; SESS.clear();
  app.innerHTML = `<div class="wait"><h2>The game has ended</h2><p>Your teacher closed this game.</p><button class="btn main" id="h">OK</button></div>`; $("#h").onclick = home; }
const sName = p => ((ME.st && ME.st.names) || {})[p] || "a teammate";
function myPlan() { const st = ME.st, gi = K.groupOf(st, ME.pid); return mergePlans([ME.hp, (st.prog || {})[gi]]); }
function stuRender() {
  const M = ME, st = M.st; if (!st) return;
  const gi = st.groups ? K.groupOf(st, M.pid) : -1;
  const presenting = st.phase === "present" && st.order && st.order[st.pi] === gi;
  const key = [st.phase, st.stage, st.pi, presenting ? st.slide : "", st.ri, gi, st.phase === "seat" ? JSON.stringify(st.groups) : "", st.phase === "reveal" || st.phase === "end" ? JSON.stringify(st.gacc && st.gacc[M.pid]) : ""].join("|");
  if (st.phase === "build" && key === M.rq) { buildSync(); return; }
  if (key === M.rq) return;
  M.rq = key;
  if (st.phase === "lobby") { app.innerHTML = `<div class="wait"><h2>You're in, ${esc(M.name)}!</h2><p>Watch the board. Your teacher will pair everyone up at random.</p></div>`; return; }
  if (gi < 0) { app.innerHTML = `<div class="wait"><h2>You're in, ${esc(M.name)}</h2><p>Hang on. The teacher's screen will put you on a team in a few seconds.</p></div>`; return; }
  const ci = compOf(st, gi), comp = HP.COMPANIES[ci], mates = st.groups[gi].filter(p => p !== M.pid).map(sName), my = st.groups[gi].indexOf(M.pid);
  if (st.phase === "seat") { app.innerHTML = `<div class="wait seat"><div class="kick">${esc(comp.name)} · ${esc(comp.ind)}</div><p>${mates.length > 1 ? "Your partners" : "Your partner"}</p><div class="tablebig mate">${esc(andList(mates)) || "Solo"}</div><p>Sit together. You're the <b>${esc(ROLES[my] || "Hiring team")}</b>, and together you need to hire four people for ${esc(comp.name)}. Either of you can make choices; your devices stay in sync.</p></div>`; return; }
  if (st.phase === "build") { M.plan = myPlan(); if (M.lastStage !== st.stage) { M.tab = st.stage; M.lastStage = st.stage; M.jt = 0; } if (M.tab == null || M.tab > st.stage) M.tab = st.stage; return drawBuild(true); }
  K.stopTick();
  const info = { ci, names: st.groups[gi].map(sName) }, plan = (st.prog || {})[gi] || myPlan();
  if (st.phase === "present") {
    const pg = st.order[st.pi];
    if (pg === gi) {
      app.innerHTML = `<div class="kick">You're presenting · Presentation ${st.pi + 1} of ${st.order.length}</div><h2 class="mh">Your slides are on the board</h2>
        <div class="deckstage">${slideHTML(plan, info, st.slide)}</div>
        <div class="decknav"><button class="btn big" id="rl" ${st.slide ? "" : "disabled"}>◀ Back</button><button class="btn main big" id="rr" ${st.slide < NSLIDES - 1 ? "" : "disabled"}>Next slide ▶</button></div>
        <p class="note" style="text-align:center">These buttons change the slide on the board. Both partners should speak. Explain why each hire fits what you were looking for.</p>`;
      const tap = i => M.N.update(`games/${M.code}/players/${M.pid}`, { rm: { g: gi, i, at: Date.now() } }).catch(() => {});
      $("#rl").onclick = () => tap(st.slide - 1); $("#rr").onclick = () => tap(st.slide + 1);
      return;
    }
    return drawRate(pg, st.groups[pg].map(sName), compOf(st, pg));
  }
  if (st.phase === "reveal" || st.phase === "end") {
    const r = st.res && st.res[gi]; if (!r) { app.innerHTML = `<div class="wait"><h2>The verdict…</h2><p>Watch the board.</p></div>`; return; }
    const rows = myGrading(M.rt, st, M.pid), sc = ((st.gacc || {})[M.pid] || {}).score ?? (rows.length ? Math.round(rows.reduce((t, x) => t + x.acc, 0) / rows.length) : 0);
    app.innerHTML = `${gradingHTML(rows, sc)}<div style="margin-top:16px">${verdictHTML(r, info)}</div>
      <div class="row" style="justify-content:center;margin-top:12px"><button class="btn main" id="dv">View our slideshow</button><button class="btn" id="pr">Print our slides</button></div>`;
    $("#dv").onclick = () => deckViewer(plan, info, 0); $("#pr").onclick = () => printDeck(plan, info);
  }
}
function drawRate(pg, names, ci) {
  const M = ME, r = M.rt[pg] || {}, all = HP.RUBRIC.every(c => r[c.id]);
  app.innerHTML = `<div class="kick">Grader · ${esc(HP.COMPANIES[ci].name)}</div><h2 class="mh">${esc(andList(names))}</h2>
    <div class="twist"><b>Your grade is how well you grade.</b> The engine scores this plan too. Match its number on a row and you earn 100; one off earns 60; two off earns 20.</div>
    <div class="rate">${HP.RUBRIC.map(c => `<div class="rrow"><div class="rq"><b>${esc(c.name)}</b><span>${esc(c.q)}</span></div>
      <div class="rbtns" data-c="${c.id}">${HP.SCALE.map(([v, l]) => `<button data-v="${v}" aria-pressed="${String(r[c.id] || "") === v}"><b>${v}</b><small>${esc(l)}</small></button>`).join("")}</div></div>`).join("")}</div>
    <div class="lockmsg2 ${all ? "ok" : ""}">${all ? "Saved. You can change it until the next company starts." : `${HP.RUBRIC.filter(c => r[c.id]).length} of ${HP.RUBRIC.length} graded`}</div>`;
  app.querySelectorAll(".rbtns").forEach(el => el.onclick = e => { const b = e.target.closest("button"); if (!b) return;
    M.rt[pg] = { ...(M.rt[pg] || {}), [el.dataset.c]: +b.dataset.v }; M.N.update(`games/${M.code}/players/${M.pid}`, { ["rt/" + pg]: M.rt[pg] }).catch(() => {}); const y = scrollY; drawRate(pg, names, ci); scrollTo(0, y); });
}
function buildSync() { if (document.activeElement && document.activeElement.id === "ht") return; const p = myPlan(); if (JSON.stringify(p) !== JSON.stringify(ME.plan)) { ME.plan = p; drawBuild(false); } }
function savePart(k, v) {
  v = { ...v, at: Date.now() };
  ME.hp[k] = v; ME.plan = { ...ME.plan, [k]: v };
  ME.N.update(`games/${ME.code}/players/${ME.pid}`, { ["hp/" + k]: v }).catch(() => {});
  drawBuild(false);
}
function drawBuild(fresh) {
  const M = ME, st = M.st, gi = K.groupOf(st, M.pid), plan = M.plan, tab = M.tab, y = scrollY, ci = compOf(st, gi), comp = HP.COMPANIES[ci];
  const mates = st.groups[gi].filter(p => p !== M.pid).map(sName), info = { ci, names: st.groups[gi].map(sName) };
  const tabs = `<div class="tabs">${STAGES.map((s, i) => `<button data-t="${i}" class="${i === tab ? "on" : ""} ${done(plan, s.id) ? "ok" : ""}" ${i > st.stage ? "disabled" : ""}><b>${done(plan, s.id) ? "✓" : i + 1}</b>${esc(s.name)}</button>`).join("")}</div>`;
  const stage = STAGES[tab];
  const jobbar = kind => `<div class="jobbar">${comp.jobs.map((job, j) => `<button data-j="${j}" class="${j === M.jt ? "on" : ""} ${jobDone(plan, kind, j) ? "ok" : ""}"><b>${jobDone(plan, kind, j) ? "✓" : j + 1}</b>${esc(job.t)}</button>`).join("")}</div>`;
  let body = "";
  if (stage.id === "type") body = typeHTML(plan.type || {}, comp);
  if (stage.id === "skills") body = jobbar("s") + skillsHTML(plan, comp, ci, M.jt);
  if (stage.id === "intv") body = intvHTML(steps(plan));
  if (stage.id === "hire") body = jobbar("h") + hireHTML(plan, comp, ci, M.jt);
  const next = stage.id === "skills" || stage.id === "hire" ? (M.jt < 3 ? `<button class="btn main" id="jn">Next job: ${esc(comp.jobs[M.jt + 1].t)} →</button>` : "") : "";
  app.innerHTML = `<div class="kick">${esc(comp.name)}${mates.length ? ` · with ${esc(andList(mates))}` : ""}</div>${K.timerHTML(M.meta.mins[st.stage] * 60)}
    ${tabs}<div class="sthead"><h2>${tab + 1}. ${esc(stage.name)}</h2><p>${esc(stage.sub)}</p></div>${body}
    <div class="row" style="justify-content:space-between;margin-top:14px"><button class="btn" id="prev">Preview our slideshow</button>${next || (tab < st.stage ? `<button class="btn main" id="tonext">Next: ${esc(STAGES[tab + 1].name)} →</button>` : `<span class="note">${done(plan, stage.id) ? "Done. Your teacher will open the next stage." : "Your choices save automatically."}</span>`)}</div>`;
  K.startTimer(app, M.meta.mins[st.stage] * 60, st.endsAt, () => {});
  app.querySelectorAll(".tabs button").forEach(b => b.onclick = () => { M.tab = +b.dataset.t; M.jt = 0; drawBuild(true); });
  app.querySelectorAll(".jobbar button").forEach(b => b.onclick = () => { M.jt = +b.dataset.j; drawBuild(true); });
  const jn = $("#jn"); if (jn) jn.onclick = () => { M.jt++; drawBuild(true); };
  $("#prev").onclick = () => deckViewer(plan, info, { type: 1, skills: 2 + M.jt, intv: 6, hire: 2 + M.jt }[stage.id]);
  const tn = $("#tonext"); if (tn) tn.onclick = () => { M.tab = tab + 1; M.jt = 0; drawBuild(true); };
  bindStage(stage.id, plan, comp);
  if (!fresh) scrollTo(0, y); else scrollTo(0, 0);
}
function typeHTML(t, comp) {
  const sel = t.traits || [];
  return `<div class="cocard"><div class="nk">${esc(comp.ind)}</div><h3>${esc(comp.name)}</h3><p>${esc(comp.desc)}</p></div>
    <div class="q"><h3>Pick exactly three traits your employees need <span class="cnt">${sel.length} of 3</span></h3>
    <div class="chips" data-k="traits">${HP.TRAITS.map(x => `<button data-v="${x.id}" aria-pressed="${sel.includes(x.id)}"><b>${esc(x.name)}</b><small>${esc(x.sub)}</small></button>`).join("")}</div></div>
    <div class="q"><h3>Finish the sentence: We hire people who...</h3><textarea class="field" id="ht" maxlength="140" rows="2" placeholder="...">${esc(t.text || "")}</textarea><div class="note" id="htn">${(t.text || "").length} of 140</div></div>`;
}
const skillOrder = ci => { const pool = HP.skillPool(HP.COMPANIES[ci]); let a = 7 + ci * 13; return pool.map((s, i) => ({ s, r: (a = (a * 9301 + 49297) % 233280) })).sort((x, y) => x.r - y.r).map(x => x.s); };
function skillsHTML(plan, comp, ci, j) {
  const job = comp.jobs[j], p = plan["s" + j] || {}, sel = p.s || [];
  return `<div class="jobcard"><div class="nk">Job ${j + 1} of 4</div><h3>${esc(job.t)}</h3><ul>${job.r.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
    <div class="q"><h3>Which 3 skills does this job need? <span class="cnt">${sel.length} of 3</span></h3>
    <div class="chips small" data-k="skill">${skillOrder(ci).map(s => `<button data-v="${esc(s)}" aria-pressed="${sel.includes(s)}"><b>${esc(s)}</b></button>`).join("")}</div></div>
    <div class="q"><h3>How much experience?</h3><div class="chips" data-k="exp">${HP.EXP.map((x, k) => `<button data-v="${k}" aria-pressed="${p.e === k}"><b>${esc(x)}</b><small>${esc(HP.EXP_SUB[k])}</small></button>`).join("")}</div></div>`;
}
function intvHTML(sel) {
  const h = HP.hours(sel);
  return `<div class="budget one"><div><small>Interview hours used per candidate</small><b>${h} of ${HP.HOURS}</b><div class="bbar"><i style="width:${100 * h / HP.HOURS}%"></i></div></div></div>
    <p class="note">Pick the steps every candidate goes through. What you learn here shows up on each candidate's card in the Hire stage.</p>
    <div class="levers">${HP.STEPS.map(x => { const on = sel.includes(x.id);
      return `<button class="lever step ${on ? "on" : ""}" data-s="${x.id}" ${on || HP.canAdd(sel, x.id) ? "" : "disabled"}><div class="lt"><b>${esc(x.name)}</b><small>${esc(x.does)}</small><em>${plural(x.hrs, "hour")}</em></div><span class="tick">${on ? "✓" : "+"}</span></button>`; }).join("")}</div>`;
}
function hireHTML(plan, comp, ci, j) {
  const job = comp.jobs[j], pj = HP.pool(ci)[j], p = plan["s" + j] || {}, t = (plan.type || {}).traits || [], h = plan["h" + j] || {}, st = steps(plan);
  return `<div class="want"><div><small>${esc(job.t)}: what you said you want</small>
      <div class="skrow">${(p.s || []).length ? pills(p.s) : "<i>No skills picked</i>"}${t.map(x => `<span class="sk tr">${esc(tName(x))}</span>`).join("")}</div>
      <p>${p.e != null ? esc(HP.EXP[p.e]) + " (" + esc(HP.EXP_SUB[p.e]) + ")" : "No experience level picked"}</p></div></div>
    <div class="cands">${pj.show.map(k => { const c = pj.cands[k], v = HP.view(c, st), r = h[c.k];
      return `<div class="cand ${r === 1 ? "first" : ""}"><div class="ch"><b>${esc(c.name)}</b><span>${esc(HP.yrsText(c.yrs))} of experience</span><em>${esc(c.bg)}</em></div>
        <div class="cl">Skills</div><div class="skrow">${v.skills.map(x => `<span class="sk ${x.bad ? "bad" : ""}">${esc(x.n)}</span>`).join("")}</div>
        <div class="cl">Traits</div><div class="skrow">${v.traits.map(x => `<span class="sk tr ${x.rev ? "rev" : ""}">${esc(tName(x.id))}</span>`).join("")}</div>
        ${v.notes.length ? `<div class="cl">Interview notes</div><div class="cn">${v.notes.map(n => `<p class="${n.bad ? "bad" : ""}"><b>${esc(n.s)}:</b> ${esc(n.t)}</p>`).join("")}</div>` : `<div class="cn"><p class="muted">No interview notes. Your process didn't include any steps.</p></div>`}
        <div class="rk" data-k="${c.k}"><span>Rank</span>${[1, 2, 3, 4].map(n => `<button data-v="${n}" aria-pressed="${r === n}">${n}</button>`).join("")}</div></div>`; }).join("")}</div>`;
}
function bindStage(id, plan, comp) {
  if (id === "type") {
    app.querySelector(".chips[data-k=traits]").onclick = e => { const b = e.target.closest("button"); if (!b) return; const t = plan.type || {}, v = b.dataset.v;
      let vs = (t.traits || []).slice(); if (vs.includes(v)) vs = vs.filter(x => x !== v); else if (vs.length < 3) vs.push(v); else return; savePart("type", { ...t, traits: vs }); };
    const ta = $("#ht"); let tm; ta.oninput = () => { $("#htn").textContent = `${ta.value.length} of 140`; clearTimeout(tm); tm = setTimeout(() => { const v = { ...(ME.plan.type || {}), text: ta.value.slice(0, 140), at: Date.now() }; ME.hp.type = v; ME.plan = { ...ME.plan, type: v }; ME.N.update(`games/${ME.code}/players/${ME.pid}`, { "hp/type": v }).catch(() => {}); }, 600); };
    ta.onblur = () => { clearTimeout(tm); if ((ME.plan.type || {}).text !== ta.value) savePart("type", { ...(ME.plan.type || {}), text: ta.value.slice(0, 140) }); };
  }
  if (id === "skills") { const j = ME.jt, key = "s" + j;
    app.querySelector(".chips[data-k=skill]").onclick = e => { const b = e.target.closest("button"); if (!b) return; const p = plan[key] || {}, v = b.dataset.v;
      let s = (p.s || []).slice(); if (s.includes(v)) s = s.filter(x => x !== v); else if (s.length < 3) s.push(v); else return; savePart(key, { ...p, s }); };
    app.querySelector(".chips[data-k=exp]").onclick = e => { const b = e.target.closest("button"); if (!b) return; savePart(key, { ...(plan[key] || {}), e: +b.dataset.v }); };
  }
  if (id === "intv") app.querySelectorAll(".lever.step").forEach(b => b.onclick = () => { const s = steps(plan).slice(), v = b.dataset.s;
    if (s.includes(v)) savePart("intv", { steps: s.filter(x => x !== v) }); else if (HP.canAdd(s, v)) savePart("intv", { steps: [...s, v] }); });
  if (id === "hire") { const key = "h" + ME.jt;
    app.querySelectorAll(".rk").forEach(el => el.onclick = e => { const b = e.target.closest("button"); if (!b) return; const k = +el.dataset.k, n = +b.dataset.v, h = { ...(plan[key] || {}) }; delete h.at;
      const old = h[k], other = Object.keys(h).find(x => +x !== k && h[x] === n);
      if (old === n) return; if (other != null) { if (old) h[other] = old; else delete h[other]; } h[k] = n;
      savePart(key, h); });
  }
}

function home() { K.stopTick(); document.onkeydown = null; document.body.classList.remove("wide", "finale-on"); app.style.zoom = ""; $("#who").hidden = true; ROLE === "teacher" ? hostSetup() : stuJoin(); }
home();
