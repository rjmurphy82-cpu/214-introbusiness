/* Culture Launch: the Management & Leadership unit project, live.
   Students sign up individually; the teacher screen pairs them at random (one group of 3 if odd). Every pair is the
   management team of a new Sole Revival shop and builds its culture guide in five timed stages the teacher opens:
     1 Found it:  the tone (Firm, Balanced, Relaxed, Inspiring, Competitive), a leadership style, and three core values
     2 Invest:    $8,000 and 12 manager hours across 10 culture levers
     3 Policies:  where each of 7 policies sits on a strict-to-loose range
     4 Discipline: a response for each of 6 infractions, from a coaching talk to termination
     5 Crisis:    one crisis card, a response approach, and one sentence in their own words
   The game builds an 8-slide deck from their choices. Pairs present from the teacher screen (they can change slides
   from their own device) while every other student scores them on a 5-row rubric on their device.
   Then "Six months later": the engine in data.js scores how well every choice matches the tone they promised and
   shows what their employees say. Total = alignment (0 to 100) + audience rubric (0 to 100).
   Games last 14 days so building and presenting can happen on different days; the teacher screen can resume.
   Storage: /api/live (codes under ibl:). */
"use strict";
const K = window.KIT;
const { $, esc, num, plural, andList, ROLE } = K;
const app = $("#app");
const GAME = "culture", PATH = "/culture-launch/", HOST_KEY = "clHost";
const money = n => "$" + Math.round(n).toLocaleString("en-US");
const STAGES = [
  { id: "found", name: "Found it", mins: 5, sub: "Pick your tone, your leadership style, and three core values." },
  { id: "invest", name: "Invest", mins: 8, sub: `Spend up to ${money(CL.BUDGET)} and ${CL.HOURS} manager hours on your culture.` },
  { id: "pol", name: "Policies", mins: 8, sub: "Decide how you'll manage the crew day to day." },
  { id: "disc", name: "Discipline", mins: 6, sub: "Choose a response for each infraction." },
  { id: "crisis", name: "Crisis", mins: 5, sub: "A crisis hits your shop. How do you handle it?" }
];

const hdr = () => `<h1 class="title">Culture <span>Launch.</span></h1>
  <p class="lede">${ROLE === "teacher"
    ? "Teacher screen. Students sign up on their own devices and get random partners. Each pair is the management team of a new Sole Revival shop: they set a tone and a leadership style, invest a limited budget, write their policies and discipline ladder, and handle a crisis. The game turns their choices into a slideshow. They present, the class scores how well their policies match their tone, and then you reveal what their employees say six months later."
    : "You and your partner are opening a new Sole Revival shop. Set the tone, pick how you'll lead, spend your budget, write the rules, and handle a crisis. The game turns your choices into a slideshow you'll present. Your classmates will judge one thing above all: does your company actually match the tone you promised?"}</p>`;

/* ============================================================ PLAN HELPERS */
const shopName = gi => `Shop ${gi + 1}`;
const SECS = ["found", "invest", "pol", "disc", "crisis"];
function mergePlans(list) { // newest section wins
  const out = {};
  SECS.forEach(k => { let best = null; list.forEach(p => { const s = p && p[k]; if (s && (!best || (s.at || 0) > (best.at || 0))) best = s; }); if (best) out[k] = best; });
  return out;
}
function done(plan, k) {
  const p = plan[k] || {};
  if (k === "found") return !!(p.tone && p.style && (p.values || []).length === 3);
  if (k === "invest") return CL.spend(p).$ > 0;
  if (k === "pol") return CL.POLICIES.every(x => p[x.id] != null);
  if (k === "disc") return CL.INFRACTIONS.every(x => p[x.id] != null);
  if (k === "crisis") return p.o != null && (p.text || "").trim().length >= 10;
  return false;
}
const crisisOf = (st, gi) => CL.crisisFor(st.seed || 0, gi);

