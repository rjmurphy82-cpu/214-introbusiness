// =====================================================================
// BUILD THE LINEUP: shared screens for the team desk and teacher console
// =====================================================================
import { teamName } from "./teams.js";
import { COMPANIES, companyById, LETTERS, MUST, NICE, ROUNDS, tier, unitCost, scoreVersion, scoreLineup, bestLineup, bestSingle, bestVersion, pctOfBest, versionNotes, esc, money, moneyExact } from "./model.js";
export * from "./model.js";

export const REFLECT = [
  "Which version earned the most profit? What about that segment made it work?",
  "What did you change between Launch 1 and Launch 2, and why?",
  "What would stop a customer in your most expensive segment from just buying your cheapest version?"
];

const dollars = v => moneyExact(v);
const segLabel = si => `Segment ${LETTERS[si]}`;
const verName = (v, si) => (v && v.n) || `Version ${LETTERS[si]}`;

export function roundBar(game) {
  if (!game || game.mode === "self") return "";
  return Array.from({ length: ROUNDS }, (_, r) => {
    const done = game.phase === "final" || r < game.round || (r === game.round && game.phase === "revealed");
    const on = game.phase === "open" && game.round === r;
    return `<i class="${on ? "on" : done ? "done" : ""}">Launch ${r + 1}</i>`;
  }).join("");
}

export function rulesHTML() {
  return `<ol class="rules">
    <li><span>The market has <b>three segments</b>. Build <b>one version of the product for each</b>: pick its features and its price.</span></li>
    <li><span><b>Unit cost</b> = base cost + the cost of every feature you add.</span></li>
    <li><span><b>Must-have</b>: 60% or more of a segment requires it. Leave one out and that segment’s buyers are <b>cut in half</b>.</span></li>
    <li><span><b>Nice-to-have</b>: 30% to 59%. Each one you include adds <b>5%</b> more buyers. Under 30% only adds cost.</span></li>
    <li><span><b>Buyers</b> = segment size × % who would buy at your price × Fit. <b>Profit</b> = buyers × (price − unit cost).</span></li>
    <li><span>You get <b>two launches</b>. See how Launch 1 did, then fix your lineup for Launch 2.</span></li>
  </ol>`;
}

/* ---------- the case file ---------- */
const meter = (v, cls = "") => `<span class="meterbar ${cls}"><span style="width:${v}%"></span><i style="left:${NICE}%"></i><i style="left:${MUST}%"></i></span>`;

export function segCardsHTML(co) {
  return `<div class="grid3">${co.segs.map((s, si) => `<div class="segcard seg${si}"><span class="tag">${segLabel(si)} · ${s.size.toLocaleString()} potential customers</span>
    <ul class="facts">${s.bullets.map(b => `<li>${esc(b)}</li>`).join("")}</ul><p class="quote">“${esc(s.quote)}”</p></div>`).join("")}</div>`;
}

export function featureTableHTML(co) {
  return `<div class="tablewrap"><table class="survey"><thead><tr><th>Feature</th><th class="r">Cost</th>${co.segs.map((_, si) => `<th>${segLabel(si)}</th>`).join("")}</tr></thead><tbody>
    ${co.feats.map(f => `<tr><td><b>${esc(f.name)}</b><div class="muted" style="font-size:14px">${esc(f.desc)}</div></td><td class="r num">${dollars(f.cost)}</td>
      ${f.pct.map(p => `<td class="pctcell"><span class="num">${p}%</span>${meter(p)}</td>`).join("")}</tr>`).join("")}
  </tbody></table></div>
  <p class="muted" style="font-size:14px;margin:8px 0 0">The two tick marks on each bar are the 30% and 60% lines.</p>`;
}

export function priceTableHTML(co) {
  return `<div class="tablewrap"><table class="survey"><thead><tr><th>Price (${esc(co.unit)})</th>${co.prices.map(p => `<th class="r">${dollars(p)}</th>`).join("")}</tr></thead><tbody>
    ${co.segs.map((s, si) => `<tr><td><b>${segLabel(si)}</b></td>${s.wtp.map(v => `<td class="r num heat" style="--h:${(v / 100 * 0.85).toFixed(2)};color:${v >= 55 ? "#fff" : "var(--ink)"}">${v}%</td>`).join("")}</tr>`).join("")}
  </tbody></table></div>`;
}

