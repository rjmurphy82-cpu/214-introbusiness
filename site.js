// District 214 Intro to Business: sidebar, mobile menu and text size (same as the Finance & Investing site).
// The menu is built from window.SITE_CATS, window.SITE_SECTIONS and window.SITE_ITEMS, which the hub page (index.html) defines
// before loading this file. The page's <body data-page="..."> marks the current page.
(function () {
  var SECTIONS = window.SITE_SECTIONS || [], ITEMS = window.SITE_ITEMS || [];
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var CATS = window.SITE_CATS || [];
  // Sidebar: Management and Marketing, each with its live games, then its simulations
  var links = CATS.map(function (c) {
    var out = '<div class="ng">' + esc(c.id) + "</div>";
    SECTIONS.forEach(function (sec) {
      var list = ITEMS.filter(function (i) { return i.cat === c.id && i.section === sec.id; });
      if (!list.length) return;
      out += '<div class="nch">' + esc(sec.title) + "</div>";
      list.forEach(function (i) { out += '<a href="' + i.href + '"><span class="ch">' + (sec.id === "live" ? "●" : "▸") + "</span>" + esc(i.navLabel || i.title) + "</a>"; });
    });
    return out;
  }).join("");
  var cur = document.body.getAttribute("data-page") || "";
  var shell = document.querySelector(".shell");
  if (shell) {
    shell.insertAdjacentHTML("afterbegin",
      '<div class="mbar"><a href="/"><img src="/logo-214.png" alt="High School District 214"></a><button id="menuBtn" aria-expanded="false" aria-controls="side">Menu</button></div>' +
      '<aside class="side" id="side"><a class="brandlink" href="/"><img src="/logo-214.png" alt="High School District 214"></a>' +
      '<div class="sitename">Intro to Business</div><nav aria-label="Site"><a class="home" href="/"' + (cur === "home" ? ' aria-current="page"' : "") + '><span class="ch">⌂</span>Home</a>' + links + "</nav>" +
      '<div class="sidefoot">High School District 214 | Intro to Business</div></aside><div class="scrim" id="scrim"></div>');
    var s = document.getElementById("side"), b = document.getElementById("menuBtn"), c = document.getElementById("scrim");
    var set = function (o) { s.classList.toggle("open", o); c.classList.toggle("on", o); b.setAttribute("aria-expanded", o); b.textContent = o ? "Close" : "Menu"; };
    b.addEventListener("click", function () { set(!s.classList.contains("open")); });
    c.addEventListener("click", function () { set(false); });
    s.addEventListener("click", function (e) { if (e.target.closest("a")) set(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") set(false); });
  }
  // Text size: scales the main content, remembered across pages
  document.body.insertAdjacentHTML("beforeend",
    '<div id="tsz" role="group" aria-label="Text size"><button type="button" data-d="-1" aria-label="Smaller text">A−</button><button type="button" data-d="0" class="pct" aria-label="Reset text size">100%</button><button type="button" data-d="1" class="big" aria-label="Bigger text">A+</button></div>');
  var STEPS = [0.8, 0.9, 1, 1.1, 1.25, 1.4, 1.6, 1.8, 2], KEY = "d214-ib-text-size", box = document.getElementById("tsz");
  var target = document.querySelector("main") || document.body, i = 2;
  try { var j = STEPS.indexOf(parseFloat(localStorage.getItem(KEY))); if (j >= 0) i = j; } catch (e) {}
  function apply() {
    var z = STEPS[i]; target.style.zoom = z;
    box.children[1].textContent = Math.round(z * 100) + "%";
    box.children[0].disabled = i === 0; box.children[2].disabled = i === STEPS.length - 1;
    try { localStorage.setItem(KEY, z); } catch (e) {}
  }
  box.addEventListener("click", function (e) { var t = e.target.closest("button"); if (!t) return; var d = +t.dataset.d; i = d === 0 ? 2 : Math.max(0, Math.min(STEPS.length - 1, i + d)); apply(); t.blur(); });
  apply();
})();