/* ============================================================ SLIDES */
const NSLIDES = 8;
function slideHTML(plan, info, i) {
  const f = plan.found || {}, tone = CL.toneById[f.tone], sty = CL.styleById[f.style], inv = plan.invest || {}, cr = info.crisis;
  const names = esc(andList(info.names || []));
  const shell = (cls, inner) => `<div class="sl ${cls}"><div class="slin">${inner}<div class="slfoot"><span>Sole Revival · ${shopName(info.gi)} · Culture Guide</span><span>${i + 1} / ${NSLIDES}</span></div></div></div>`;
  const miss = t => `<div class="slmiss">${esc(t)}</div>`;
  if (i === 0) return shell("dark title", `<div class="slk">Culture Guide</div><h1>Sole Revival<br>${shopName(info.gi)}</h1>
    ${tone ? `<div class="tchip">${esc(tone.name)} culture</div>` : ""}<p class="slnames">Management team: ${names}</p>`);
  if (i === 1) return shell("", `<div class="slk">Who we are</div><h2>Our Tone and Our Leadership</h2>
    <div class="two"><div class="bigcard dark"><small>Tone</small><b>${tone ? esc(tone.name) : "?"}</b><p>${tone ? esc(tone.line) : ""}</p></div>
    <div class="bigcard"><small>Leadership style</small><b>${sty ? esc(sty.name) : "?"}</b><p>${sty ? `“${esc(sty.q)}”` : ""}</p></div></div>`);
  if (i === 2) return shell("", `<div class="slk">What we stand for</div><h2>Our Core Values</h2>
    <div class="three">${(f.values || []).map((v, k) => `<div class="vcard"><span>${k + 1}</span><b>${esc((CL.valueById[v] || {}).name || v)}</b></div>`).join("") || miss("No values chosen yet")}</div>`);
  if (i === 3) { const sp = CL.spend(inv), rows = CL.LEVERS.filter(l => inv[l.id]).sort((a, b) => inv[b.id] * b.cost - inv[a.id] * a.cost);
    return shell("", `<div class="slk">Where our money and time go</div><h2>What We Invested In</h2>
    <div class="sltot"><span><b>${money(sp.$)}</b> of ${money(CL.BUDGET)}</span><span><b>${sp.h}</b> of ${CL.HOURS} manager hours</span></div>
    <div class="ibars">${rows.map(l => `<div class="ib"><span>${esc(l.name)}</span><div><i style="width:${Math.max(4, 100 * inv[l.id] * l.cost / CL.BUDGET)}%"></i></div><b>${money(inv[l.id] * l.cost)}</b></div>`).join("") || miss("Nothing invested yet")}</div>`); }
  if (i === 4) return shell("", `<div class="slk">How we manage</div><h2>Our Policies</h2>
    <div class="ptab">${CL.POLICIES.map(x => { const v = (plan.pol || {})[x.id]; return `<div><span>${esc(x.name)}</span><b>${v != null ? esc(x.o[v][0]) : "?"}</b><em class="rng">${x.o.map((o, k) => `<i class="${k === v ? "on" : ""}"></i>`).join("")}</em></div>`; }).join("")}</div>
`);
  if (i === 5) return shell("", `<div class="slk">When rules get broken</div><h2>Our Discipline Ladder</h2>
    <div class="ptab disc">${CL.INFRACTIONS.map(x => { const v = (plan.disc || {})[x.id]; return `<div><span>${esc(x.name)}</span><b class="sev s${v ?? "n"}">${v != null ? esc(CL.RESP[v]) : "?"}</b><em class="rng sv">${CL.RESP.map((o, k) => `<i class="${v != null && k <= v ? "on" : ""}"></i>`).join("")}</em></div>`; }).join("")}</div>`);
  if (i === 6) { const c = plan.crisis || {}; return shell("", `<div class="slk">Crisis</div><h2>${cr ? esc(cr.head) : "Crisis"}</h2>
    <p class="crt">${cr ? esc(cr.text) : ""}</p><div class="bigcard dark wide"><small>Our response</small><b class="mid">${c.o != null && cr ? esc(cr.o[c.o][0]) : "?"}</b>${c.text ? `<p>“${esc(c.text)}”</p>` : ""}</div>`); }
  return shell("dark title", `<div class="slk">Our culture in one line</div><h1 class="mid">${tone ? esc(tone.line) : ""}</h1>
    <div class="vrow">${(f.values || []).map(v => `<span>${esc((CL.valueById[v] || {}).name || v)}</span>`).join("")}</div><p class="slnames">Questions?</p>`);
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

/* ============================================================ SIX MONTHS LATER (shared) */
function cultureMap(plan, res) {
  const W = 420, Hh = 380, M = 46, x = s => M + (W - 2 * M) * ((s + 2.2) / 4.4), y = p => M + (Hh - 2 * M) * (1 - (p + 2.2) / 4.4);
  let g = `<rect x="${M}" y="${M}" width="${W - 2 * M}" height="${Hh - 2 * M}" class="mapbg"/>`;
  g += `<line class="ax" x1="${x(0)}" x2="${x(0)}" y1="${M}" y2="${Hh - M}"/><line class="ax" y1="${y(0)}" y2="${y(0)}" x1="${M}" x2="${W - M}"/>`;
  g += `<text x="${M}" y="${Hh - 24}">◀ Loose</text><text x="${W - M}" y="${Hh - 24}" text-anchor="end">Strict ▶</text>`;
  g += `<text x="${W / 2}" y="${M - 14}" text-anchor="middle">▲ People and purpose</text><text x="${W / 2}" y="${Hh - 6}" text-anchor="middle">▼ Pressure and results</text>`;
  CL.TONES.forEach(t => g += `<text class="tl" x="${x(t.s)}" y="${y(t.p) + 4}" text-anchor="middle">${esc(t.name)}</text>`);
  const t = res.tone; if (t) g += `<circle class="tgt" cx="${x(t.s)}" cy="${y(t.p)}" r="28"/>`;
  const ab = { style: "L", values: "V", invest: "$", policy: "P", disc: "D", crisis: "C" };
  Object.entries(res.secs || {}).forEach(([k, v]) => { if (v.missing) return;
    g += `<g class="sdot ${v.fit < 60 ? "bad" : v.fit < 80 ? "mid" : ""}"><circle cx="${x(v.s)}" cy="${y(v.p)}" r="12"/><text x="${x(v.s)}" y="${y(v.p) + 5}" text-anchor="middle">${ab[k]}</text></g>`; });
  return `<svg class="cmap" viewBox="0 0 ${W} ${Hh}">${g}</svg><p class="note">Big circle: the tone you promised. Dots: where each part of your culture actually landed. L style, V values, $ investments, P policies, D discipline, C crisis.</p>`;
}
function laterHTML(plan, r, info) {
  const sec = Object.entries(r.secs || {});
  return `<div class="later"><div class="lhead"><div><div class="kick">Six months later · ${esc(info.title)}</div><h2>${r.tone ? esc(r.tone.name) + " culture" : "No tone set"}</h2><p>${esc(andList(info.names || []))}</p></div>
      <div class="scorebox"><div><small>Alignment</small><b>${r.align}</b></div><div><small>Audience</small><b>${r.aud && r.aud.n ? r.aud.pct : "-"}</b></div><div class="tot"><small>Total</small><b>${r.total ?? r.align}</b></div></div></div>
    <div class="lgrid"><div>${cultureMap(plan, r)}</div><div>
      <div class="skh">How each part fit the tone</div>
      <div class="fits">${sec.map(([k, v]) => `<div><span>${esc(CL.SECTION_NAMES[k])}</span><div class="fb2"><i class="${v.fit < 60 ? "lo" : v.fit < 80 ? "mid" : ""}" style="width:${Math.max(3, v.fit)}%"></i></div><b>${v.fit}</b></div>`).join("")}</div>
      <div class="skh">What the crew is saying</div>
      ${(r.reacts || []).slice(0, 4).map(x => `<div class="quote ${x.bad ? "bad" : ""}"><small>${esc(CL.SECTION_NAMES[x.k])}</small>${esc(x.t)}</div>`).join("")}
      ${(r.flags || []).map(f => `<div class="quote bad"><small>Fairness</small>${esc(f)}</div>`).join("")}
      ${r.aud && r.aud.n ? `<div class="skh">What the audience saw (${plural(r.aud.n, "rating")})</div><div class="fits aud">${CL.RUBRIC.map(c => `<div><span>${esc(c.name)}</span><div class="fb2"><i style="width:${(r.aud.c[c.id] || 0) / 4 * 100}%"></i></div><b>${(r.aud.c[c.id] || 0).toFixed(1)}</b></div>`).join("")}</div>` : ""}
    </div></div></div>`;
}

/* ============================================================ HOST */
let H = null;
async function hostSetup() {
  const N = await K.net("clMock").catch(() => null); if (!N) return K.needSetup(hdr());
  let saved = null; try { const c = localStorage.getItem(HOST_KEY); if (c) { const g = await N.get("games/" + c); if (g && g.game === GAME) saved = { code: c, g }; } } catch (e) {}
  const mins = STAGES.map(s => s.mins);
  app.innerHTML = `${hdr()}${saved ? `<div class="panel resume"><h2>Pick up where you left off</h2><p>Game <b>${saved.code}</b> is still running (${esc(phaseLabel(saved.g.state))}). Students rejoin with the same code and their same first name.</p><button class="btn main" id="res">Resume game ${saved.code}</button></div>` : ""}
    <div class="panel wide-panel"><h2>Host a new game</h2>
    <p class="note"><b>Groups:</b> random pairs (one group of 3 if odd). The game lasts 14 days, so you can build one day and present the next.</p>
    <p>Minutes for each stage (you open each one, and you can add time):</p>
    <div class="stmins">${STAGES.map((s, i) => `<label><span>${i + 1}. ${esc(s.name)}</span><input type="number" min="2" max="20" value="${s.mins}" data-i="${i}"></label>`).join("")}</div>
    <p class="note">Building takes about 35 minutes. Presentations take about 2 minutes per pair. Scoring: alignment (how well every choice matches the promised tone, 0 to 100) plus the audience rubric (0 to 100).</p>
    <div class="err" id="er"></div><button class="btn main" id="go">Create game</button></div>`;
  app.querySelectorAll(".stmins input").forEach(inp => inp.onchange = () => mins[+inp.dataset.i] = Math.max(2, Math.min(20, +inp.value || STAGES[+inp.dataset.i].mins)));
  if (saved) $("#res").onclick = () => { const { state, players, ...meta } = saved.g; startHost(N, saved.code, meta, state, players || {}); };
  $("#go").onclick = async () => {
    $("#go").disabled = true;
    try {
      const code = await K.newCode(N);
      const meta = { created: Date.now(), game: GAME, kind: "engagement", size: 2, mins };
      const state = { phase: "lobby", tot: {}, seed: Math.floor(Math.random() * 1000) };
      await N.set("games/" + code, { ...meta, state });
      try { localStorage.setItem(HOST_KEY, code); } catch (e) {}
      startHost(N, code, meta, state, {});
    } catch (e) { $("#er").textContent = "Couldn't reach the class game database."; $("#go").disabled = false; }
  };
}
function phaseLabel(st) { if (!st) return "lobby"; return st.phase === "build" ? `stage ${st.stage + 1}: ${STAGES[st.stage].name}` : st.phase === "present" ? "presentations" : st.phase === "reveal" ? "six months later" : st.phase; }
function startHost(N, code, meta, state, players) {
  H = { N, code, meta, state, players };
  H.off = N.on("games/" + code + "/players", v => { H.players = v || {}; hostRender(true); });
  hostRender();
}
function hostSet(state) { K.stopTick(); H.state = state; H.rq = null; H.N.set("games/" + H.code + "/state", state).catch(() => {}); hostRender(); }
function hostSave() { clearTimeout(H.pt); H.pt = setTimeout(() => H.N.set("games/" + H.code + "/state", H.state).catch(() => {}), 500); }
function hostRender(fromPlayers) {
  const st = H.state;
  ({ lobby: hostLobby, seat: hostSeat, build: hostBuild, present: hostPresent, reveal: hostReveal, end: hostEnd })[st.phase](fromPlayers);
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
function hostLobby(fromPlayers) {
  app.innerHTML = K.lobbyHTML(H, "Culture Launch", PATH, "Random pairs (one group of 3 if odd) · every pair builds the culture guide for its own Sole Revival shop");
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
  app.innerHTML = K.seatHTML(H, { sub: "Sit with your partner. You're the management team of a new Sole Revival shop.", go: "Open Stage 1: Found it", mark: () => "" });
  app.querySelectorAll(".pcard .tn em").forEach(el => el.remove());
  const h2 = app.querySelector(".hostbar h2"); if (h2) h2.textContent = "Meet your management partner";
  const k = app.querySelector(".hostbar .kick"); if (k) k.textContent = "Culture Launch";
  $("#go").onclick = () => openStage(0);
  K.bindRemove(H, () => { H.rq = null; hostSeat(); }); K.fit();
}
function openStage(i) { hostSet({ ...H.state, phase: "build", stage: i, endsAt: Date.now() + H.meta.mins[i] * 60000 }); }
function groupPlan(gi) {
  const st = H.state, g = st.groups[gi] || [];
  return mergePlans([...(g.map(p => H.players[p] && H.players[p].cl)), (st.prog || {})[gi]]);
}
function hostBuild(fromPlayers) {
  syncGroups();
  const st = H.state, s = st.stage, live = liveGroups(st);
  const prog = {}; live.forEach(gi => prog[gi] = groupPlan(gi));
  if (JSON.stringify(prog) !== JSON.stringify(st.prog || {})) { H.state = { ...H.state, prog }; hostSave(); }
  const nDone = live.filter(gi => done(prog[gi], STAGES[s].id)).length;
  if (H.rq !== "build" + s) {
    H.rq = "build" + s; const secs = H.meta.mins[s] * 60;
    app.innerHTML = `<div class="hostbar"><div><div class="kick">Stage ${s + 1} of 5 · ${esc(STAGES[s].name)}</div><h2>${esc(STAGES[s].sub)}</h2></div>
      <div class="clock"><div class="secs big">${K.clockText(secs)}</div><div class="count" id="cnt"></div></div></div>
      <div class="stagebar">${STAGES.map((x, i) => `<span class="${i < s ? "past" : i === s ? "now" : ""}"><b>${i + 1}</b>${esc(x.name)}</span>`).join("")}</div>
      <div class="gprog" id="gp"></div>
      <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn" id="more">+2 minutes</button>${s < 4 ? `<button class="btn main" id="nx">Open Stage ${s + 2}: ${esc(STAGES[s + 1].name)} →</button>` : `<button class="btn main" id="nx">Start presentations →</button>`}</div>`;
    K.startTimer(app, secs, st.endsAt, () => {});
    $("#more").onclick = () => hostSet({ ...H.state, endsAt: Math.max(Date.now(), H.state.endsAt) + 120000 });
    $("#nx").onclick = () => s < 4 ? openStage(s + 1) : startPresent();
    K.fit();
  }
  $("#cnt").textContent = `${nDone} of ${live.length} shops done`;
  $("#gp").innerHTML = live.map(gi => { const p = prog[gi];
    return `<div class="gp ${done(p, STAGES[s].id) ? "done" : ""}"><span class="pn">${gi + 1}</span><div class="gpt"><b>${STAGES.map((x, i) => `<i class="dotk ${done(p, x.id) ? "on" : ""}" title="${esc(x.name)}"></i>`).join("")}</b><small>${esc(namesOf(st, gi, hName).join(" & "))}</small></div></div>`; }).join("");
}
function startPresent() {
  const st = H.state, live = liveGroups(st), order = K.shuffle(live.slice());
  const prog = {}; live.forEach(gi => prog[gi] = groupPlan(gi));
  hostSet({ ...st, prog, phase: "present", order, pi: 0, slide: 0 });
}
function ratingsFor(gi) {
  const st = H.state, mine = new Set(st.groups[gi] || []), out = [];
  Object.entries(H.players || {}).forEach(([pid, p]) => { if (mine.has(pid) || p.out) return; const r = p.rt && p.rt[gi]; if (r && CL.RUBRIC.every(c => r[c.id])) out.push(r); });
  return out;
}
function hostPresent(fromPlayers) {
  const st = H.state, gi = st.order[st.pi];
  // presenter remote: newest slide tap from the presenting pair
  if (fromPlayers) { let best = null; (st.groups[gi] || []).forEach(p => { const r = H.players[p] && H.players[p].rm; if (r && r.g === gi && (!best || r.at > best.at)) best = r; });
    if (best && best.at > (H.rmAt || 0)) { H.rmAt = best.at; if (best.i !== st.slide && best.i >= 0 && best.i < NSLIDES) { H.state = { ...st, slide: best.i }; hostSave(); H.rq = null; } } }
  const n = ratingsFor(gi).length, voters = K.activeIds(H).filter(p => !(st.groups[gi] || []).includes(p)).length;
  if (H.rq === "pres" + st.pi + "|" + H.state.slide) { const c = $("#rc"); if (c) c.textContent = `${n} of ${voters} ratings in`; return; }
  H.rq = "pres" + st.pi + "|" + H.state.slide;
  const info = { gi, names: namesOf(st, gi, hName), crisis: crisisOf(st, gi) };
  app.innerHTML = `<div class="presbar"><div><div class="kick">Presentation ${st.pi + 1} of ${st.order.length}</div><b>${shopName(gi)}: ${esc(info.names.join(" & "))}</b></div>
    <div class="row"><span class="rc" id="rc">${n} of ${voters} ratings in</span><button class="btn" id="pv">◀</button><span>${H.state.slide + 1} / ${NSLIDES}</span><button class="btn" id="nv">▶</button>
    <button class="btn main" id="nxg">${st.pi < st.order.length - 1 ? "Next shop →" : "Six months later →"}</button></div></div>
    <div class="deckstage host">${slideHTML(st.prog[gi] || {}, info, H.state.slide)}</div>`;
  const go = d => { const v = Math.max(0, Math.min(NSLIDES - 1, H.state.slide + d)); if (v !== H.state.slide) { H.state = { ...H.state, slide: v }; hostSave(); H.rq = null; hostPresent(); } };
  $("#pv").onclick = () => go(-1); $("#nv").onclick = () => go(1);
  H.key = e => { if (H.state.phase !== "present") return; if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); go(1); } if (e.key === "ArrowLeft") go(-1); };
  document.onkeydown = H.key;
  $("#nxg").onclick = () => { if (st.pi < st.order.length - 1) hostSet({ ...H.state, pi: st.pi + 1, slide: 0 }); else startReveal(); };
}
function results() {
  const st = H.state, res = {};
  liveGroups(st).forEach(gi => { const plan = st.prog[gi] || {}, r = CL.score(plan, crisisOf(st, gi)), rs = ratingsFor(gi), c = {};
    CL.RUBRIC.forEach(k => c[k.id] = rs.length ? rs.reduce((t, x) => t + +x[k.id], 0) / rs.length : 0);
    const avg = rs.length ? CL.RUBRIC.reduce((t, k) => t + c[k.id], 0) / CL.RUBRIC.length : 0, pct = Math.round(avg / 4 * 100);
    res[gi] = { align: r.align, secs: r.secs, reacts: r.reacts, flags: r.flags, tone: r.tone ? { id: r.tone.id, name: r.tone.name, s: r.tone.s, p: r.tone.p } : null, aud: { n: rs.length, c, pct }, total: r.align + pct }; });
  return res;
}
function startReveal() {
  document.onkeydown = null;
  const res = results(), st = H.state, tot = {};
  st.groups.forEach((g, gi) => g.forEach(p => tot[p] = (res[gi] || {}).total || 0));
  hostSet({ ...st, phase: "reveal", res, tot, ri: 0, rorder: st.order });
}
function hostReveal() {
  if (H.rq === "rev" + H.state.ri) return; H.rq = "rev" + H.state.ri;
  const st = H.state, gi = st.rorder[st.ri], r = st.res[gi];
  app.innerHTML = `${laterHTML(st.prog[gi] || {}, r, { title: shopName(gi), names: namesOf(st, gi, hName) })}
    <div class="row" style="justify-content:center;margin-top:12px"><button class="btn" id="rs">Rescore with late ratings</button><button class="btn main" id="nx">${st.ri < st.rorder.length - 1 ? "Next shop →" : "Final results →"}</button></div>`;
  $("#nx").onclick = () => st.ri < st.rorder.length - 1 ? hostSet({ ...st, ri: st.ri + 1 }) : hostSet({ ...st, phase: "end" });
  $("#rs").onclick = () => { const res = results(), tot = {}; st.groups.forEach((g, i) => g.forEach(p => tot[p] = (res[i] || {}).total || 0)); hostSet({ ...st, res, tot }); };
  K.fit();
}
function hostEnd() {
  if (H.rq === "end") return; H.rq = "end";
  const st = H.state, shim = { state: { tot: {} }, players: {} };
  liveGroups(st).forEach(gi => { shim.state.tot["g" + gi] = st.res[gi].total; shim.players["g" + gi] = { name: namesOf(st, gi, hName).join(" & ") }; });
  K.finale(shim, "Culture Launch · Final", "Top 5 Shops", classResults, hostErase, () => { cleanupHost(); home(); });
}
function scatter(pts) {
  const W = 520, Hh = 340, L = 50, R = 16, T = 16, B = 46, x = v => L + (W - L - R) * v / 100, y = v => T + (Hh - T - B) * (1 - v / 100);
  let g = "";
  [0, 25, 50, 75, 100].forEach(v => g += `<line class="gl" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text><text x="${x(v)}" y="${Hh - 26}" text-anchor="middle">${v}</text>`);
  g += `<line class="diag" x1="${x(0)}" y1="${y(0)}" x2="${x(100)}" y2="${y(100)}"/>`;
  g += `<text class="at" x="${(L + W - R) / 2}" y="${Hh - 6}" text-anchor="middle">Alignment score (the engine)</text><text class="at" transform="translate(14 ${(T + Hh - B) / 2}) rotate(-90)" text-anchor="middle">Audience score</text>`;
  pts.forEach(p => g += `<circle class="dot" cx="${x(p.x)}" cy="${y(p.y)}" r="10"/><text class="dl" x="${x(p.x)}" y="${y(p.y) + 4}" text-anchor="middle" fill="#fff">${p.l}</text>`);
  return `<svg class="scatter" viewBox="0 0 ${W} ${Hh}">${g}</svg>`;
}
function csv() {
  const st = H.state, rows = [["Name", "Partner", "Shop", "Tone", "Leadership style", "Alignment", "Audience %", "Total", ...CL.RUBRIC.map(c => "Audience: " + c.name), "Ratings"]];
  liveGroups(st).forEach(gi => { const r = st.res[gi], f = (st.prog[gi] || {}).found || {}, g = st.groups[gi];
    g.forEach(p => rows.push([hName(p), g.filter(q => q !== p).map(hName).join(" & "), shopName(gi), (CL.toneById[f.tone] || {}).name || "", (CL.styleById[f.style] || {}).name || "", r.align, r.aud.pct, r.total, ...CL.RUBRIC.map(c => r.aud.c[c.id].toFixed(2)), r.aud.n])); });
  return rows.map(r => r.map(v => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v).join(",")).join("\n");
}
function classResults() {
  document.body.classList.remove("finale-on");
  const st = H.state, live = liveGroups(st), ranked = live.slice().sort((a, b) => st.res[b].total - st.res[a].total);
  const miss = {}; live.forEach(gi => Object.entries(st.res[gi].secs).forEach(([k, v]) => { if (v.fit < 60) miss[k] = (miss[k] || 0) + 1; }));
  app.innerHTML = `<div class="rep"><h2>Class results</h2><div class="endgrid">
    <div class="skills"><div class="skh">Did the audience spot the mismatches?</div>${scatter(live.map(gi => ({ x: st.res[gi].align, y: st.res[gi].aud.pct, l: gi + 1 })))}
      <p class="note">Each dot is a shop. On the diagonal line, the class and the engine agreed. Above the line, the audience was more generous than the engine. Below it, the audience was tougher.</p>
      <div class="skh" style="margin-top:10px">Where cultures broke down most</div>
      <div class="poplist">${Object.keys(CL.WEIGHTS).map(k => `<div><span>${esc(CL.SECTION_NAMES[k])}</span><div class="pbar"><i style="width:${Math.max(3, 100 * (miss[k] || 0) / Math.max(1, live.length))}%"></i></div><b>${miss[k] || 0}</b></div>`).join("")}</div>
      <p class="note">Number of shops where that part missed the tone (fit under 60).</p>
      <div class="skh" style="margin-top:10px">Debrief</div>
      <ol class="debrief"><li>Which part of a culture was hardest to keep consistent with the tone? Why?</li><li>Find a shop the audience scored higher than the engine. What made it sound better than it was?</li><li>Can a company be "Relaxed" and still fire someone for theft? Where's the line between a tone and fairness?</li><li>Which leadership style fit your tone best? Would you change it now?</li></ol></div>
    <div class="skills"><div class="skh">Every shop</div>
      <table class="htab small"><tr><th>Shop</th><th>Tone</th><th>Align</th><th>Audience</th><th>Total</th></tr>
        ${ranked.map(gi => `<tr><td><b>${shopName(gi)}</b><small>${esc(namesOf(st, gi, hName).join(" & "))}</small></td><td>${esc((st.res[gi].tone || {}).name || "-")}</td><td>${st.res[gi].align}</td><td>${st.res[gi].aud.pct}</td><td><b>${st.res[gi].total}</b></td></tr>`).join("")}</table></div></div>
    <div class="row" style="justify-content:center;margin-top:14px"><button class="btn main" id="pod">Back to Top 5</button><button class="btn" id="csv">Download scores (CSV)</button><button class="btn" id="erase">Erase game</button></div></div>`;
  $("#pod").onclick = () => { H.rq = null; hostEnd(); }; $("#erase").onclick = hostErase;
  $("#csv").onclick = () => { const b = new Blob([csv()], { type: "text/csv" }), a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `culture-launch-${H.code}.csv`; a.click(); };
  K.fit();
}
function cleanupHost() { K.stopTick(); document.onkeydown = null; if (H && H.off) H.off(); }
async function hostErase() { if (!H) return home(); cleanupHost(); try { await H.N.remove("games/" + H.code); } catch (e) {} try { localStorage.removeItem(HOST_KEY); } catch (e) {} H = null; home(); }