export function briefHTML(co) {
  return `<div class="stack">
  <div class="hero">
    <div class="stack" style="gap:10px">
      <span class="eyebrow">Case file · ${esc(co.industry)}</span>
      <h2 style="font-size:clamp(30px,4.4vw,46px)">${esc(co.name)}</h2>
      <p class="lede">${esc(co.about)}</p>
    </div>
    <div class="stack" style="gap:12px">
      <div class="owner"><span class="eyebrow">Your job</span><p>Build three versions of our ${esc(co.product)}, one for each segment. Choose the features and set the price. Most total profit wins.</p></div>
      <div class="panel"><h3>Product basics</h3><div class="prices"><span>Base cost of every version</span><b>${dollars(co.base)}</b><span>Price options (${esc(co.unit)})</span><b>${co.prices.map(dollars).join(" · ")}</b></div></div>
    </div>
  </div>
  <div><span class="eyebrow">Step 1</span><h2>Meet the three segments</h2></div>
  ${segCardsHTML(co)}
  <div><span class="eyebrow">Step 2</span><h2>What does each segment require?</h2>
    <p class="lede" style="margin-top:6px">Percent of each segment who said “I would only buy it if it had this.”</p></div>
  <div class="panel">${featureTableHTML(co)}</div>
  <div><span class="eyebrow">Step 3</span><h2>What will each segment pay?</h2>
    <p class="lede" style="margin-top:6px">Percent of each segment who would buy at each price, if the product had everything they need.</p></div>
  <div class="panel">${priceTableHTML(co)}</div>
  </div>`;
}

/* ---------- the builder ---------- */
export const emptyLineup = () => LETTERS.map(() => ({ f: [], p: null, n: "" }));

export function builderHTML(co, draft, seg, opts = {}) {
  const v = draft[seg], cost = unitCost(co, v.f), s = co.segs[seg];
  const tabs = `<div class="vtabs" role="tablist">${draft.map((d, si) => `<button role="tab" aria-selected="${si === seg}" data-seg="${si}" class="${d.p !== null ? "set" : ""}">
      <b><span class="full">Segment </span>${LETTERS[si]}</b><span>${d.p !== null ? `${dollars(co.prices[d.p])} · ${d.f.length} feature${d.f.length === 1 ? "" : "s"}` : "Not priced yet"}</span></button>`).join("")}</div>`;
  const feats = co.feats.map((f, fi) => { const on = v.f.includes(fi); return `<label class="feat ${on ? "on" : ""}" for="ft${fi}">
      <input type="checkbox" id="ft${fi}" data-feat="${fi}" ${on ? "checked" : ""}>
      <span class="fn"><b>${esc(f.name)}</b><small>${esc(f.desc)}</small></span>
      <span class="fs">${meter(f.pct[seg], "sm")}<span class="num">${f.pct[seg]}%</span></span>
      <span class="fc num">+${dollars(f.cost)}</span></label>`; }).join("");
  const prices = co.prices.map((p, pi) => { const margin = p - cost; return `<button class="pbtn ${v.p === pi ? "on" : ""}" data-price="${pi}" aria-pressed="${v.p === pi}">
      <b>${dollars(p)}</b><span>${s.wtp[pi]}% would buy</span><span class="${margin <= 0 ? "neg" : ""}">${margin <= 0 ? "loses" : "keeps"} ${dollars(Math.abs(Math.round(margin * 100) / 100))}/unit</span></button>`; }).join("");
  return `${tabs}
    <div class="builder">
      <div class="stack" style="gap:10px">
        <div class="segmini seg${seg}"><span class="eyebrow">${segLabel(seg)} · ${s.size.toLocaleString()} potential customers</span>
          <p style="margin:4px 0 0">${s.bullets.map(esc).join(" · ")}</p><p class="quote" style="margin-top:6px">“${esc(s.quote)}”</p></div>
        <label for="vname" class="vname"><span>Version name <span class="muted">(optional)</span></span><input type="text" id="vname" maxlength="24" value="${esc(v.n)}" placeholder="${esc("Version " + LETTERS[seg])}" autocomplete="off"></label>
        <div><div class="row" style="justify-content:space-between"><h3 style="margin:0">Features</h3><span class="muted" style="font-size:14px">% of ${segLabel(seg)} who require it</span></div>
          <div class="feats">${feats}</div></div>
      </div>
      <div class="stack" style="gap:10px">
        <div class="costbox"><div><span class="eyebrow">Unit cost</span><div class="big">${dollars(cost)}</div></div>
          <p class="muted" style="margin:0;font-size:15px">${dollars(co.base)} base${v.f.length ? " + " + v.f.map(fi => dollars(co.feats[fi].cost)).join(" + ") : ""}</p></div>
        <div><h3 style="margin:0 0 6px">Price</h3><div class="prices6">${prices}</div></div>
        ${opts.after || ""}
      </div>
    </div>`;
}

