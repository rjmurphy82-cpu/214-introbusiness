/* Keep the Crew: a live employee motivation simulation for the Management & Leadership unit.
   Students sign up individually. The teacher screen pairs everyone up (one group of 3 if the class has an odd
   number), and each pair runs its own Sole Revival shop for six months. Partners stay the same all game because
   the results build on each other.
   Each month the pair reads the crew survey and what each employee is saying, then makes two moves from a menu
   of 15 (raises, bonuses, the AC, recognition, training, and more) within a $1,500 budget. For every move they
   label it Hygiene factor or Motivator, and Extrinsic or Intrinsic, before the month closes.
   The teacher screen runs the engine in data.js for every shop, writes the results to the shared state, and shows
   the class how each shop did. Employees whose morale stays under 35 for two months quit and leave a resignation note.
   At the end: top 5 shops, a class chart of spending against morale, what each move did, a CSV for the gradebook,
   and on every student device a printable Shop Report with the Exit Interview Memo prompt.
   Solo play runs the same six months on one device with no code, for absent students.
   Storage: /api/live (codes under ibl:), same as Shift Manager. */
"use strict";
const C = window.CREW, K = window.KIT;
const { $, esc, num, ord, plural, andList, ROLE } = K;
const app = $("#app");
const GAME = "crew";
const PATH = "/keep-the-crew/";
const money = C.money;

const hdr = () => `<h1 class="title">Keep the <span>Crew.</span></h1>
  <p class="lede">${ROLE === "teacher"
    ? "Teacher screen for the projector. Students sign up on their own devices and get paired up (one group of 3 if there's an odd number). Each pair runs its own Sole Revival shop for six months, with the same partner all game. Every month they make two moves to keep the crew motivated and label each one. Employees who stay unhappy quit."
    : "You and a partner are the new managers of a Sole Revival shop. For six months, read your crew, check the survey, and make two moves a month to keep them motivated. Label every move. If someone stays unhappy for two months, they quit."}</p>`;

