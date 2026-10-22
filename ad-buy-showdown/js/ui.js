// Ad Buy Showdown: screens shared by the student page and the teacher console.
import { PLATFORMS, SEGMENTS, GEOS, OBJECTIVES, FORMATS, FMT_FIT, ROUNDS, NROUNDS, platformById, segById, geoById, objById, fmtById, audienceFor, totalAudience, totalSpend } from "./model.js";

export const $ = s => document.querySelector(s);
export const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const money = (n, d = 0) => (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
export const int = n => Math.round(n || 0).toLocaleString();
export const short = n => n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(n >= 1e5 ? 0 : 1) + "K" : String(Math.round(n));
export const pct = (n, d = 2) => (n * 100).toFixed(d) + "%";
const sign = n => n >= 0 ? "pos" : "neg";

/* ---------- top bar ---------- */
export function roundBar(round, doneUpTo, phase) {
  return ROUNDS.map((_, i) => `<i class="${i === round && phase !== "final" ? "on" : ""} ${i < doneUpTo ? "done" : ""}">R${i + 1}</i>`).join("");
}

export function rulesHTML() {
  return `<ol class="rules">
    <li><span>Each round, a new client hands your agency an ad budget and a product to sell.</span></li>
    <li><span>Read the client brief and the audience data. Decide who buys this product and where they scroll.</span></li>
    <li><span>Build the campaign: objective, location, age groups, interest targeting, creative format, and budget by platform.</span></li>
    <li><span>Lock it in. When your teacher launches, every campaign runs at once and the results come back.</span></li>
    <li><span>Your score is profit: sales × the client's profit per sale, minus what you spent on ads. Most total profit after six rounds wins.</span></li>
  </ol>`;
}

/* ---------- client brief ---------- */
export function briefHTML(r) {
  const R = ROUNDS[r];
  const heat = SEGMENTS.map(s => `<tr><td>${esc(s.name)}</td>${PLATFORMS.map(p => { const v = s.reach[p.id]; return `<td class="h" style="background:rgba(226,111,57,${(v * v * 0.7).toFixed(2)})">${Math.round(v * 100)}%</td>`; }).join("")}<td class="h r">${short(s.size)}</td></tr>`).join("");
  return `<div class="stack">
  <div><span class="eyebrow">Round ${r + 1} of ${NROUNDS} · ${esc(R.tag)}</span><h2>${esc(R.title)}</h2><p class="muted" style="margin:0">Client: <b>${esc(R.client)}</b></p></div>
  <div class="brief">
    <section class="panel">
      <h3>The product</h3>
      <p class="lede" style="margin:0">${esc(R.what)}</p>
      <dl class="facts">
        <div><dt>Price</dt><dd>${money(R.price)}<small>${esc(R.priceNote)}</small></dd></div>
        <div><dt>Profit per sale</dt><dd>${money(R.margin)}<small>before ad costs</small></dd></div>
        <div><dt>Ad budget</dt><dd>${money(R.budget)}<small>do not go over</small></dd></div>
        <div><dt>Available</dt><dd>${R.inventory >= 100000 ? "No limit" : int(R.inventory)}<small>${R.inventory >= 100000 ? "sell as many as you can" : "then it is sold out"}</small></dd></div>
        <div><dt>Flight</dt><dd class="txt">${esc(R.flight)}</dd></div>
        <div><dt>Break-even</dt><dd>${int(Math.ceil(R.budget / R.margin))}<small>sales to cover the full budget</small></dd></div>
      </dl>
      <p><b>Client goal:</b> ${esc(R.goal)}</p>
      <div class="think">${esc(R.think)}</div>
    </section>
    <section class="panel">
      <h3>Audience insights</h3>
      <p class="muted small" style="margin-top:-4px">Share of each age group that uses each platform in a typical week.</p>
      <div class="tablewrap"><table class="heat"><thead><tr><th>Age group</th>${PLATFORMS.map(p => `<th><span class="pdot" style="background:${p.color}"></span>${p.name}</th>`).join("")}<th class="r">People</th></tr></thead><tbody>${heat}</tbody></table></div>
      <p class="foot">People = population within 25 miles of Arlington Heights. Simulation figures modeled on national survey patterns.</p>
      <h3 style="margin-top:16px">Platform benchmarks</h3>
      <div class="tablewrap"><table><thead><tr><th>Platform</th><th class="r">Avg CPM</th><th class="r">Avg click rate</th><th>Formats that work</th></tr></thead><tbody>
      ${PLATFORMS.map(p => { const best = FORMATS.slice().sort((a, b) => FMT_FIT[b.id][p.id] - FMT_FIT[a.id][p.id]).slice(0, 2).map(f => f.name).join(", "); return `<tr><td><span class="pdot" style="background:${p.color}"></span>${p.name}</td><td class="r num">${money(p.cpm, 2)}</td><td class="r num">${pct(p.ctr, 1)}</td><td class="small">${best}</td></tr>`; }).join("")}
      </tbody></table></div>
      <p class="foot">CPM = cost to show an ad 1,000 times. Click rate = share of people who tap the ad.</p>
    </section>
  </div></div>`;
}

/* ---------- campaign builder ---------- */
// opts: { locked, submitLabel, statusHTML, busy, err }
export function builderHTML(r, c, opts = {}) {
  const R = ROUNDS[r], lk = opts.locked ? "disabled" : "";
  const geo = geoById(c.geo);
  const hasTeen = c.segs.some(id => segById(id).teen), anyAdult = c.segs.some(id => !segById(id).teen);
  const step = R.budget >= 5000 ? 100 : 50;
  return `<div class="builder" id="builder">
   <div class="panel bpanel">
    <div class="sect"><h4>1. Campaign objective</h4><p class="hint">What should the platform's algorithm optimize for?</p>
      <div class="chips">${OBJECTIVES.map(o => `<button class="chip ${c.obj === o.id ? "on" : ""}" data-set="obj" data-v="${o.id}" ${lk}><b>${o.name}</b><small>${o.sub}</small></button>`).join("")}</div></div>
    <div class="sect"><h4>2. Location</h4><p class="hint">Where should the ads run?</p>
      <div class="chips">${GEOS.map(g => `<button class="chip ${c.geo === g.id ? "on" : ""}" data-set="geo" data-v="${g.id}" ${lk}><b>${g.name}</b><small>${g.sub}</small></button>`).join("")}</div></div>
    <div class="sect"><h4>3. Age groups</h4><p class="hint">Pick every group you want to reach. Your spend is shared across them by size.</p>
      <div class="chips">${SEGMENTS.map(s => `<button class="chip ${c.segs.includes(s.id) ? "on" : ""}" data-seg="${s.id}" aria-pressed="${c.segs.includes(s.id)}" ${lk}><b>${esc(s.name)}</b><small class="num">${short(s.size * geo.pool)} people</small></button>`).join("")}</div></div>
    <div class="sect"><h4>4. Detailed targeting</h4><p class="hint">Narrow adults (18+) to one interest. Smaller audience, more likely buyers.</p>
      <div class="chips"><button class="chip ${c.interest < 0 ? "on" : ""}" data-set="interest" data-v="-1" ${lk}><b>None</b><small>Broad: let the algorithm find buyers</small></button>
      ${R.interests.map((x, i) => `<button class="chip ${c.interest === i ? "on" : ""}" data-set="interest" data-v="${i}" ${lk}><b>${esc(x.name)}</b><small>${Math.round(x.share * 100)}% of adults</small></button>`).join("")}</div>
      ${c.interest >= 0 && hasTeen ? `<div class="pol">Ad policy: platforms only let advertisers target users under 18 by age and location. Your teen groups will not be narrowed by interest.</div>` : ""}
      ${c.interest >= 0 && c.segs.length && !anyAdult ? `<div class="pol">Interest targeting does nothing here because you only picked under-18 groups.</div>` : ""}
    </div>
    <div class="sect"><h4>5. Creative format</h4><p class="hint">One ad format runs on every platform you buy.</p>
      <div class="fmtgrid">${FORMATS.map(f => `<button class="chip ${c.fmt === f.id ? "on" : ""}" data-set="fmt" data-v="${f.id}" ${lk}><b>${f.name}</b><small>${f.sub}</small></button>`).join("")}</div></div>
    <div class="sect"><h4>6. Budget by platform</h4><p class="hint">The total cannot go over ${money(R.budget)}. “People” is how many of your chosen audience use that platform.</p>
      ${PLATFORMS.map(p => { const pool = audienceFor(r, c, p.id).reduce((a, x) => a + x.pool, 0), v = +c.spend[p.id] || 0; return `<div class="bud"><label for="amt-${p.id}"><span class="pdot" style="background:${p.color}"></span><span>${p.name}<small>${c.segs.length ? short(pool) + " people" : "pick ages first"}</small></span></label>
        <input type="range" id="rng-${p.id}" min="0" max="${R.budget}" step="${step}" value="${v}" data-rng="${p.id}" aria-label="${p.name} budget" ${lk}>
        <div class="amt"><span>$</span><input type="text" id="amt-${p.id}" inputmode="numeric" value="${v}" data-amt="${p.id}" aria-label="${p.name} dollars" ${lk}></div></div>`; }).join("")}
      ${opts.locked ? "" : `<div class="row" style="margin-top:12px;gap:8px"><button class="btn ghost small" data-even>Split evenly</button><button class="btn ghost small" data-clear>Clear budget</button></div>`}
    </div>
   </div>
   <aside class="side">${sideHTML(r, c, opts)}</aside>
  </div>`;
}

export function sideHTML(r, c, opts = {}) {
  const R = ROUNDS[r], used = totalSpend(c), aud = totalAudience(r, c);
  const pos = aud > 0 ? Math.min(100, Math.max(0, (Math.log10(aud) - 3.5) / (7.8 - 3.5) * 100)) : 0;
  const label = !aud ? "Pick at least one age group" : aud < 25000 ? "Very specific" : aud < 120000 ? "Specific" : aud < 2e6 ? "Well defined" : aud < 8e6 ? "Broad" : "Very broad";
  return `<div class="panel">
      <span class="eyebrow">Audience definition</span>
      <div class="big" style="margin-top:4px" id="audBig">${int(aud)}</div><div class="muted small" id="audLbl">potential people · ${label}</div>
      <div class="gauge"><i id="gaugeI" style="left:${pos}%"></i></div><div class="gl"><span>Specific</span><span>Broad</span></div>
    </div>
    <div class="panel">
      <span class="eyebrow">Budget</span>
      <div class="big ${used > R.budget ? "over" : ""}" style="margin-top:4px" id="usedBig">${money(used)}</div><div class="muted small" id="leftTxt">of ${money(R.budget)} · ${money(R.budget - used)} left</div>
      <div class="meter" id="meter">${meterHTML(R, c)}</div>
    </div>
    <div class="panel">
      <div class="kv"><span>Objective</span><b>${objById(c.obj).name}</b></div>
      <div class="kv"><span>Location</span><b>${geoById(c.geo).name}</b></div>
      <div class="kv"><span>Ages</span><b>${c.segs.length ? c.segs.map(id => segById(id).name.replace("Ages ", "").replace(" (parents)", "")).join(", ") : "none yet"}</b></div>
      <div class="kv"><span>Interest</span><b>${c.interest >= 0 ? esc(ROUNDS[r].interests[c.interest].name) : "Broad"}</b></div>
      <div class="kv"><span>Format</span><b>${fmtById(c.fmt).name}</b></div>
      ${opts.statusHTML || ""}
      ${opts.submitLabel ? `<button class="btn" style="width:100%;margin-top:12px" id="submitCamp" ${opts.busy || opts.locked ? "disabled" : ""}>${opts.busy ? "Saving…" : opts.submitLabel}</button>` : ""}
      <p class="err" id="campErr" style="margin-top:8px">${esc(opts.err || "")}</p>
    </div>`;
}
const meterHTML = (R, c) => PLATFORMS.map(p => `<span style="width:${Math.min(100, (+c.spend[p.id] || 0) / R.budget * 100)}%;background:${p.color}"></span>`).join("");

// Wires up the builder. getCamp() returns the draft; onChange(full) asks the page to re-render (full = true)
// or only the budget numbers (full = false), so typing in a box never loses focus.
export function bindBuilder(r, getCamp, onChange) {
  const R = ROUNDS[r], root = $("#builder");
  if (!root) return;
  root.querySelectorAll("[data-set]").forEach(b => b.onclick = () => { const c = getCamp(); const k = b.dataset.set; c[k] = k === "interest" ? +b.dataset.v : b.dataset.v; onChange(true); });
  root.querySelectorAll("[data-seg]").forEach(b => b.onclick = () => { const c = getCamp(), v = b.dataset.seg; c.segs = c.segs.includes(v) ? c.segs.filter(x => x !== v) : [...c.segs, v]; onChange(true); });
  const setSpend = (pid, raw) => {
    const c = getCamp();
    let v = Math.max(0, Math.round(+String(raw).replace(/[^0-9.]/g, "") || 0));
    const others = totalSpend(c) - (+c.spend[pid] || 0);
    v = Math.min(v, Math.max(0, R.budget - others));
    c.spend[pid] = v;
    const rng = $("#rng-" + pid), amt = $("#amt-" + pid);
    if (rng) rng.value = v;
    if (amt && document.activeElement !== amt) amt.value = v;
    const used = totalSpend(c);
    $("#usedBig").textContent = money(used);
    $("#leftTxt").textContent = `of ${money(R.budget)} · ${money(R.budget - used)} left`;
    $("#meter").innerHTML = meterHTML(R, c);
    onChange(false);
    return v;
  };
  root.querySelectorAll("[data-rng]").forEach(el => {
    el.oninput = () => { const v = setSpend(el.dataset.rng, el.value); el.value = v; };
  });
  root.querySelectorAll("[data-amt]").forEach(el => {
    el.oninput = () => setSpend(el.dataset.amt, el.value);
    el.onchange = () => { el.value = getCamp().spend[el.dataset.amt]; };
    el.onfocus = () => el.select();
  });
  const ev = root.querySelector("[data-even]");
  if (ev) ev.onclick = () => {
    const c = getCamp(), step = R.budget >= 5000 ? 100 : 50;
    const on = PLATFORMS.filter(p => c.spend[p.id] > 0), list = on.length ? on : PLATFORMS;
    const each = Math.floor(R.budget / list.length / step) * step;
    PLATFORMS.forEach(p => c.spend[p.id] = list.includes(p) ? each : 0);
    onChange(true);
  };
  const cl = root.querySelector("[data-clear]");
  if (cl) cl.onclick = () => { const c = getCamp(); PLATFORMS.forEach(p => c.spend[p.id] = 0); onChange(true); };
}

/* ---------- results ---------- */
export function eventHTML(r) {
  const e = ROUNDS[r].event;
  return `<div class="evt"><div class="stamp">Market<br>event</div><div><h3>${esc(e.title)}</h3><p>${esc(e.text)}</p></div></div>`;
}

// list: [{ id, name, camp, res }] (res null = did not launch). Sorted by profit inside.
export function rankList(list) {
  return list.slice().sort((a, b) => (b.res ? b.res.profit : 0) - (a.res ? a.res.profit : 0) || (b.res ? 1 : 0) - (a.res ? 1 : 0));
}
export function barsHTML(items, me) {
  // items: [{ id, name, value }]
  const max = Math.max(1, ...items.map(o => Math.abs(o.value)));
  const neg = items.some(o => o.value < 0), zero = neg ? 50 : 0, span = neg ? 50 : 100;
  return `<div class="bars">${items.map(o => { const w = Math.abs(o.value) / max * span, left = o.value >= 0 ? zero : zero - w;
    return `<div class="barrow ${o.id === me ? "me" : ""}"><b title="${esc(o.name)}">${esc(o.name)}</b><div class="bt">${neg ? `<i style="left:50%"></i>` : ""}<span data-w="${w.toFixed(1)}" style="left:${left}%;width:0;background:${o.value >= 0 ? "var(--good)" : "var(--bad)"}"></span></div><span class="v ${sign(o.value)}">${money(o.value)}</span></div>`; }).join("")}</div>`;
}
export function growBars() { requestAnimationFrame(() => requestAnimationFrame(() => document.querySelectorAll(".bt span[data-w]").forEach(s => s.style.width = s.dataset.w + "%"))); }

export function reportTableHTML(r, list, { open = null, me = null } = {}) {
  const R = ROUNDS[r], ranked = rankList(list);
  return `<div class="tablewrap"><table class="rep"><thead><tr><th>#</th><th>Agency</th><th>Spend</th><th>Impressions</th><th>CTR</th><th>Clicks</th><th>Sales</th><th>Cost / sale</th><th>Revenue</th><th>ROAS</th><th>Profit</th></tr></thead><tbody>
  ${ranked.map((o, k) => { const x = o.res, canOpen = !!(x && o.camp), isOpen = open === o.id && canOpen;
    if (!x) return `<tr class="${o.id === me ? "me" : ""}"><td class="rank">${k + 1}</td><td class="tn">${esc(o.name)}<span class="tag none">Did not launch</span></td><td colspan="8" class="muted" style="text-align:left">No campaign was locked in.</td><td class="td p">$0</td></tr>`;
    return `<tr class="${canOpen ? "main" : ""} ${k === 0 ? "top" : ""} ${o.id === me ? "me" : ""}" ${canOpen ? `data-open="${o.id}" aria-expanded="${isOpen}" tabindex="0"` : ""}><td class="rank">${k + 1}</td><td class="tn">${esc(o.name)}${x.soldOut ? `<span class="tag so">Sold out</span>` : ""}</td>
    <td class="td">${money(x.spend)}</td><td class="td">${int(x.imps)}</td><td class="td">${pct(x.ctr)}</td><td class="td">${int(x.clicks)}</td><td class="td">${int(x.conv)}</td><td class="td">${x.conv ? money(x.cpa, 2) : "–"}</td><td class="td">${money(x.revenue)}</td><td class="td">${x.roas.toFixed(2)}x</td><td class="td p ${sign(x.profit)}">${money(x.profit)}</td></tr>
    ${isOpen ? `<tr class="detail"><td colspan="11">${detailHTML(r, o.camp, x)}</td></tr>` : ""}`; }).join("")}
  </tbody></table></div>
  <p class="foot">ROAS = revenue ÷ ad spend. Profit = sales × ${money(R.margin)} − ad spend.${ranked.some(o => o.res && o.camp) ? " Click an agency to see its platform breakdown and analyst notes." : ""}</p>`;
}

export function setupLine(r, c) {
  const R = ROUNDS[r];
  return `${objById(c.obj).name} objective · ${geoById(c.geo).name} · ${c.segs.map(id => segById(id).name).join(", ")} · ${c.interest >= 0 ? esc(R.interests[c.interest].name) : "Broad targeting"} · ${fmtById(c.fmt).name}`;
}
export function detailHTML(r, c, x) {
  return `<div class="dgrid"><div>
    <div class="tablewrap"><table class="mini"><thead><tr><th>Platform</th><th>Spend</th><th>CPM</th><th>Impr.</th><th>Reach</th><th>Freq.</th><th>Clicks</th><th>Sales</th><th>Cost / sale</th></tr></thead><tbody>
    ${x.rows.map(w => { const p = platformById(w.pid); return `<tr><td><span class="pdot" style="background:${p.color}"></span>${p.name}</td><td>${w.nodelivery ? "$0 (refunded)" : money(w.spend)}</td><td>${w.cpm ? money(w.cpm, 2) : "–"}</td><td>${int(w.imps)}</td><td>${int(w.reach)}</td><td>${w.freq ? w.freq.toFixed(1) : "–"}</td><td>${int(w.clicks)}</td><td>${int(w.conv)}</td><td>${w.conv ? money(w.spend / w.conv, 2) : "–"}</td></tr>`; }).join("")}
    </tbody></table></div>
    <p class="setsum"><b>Setup:</b> ${setupLine(r, c)}</p>
  </div><div><span class="eyebrow">Analyst notes</span><ul class="notes" style="margin-top:6px">${(x.notes || []).map(n => `<li class="${n.t}">${esc(n.m)}</li>`).join("") || `<li class="info">Clean campaign. No major issues found.</li>`}</ul></div></div>`;
}

export function kpisHTML(x) {
  return `<div class="kpis">
    <div><small>Spend</small><b>${money(x.spend)}</b></div><div><small>Impressions</small><b>${int(x.imps)}</b></div>
    <div><small>Reach</small><b>${int(x.reach)}</b></div><div><small>Frequency</small><b>${(x.freq || 0).toFixed(1)}</b></div>
    <div><small>Click rate</small><b>${pct(x.ctr)}</b></div><div><small>Clicks</small><b>${int(x.clicks)}</b></div>
    <div><small>Cost per click</small><b>${x.clicks ? money(x.cpc, 2) : "–"}</b></div><div><small>Sales</small><b>${int(x.conv)}</b></div>
    <div><small>Cost per sale</small><b>${x.conv ? money(x.cpa, 2) : "–"}</b></div><div><small>Revenue</small><b>${money(x.revenue)}</b></div>
    <div><small>ROAS</small><b>${x.roas.toFixed(2)}x</b></div><div><small>Profit</small><b class="${sign(x.profit)}">${money(x.profit)}</b></div></div>`;
}

// One team's own result card. place/of are optional (live rank).
export function myResultHTML(r, c, x, place, of) {
  return `<section class="panel myres stack" style="gap:14px">
    <div class="row" style="justify-content:space-between;align-items:flex-end">
      <div><span class="eyebrow">Your campaign · ${esc(ROUNDS[r].title)}</span><div class="hero-num ${sign(x.profit)}">${money(x.profit)}</div><span class="muted">profit for ${esc(ROUNDS[r].client)}${x.soldOut ? " · SOLD OUT" : ""}</span></div>
      ${place ? `<div style="text-align:right"><span class="eyebrow">Rank this round</span><div class="hero-num" style="color:var(--brown)">${place}<span style="font-size:.45em;color:var(--muted)"> of ${of}</span></div></div>` : ""}
    </div>
    ${kpisHTML(x)}
    ${detailHTML(r, c, x)}
  </section>`;
}

// Cumulative standings table. rows: [{ id, name, per: [profit|null x6], sum }]
export function standingsTableHTML(rows, me) {
  const sorted = rows.slice().sort((a, b) => b.sum - a.sum);
  return `<div class="tablewrap"><table class="rep"><thead><tr><th>#</th><th>Agency</th>${ROUNDS.map((_, r) => `<th>R${r + 1}</th>`).join("")}<th>Total profit</th></tr></thead><tbody>
  ${sorted.map((o, k) => `<tr class="${k === 0 ? "top" : ""} ${o.id === me ? "me" : ""}"><td class="rank">${k + 1}</td><td class="tn">${esc(o.name)}</td>${o.per.map(v => `<td class="td ${v == null ? "muted" : sign(v)}">${v == null ? "–" : money(v)}</td>`).join("")}<td class="td p ${sign(o.sum)}">${money(o.sum)}</td></tr>`).join("")}
  </tbody></table></div>`;
}

/* ---------- launch animation ---------- */
// Plays the "campaigns delivering" sequence in el, then calls done().
export function playLaunch(el, r, results, done) {
  const R = ROUNDS[r], days = parseInt(R.flight, 10) || 7;
  const t = results.filter(Boolean).reduce((a, x) => ({ spend: a.spend + x.spend, imps: a.imps + x.imps, clicks: a.clicks + x.clicks, conv: a.conv + x.conv }), { spend: 0, imps: 0, clicks: 0, conv: 0 });
  el.innerHTML = `<div class="panel launch"><span class="eyebrow">Round ${r + 1} · ${esc(R.title)}</span><h2>Campaigns delivering</h2><p class="muted" id="lday">Day 1 of ${days}</p>
    <div class="prog"><span id="lpb"></span></div>
    <div class="ticker"><div><small>Spend</small><span class="big" id="lk1">$0</span></div><div><small>Impressions</small><span class="big" id="lk2">0</span></div><div><small>Clicks</small><span class="big" id="lk3">0</span></div><div><small>Sales</small><span class="big" id="lk4">0</span></div></div></div>`;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, T = reduce ? 300 : 3400, t0 = performance.now();
  (function step(now) {
    const f = Math.min(1, (now - t0) / T), e = 1 - Math.pow(1 - f, 2);
    const q = id => document.getElementById(id);
    if (!q("lpb")) return; // screen changed underneath
    q("lpb").style.width = (f * 100) + "%";
    q("lday").textContent = `Day ${Math.min(days, Math.floor(f * days) + 1)} of ${days}`;
    q("lk1").textContent = money(t.spend * e); q("lk2").textContent = short(t.imps * e); q("lk3").textContent = int(t.clicks * e); q("lk4").textContent = int(t.conv * e);
    if (f < 1) requestAnimationFrame(step); else setTimeout(done, 400);
  })(t0);
}

export function toast(text) {
  const el = document.createElement("div"); el.className = "banner wait toast"; el.textContent = text;
  document.body.appendChild(el); setTimeout(() => el.remove(), 4200);
}