export const lineupComplete = d => d.every(v => v.p !== null);

/* ---------- results for one team ---------- */
export function versionResultHTML(co, si, ver, opts = {}) {
  const r = scoreVersion(co, si, ver), notes = versionNotes(co, si, r);
  return `<div class="panel vres seg${si}">
    <span class="eyebrow">${segLabel(si)}</span><h3 style="margin:2px 0 6px">${esc(verName(ver, si))}</h3>
    <div class="vnums"><div><span>Price</span><b>${dollars(r.price)}</b></div><div><span>Cost</span><b>${dollars(r.cost)}</b></div><div><span>% buy</span><b>${r.pct}%</b></div><div><span>Fit</span><b>${Math.round(r.fit * 100)}%</b></div><div><span>Buyers</span><b>${r.buyers.toLocaleString()}</b></div></div>
    <div class="vprofit ${r.profit < 0 ? "neg" : ""}">${dollars(r.profit)}<small>profit</small></div>
    <p class="muted" style="font-size:14px;margin:0 0 8px">${r.feats.length ? r.feats.map(f => esc(co.feats[f].name)).join(", ") : "No added features"}</p>
    ${opts.notes === false ? "" : `<ul class="notes">${notes.map(n => `<li class="${n.bad ? "bad" : n.good ? "good" : ""}">${esc(n.t)}</li>`).join("")}</ul>`}
    ${opts.best ? `<p class="bestline">Best possible for this segment: <b>${dollars(bestVersion(co, si).profit)}</b></p>` : ""}
  </div>`;
}

export function lineupResultHTML(co, lineup, opts = {}) {
  const s = scoreLineup(co, lineup);
  return `<div class="grid3">${lineup.map((v, si) => versionResultHTML(co, si, v, opts)).join("")}</div>`;
}

export function bestLineupHTML(co) {
  const b = bestLineup(co), one = bestSingle(co);
  return `<div class="panel"><span class="eyebrow">The answer key</span><h3>Best possible lineup: ${dollars(b.total)}</h3>
    <div class="tablewrap"><table><thead><tr><th>Segment</th><th>Features</th><th class="r">Unit cost</th><th class="r">Price</th><th class="r">Buyers</th><th class="r">Profit</th></tr></thead><tbody>
    ${b.vers.map((v, si) => `<tr><td><b>${segLabel(si)}</b></td><td>${v.feats.length ? v.feats.map(f => esc(co.feats[f].name)).join(", ") : "No added features"}</td><td class="r num">${dollars(v.cost)}</td><td class="r num">${dollars(v.price)}</td><td class="r num">${v.buyers.toLocaleString()}</td><td class="r num">${dollars(v.profit)}</td></tr>`).join("")}
    </tbody></table></div>
    <p style="margin:12px 0 0">One version for everyone could only reach <b>${dollars(one.total)}</b> (${one.f.length ? one.f.map(f => esc(co.feats[f].name)).join(", ") : "no added features"} at ${dollars(one.price)}). Three versions earn <b>${Math.round((b.total / one.total - 1) * 100)}% more</b>.</p></div>`;
}

/* ---------- live mode screens ---------- */
function rankRows(game, res) {
  return game.teams.map(id => ({ id, ...(res.teams[id] || { missing: true, total: 0 }) })).sort((a, b) => b.total - a.total);
}