/* ============================================================ SHARED PIECES */
const shopName = gi => `Shop ${gi + 1}`;
function newsHTML(m) {
  const ev = C.EVENTS[m];
  return `<div class="news"><div class="nk">Month ${m + 1} of ${C.MONTHS} · This month</div><h3>${esc(ev.head)}</h3><p>${esc(ev.text)}</p></div>`;
}
function prevItems(shop) { const m = shop.m; return m >= 2 ? shop.hist[m - 2].items : m === 1 ? shop.startItems : null; }
function surveyHTML(shop, o = {}) {
  const it = shop.items, pv = o.prev === undefined ? prevItems(shop) : o.prev;
  return `<div class="survey"><div class="sh">Crew survey <small>% who agree</small></div>
    ${C.ITEMS.map(i => { const v = it[i.id], d = pv ? v - pv[i.id] : 0;
      return `<div class="srow"><span class="sl">${esc(i.label)}</span><div class="sbar2"><i class="${v < 40 ? "lo" : v < 60 ? "mid" : ""}" style="width:${Math.max(2, v)}%"></i></div>
        <b>${v}%</b><em class="${d > 0 ? "up" : d < 0 ? "dn" : ""}">${d ? (d > 0 ? "▲" : "▼") + Math.abs(d) : ""}</em></div>`; }).join("")}</div>`;
}
function crewHTML(shop, o = {}) {
  const last = o.result ? shop.hist[shop.hist.length - 1] : null;
  return `<div class="crew">${shop.crew.map((c, k) => { const p = C.personById[c.id];
    if (c.quit && (!last || c.quitM !== last.m)) return `<div class="pc gone"><div class="pt"><b>${esc(p.name)}</b><span>${esc(p.role)}</span></div><div class="gonetag">Quit in Month ${c.quitM + 1}</div></div>`;
    const before = last ? last.before[c.id] : null, d = before != null ? c.morale - before : 0;
    return `<div class="pc ${c.quit ? "quit" : c.warn ? "warn" : ""}"><div class="pt"><b>${esc(p.name)}</b><span>${esc(p.role)}</span></div>
      <div class="mrow"><div class="mbar"><i class="${c.morale < 35 ? "lo" : c.morale < 55 ? "mid" : ""}" style="width:${c.morale}%"></i><u></u></div><b>${c.morale}</b>${last ? `<em class="${d > 0 ? "up" : d < 0 ? "dn" : ""}">${d ? (d > 0 ? "▲" : "▼") + Math.abs(d) : "="}</em>` : ""}</div>
      <div class="md">${c.quit ? "Quit" : c.warn ? "Warning: might quit" : esc(C.mood(c.morale))}</div>
      <p class="qt">“${esc(C.quoteOf(shop, c.id))}”</p></div>`; }).join("")}</div>`;
}
function statHTML(shop) {
  const left = shop.crew.filter(c => !c.quit).length, mo = C.committed(shop);
  return `<div class="kstats"><div><small>Budget this month</small><b>${money(C.BUDGET)}</b></div>
    <div><small>Monthly programs</small><b>${money(mo)}</b></div>
    <div><small>Profit so far</small><b>${money(shop.profit)}</b></div>
    <div><small>Crew</small><b>${left} of 6</b></div><div><small>Points</small><b>${num(shop.total)}</b></div></div>`;
}
// the move picker. pick = { a: [ids], l: { id: { h: "H"|"M", e: "E"|"I" } }, lock }
function pickerHTML(shop, pick, o = {}) {
  const ids = pick.a || [], locked = !!pick.lock || o.readonly, left = C.budgetLeft(shop, ids), l = pick.l || {};
  const card = a => {
    const on = ids.includes(a.id), owned = a.once && shop.owned[a.id];
    const can = on || C.canBuy(shop, a.id, ids);
    const why = owned ? (a.monthly ? "Running" : "Done") : !can ? (ids.length >= C.PICKS ? "" : "Over budget") : "";
    return `<button class="act ${on ? "on" : ""} ${owned ? "owned" : ""}" data-a="${a.id}" ${(!can || locked) && !on ? "disabled" : ""} ${locked ? "aria-disabled='true'" : ""}>
      <span class="an">${esc(a.name)}</span><span class="ac">${a.cost ? money(a.cost) + (a.monthly ? "/mo" : "") : "Free"}</span>
      <small>${esc(a.blurb)}</small>${why ? `<i>${why}</i>` : ""}</button>`;
  };
  const labRow = id => { const a = C.actById[id], x = l[id] || {};
    return `<div class="lab"><div class="lname">${esc(a.name)}</div>
      <div class="lseg" data-id="${id}" data-k="h"><button data-v="H" aria-pressed="${x.h === "H"}" ${locked ? "disabled" : ""}>Hygiene factor</button><button data-v="M" aria-pressed="${x.h === "M"}" ${locked ? "disabled" : ""}>Motivator</button></div>
      <div class="lseg" data-id="${id}" data-k="e"><button data-v="E" aria-pressed="${x.e === "E"}" ${locked ? "disabled" : ""}>Extrinsic</button><button data-v="I" aria-pressed="${x.e === "I"}" ${locked ? "disabled" : ""}>Intrinsic</button></div></div>`; };
  const labeled = ids.every(id => l[id] && l[id].h && l[id].e);
  return `<div class="step"><span>1</span>Make up to ${C.PICKS} moves <em class="bl ${left < 0 ? "neg" : ""}">${money(left)} left to spend</em></div>
    <div class="acts">${C.ACTIONS.map(card).join("")}</div>
    ${ids.length ? `<div class="step"><span>2</span>Label each move</div><div class="labs">${ids.map(labRow).join("")}</div>` : ""}
    ${o.readonly ? "" : `<div class="lockbar">${locked
      ? `<div class="lockmsg">Locked in. ${o.solo ? "" : "Waiting for the month to close."}</div><button class="btn" id="unlock">Change our moves</button>`
      : `<div class="note">${!ids.length ? "No moves picked. You can lock in with no moves, but your crew will notice." : !labeled ? "Label every move to lock in." : "Ready."}</div>
         <button class="btn main" id="lock" ${labeled ? "" : "disabled"}>${o.solo ? "Close the month" : "Lock in our moves"}</button>`}</div>`}`;
}
function bindPicker(shop, getPick, setPick) {
  app.querySelectorAll(".act[data-a]").forEach(b => b.onclick = () => {
    const p = getPick(); if (p.lock) return; const id = b.dataset.a, ids = (p.a || []).slice();
    const i = ids.indexOf(id); if (i >= 0) ids.splice(i, 1); else if (C.canBuy(shop, id, ids)) ids.push(id); else return;
    const l = { ...(p.l || {}) }; Object.keys(l).forEach(k => { if (!ids.includes(k)) delete l[k]; });
    setPick({ a: ids, l });
  });
  app.querySelectorAll(".lseg").forEach(sg => sg.onclick = e => { const b = e.target.closest("button"); if (!b) return; const p = getPick(); if (p.lock) return;
    const id = sg.dataset.id, l = { ...(p.l || {}) }; l[id] = { ...(l[id] || {}), [sg.dataset.k]: b.dataset.v }; setPick({ l }); });
}
// one month's results for one shop
function resultHTML(shop) {
  const h = shop.hist[shop.hist.length - 1];
  const parts = [["Profit ÷ 100", Math.round(h.profit / 100)], ["Average morale", h.avg], [`Labels (${h.lab.right} of ${h.lab.total} right)`, h.lab.right * C.PTS.label]];
  if (h.quits.length) parts.push([`${plural(h.quits.length, "quit")}`, h.quits.length * C.PTS.quit]);
  return `<div class="rgrid"><div>
      ${h.ev ? `<div class="evnote">${esc(h.ev)}</div>` : ""}
      ${h.quits.map(id => `<div class="letter"><div class="lh">Resignation letter · ${esc(C.personById[id].name)}</div><p>“${esc(C.personById[id].quit)}”</p><small>Replacing a worker costs ${money(C.QUIT_COST)}, and the seat stays empty.</small></div>`).join("")}
      ${h.warns.map(id => `<div class="warnnote"><b>Warning:</b> ${esc(C.personById[id].warn)} One more month under ${C.QUIT_AT} and ${esc(C.personById[id].name)} quits.</div>`).join("")}
      <div class="skh">Your labels</div>
      ${h.acts.length ? h.acts.map(id => { const a = C.actById[id], x = h.labels[id] || {}, r = h.lab.by[id] || {};
        return `<div class="lcheck"><div class="lct"><b>${esc(a.name)}</b><span class="${r.h ? "ok" : "no"}">${r.h ? "✓" : "✗ Answer:"} ${a.h ? "Hygiene factor" : "Motivator"}</span><span class="${r.e ? "ok" : "no"}">${r.e ? "✓" : "✗ Answer:"} ${a.e ? "Extrinsic" : "Intrinsic"}</span></div><small>${esc(a.why)}</small></div>`; }).join("")
        : `<p class="note">No moves this month.</p>`}
    </div><div>
      <div class="money"><div><small>Revenue</small><b>${money(h.revenue)}</b></div><div><small>Spending</small><b>${money(h.spend + h.quitCost)}</b></div><div><small>Profit</small><b>${money(h.profit)}</b></div></div>
      <div class="pts">${parts.map(([k, v]) => `<div><span>${esc(k)}</span><b>${v >= 0 ? "+" : ""}${num(v)}</b></div>`).join("")}<div class="ptot"><span>This month</span><b>${num(h.score)}</b></div></div>
    </div></div>`;
}
// SVG line chart of every crew member's morale plus the crew average
function moraleChart(shop) {
  const W = 640, Hh = 260, L = 40, R = 70, T = 14, B = 34, n = C.MONTHS;
  const x = i => L + (W - L - R) * (i / n), y = v => T + (Hh - T - B) * (1 - v / 100);
  const series = shop.crew.map((c, k) => [shop.start[k], ...shop.hist.map(h => h.morale[k])]);
  const avgS = [Math.round(shop.start.reduce((s, v) => s + v, 0) / 6), ...shop.hist.map(h => h.avg)];
  let g = "";
  [0, 25, 50, 75, 100].forEach(v => g += `<line class="gl" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`);
  g += `<line class="qline" x1="${L}" x2="${W - R}" y1="${y(C.QUIT_AT)}" y2="${y(C.QUIT_AT)}"/><text class="qt" x="${L + 4}" y="${y(C.QUIT_AT) + 14}">Quit line</text>`;
  for (let i = 0; i <= n; i++) g += `<text x="${x(i)}" y="${Hh - 12}" text-anchor="middle">${i === 0 ? "Start" : "M" + i}</text>`;
  const path = s => s.map((v, i) => v == null ? null : [x(i), y(v)]).filter(Boolean).map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join("");
  const tags = [];
  series.forEach((s, k) => { const lastI = s.map((v, i) => v != null ? i : -1).reduce((a, b) => Math.max(a, b), 0);
    g += `<path class="pl p${k}" d="${path(s)}"/>`;
    tags.push({ k, x: x(lastI) + 6, y: y(s[lastI]) + 4 }); });
  // spread the name tags so they never overlap: 12px apart, kept inside the chart
  tags.sort((a, b) => a.y - b.y);
  for (let i = 1; i < tags.length; i++) if (tags[i].x === tags[i - 1].x && tags[i].y - tags[i - 1].y < 12) tags[i].y = tags[i - 1].y + 12;
  const over = Math.max(0, ...tags.map(t => t.y - (Hh - B + 4))); if (over) tags.forEach(t => t.y -= over);
  tags.forEach(t => g += `<text class="pn" x="${t.x}" y="${t.y}">${esc(C.PEOPLE[t.k].name)}${shop.crew[t.k].quit ? " ✗" : ""}</text>`);
  g += `<path class="avgl" d="${path(avgS)}"/>`;
  return `<svg class="mchart" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Crew morale by month">${g}</svg>`;
}
function surveyCompareHTML(shop) {
  return `<table class="stab"><tr><th>Survey item</th><th>Start</th><th>Month ${shop.m}</th><th>Change</th></tr>
    ${C.ITEMS.map(i => { const a = shop.startItems[i.id], b = shop.items[i.id]; return `<tr><td>${esc(i.label)}</td><td>${a}%</td><td>${b}%</td><td>${b - a > 0 ? "+" : ""}${b - a}</td></tr>`; }).join("")}</table>`;
}
function reportHTML(shop, who, o = {}) {
  const left = shop.crew.filter(c => !c.quit).length, labR = shop.hist.reduce((s, h) => s + h.lab.right, 0), labT = shop.hist.reduce((s, h) => s + h.lab.total, 0);
  const last = shop.hist[shop.hist.length - 1] || {};
  return `<div class="report">
    <div class="rhead"><div><div class="kick">Keep the Crew · Shop Report</div><h2>${esc(o.shop || "My shop")}</h2><p>${esc(who)}</p></div>
      <div class="row noprint"><button class="btn main" id="print">Print my report</button>${o.extra || ""}</div></div>
    <div class="kstats"><div><small>Points</small><b>${num(shop.total)}</b></div><div><small>Total profit</small><b>${money(shop.profit)}</b></div><div><small>Total spent</small><b>${money(shop.spent || 0)}</b></div>
      <div><small>Crew kept</small><b>${left} of 6</b></div><div><small>Final morale</small><b>${last.avg ?? "-"}</b></div><div><small>Labels right</small><b>${labR} of ${labT}</b></div></div>
    <div class="rcols"><div><div class="skh">Crew morale by month</div>${moraleChart(shop)}<p class="note">Thick line: crew average. Dashed line: below ${C.QUIT_AT} for two months means they quit.</p></div>
      <div><div class="skh">Crew survey: start vs. end</div>${surveyCompareHTML(shop)}</div></div>
    <div class="skh">Our moves</div>
    <table class="dtab"><tr><th>Month</th><th>Moves</th><th>Avg morale</th><th>Profit</th><th>Labels</th><th>Quits</th></tr>
      ${shop.hist.map(h => `<tr><td>${h.m + 1}</td><td>${h.acts.map(id => esc(C.actById[id].name)).join("<br>") || "<i>none</i>"}</td><td>${h.avg}</td><td>${money(h.profit)}</td><td>${h.lab.right}/${h.lab.total}</td><td>${h.quits.map(id => esc(C.personById[id].name)).join(", ") || "-"}</td></tr>`).join("")}</table>
    <div class="memo"><div class="skh">Exit Interview Memo</div>
      <p>Write a memo to Maya, the owner of Sole Revival. Use this report as your evidence.</p>
      <ol><li><b>What worked?</b> Name the move that helped your crew most. Use a number from the chart or the survey to prove it.</li>
        <li><b>Why did it work?</b> Explain it with Herzberg (hygiene factors vs. motivators) or Maslow's hierarchy of needs.</li>
        <li><b>What would you change?</b> Name one move you'd skip or make earlier, and explain why. If anyone quit, explain what they needed.</li>
        <li><b>Advice for the next manager:</b> one sentence.</li></ol>
      <table class="rubric"><tr><th></th><th>4</th><th>3</th><th>2</th><th>1</th></tr>
        <tr><td>Evidence</td><td>Two or more accurate numbers from the report</td><td>One accurate number</td><td>Refers to results, no numbers</td><td>No evidence</td></tr>
        <tr><td>Theory</td><td>Herzberg or Maslow used correctly to explain why</td><td>Theory named, explanation thin</td><td>Theory misused</td><td>No theory</td></tr>
        <tr><td>Reflection</td><td>Specific change with a clear reason</td><td>Change with a vague reason</td><td>Change, no reason</td><td>Missing</td></tr>
        <tr><td>Writing</td><td>Memo format, clear and concise</td><td>Mostly clear</td><td>Hard to follow</td><td>Incomplete</td></tr></table>
    </div></div>`;
}
function bindPrint() { const b = $("#print"); if (b) b.onclick = () => window.print(); }

