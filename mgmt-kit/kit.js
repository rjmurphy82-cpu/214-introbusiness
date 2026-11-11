/* Management Kit: shared plumbing for the Management unit's live group games (Shift Manager, Keep the Crew).
   Same pattern and store as Boss Moves: the teacher screen does all the scoring and writes the shared state;
   student devices only write their own player record. Storage: /api/live (codes under ibl:), so no new server function.
   Groups of 2 or 3 (teacher picks), reshuffled every round with as few repeat partners as possible. */
"use strict";
window.KIT = (function () {
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const num = n => Math.round(n).toLocaleString("en-US");
  const ord = n => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th");
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
  const andList = a => a.length <= 1 ? (a[0] || "") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
  const ROLE = window.BRL_ROLE || "student";
  const MOCK = /[?&]mock=1/.test(location.search);
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function beep(f, d) { try { const c = beep.c || (beep.c = new (window.AudioContext || window.webkitAudioContext)()); const o = c.createOscillator(), g = c.createGain(); o.frequency.value = f; g.gain.value = .06; o.connect(g); g.connect(c.destination); const t = c.currentTime; g.gain.exponentialRampToValueAtTime(.0001, t + d); o.start(t); o.stop(t + d); } catch (e) {} }

  /* ---------------- network ---------------- */
  function mockNet(KEY) {
    const bc = ("BroadcastChannel" in window) ? new BroadcastChannel(KEY) : null, subs = [];
    const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } };
    const write = t => { localStorage.setItem(KEY, JSON.stringify(t)); fire(); if (bc) bc.postMessage(1); };
    const at = (t, p) => p.split("/").filter(Boolean).reduce((o, k) => (o == null ? undefined : o[k]), t);
    const put = (t, p, v) => { const ks = p.split("/").filter(Boolean); let o = t; ks.slice(0, -1).forEach(k => { if (typeof o[k] !== "object" || o[k] === null) o[k] = {}; o = o[k]; }); if (v === null) delete o[ks[ks.length - 1]]; else o[ks[ks.length - 1]] = v; };
    const fire = () => { const t = read(); subs.forEach(s => { const v = JSON.stringify(at(t, s.p) ?? null); if (v !== s.last) { s.last = v; s.cb(JSON.parse(v)); } }); };
    if (bc) bc.onmessage = fire; window.addEventListener("storage", e => { if (e.key === KEY) fire(); });
    return {
      get: async p => at(read(), p) ?? null,
      set: async (p, v) => { const t = read(); put(t, p, v); write(t); },
      update: async (p, o) => { const t = read(); Object.entries(o).forEach(([k, v]) => put(t, p + "/" + k, v)); write(t); },
      remove: async p => { const t = read(); put(t, p, null); write(t); },
      on: (p, cb) => { const s = { p, cb, last: undefined }; subs.push(s); setTimeout(fire, 0); return () => { const i = subs.indexOf(s); if (i >= 0) subs.splice(i, 1); }; }
    };
  }
  async function vercelNet() {
    const call = async (op, path, v) => { const r = await fetch("/api/live", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op, path, v }) });
      const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || r.status); return j; };
    try { const p = await call("ping"); if (!p.ok) return null; } catch (e) { return null; }
    return {
      get: async p => (await call("get", p)).v ?? null,
      set: (p, v) => call("set", p, v),
      update: (p, o) => call("update", p, o),
      remove: p => call("remove", p),
      on: (p, cb) => { let last, stop = false, t;
        const tick = async () => { if (stop) return;
          if (!document.hidden) { try { const v = (await call("get", p)).v ?? null, s = JSON.stringify(v); if (s !== last) { last = s; cb(v); } } catch (e) {} }
          if (!stop) t = setTimeout(tick, 1200); };
        tick(); return () => { stop = true; clearTimeout(t); }; }
    };
  }
  let NET = null;
  async function net(mockKey) { if (NET) return NET; NET = MOCK ? mockNet(mockKey || "kitMock") : await vercelNet(); return NET; }

  /* ---------------- groups of 2 or 3 ---------------- */
  const pkey = (a, b) => (a < b ? a + "|" + b : b + "|" + a);
  // size 2: pairs, an odd one out makes one group of 3. size 3: trios, leftovers make groups of 2 (never a group of 1 or 4).
  function chunk(order, size) {
    const n = order.length; if (n <= 3) return [order.slice()];
    let threes, twos;
    if (size === 3) { threes = Math.floor(n / 3); let rem = n - threes * 3; if (rem === 1) { threes -= 1; rem += 3; } twos = rem / 2; }
    else { twos = Math.floor(n / 2); threes = 0; if (n % 2) { twos -= 1; threes = 1; } }
    const out = []; let i = 0;
    for (let k = 0; k < threes; k++) { out.push(order.slice(i, i + 3)); i += 3; }
    for (let k = 0; k < twos; k++) { out.push(order.slice(i, i + 2)); i += 2; }
    return out;
  }
  function cost(groups, hist) { let c = 0; groups.forEach(g => { for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) c += (hist[pkey(g[i], g[j])] || 0); }); return c; }
  function groupUp(ids, hist, size) {
    let best = null, bc = Infinity;
    for (let t = 0; t < 500 && bc > 0; t++) { const g = chunk(shuffle(ids), size), c = cost(g, hist || {}); if (c < bc) { bc = c; best = g; } }
    return best || [];
  }
  function addHist(hist, groups) { const h = { ...(hist || {}) }; groups.forEach(g => { for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) { const k = pkey(g[i], g[j]); h[k] = (h[k] || 0) + 1; } }); return h; }
  const groupOf = (st, pid) => (st.groups || []).findIndex(g => g.includes(pid));
  // fold late joiners into the smallest groups, drop removed players, and never leave someone alone
  function patchGroups(groups, activeIds, size) {
    const act = new Set(activeIds);
    let gs = groups.map(g => g.filter(p => act.has(p))).filter(g => g.length);
    const seated = new Set(gs.flat());
    activeIds.filter(p => !seated.has(p)).forEach(p => {
      const open = gs.filter(g => g.length < size).sort((a, b) => a.length - b.length)[0];
      if (open) open.push(p); else gs.push([p]);
    });
    const solos = gs.filter(g => g.length === 1);
    if (solos.length && gs.length > 1) { gs = gs.filter(g => g.length > 1); solos.forEach(s => { const t = gs.slice().sort((a, b) => a.length - b.length)[0]; t.push(s[0]); }); }
    return gs;
  }

  /* ---------------- timers ---------------- */
  const clockText = s => (s >= 60 ? Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0") : String(s));
  const timerHTML = secs => `<div class="row tline"><div class="timer" style="flex:1"><i></i></div><span class="secs">${clockText(secs)}</span></div>`;
  let TICK = null;
  function stopTick() { clearInterval(TICK); TICK = null; }
  // endsAt is a wall-clock time (Date.now based) so every device counts down to the same moment
  function startTimer(el, secs, endsAt, onEnd) {
    stopTick();
    const bar = el.querySelector(".timer i"), sec = el.querySelectorAll(".secs"), tm = el.querySelector(".timer"); let last = null;
    TICK = setInterval(() => {
      const left = Math.max(0, (endsAt - Date.now()) / 1000), c = Math.ceil(left);
      if (bar) bar.style.transform = `scaleX(${left / secs})`;
      if (c !== last) { last = c; sec.forEach(s => s.textContent = clockText(c)); if (c <= 3 && c > 0) beep(880, .05); }
      if (tm) tm.classList.toggle("low", left <= Math.min(30, secs * .2));
      if (left <= 0) { stopTick(); onEnd && onEnd(); }
    }, 200);
  }

  /* ---------------- projector fit ---------------- */
  function zoomApp() { const a = $("#app"); a.style.zoom = ""; const R = document.documentElement; let lo = .55, hi = 2.2;
    for (let i = 0; i < 12; i++) { const m = (lo + hi) / 2; a.style.zoom = m.toFixed(3); (R.scrollHeight <= innerHeight + 1 && R.scrollWidth <= innerWidth + 1) ? lo = m : hi = m; }
    a.style.zoom = lo.toFixed(3); }
  function fit() { if (ROLE !== "teacher") return; document.body.classList.add("wide"); requestAnimationFrame(zoomApp); }
  window.addEventListener("resize", () => { if (ROLE === "teacher") { clearTimeout(fit.t); fit.t = setTimeout(zoomApp, 150); } });

  function qrSvg(text) {
    try { if (!window.qrcode) return ""; const q = qrcode(0, "M"); q.addData(text); q.make(); const n = q.getModuleCount(), m = 2; let d = "";
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + m} ${r + m}h1v1h-1z`;
      return `<svg viewBox="0 0 ${n + 2 * m} ${n + 2 * m}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#111"/></svg>`; } catch (e) { return ""; }
  }

  /* ---------------- host basics ---------------- */
  async function newCode(N) { let code; for (let t = 0; t < 20; t++) { code = String(Math.floor(1000 + Math.random() * 9000)); if (!(await N.get("games/" + code))) break; } return code; }
  const activeIds = H => Object.entries(H.players).filter(([, p]) => !p.out).map(([id]) => id);
  const nameOf = (H, pid) => (H.players[pid] && H.players[pid].name) || (H.state.names && H.state.names[pid]) || "?";
  const namesMap = H => { const o = {}; Object.entries(H.players).forEach(([id, p]) => o[id] = p.name); return o; };
  const standings = st => Object.entries(st.tot || {}).map(([p, s]) => ({ p, s })).sort((a, b) => b.s - a.s);

  function lobbyHTML(H, title, path, extra) {
    const ps = activeIds(H), url = location.origin + path + "?code=" + H.code;
    if (!H.qr) H.qr = qrSvg(url);
    const ng = ps.length >= 2 ? chunk(ps, H.meta.size).length : 0;
    return `<div class="lobby"><div class="lobtop"><div class="lobleft"><div class="join">Scan the code, or open <b>${esc(title)}</b> on the Intro to Business site and enter</div>
      <div class="code">${H.code}</div><div class="url">${esc(url.replace(/^https?:\/\//, ""))}</div></div>
      ${H.qr ? `<div class="qr">${H.qr}<span>Scan to join</span></div>` : ""}</div>
      <div class="count">${plural(ps.length, "player")} joined · ${plural(ng, "group")} (groups of ${H.meta.size === 3 ? "3, some 2" : "2, maybe one 3"})</div>
      <div class="names">${ps.map(id => `<span>${esc(nameOf(H, id))}</span>`).join("") || '<span style="opacity:.5">Waiting for players…</span>'}</div>
      <p class="note">${extra || ""}</p>
      <div class="row" style="justify-content:center"><button class="btn main" id="start" ${ps.length >= 2 ? "" : "disabled"}>Make the groups</button><button class="btn" id="end">Cancel</button></div></div>`;
  }
  function seatHTML(H, o) {
    const st = H.state;
    return `<div class="hostbar"><div><div class="kick">Round ${st.r + 1} of ${H.meta.rounds}</div><h2>${st.r === 0 ? "Find your group" : "New groups"}</h2></div>
      <p>${o.sub || "Sit with the people on your screen."}</p></div>
      <div class="pgrid">${st.groups.map((g, i) => `<div class="pcard"><span class="pn">${i + 1}</span><div class="pp">${g.map(p => `<div class="tn"><span>${o.mark && o.mark(p, i) ? o.mark(p, i) + " " : ""}${esc(nameOf(H, p))}</span><em>${num((st.tot || {})[p] || 0)}</em><button class="x" data-p="${p}" title="Remove from the game">✕</button></div>`).join("")}</div></div>`).join("")}</div>
      <div class="row" style="justify-content:center;margin-top:14px"><button class="btn main" id="go">${esc(o.go)}</button></div>
      <p class="note" style="text-align:center">✕ removes an absent student. If they come back, they rejoin with the same name and keep their points.</p>`;
  }
  function bindRemove(H, onDone) {
    document.querySelectorAll("button.x[data-p]").forEach(b => b.onclick = async () => {
      const p = b.dataset.p; try { await H.N.update(`games/${H.code}/players/${p}`, { out: true }); } catch (e) {}
      H.players[p] = { ...(H.players[p] || {}), out: true }; onDone();
    });
  }
  function finale(H, kick, head, onClass, onErase, onDone) {
    const st = H.state, list = standings(st), top = list.slice(0, 5), rk = []; let r = 0, prev = null;
    list.forEach((x, i) => { if (x.s !== prev) { r = i + 1; prev = x.s; } rk.push(r); });
    const slot = (x, i, cls) => x ? `<div class="pod ${cls}" data-i="${i}"><div class="who"><div class="medal">${rk[i]}</div><div class="nm">${esc(nameOf(H, x.p))}</div><div class="pts">${num(x.s)}</div></div><div class="block"><span>${ord(rk[i])}</span></div></div>` : `<div class="pod ${cls} empty"></div>`;
    document.body.classList.add("finale-on"); $("#app").style.zoom = "";
    $("#app").innerHTML = `<div class="finale"><div class="rays"></div>
      <div class="fhead"><div class="kick">${esc(kick)}</div><h2>${esc(head)}</h2></div>
      <div class="podium">${slot(top[1], 1, "p2")}${slot(top[0], 0, "p1")}${slot(top[2], 2, "p3")}</div>
      <div class="rest">${top.slice(3).map((x, k) => `<div class="row45" data-i="${k + 3}"><span class="r">${rk[k + 3]}</span><span class="n">${esc(nameOf(H, x.p))}</span><span class="s">${num(x.s)}</span></div>`).join("")}</div>
      <div class="fbar"><button class="btn" id="cr">Class results</button><button class="btn" id="erase">Erase game</button><button class="btn" id="done">Done</button></div></div>`;
    [4, 3, 2, 1, 0].filter(i => top[i]).forEach((i, n) => setTimeout(() => { const el = document.querySelector(`.finale [data-i="${i}"]`); if (el) el.classList.add("in"); beep(i === 0 ? 1047 : 600, .2); }, [1500, 5500, 10000, 14500, 20000][n]));
    $("#cr").onclick = onClass; $("#erase").onclick = onErase; $("#done").onclick = onDone;
  }

  /* ---------------- student join ---------------- */
  const sess = key => ({ save: o => { try { localStorage.setItem(key, JSON.stringify(o)); } catch (e) {} },
    load: () => { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch (e) { return null; } },
    clear: () => { try { localStorage.removeItem(key); } catch (e) {} } });
  function cleanName(v) {
    const parts = String(v || "").trim().replace(/\s+/g, " ").split(" ").filter(Boolean).slice(0, 2);
    return parts.map((w, i) => { w = w.charAt(0).toUpperCase() + w.slice(1); return i === 1 && /^[A-Za-z]\.?$/.test(w) ? w.charAt(0) + "." : w; }).join(" ");
  }
  // o: { N, game, title, sessKey, hdr, onJoined(ctx) }
  function joinForm(o) {
    const S = sess(o.sessKey), sv = S.load(), qcode = (location.search.match(/[?&]code=(\d{4})/) || [])[1];
    $("#app").innerHTML = `${o.hdr}<div class="panel"><h2>Join the game</h2><p>${qcode ? "Code filled in. Type your first name." : "Type the code on the board and your first name."} Closed the page? Join again with the same name and you keep your points.</p>
      <input class="field code" id="cd" inputmode="numeric" maxlength="4" placeholder="0000" autocomplete="off" value="${qcode || (sv ? esc(sv.code) : "")}">
      <input class="field" id="nm" maxlength="20" placeholder="First name" autocomplete="given-name" autocapitalize="words" value="${sv && (!qcode || sv.code === qcode) ? esc(sv.name) : ""}">
      <div class="err" id="er"></div><div class="row" id="dup" hidden></div><button class="btn main" id="go">Join</button></div>`;
    (qcode && !$("#nm").value) ? $("#nm").focus() : $("#cd").focus();
    const enter = async (code, name, forcePid) => {
      try {
        const g = await o.N.get("games/" + code);
        if (!g || g.game !== o.game) return `No ${o.title} game with that code. Check the board.`;
        const norm = x => String(x || "").trim().toLowerCase().replace(/[.\s]+/g, " ").trim(), sv2 = S.load();
        let pid = forcePid || (sv2 && sv2.code === code && norm(sv2.name) === norm(name) ? sv2.pid : null);
        if (!pid && g.players) { const hit = Object.entries(g.players).find(([, p]) => norm(p.name) === norm(name)); if (hit) return { dup: true, pid: hit[0], name: hit[1].name }; }
        const rec = pid && g.players && g.players[pid];
        if (rec) { name = rec.name || name; await o.N.update(`games/${code}/players/${pid}`, { out: false }); }
        else { pid = "p" + Math.random().toString(36).slice(2, 10); await o.N.set(`games/${code}/players/${pid}`, { name, joined: Date.now() }); }
        S.save({ code, pid, name });
        const { state, players, ...meta } = g;
        $("#who").textContent = name; $("#who").hidden = false;
        o.onJoined({ code, pid, name, meta, rec: rec || {} });
        return null;
      } catch (e) { return "Couldn't connect. Try again."; }
    };
    const go = async () => {
      const code = $("#cd").value.trim(), name = cleanName($("#nm").value);
      if (!/^\d{4}$/.test(code)) { $("#er").textContent = "The code is 4 numbers."; return; }
      if (!name) { $("#er").textContent = "Type your first name."; return; }
      $("#go").disabled = true; $("#dup").hidden = true; $("#go").hidden = false;
      const r = await enter(code, name);
      if (r && r.dup) {
        $("#er").textContent = `${r.name} is already in this game.`;
        $("#dup").hidden = false; $("#go").hidden = true;
        $("#dup").innerHTML = `<button class="btn main" id="me">That's me</button><button class="btn" id="other">I'm a different ${esc(r.name)}</button>`;
        $("#me").onclick = async () => { const e = await enter(code, r.name, r.pid); if (e) $("#er").textContent = e; };
        $("#other").onclick = () => { $("#dup").hidden = true; $("#go").hidden = false; $("#nm").value = r.name + " "; $("#nm").focus();
          $("#er").textContent = `Add your last initial so you two show up separately, like "${r.name} M."`; $("#go").disabled = false; };
        return;
      }
      if (r) { $("#er").textContent = r; $("#go").disabled = false; }
    };
    $("#go").onclick = go; $("#nm").onkeydown = e => { if (e.key === "Enter") go(); };
  }
  function needSetup(hdr) {
    $("#app").innerHTML = `${hdr}<div class="panel"><h2>${ROLE === "teacher" ? "Class games need the database" : "The game isn't open yet"}</h2>
      <p>${ROLE === "teacher" ? "In Vercel, connect the Upstash for Redis database to this project, then redeploy. It's the same setup Boss Moves uses." : "Wait for your teacher to start it, then reload this page."}</p>
      <button class="btn main" id="b">Reload</button></div>`;
    $("#b").onclick = () => location.reload();
  }
  // simple horizontal bars: rows [{label, value, max, sub, hi}]
  function bars(rows, o = {}) {
    const max = o.max || Math.max(1, ...rows.map(r => r.value));
    return `<div class="sbars">${rows.map(r => `<div class="sbrow ${r.hi ? "best" : ""}"><div class="bn">${esc(r.label)}${r.sub ? `<small>${esc(r.sub)}</small>` : ""}</div>
      <div class="sbar"><i style="width:${Math.max(2, (r.value / max) * 100)}%"></i><b>${esc(r.text ?? num(r.value))}</b></div></div>`).join("")}</div>`;
  }

  return { $, esc, num, ord, plural, andList, ROLE, MOCK, shuffle, beep, net, chunk, groupUp, addHist, groupOf, patchGroups, pkey,
    clockText, timerHTML, startTimer, stopTick, fit, qrSvg, newCode, activeIds, nameOf, namesMap, standings, lobbyHTML, seatHTML, bindRemove, finale,
    sess, joinForm, needSetup, bars };
})();