export function resultsHTML(game, res, me) {
  const co = companyById(game.company), r = res.round, order = rankRows(game, res);
  const played = order.filter(t => !t.missing);
  const missRate = co.segs.map((_, si) => played.length ? Math.round(played.filter(t => scoreVersion(co, si, t.lineup[si]).missing.length).length / played.length * 100) : 0);
  const wasteRate = co.segs.map((_, si) => played.length ? Math.round(played.filter(t => scoreVersion(co, si, t.lineup[si]).wasted.length).length / played.length * 100) : 0);
  return `<div class="stack">
  <div><span class="eyebrow">Launch ${r + 1} results · ${esc(co.name)}</span><h2>Whose lineup made the most?</h2></div>
  <div class="panel tablewrap reveal"><table class="lb"><thead><tr><th></th><th>Team</th>${co.segs.map((_, si) => `<th class="r">${segLabel(si)}</th>`).join("")}<th class="r">Total profit</th><th class="r">% of best</th></tr></thead><tbody>
  ${order.map((t, k) => `<tr class="${t.id === me ? "me" : k === 0 ? "top" : ""}"><td class="rank">${k + 1}</td><td><b>${esc(teamName(t.id))}</b>${t.missing ? ' <span class="pill no">No launch</span>' : ""}</td>
    ${co.segs.map((_, si) => `<td class="r num">${t.missing ? "—" : money(t.profits[si])}</td>`).join("")}<td class="r num" style="font-size:21px">${money(t.total)}</td><td class="r num">${pctOfBest(co, t.total)}%</td></tr>`).join("")}
  </tbody></table></div>
  <div class="panel reveal"><span class="eyebrow">Where the class lost money</span><h3>Mistakes by segment</h3>
    <div class="tablewrap"><table><thead><tr><th></th>${co.segs.map((_, si) => `<th class="r">${segLabel(si)}</th>`).join("")}</tr></thead><tbody>
      <tr><td>Teams that left out a must-have</td>${missRate.map(v => `<td class="r num" style="font-size:20px">${v}%</td>`).join("")}</tr>
      <tr><td>Teams that paid for features nobody wanted</td>${wasteRate.map(v => `<td class="r num" style="font-size:20px">${v}%</td>`).join("")}</tr>
    </tbody></table></div></div>
  </div>`;
}

export function standingsHTML(game, results, me) {
  const done = results.filter(Boolean);
  if (!done.length) return `<p class="muted">No launches yet. Standings appear after Launch 1.</p>`;
  const co = companyById(game.company);
  const rows = game.teams.map(id => ({ id, per: done.map(r => r.teams[id] ? r.teams[id].total : 0) })).map(t => ({ ...t, total: t.per.reduce((a, b) => a + b, 0) })).sort((a, b) => b.total - a.total);
  return `<div class="tablewrap"><table class="lb"><thead><tr><th></th><th>Team</th>${done.map(r => `<th class="r">Launch ${r.round + 1}</th>`).join("")}${done.length > 1 ? `<th class="r">Change</th>` : ""}<th class="r">Total profit</th></tr></thead><tbody>
  ${rows.map((t, k) => `<tr class="${t.id === me ? "me" : k === 0 ? "top" : ""}"><td class="rank">${k + 1}</td><td><b>${esc(teamName(t.id))}</b></td>${t.per.map(v => `<td class="r num">${money(v)}</td>`).join("")}
    ${done.length > 1 ? `<td class="r num ${t.per[1] >= t.per[0] ? "up" : "down"}">${t.per[1] >= t.per[0] ? "+" : "−"}${money(Math.abs(t.per[1] - t.per[0]))}</td>` : ""}<td class="r num" style="font-size:21px">${money(t.total)}</td></tr>`).join("")}
  </tbody></table></div>`;
}

export function finalHTML(game, results, me) {
  const co = companyById(game.company), done = results.filter(Boolean);
  const rows = game.teams.map(id => ({ id, total: done.reduce((a, r) => a + (r.teams[id] ? r.teams[id].total : 0), 0), last: done.length ? (done[done.length - 1].teams[id] || {}).total || 0 : 0 })).sort((a, b) => b.total - a.total);
  return `<div class="stack">
  <div><span class="eyebrow">${esc(co.name)} · Two launches</span><h2>Final standings</h2></div>
  <div class="podium">${rows.slice(0, 3).map((t, k) => `<div class="p ${k === 0 ? "first" : ""} reveal"><span class="eyebrow">${["1st place", "2nd place", "3rd place"][k]}</span><div style="font-family:var(--display);font-size:24px;text-transform:uppercase;color:var(--brown);margin:4px 0">${esc(teamName(t.id))}</div><div class="big">${money(t.total)}</div><p class="muted" style="margin:6px 0 0">Launch 2 reached ${pctOfBest(co, t.last)}% of the best possible</p></div>`).join("")}</div>
  <div class="panel">${standingsHTML(game, results, me)}</div>
  ${bestLineupHTML(co)}
  <div class="panel"><span class="eyebrow">Talk it over</span><h3>Debrief</h3><ol class="rules">
    <li><span>Which segment was the easiest to price? Which one punished a wrong price the most?</span></li>
    <li><span>Why didn’t putting every feature in every version make the most money?</span></li>
    <li><span>Why does three versions beat one version sold to everyone?</span></li>
    <li><span>What would stop a premium customer from buying your cheapest version? (That’s called cannibalization.)</span></li>
  </ol></div></div>`;
}