/* ============================================================ STUDENT */
let ME = null;
const SESS = K.sess("clSession");
async function stuJoin() {
  const N = await K.net("clMock").catch(() => null); if (!N) return K.needSetup(hdr());
  K.joinForm({ N, game: GAME, title: "Culture Launch", sessKey: "clSession", hdr: hdr(), onJoined: ctx => {
    if (ME && ME.off) ME.off();
    ME = { N, ...ctx, cl: { ...((ctx.rec && ctx.rec.cl) || {}) }, rt: { ...((ctx.rec && ctx.rec.rt) || {}) }, st: null, rq: null, tab: null };
    ME.off = N.on(`games/${ctx.code}/state`, s => { if (!ME) return; if (!s) return gameGone(); ME.st = s; stuRender(); });
  } });
}
function gameGone() { K.stopTick(); if (ME && ME.off) ME.off(); ME = null; SESS.clear();
  app.innerHTML = `<div class="wait"><h2>The game has ended</h2><p>Your teacher closed this game.</p><button class="btn main" id="h">OK</button></div>`; $("#h").onclick = home; }
const sName = p => ((ME.st && ME.st.names) || {})[p] || "a teammate";
function myPlan() { const st = ME.st, gi = K.groupOf(st, ME.pid); return mergePlans([ME.cl, (st.prog || {})[gi]]); }
function stuRender() {
  const M = ME, st = M.st; if (!st) return;
  const gi = st.groups ? K.groupOf(st, M.pid) : -1;
  const presenting = st.phase === "present" && st.order && st.order[st.pi] === gi;
  const key = [st.phase, st.stage, st.pi, presenting ? st.slide : "", st.ri, gi, st.phase === "seat" ? JSON.stringify(st.groups) : ""].join("|");
  if (st.phase === "build" && key === M.rq) { buildSync(); return; }
  if (key === M.rq) return;
  M.rq = key;
  if (st.phase === "lobby") { app.innerHTML = `<div class="wait"><h2>You're in, ${esc(M.name)}!</h2><p>Watch the board. Your teacher will pair everyone up at random.</p></div>`; return; }
  if (gi < 0) { app.innerHTML = `<div class="wait"><h2>You're in, ${esc(M.name)}</h2><p>Hang on. The teacher's screen will put you on a team in a few seconds.</p></div>`; return; }
  const mates = st.groups[gi].filter(p => p !== M.pid).map(sName);
  if (st.phase === "seat") { app.innerHTML = `<div class="wait seat"><div class="kick">Sole Revival ${shopName(gi)}</div><p>${mates.length > 1 ? "Your partners" : "Your partner"}</p><div class="tablebig mate">${esc(andList(mates)) || "Solo"}</div><p>Sit together. You two are the management team of a brand-new Sole Revival shop. Either of you can make choices; your devices stay in sync.</p></div>`; return; }
  if (st.phase === "build") { M.plan = myPlan(); if (M.tab == null || M.tab > st.stage) M.tab = st.stage; if (M.lastStage !== st.stage) { M.tab = st.stage; M.lastStage = st.stage; } return drawBuild(true); }
  K.stopTick();
  const info = { gi, names: st.groups[gi].map(sName), crisis: crisisOf(st, gi) }, plan = (st.prog || {})[gi] || myPlan();
  if (st.phase === "present") {
    const pg = st.order[st.pi];
    if (pg === gi) {
      app.innerHTML = `<div class="kick">You're presenting · Presentation ${st.pi + 1} of ${st.order.length}</div><h2 class="mh">Your slides are on the board</h2>
        <div class="deckstage">${slideHTML(plan, info, st.slide)}</div>
        <div class="decknav"><button class="btn big" id="rl" ${st.slide ? "" : "disabled"}>◀ Back</button><button class="btn main big" id="rr" ${st.slide < NSLIDES - 1 ? "" : "disabled"}>Next slide ▶</button></div>
        <p class="note" style="text-align:center">These buttons change the slide on the board. Both partners should speak.</p>`;
      const tap = i => { const r = { g: gi, i, at: Date.now() }; M.N.update(`games/${M.code}/players/${M.pid}`, { rm: r }).catch(() => {}); };
      $("#rl").onclick = () => tap(st.slide - 1); $("#rr").onclick = () => tap(st.slide + 1);
      return;
    }
    return drawRate(pg, st.groups[pg].map(sName));
  }
  if (st.phase === "reveal" || st.phase === "end") {
    const r = st.res && st.res[gi]; if (!r) { app.innerHTML = `<div class="wait"><h2>Six months later…</h2><p>Watch the board.</p></div>`; return; }
    app.innerHTML = `${laterHTML(plan, r, { title: shopName(gi), names: info.names })}
      <div class="row" style="justify-content:center;margin-top:12px"><button class="btn main" id="dv">View our slideshow</button><button class="btn" id="pr">Print our slides</button></div>`;
    $("#dv").onclick = () => deckViewer(plan, info, 0); $("#pr").onclick = () => printDeck(plan, info);
  }
}
function drawRate(pg, names) {
  const M = ME, r = M.rt[pg] || {};
  const all = CL.RUBRIC.every(c => r[c.id]);
  app.innerHTML = `<div class="kick">Audience · rate ${shopName(pg)}</div><h2 class="mh">${esc(andList(names))}</h2>
    <p class="note">Listen, look at the slides on the board, and score each row. You can change scores until the next shop starts.</p>
    <div class="rate">${CL.RUBRIC.map(c => `<div class="rrow"><div class="rq"><b>${esc(c.name)}</b><span>${esc(c.q)}</span></div>
      <div class="rbtns" data-c="${c.id}">${CL.SCALE.map(([v, l]) => `<button data-v="${v}" aria-pressed="${String(r[c.id] || "") === v}"><b>${v}</b><small>${esc(l)}</small></button>`).join("")}</div></div>`).join("")}</div>
    <div class="lockmsg2 ${all ? "ok" : ""}">${all ? "Saved. Thanks!" : `${CL.RUBRIC.filter(c => r[c.id]).length} of ${CL.RUBRIC.length} scored`}</div>`;
  app.querySelectorAll(".rbtns").forEach(el => el.onclick = e => { const b = e.target.closest("button"); if (!b) return;
    M.rt[pg] = { ...(M.rt[pg] || {}), [el.dataset.c]: +b.dataset.v }; M.N.update(`games/${M.code}/players/${M.pid}`, { ["rt/" + pg]: M.rt[pg] }).catch(() => {}); const y = scrollY; drawRate(pg, names); scrollTo(0, y); });
}
function buildSync() { if (document.activeElement && document.activeElement.id === "ct") return; const p = myPlan(); if (JSON.stringify(p) !== JSON.stringify(ME.plan)) { ME.plan = p; drawBuild(false); } }
function savePart(k, patch) {
  const cur = ME.plan[k] || {}; const v = { ...cur, ...patch, at: Date.now() };
  ME.cl[k] = v; ME.plan = { ...ME.plan, [k]: v };
  ME.N.update(`games/${ME.code}/players/${ME.pid}`, { ["cl/" + k]: v }).catch(() => {});
  drawBuild(false);
}
function drawBuild(fresh) {
  const M = ME, st = M.st, gi = K.groupOf(st, M.pid), plan = M.plan, tab = M.tab, y = scrollY;
  const mates = st.groups[gi].filter(p => p !== M.pid).map(sName), info = { gi, names: st.groups[gi].map(sName), crisis: crisisOf(st, gi) };
  const tabs = `<div class="tabs">${STAGES.map((s, i) => `<button data-t="${i}" class="${i === tab ? "on" : ""} ${done(plan, s.id) ? "ok" : ""}" ${i > st.stage ? "disabled" : ""}><b>${done(plan, s.id) ? "✓" : i + 1}</b>${esc(s.name)}</button>`).join("")}</div>`;
  const stage = STAGES[tab];
  let body = "";
  if (stage.id === "found") body = foundHTML(plan.found || {});
  if (stage.id === "invest") body = investHTML(plan.invest || {});
  if (stage.id === "pol") body = polHTML(plan.pol || {});
  if (stage.id === "disc") body = discHTML(plan.disc || {});
  if (stage.id === "crisis") body = crisisHTML(plan.crisis || {}, info.crisis);
  app.innerHTML = `<div class="kick">Sole Revival ${shopName(gi)}${mates.length ? ` · with ${esc(andList(mates))}` : ""}</div>${K.timerHTML(M.meta.mins[st.stage] * 60)}
    ${tabs}<div class="sthead"><h2>${tab + 1}. ${esc(stage.name)}</h2><p>${esc(stage.sub)}</p></div>${body}
    <div class="row" style="justify-content:space-between;margin-top:14px"><button class="btn" id="prev">Preview our slideshow</button>${tab < st.stage ? `<button class="btn main" id="tonext">Next: ${esc(STAGES[tab + 1].name)} →</button>` : `<span class="note">${done(plan, stage.id) ? "Done. Your teacher will open the next stage." : "Your choices save automatically."}</span>`}</div>`;
  K.startTimer(app, M.meta.mins[st.stage] * 60, st.endsAt, () => {});
  app.querySelectorAll(".tabs button").forEach(b => b.onclick = () => { M.tab = +b.dataset.t; drawBuild(true); });
  $("#prev").onclick = () => deckViewer(plan, info, Math.min(tab + 1, NSLIDES - 1));
  const tn = $("#tonext"); if (tn) tn.onclick = () => { M.tab = tab + 1; drawBuild(true); };
  bindStage(stage.id, plan);
  if (!fresh) scrollTo(0, y); else scrollTo(0, 0);
}
function chips(list, sel, key, o = {}) {
  return `<div class="chips ${o.cls || ""}" data-k="${key}">${list.map(x => `<button data-v="${x.id}" aria-pressed="${Array.isArray(sel) ? sel.includes(x.id) : sel === x.id}"><b>${esc(x.name)}</b>${x.sub ? `<small>${esc(x.sub)}</small>` : ""}</button>`).join("")}</div>`;
}
function foundHTML(f) {
  return `<div class="q"><h3>What tone do you want to set?</h3>${chips(CL.TONES.map(t => ({ id: t.id, name: t.name, sub: t.line })), f.tone, "tone", { cls: "big" })}</div>
    <div class="q"><h3>What leadership style will you lead with?</h3>${chips(CL.STYLES.map(s => ({ id: s.id, name: s.name, sub: "“" + s.q + "”" })), f.style, "style")}</div>
    <div class="q"><h3>Pick exactly three core values <span class="cnt">${(f.values || []).length} of 3</span></h3>${chips(CL.VALUES, f.values || [], "values", { cls: "small" })}</div>`;
}
function investHTML(inv) {
  const sp = CL.spend(inv);
  return `<div class="budget"><div><small>Money left</small><b>${money(CL.BUDGET - sp.$)}</b><div class="bbar"><i style="width:${100 * sp.$ / CL.BUDGET}%"></i></div></div>
    <div><small>Manager hours left</small><b>${CL.HOURS - sp.h} of ${CL.HOURS}</b><div class="bbar"><i style="width:${100 * sp.h / CL.HOURS}%"></i></div></div></div>
    <div class="levers">${CL.LEVERS.map(l => { const n = inv[l.id] || 0;
      return `<div class="lever ${n ? "on" : ""}"><div class="lt"><b>${esc(l.name)}</b><small>${esc(l.blurb)}</small><em>${money(l.cost)} and ${plural(l.hrs, "hour")} per level</em></div>
        <div class="lv"><button data-l="${l.id}" data-d="-1" ${n ? "" : "disabled"}>−</button><span class="lvd">${[1, 2, 3].map(k => `<i class="${k <= n ? "on" : ""}"></i>`).join("")}</span><button data-l="${l.id}" data-d="1" ${CL.canAdd(inv, l.id) ? "" : "disabled"}>+</button></div></div>`; }).join("")}</div>`;
}
function rangeHTML(list, sel, key, labels) {
  return list.map(x => `<div class="pol"><div class="pq"><b>${esc(x.name)}</b><span>${esc(x.q || "")}</span></div>
    <div class="popts" data-k="${key}" data-id="${x.id}">${(labels || x.o.map(o => o[0])).map((t, k) => `<button data-v="${k}" aria-pressed="${sel[x.id] === k}" class="sv${k}">${esc(t)}</button>`).join("")}</div></div>`).join("");
}
const polHTML = p => rangeHTML(CL.POLICIES, p, "pol");
const discHTML = p => `<div class="rlegend top"><span>◀ Lightest</span><span>Harshest ▶</span></div>${rangeHTML(CL.INFRACTIONS.map(x => ({ ...x, q: "" })), p, "disc", CL.RESP)}`;
function crisisHTML(c, cr) {
  return `<div class="crisis"><div class="nk">Your crisis</div><h3>${esc(cr.head)}</h3><p>${esc(cr.text)}</p></div>
    <div class="q"><h3>How do you respond?</h3><div class="chips stack" data-k="co">${cr.o.map((o, k) => `<button data-v="${k}" aria-pressed="${c.o === k}"><b>${esc(o[0])}</b></button>`).join("")}</div></div>
    <div class="q"><h3>In one sentence, what will you tell your crew?</h3><textarea class="field" id="ct" maxlength="160" rows="2" placeholder="We're handling this by...">${esc(c.text || "")}</textarea><div class="note" id="ctn">${(c.text || "").length} of 160</div></div>`;
}
function bindStage(id, plan) {
  if (id === "found") app.querySelectorAll(".chips[data-k]").forEach(el => el.onclick = e => { const b = e.target.closest("button"); if (!b) return; const k = el.dataset.k, v = b.dataset.v, f = plan.found || {};
    if (k === "values") { let vs = (f.values || []).slice(); if (vs.includes(v)) vs = vs.filter(x => x !== v); else if (vs.length < 3) vs.push(v); else return; savePart("found", { values: vs }); }
    else savePart("found", { [k]: v }); });
  if (id === "invest") app.querySelectorAll(".lv button").forEach(b => b.onclick = () => { const inv = { ...(plan.invest || {}) }, l = b.dataset.l, d = +b.dataset.d, n = inv[l] || 0;
    if (d > 0 && !CL.canAdd(inv, l)) return; inv[l] = Math.max(0, n + d); savePart("invest", Object.fromEntries(CL.LEVERS.map(x => [x.id, inv[x.id] || 0]))); });
  if (id === "pol" || id === "disc") app.querySelectorAll(".popts").forEach(el => el.onclick = e => { const b = e.target.closest("button"); if (!b) return; savePart(id, { [el.dataset.id]: +b.dataset.v }); });
  if (id === "crisis") {
    app.querySelector(".chips[data-k=co]").onclick = e => { const b = e.target.closest("button"); if (!b) return; savePart("crisis", { o: +b.dataset.v }); };
    const ta = $("#ct"); let t; ta.oninput = () => { $("#ctn").textContent = `${ta.value.length} of 160`; clearTimeout(t); t = setTimeout(() => { const v = ta.value.slice(0, 160); ME.cl.crisis = { ...(ME.plan.crisis || {}), text: v, at: Date.now() }; ME.plan = { ...ME.plan, crisis: ME.cl.crisis }; ME.N.update(`games/${ME.code}/players/${ME.pid}`, { "cl/crisis": ME.cl.crisis }).catch(() => {}); }, 600); };
    ta.onblur = () => { clearTimeout(t); if ((ME.plan.crisis || {}).text !== ta.value) savePart("crisis", { text: ta.value.slice(0, 160) }); };
  }
}

function home() { K.stopTick(); document.onkeydown = null; document.body.classList.remove("wide", "finale-on"); app.style.zoom = ""; $("#who").hidden = true; ROLE === "teacher" ? hostSetup() : stuJoin(); }
home();