/* ============================================================ HOST */
let H = null;
async function hostSetup() {
  const N = await K.net("crewMock").catch(() => null); if (!N) return K.needSetup(hdr());
  const cfg = { secs: 240, size: 2 };
  app.innerHTML = `${hdr()}<div class="panel wide-panel"><h2>Host a game</h2>
    <p class="note"><b>Groups:</b> everyone signs up on their own device. The game pairs them up (one group of 3 if there's an odd number). Partners stay together all six months because each pair runs one shop.</p>
    <p>Time to plan each month:</p><div class="seg" data-k="secs"><button data-v="180">3 min</button><button data-v="240" aria-pressed="true">4 min</button><button data-v="300">5 min</button></div>
    <p class="note">Six months, about 40 minutes. Each month: profit ÷ 100, plus average crew morale, plus ${C.PTS.label} for each correct label (two labels per move), minus ${-C.PTS.quit} for each employee who quits. Both partners get the shop's points.</p>
    <div class="err" id="er"></div><button class="btn main" id="go">Create game</button></div>`;
  app.querySelectorAll(".seg[data-k]").forEach(sg => sg.onclick = e => { const b = e.target.closest("button"); if (!b) return;
    [...sg.children].forEach(x => x.setAttribute("aria-pressed", x === b)); cfg[sg.dataset.k] = +b.dataset.v; });
  $("#go").onclick = async () => {
    $("#go").disabled = true;
    try {
      const code = await K.newCode(N);
      const meta = { created: Date.now(), game: GAME, rounds: C.MONTHS, secs: cfg.secs, size: cfg.size };
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
  if (fromPlayers && !["lobby", "seat", "plan"].includes(st.phase)) return;
  ({ lobby: hostLobby, seat: hostSeat, plan: hostPlan, reveal: hostReveal, end: hostEnd })[st.phase](fromPlayers);
}
// keep every shop at the same index all game: drop removed players, put late joiners in the smallest shop
function keepGroups(groups, ids) {
  const act = new Set(ids), gs = groups.map(g => g.filter(p => act.has(p))), seated = new Set(gs.flat());
  ids.filter(p => !seated.has(p)).forEach(p => { const live = gs.filter(g => g.length), pool = live.length ? live : gs;
    const t = pool.slice().sort((a, b) => a.length - b.length)[0]; if (t) t.push(p); else gs.push([p]); });
  return gs;
}
const groupTot = st => { const o = {}; (st.shops || []).forEach((s, i) => o[i] = s.total); return o; };
function shopTot(st) { const tot = {}; (st.groups || []).forEach((g, i) => g.forEach(p => tot[p] = (st.shops[i] || {}).total || 0)); return tot; }
function hostLobby() {
  app.innerHTML = K.lobbyHTML(H, "Keep the Crew", PATH, `${C.MONTHS} months · pairs (one group of 3 if odd) · same partner all game · every pair runs its own shop`);
  $("#start").onclick = () => { const groups = K.groupUp(K.activeIds(H), {}, 2);
    hostSet({ phase: "seat", r: 0, groups, shops: groups.map(() => C.newShop()), tot: {}, names: K.namesMap(H), log: [] }); };
  $("#end").onclick = hostErase;
  K.fit();
}
function hostSeat(fromPlayers) {
  const st = H.state, kept = keepGroups(st.groups, K.activeIds(H));
  if (JSON.stringify(kept) !== JSON.stringify(st.groups)) return hostSet({ ...st, groups: kept, shops: kept.map((g, i) => st.shops[i] || C.newShop()), names: K.namesMap(H) });
  if (fromPlayers && H.rq === "seat") return; H.rq = "seat";
  app.innerHTML = K.seatHTML(H, { sub: "Sit with your partner. You run this shop together for all six months. Any of you can tap; every device in the shop shows the same picks.", go: "Everyone's with a partner: open Month 1", mark: (p, i) => "" });
  app.querySelectorAll(".pcard .pn").forEach((el, i) => el.title = shopName(i));
  const h2 = app.querySelector(".hostbar h2"); if (h2) h2.textContent = "Meet your partner";
  app.querySelectorAll(".pcard .tn em").forEach(el => el.remove());
  $("#go").onclick = () => hostSet({ ...st, phase: "plan", endsAt: Date.now() + H.meta.secs * 1000, prog: {} });
  K.bindRemove(H, () => { H.rq = null; hostSeat(); });
  K.fit();
}
function groupPick(g, r, players) {
  let best = null;
  g.forEach(p => { const c = players[p] && players[p].kc && players[p].kc[r]; if (c && (!best || (c.at || 0) > (best.at || 0))) best = c; });
  return best;
}
function hostPlan(fromPlayers) {
  const st = H.state, secs = H.meta.secs;
  // late joiners and removals
  const kept = keepGroups(st.groups, K.activeIds(H));
  if (JSON.stringify(kept) !== JSON.stringify(st.groups)) { H.state = { ...st, groups: kept, names: K.namesMap(H) }; H.N.set("games/" + H.code + "/state", H.state).catch(() => {}); return hostPlan(); }
  const picks = st.groups.map(g => groupPick(g, st.r, H.players)), live = st.groups.filter(g => g.length).length;
  const done = picks.filter((c, i) => st.groups[i].length && c && c.lock).length;
  const prog = {}; picks.forEach((c, i) => { if (c) prog[i] = c; });
  if (JSON.stringify(prog) !== JSON.stringify(st.prog || {})) {
    H.state = { ...H.state, prog };
    clearTimeout(H.pt); H.pt = setTimeout(() => H.N.set("games/" + H.code + "/state", H.state).catch(() => {}), 600);
  }
  if (H.rq !== "plan" + st.r) {
    H.rq = "plan" + st.r;
    app.innerHTML = `<div class="hostbar"><div><div class="kick">Month ${st.r + 1} of ${C.MONTHS} · Plan your moves</div><h2>${esc(C.EVENTS[st.r].head)}</h2></div>
      <div class="clock"><div class="secs big">${K.clockText(secs)}</div><div class="count" id="cnt"></div></div></div>
      <div class="news big"><p>${esc(C.EVENTS[st.r].text)}</p></div>
      <div class="stepkey"><span><b>1</b> Read the crew and the survey</span><span><b>2</b> Pick up to ${C.PICKS} moves</span><span><b>3</b> Label each one</span><span><b>4</b> Lock in</span></div>
      <div class="gprog" id="gp"></div>
      <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn" id="close">Close the month now</button></div>`;
    $("#close").onclick = () => hostClose();
    K.startTimer(app, secs, st.endsAt, () => setTimeout(hostClose, 3000));
    K.fit();
  }
  $("#cnt").textContent = `${done} of ${live} shops locked in`;
  $("#gp").innerHTML = st.groups.map((g, i) => { if (!g.length) return ""; const c = picks[i] || {}, n = (c.a || []).length, lab = (c.a || []).every(id => c.l && c.l[id] && c.l[id].h && c.l[id].e);
    return `<div class="gp ${c.lock ? "done" : ""}"><span class="pn">${i + 1}</span><div class="gpt"><b>${c.lock ? "Locked in" : n ? `${plural(n, "move")}${lab ? ", labeled" : ""}` : "Thinking"}</b><small>${esc(g.map(p => K.nameOf(H, p)).join(" & "))}</small></div></div>`; }).join("");
  if (live && done >= live && !H.closing) { H.closing = setTimeout(() => { H.closing = null; if (H.state.phase === "plan") hostClose(); }, 2500); }
}
async function hostClose() {
  if (H.state.phase !== "plan" || H.closingNow) return; H.closingNow = true; K.stopTick(); clearTimeout(H.pt);
  try { H.players = (await H.N.get(`games/${H.code}/players`)) || H.players; } catch (e) {}
  const st = H.state, picks = st.groups.map(g => groupPick(g, st.r, H.players));
  const shops = st.shops.map((s, i) => C.step(s, picks[i]));
  const nst = { ...st, shops, prog: {} }; nst.tot = shopTot(nst);
  const buys = {}; shops.forEach((s, i) => { if (st.groups[i].length) s.hist[st.r].acts.forEach(id => buys[id] = (buys[id] || 0) + 1); });
  nst.log = [...(st.log || []), { r: st.r, buys }];
  H.closingNow = false;
  hostSet({ ...nst, phase: "reveal", names: K.namesMap(H) });
}
function crewDots(s) { return `<span class="cdots">${s.crew.map(c => `<i class="${c.quit ? "x" : c.warn ? "w" : ""}" title="${esc(C.personById[c.id].name)}"></i>`).join("")}</span>`; }
function hostReveal() {
  const st = H.state, r = st.r, last = r >= C.MONTHS - 1, live = st.groups.map((g, i) => i).filter(i => st.groups[i].length);
  const rows = live.map(i => ({ i, s: st.shops[i], h: st.shops[i].hist[r] })).sort((a, b) => b.s.total - a.s.total);
  const buys = (st.log[st.log.length - 1] || {}).buys || {}, top = Object.entries(buys).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const quits = []; live.forEach(i => st.shops[i].hist[r].quits.forEach(id => quits.push({ i, id })));
  const spot = quits[0];
  app.innerHTML = `<div class="hostbar"><div><div class="kick">Month ${r + 1} of ${C.MONTHS} · Results</div><h2>How every shop did</h2></div>
    <p>${quits.length ? `${plural(quits.length, "employee")} quit this month across the class.` : "Nobody quit this month."} ${last ? "That was the last month." : `Next: ${esc(C.EVENTS[r + 1].head)}.`}</p></div>
    <div class="revgrid"><div><table class="htab"><tr><th>#</th><th>Shop</th><th>Crew</th><th>Morale</th><th>Profit</th><th>Labels</th><th>Month</th><th>Total</th></tr>
      ${rows.map((x, k) => `<tr><td>${k + 1}</td><td><b>${shopName(x.i)}</b><small>${esc(st.groups[x.i].map(p => K.nameOf(H, p)).join(" & "))}</small></td><td>${crewDots(x.s)}</td><td>${x.h.avg}</td><td>${money(x.h.profit)}</td><td>${x.h.lab.right}/${x.h.lab.total}</td><td>+${num(x.h.score)}</td><td><b>${num(x.s.total)}</b></td></tr>`).join("")}</table></div>
    <div><div class="skh">Most popular moves this month</div>
      ${top.length ? `<div class="poplist">${top.map(([id, n]) => `<div><span>${esc(C.actById[id].name)}</span><div class="pbar"><i style="width:${Math.max(4, 100 * n / live.length)}%"></i></div><b>${n}</b></div>`).join("")}</div><p class="note">Number of shops that made each move.</p>` : "<p class='note'>No moves this month.</p>"}
      ${spot ? `<div class="letter" style="margin-top:12px"><div class="lh">Resignation letter · ${esc(C.personById[spot.id].name)} · ${shopName(spot.i)}</div><p>“${esc(C.personById[spot.id].quit)}”</p></div>` : ""}
    </div></div>
    <div class="row" style="justify-content:center;margin-top:14px"><button class="btn main" id="nx">${last ? "Final results →" : `Open Month ${r + 2} →`}</button></div>`;
  $("#nx").onclick = () => last ? hostSet({ ...st, phase: "end" }) : hostSet({ ...st, phase: "plan", r: r + 1, endsAt: Date.now() + H.meta.secs * 1000, prog: {} });
  K.fit();
}
function hostEnd() {
  if (H.rq === "end") return; H.rq = "end";
  const st = H.state, shim = { state: { tot: {} }, players: {} };
  st.groups.forEach((g, i) => { if (!g.length) return; shim.state.tot["g" + i] = st.shops[i].total; shim.players["g" + i] = { name: g.map(p => K.nameOf(H, p)).join(" & ") }; });
  K.finale(shim, "Keep the Crew · Final", "Top 5 Shops", classResults, hostErase, () => { cleanupHost(); home(); });
}
function scatter(pts) {
  const W = 560, Hh = 300, L = 54, R = 16, T = 14, B = 44;
  const xs = pts.map(p => p.x), xmin = 0, xmax = Math.max(1000, ...xs) * 1.08;
  const x = v => L + (W - L - R) * ((v - xmin) / (xmax - xmin)), y = v => T + (Hh - T - B) * (1 - v / 100);
  let g = "";
  [0, 25, 50, 75, 100].forEach(v => g += `<line class="gl" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`);
  const step = xmax > 8000 ? 2000 : 1000; for (let v = 0; v <= xmax; v += step) g += `<text x="${x(v)}" y="${Hh - 24}" text-anchor="middle">$${v / 1000}k</text>`;
  g += `<line class="ax" x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}"/><line class="ax" x1="${L}" x2="${L}" y1="${T}" y2="${y(0)}"/>`;
  g += `<text class="at" x="${(L + W - R) / 2}" y="${Hh - 4}" text-anchor="middle">Total spent on the crew</text><text class="at" transform="translate(14 ${(T + Hh - B) / 2}) rotate(-90)" text-anchor="middle">Final morale</text>`;
  pts.forEach(p => g += `<circle class="dot" cx="${x(p.x)}" cy="${y(p.y)}" r="9"/><text class="dl" x="${x(p.x)}" y="${y(p.y) + 4}" text-anchor="middle" fill="#fff">${p.l}</text>`);
  return `<svg class="scatter" viewBox="0 0 ${W} ${Hh}">${g}</svg>`;
}
// what each move did: final morale of shops that made it vs shops that didn't
function impact(st, live) {
  return C.ACTIONS.map(a => { const yes = live.filter(i => st.shops[i].buys[a.id]), no = live.filter(i => !st.shops[i].buys[a.id]);
    const fm = i => st.shops[i].hist[st.shops[i].hist.length - 1].avg, av = arr => arr.length ? Math.round(arr.reduce((s, i) => s + fm(i), 0) / arr.length) : null;
    return { a, n: yes.length, yes: av(yes), no: av(no) }; }).filter(x => x.n).sort((p, q) => ((q.yes ?? 0) - (q.no ?? q.yes ?? 0)) - ((p.yes ?? 0) - (p.no ?? p.yes ?? 0)));
}
function csv(st) {
  const live = st.groups.map((g, i) => i).filter(i => st.groups[i].length);
  const rows = [["Name", "Partner", "Shop", "Points", "Profit", "Total spent", "Crew kept", "Final morale", "Labels right", "Labels total", "Label %"]];
  live.forEach(i => { const s = st.shops[i], g = st.groups[i], last = s.hist[s.hist.length - 1];
    const lr = s.hist.reduce((t, h) => t + h.lab.right, 0), lt = s.hist.reduce((t, h) => t + h.lab.total, 0);
    g.forEach(p => rows.push([K.nameOf(H, p), g.filter(q => q !== p).map(q => K.nameOf(H, q)).join(" & "), shopName(i), s.total, s.profit, s.spent || 0, s.crew.filter(c => !c.quit).length, last ? last.avg : "", lr, lt, lt ? Math.round(100 * lr / lt) : ""])); });
  return rows.map(r => r.map(v => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v).join(",")).join("\n");
}
function classResults() {
  document.body.classList.remove("finale-on");
  const st = H.state, live = st.groups.map((g, i) => i).filter(i => st.groups[i].length);
  const pts = live.map(i => ({ x: st.shops[i].spent || 0, y: st.shops[i].hist[st.shops[i].hist.length - 1].avg, l: i + 1 }));
  const imp = impact(st, live), quitBy = {}; live.forEach(i => st.shops[i].crew.forEach(c => { if (c.quit) quitBy[c.id] = (quitBy[c.id] || 0) + 1; }));
  const ranked = live.slice().sort((a, b) => st.shops[b].total - st.shops[a].total);
  app.innerHTML = `<div class="rep"><h2>Class results</h2><div class="endgrid">
    <div class="skills"><div class="skh">Did spending more buy more morale?</div>${scatter(pts)}<p class="note">Each dot is a shop (number = shop). Ask: which shops spent the least and still kept a happy crew? What did they buy?</p>
      <div class="skh" style="margin-top:10px">Who quit, across the class</div>
      ${Object.keys(quitBy).length ? `<div class="poplist">${C.PEOPLE.filter(p => quitBy[p.id]).map(p => `<div><span>${esc(p.name)} <small>${esc(p.maslow)} need</small></span><div class="pbar"><i style="width:${Math.max(4, 100 * quitBy[p.id] / live.length)}%"></i></div><b>${quitBy[p.id]}</b></div>`).join("")}</div><p class="note">Number of shops where each person quit.</p>` : "<p class='note'>Nobody quit in any shop. Strong class.</p>"}
      <div class="skh" style="margin-top:10px">Debrief</div>
      <ol class="debrief"><li>Which shops fixed the basics first (AC, pay, security)? How did their morale compare once they added motivators?</li>
        <li>Bonuses and pizza parties made morale jump for a month. Why didn't it last?</li>
        <li>Who quit most often? Which Maslow need was that person missing?</li>
        <li>Find a free move that worked. Why can a $0 move beat a $900 one?</li></ol></div>
    <div class="skills"><div class="skh">What each move did</div>
      <table class="htab small"><tr><th>Move</th><th>Shops</th><th>Final morale with it</th><th>Without it</th></tr>
        ${imp.map(x => `<tr><td>${esc(x.a.name)}<small>${x.a.h ? "Hygiene" : "Motivator"} · ${x.a.e ? "Extrinsic" : "Intrinsic"}</small></td><td>${x.n}</td><td><b>${x.yes ?? "-"}</b></td><td>${x.no ?? "-"}</td></tr>`).join("")}</table>
      <div class="skh" style="margin-top:10px">Final standings</div><ol class="stand">${ranked.map(i => `<li><span>${shopName(i)}: ${esc(st.groups[i].map(p => K.nameOf(H, p)).join(" & "))}</span><em>${num(st.shops[i].total)}</em></li>`).join("")}</ol></div></div>
    <div class="row" style="justify-content:center;margin-top:14px"><button class="btn main" id="pod">Back to Top 5</button><button class="btn" id="csv">Download scores (CSV)</button><button class="btn" id="erase">Erase game</button></div></div>`;
  $("#pod").onclick = () => { H.rq = null; hostEnd(); }; $("#erase").onclick = hostErase;
  $("#csv").onclick = () => { const b = new Blob([csv(st)], { type: "text/csv" }), a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `keep-the-crew-${H.code}.csv`; a.click(); };
  K.fit();
}
function cleanupHost() { K.stopTick(); if (H && H.off) H.off(); }
async function hostErase() { if (!H) return home(); cleanupHost(); try { await H.N.remove("games/" + H.code); } catch (e) {} H = null; home(); }

/* ============================================================ STUDENT */
let ME = null;
const SESS = K.sess("crewSession");
function stuStart() {
  app.innerHTML = `${hdr()}<div class="doors two">
    <button class="door" id="live"><span class="tag">In class</span><b>Join the class game</b><span>Your teacher has a code on the board. You'll get a partner and run a shop together.</span></button>
    <button class="door" id="solo"><span class="tag">On your own</span><b>Play solo</b><span>Missed class? Run all six months on your own, then print your Shop Report and write the memo.</span></button></div>`;
  $("#live").onclick = stuJoin; $("#solo").onclick = soloStart;
  if (/[?&]code=\d{4}/.test(location.search)) stuJoin();
}
async function stuJoin() {
  const N = await K.net("crewMock").catch(() => null); if (!N) return K.needSetup(hdr());
  K.joinForm({ N, game: GAME, title: "Keep the Crew", sessKey: "crewSession", hdr: hdr(), onJoined: ctx => {
    if (ME && ME.off) ME.off();
    ME = { N, ...ctx, kc: { ...((ctx.rec && ctx.rec.kc) || {}) }, st: null, rq: null };
    ME.off = N.on(`games/${ctx.code}/state`, s => { if (!ME) return; if (!s) return gameGone(); ME.st = s; stuRender(); });
  } });
}
function gameGone() { K.stopTick(); if (ME && ME.off) ME.off(); ME = null; SESS.clear();
  app.innerHTML = `<div class="wait"><h2>The game has ended</h2><p>Your teacher closed this game.</p><button class="btn main" id="h">OK</button></div>`; $("#h").onclick = home; }
const mateNames = st => { const g = st.groups[K.groupOf(st, ME.pid)] || []; return g.filter(p => p !== ME.pid).map(p => (st.names || {})[p] || "a teammate"); };
function stuRender() {
  const M = ME, st = M.st; if (!st) return;
  const gi = st.groups ? K.groupOf(st, M.pid) : -1;
  const key = st.phase + "|" + st.r + "|" + gi + (st.phase === "seat" ? JSON.stringify(st.groups) : "");
  if (key === M.rq) { if (st.phase === "plan") planSync(); return; }
  M.rq = key;
  if (st.phase === "lobby") { app.innerHTML = `<div class="wait"><h2>You're in, ${esc(M.name)}!</h2><p>Watch the board. Your teacher will pair everyone up.</p></div>`; return; }
  if (gi < 0) { K.stopTick(); app.innerHTML = `<div class="wait"><h2>You're in, ${esc(M.name)}</h2><p>Hang on. Your teacher's screen will put you in a shop in a few seconds.</p></div>`; return; }
  const shop = st.shops[gi];
  if (st.phase === "seat") {
    const mates = mateNames(st);
    app.innerHTML = `<div class="wait seat"><div class="kick">${shopName(gi)}</div><p>${mates.length > 1 ? "Your partners" : "Your partner"}</p>
      <div class="tablebig mate">${mates.length ? esc(andList(mates)) : "Solo"}</div><p>Find them and sit together. You'll run this shop together for all six months. One device is enough, but any of you can tap.</p></div>`;
    return;
  }
  if (st.phase === "plan") { M.pick = mergedPick(); return drawPlan(true); }
  K.stopTick();
  if (st.phase === "reveal") {
    const last = st.r >= C.MONTHS - 1;
    app.innerHTML = `<div class="kick">${shopName(gi)} · Month ${st.r + 1} results</div><h2 class="mh">${last ? "Six months done" : "How your crew reacted"}</h2>
      ${resultHTML(shop)}${crewHTML(shop, { result: true })}
      <p class="note" style="text-align:center;margin-top:12px">${last ? "Watch the board for the final results. Your Shop Report comes next." : `Watch the board. Next month: ${esc(C.EVENTS[st.r + 1].head)}.`}</p>`;
    return;
  }
  if (st.phase === "end") {
    const g = st.groups[gi].map(p => (st.names || {})[p] || "?");
    app.innerHTML = reportHTML(shop, `Managers: ${andList(g)}`, { shop: `Sole Revival ${shopName(gi)}` });
    bindPrint();
  }
}
function mergedPick() {
  const st = ME.st, gi = K.groupOf(st, ME.pid), mine = ME.kc[st.r] || null, grp = st.prog && st.prog[gi];
  if (grp && (!mine || (grp.at || 0) > (mine.at || 0))) return { ...grp };
  return mine ? { ...mine } : { a: [], l: {} };
}
function planSync() { const p = mergedPick(); if (JSON.stringify(p) !== JSON.stringify(ME.pick)) { ME.pick = p; drawPlan(false); } }
function savePick(patch) {
  const r = ME.st.r; ME.pick = { ...ME.pick, ...patch, at: Date.now() }; ME.kc[r] = ME.pick;
  ME.N.update(`games/${ME.code}/players/${ME.pid}`, { ["kc/" + r]: ME.pick }).catch(() => {});
  drawPlan(false);
}
function planHTML(shop, pick, o) {
  return `<div class="kick">${esc(o.kick)}</div>${o.timer ? K.timerHTML(o.secs) : ""}
    ${newsHTML(shop.m)}${statHTML(shop)}
    <div class="dash">${surveyHTML(shop)}<div><div class="skh">Your crew</div>${crewHTML(shop)}</div></div>
    ${pickerHTML(shop, pick, { solo: o.solo })}`;
}
function drawPlan(fresh) {
  const M = ME, st = M.st, gi = K.groupOf(st, M.pid), shop = st.shops[gi], mates = mateNames(st);
  const y = window.scrollY;
  app.innerHTML = planHTML(shop, M.pick, { kick: `${shopName(gi)} · Month ${st.r + 1} of ${C.MONTHS}${mates.length ? ` · with ${andList(mates)}` : ""}`, timer: true, secs: M.meta.secs });
  K.startTimer(app, M.meta.secs, st.endsAt, () => {});
  bindPicker(shop, () => ME.pick, savePick);
  const lk = $("#lock"); if (lk) lk.onclick = () => savePick({ lock: true });
  const ul = $("#unlock"); if (ul) ul.onclick = () => savePick({ lock: false });
  if (!fresh) window.scrollTo(0, y);
}

/* ============================================================ SOLO */
let SOLO = null;
const SOLO_KEY = "crewSolo";
function soloStart() {
  let saved = null; try { saved = JSON.parse(localStorage.getItem(SOLO_KEY) || "null"); } catch (e) {}
  app.innerHTML = `${hdr()}<div class="panel"><h2>Play solo</h2><p>Run your own Sole Revival shop for six months. No code needed. At the end you'll print your Shop Report for the Exit Interview Memo.</p>
    <input class="field" id="nm" maxlength="30" placeholder="Your first and last name" value="${saved ? esc(saved.name) : ""}">
    <div class="err" id="er"></div><div class="row"><button class="btn main" id="go">${saved && saved.shop.m > 0 ? "Start over" : "Start"}</button>${saved && saved.shop.m > 0 ? `<button class="btn" id="cont">Continue (Month ${Math.min(saved.shop.m + 1, C.MONTHS)})</button>` : ""}<button class="btn" id="back">Back</button></div></div>`;
  $("#back").onclick = home;
  $("#go").onclick = () => { const name = $("#nm").value.trim().slice(0, 30); if (!name) { $("#er").textContent = "Type your name so it prints on your report."; return; }
    SOLO = { name, shop: C.newShop(), pick: { a: [], l: {} }, view: "plan" }; soloSave(); soloDraw(); };
  const c = $("#cont"); if (c) c.onclick = () => { SOLO = saved; soloDraw(); };
}
function soloSave() { try { localStorage.setItem(SOLO_KEY, JSON.stringify(SOLO)); } catch (e) {} }
function soloDraw() {
  const S = SOLO, shop = S.shop; window.scrollTo(0, 0);
  $("#who").textContent = S.name; $("#who").hidden = false;
  if (shop.m >= C.MONTHS && S.view !== "result") { app.innerHTML = reportHTML(shop, `Manager: ${S.name} (solo)`, { shop: "Sole Revival Solo Shop", extra: `<button class="btn" id="again">Play again</button>` });
    bindPrint(); $("#again").onclick = () => { SOLO = { name: S.name, shop: C.newShop(), pick: { a: [], l: {} }, view: "plan" }; soloSave(); soloDraw(); }; return; }
  if (S.view === "result") {
    app.innerHTML = `<div class="kick">Solo shop · Month ${shop.m} results</div><h2 class="mh">How your crew reacted</h2>${resultHTML(shop)}${crewHTML(shop, { result: true })}
      <div class="row" style="justify-content:center;margin-top:14px"><button class="btn main" id="nx">${shop.m >= C.MONTHS ? "See my Shop Report →" : `Month ${shop.m + 1} →`}</button></div>`;
    $("#nx").onclick = () => { S.view = "plan"; soloSave(); soloDraw(); }; return;
  }
  const y = window.scrollY;
  app.innerHTML = planHTML(shop, S.pick, { kick: `Solo shop · Month ${shop.m + 1} of ${C.MONTHS}`, solo: true });
  const set = patch => { S.pick = { ...S.pick, ...patch }; soloSave(); const yy = window.scrollY; soloDraw(); window.scrollTo(0, yy); };
  bindPicker(shop, () => S.pick, set);
  const lk = $("#lock"); if (lk) lk.onclick = () => { S.shop = C.step(shop, S.pick); S.pick = { a: [], l: {} }; S.view = "result"; soloSave(); soloDraw(); };
  window.scrollTo(0, y);
}

function home() { K.stopTick(); document.body.classList.remove("wide", "finale-on"); app.style.zoom = ""; $("#who").hidden = true; ROLE === "teacher" ? hostSetup() : stuStart(); }
home();