/* ---------- self-paced: progress and the report ---------- */
// prog = { companies: { [id]: { rounds: [{ lineup, profits, total, why }], reflect: [3] } }, sentAt }
export function coStats(co, entry) {
  const rounds = (entry && entry.rounds) || [];
  const last = rounds.length ? rounds[rounds.length - 1].total : 0;
  const bestRun = rounds.length ? Math.max(...rounds.map(r => r.total)) : 0;
  return { rounds, done: rounds.length, last, pct: rounds.length ? pctOfBest(co, bestRun) : 0, finished: rounds.length >= ROUNDS && entry && Array.isArray(entry.reflect) };
}
export function progressSummary(game, prog) {
  const stats = (game.companies || []).map(companyById).map(co => ({ co, ...coStats(co, prog && prog.companies && prog.companies[co.id]) }));
  const fin = stats.filter(s => s.finished);
  return { stats, finishedCount: fin.length, total: stats.length, avg: fin.length ? Math.round(fin.reduce((a, s) => a + s.pct, 0) / fin.length) : null };
}

export function coReportHTML(co, entry) {
  const st = coStats(co, entry);
  if (!st.done) return `<div class="panel"><span class="eyebrow">${esc(co.industry)}</span><h3>${esc(co.name)}</h3><p class="muted" style="margin:0">Not started.</p></div>`;
  return `<div class="panel stack" style="gap:10px">
    <div class="row" style="justify-content:space-between"><div><span class="eyebrow">${esc(co.industry)}</span><h3 style="margin:0">${esc(co.name)}</h3></div>
      <div style="text-align:right"><div class="num" style="font-size:24px">${st.pct}% of best</div><div class="muted" style="font-size:14px">${st.finished ? "Finished" : `${st.done} of ${ROUNDS} launches`}</div></div></div>
    <div class="tablewrap"><table><thead><tr><th>Launch</th>${co.segs.map((_, si) => `<th>${segLabel(si)}</th>`).join("")}<th class="r">Total profit</th><th>Their reasoning</th></tr></thead><tbody>
      ${st.rounds.map((r, k) => `<tr><td><b>${k + 1}</b></td>${r.lineup.map((v, si) => `<td style="min-width:150px;font-size:14px"><b>${esc(verName(v, si))}</b> · ${dollars(co.prices[v.p])}<div class="muted">${v.f.length ? v.f.map(f => esc(co.feats[f].name)).join(", ") : "No added features"}</div><div class="num">${dollars(r.profits[si])}</div></td>`).join("")}
        <td class="r num" style="font-size:19px">${dollars(r.total)}</td><td style="min-width:200px;font-size:15px">${esc(r.why)}</td></tr>`).join("")}
    </tbody></table></div>
    <p class="muted" style="margin:0;font-size:14px">Best possible lineup: ${dollars(bestLineup(co).total)}</p>
    ${entry && Array.isArray(entry.reflect) ? `<div class="stack" style="gap:8px">${REFLECT.map((q, i) => `<div><b style="font-size:15px">${esc(q)}</b><p style="margin:2px 0 0">${esc(entry.reflect[i] || "")}</p></div>`).join("")}</div>` : ""}
  </div>`;
}

export function reportHTML(game, teamId, prog, members) {
  const sum = progressSummary(game, prog);
  const sent = prog && prog.sentAt ? new Date(prog.sentAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : null;
  const started = sum.stats.filter(s => s.done);
  return `<div class="report stack">
    <div class="panel" style="border-top:6px solid var(--orange)">
      <span class="eyebrow">Segmentation report · ${esc(game.name)}</span>
      <h2 style="margin:4px 0">${esc(teamName(teamId))}</h2>
      ${members && members.length ? `<p class="muted" style="margin:0">Team: ${esc(members.join(", "))}</p>` : ""}
      <div class="row" style="gap:28px;margin-top:12px">
        <div><div class="big">${sum.finishedCount}/${sum.total}</div><div class="muted">companies finished</div></div>
        <div><div class="big">${sum.avg === null ? "—" : sum.avg + "%"}</div><div class="muted">average of best possible</div></div>
        <div><div class="big" style="font-size:clamp(20px,3vw,28px)">${sent ? "Sent" : "Not sent"}</div><div class="muted">${sent ? esc(sent) : "to the teacher yet"}</div></div>
      </div>
    </div>
    ${started.length ? started.map(s => coReportHTML(s.co, prog.companies[s.co.id])).join("") : `<p class="muted">No companies started yet.</p>`}
  </div>`;
}
