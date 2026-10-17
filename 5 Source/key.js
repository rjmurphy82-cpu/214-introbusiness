// Teacher Answer Key: overview, grading guidance, and one page per company.
const fs = require("fs");
const path = require("path");
const H = require("./hersey");
const { C, run, p, h1, h2, h3, cell, table, dataTable, callout, bullets, CONTENT_W, d } = H;

const ROOT = path.join(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "data.json")));
const money = (v) => (Number.isInteger(v) ? `$${v.toLocaleString()}` : `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
const pct = (f) => `${Math.round(f * 100)}%`;
const CT = d.AlignmentType.CENTER;

function warmupAnswers(co) {
  const must = co.segs.map((_, si) => co.feats.filter((f) => f.pct[si] >= 60).length);
  const mx = Math.max(...must);
  const who = co.segs.filter((_, i) => must[i] === mx).map((s) => `Segment ${s.letter}`);
  const top = co.feats.reduce((a, f) => (f.cost > a.cost ? f : a));
  const topMust = co.segs.filter((_, si) => top.pct[si] >= 60).map((s) => `Segment ${s.letter}`);
  const b = co.segs[1];
  const bi = b.wtp.findIndex((v) => v < 50);
  const pA = co.segs[0].best.price;
  const pctA = co.segs[0].wtp[co.prices.indexOf(pA)];
  return [
    `${who.join(" and ")}, with ${mx} must-have${mx === 1 ? "" : "s"}.`,
    `${top.name} at ${money(top.cost)}. ${topMust.length ? `Must-have for ${topMust.join(" and ")}.` : "No segment lists it as a must-have."}`,
    `${money(co.prices[bi])} (${b.wtp[bi]}% would buy).`,
    `${co.segs[0].size.toLocaleString()} × ${pctA}% = ${Math.round(co.segs[0].size * pctA / 100).toLocaleString()} buyers.`,
  ];
}

function companyPage(co, num) {
  const n = String(num).padStart(2, "0");
  const fname = (ids) => (ids.length ? ids.map((i) => co.feats[i].name).join(", ") : "No added features");
  const w = [1500, 3700, 1000, 900, 800, 750, 900, CONTENT_W - 9550];
  const rows = co.segs.map((s) => {
    const b = s.best;
    return [`${s.letter}: ${s.key}`, fname(b.feats), money(b.cost), money(b.price), `${b.pct}%`, pct(b.fit), b.buyers.toLocaleString(), money(b.profit)];
  });
  const total = co.segs.reduce((a, s) => a + s.best.profit, 0);
  rows.push([cell("Lineup total", { w: w[0], bold: true, size: 16, fill: C.tan }), ...w.slice(1, 7).map((x) => cell("", { w: x, fill: C.tan })),
    cell(money(Math.round(total * 100) / 100), { w: w[7], bold: true, size: 16, fill: C.tan, align: CT })]);
  const wa = warmupAnswers(co);
  const sg = co.single;
  const lift = Math.round((total / sg.profit - 1) * 100);
  return [
    p([run(`CASE FILE ${n}`, { size: 16, bold: true, color: C.orange })], { after: 0, pageBreak: true }),
    h1(co.name),
    p([run(`${co.product}  |  base cost ${money(co.base)} ${co.unit}`, { size: 18, color: C.grey })], { after: 100 }),
    h2("Suggested Segment Names", { before: 80 }),
    p([run(co.segs.map((s) => `${s.letter}: ${s.key}`).join("     "), { size: 18 })], { after: 40 }),
    p([run("Any name that matches the profile earns credit.", { size: 16, italics: true, color: C.grey })], { after: 60 }),
    h2("Warm-Up Answers", { before: 120 }),
    ...wa.map((a, i) => p([run(`${i + 1}.  `, { bold: true, size: 18, color: C.brown }), run(a, { size: 18 })], { after: 30 })),
    h2("Most Profitable Version for Each Segment", { before: 160 }),
    dataTable(w, ["Segment", "Features", "Unit cost", "Price", "% buy", "Fit", "Buyers", "Profit"], rows,
      { size: 16, align: [null, null, CT, CT, CT, CT, CT, CT], boldCol: 0 }),
    p([run("Found by testing every combination of features and prices. Students will rarely land on these exact builds.", { size: 16, italics: true, color: C.grey })], { before: 60, after: 60 }),
    h2("Lineup vs. One Version", { before: 140 }),
    table([3400, CONTENT_W - 3400], [
      [cell("Best single version for everyone", { w: 3400, bold: true, size: 17, fill: C.tan }),
       cell(`${fname(sg.feats)} at ${money(sg.price)} (unit cost ${money(sg.cost)}): ${money(sg.profit)} total profit`, { w: CONTENT_W - 3400, size: 17 })],
      [cell("Best three-version lineup", { w: 3400, bold: true, size: 17, fill: C.tan }),
       cell(`${money(Math.round(total * 100) / 100)} total profit, about ${lift}% more than the best single version`, { w: CONTENT_W - 3400, size: 17 })],
    ]),
    h2("The Trap: Every Feature in Every Version", { before: 140 }),
    p([run("If a team loads all 8 features into a version and picks its best price, here is what each segment earns:", { size: 17 })], { after: 60 }),
    dataTable([3400, 2370, 2370, CONTENT_W - 3400 - 4740], ["Segment", "Loaded version profit", "Best version profit", "Lost by loading up"],
      co.segs.map((s) => [`${s.letter}: ${s.key}`, money(s.loaded.profit), money(s.best.profit), money(Math.round((s.best.profit - s.loaded.profit) * 100) / 100)]),
      { size: 16, align: [null, CT, CT, CT], boldCol: 0 }),
  ];
}

const intro = [
  p([run("TEACHER ONLY", { size: 18, bold: true, color: C.orange })], { after: 0 }),
  h1("Build the Lineup: Answer Key"),
  p([run("Market Segmentation Project", { size: 20, color: C.grey })], { after: 140 }),
  h2("Project at a Glance", { before: 60 }),
  table([2600, CONTENT_W - 2600], [
    ["Where it fits", "Third step in the marketing sequence. Target Marketing found the customer, Million Dollar Media Buy spent money on given segments, and this project has students define segments themselves and design a product and price for each one."],
    ["Groups", "Pairs. 12 case files. With more than 12 pairs, give two pairs the same company and compare their lineups during presentations."],
    ["Timing", "Block 1: launch deck (about 25 minutes), warm-up, segment names, feature sort. Block 2: build versions, price tests, one-version comparison, slides. Block 3 (optional): presentations."],
    ["Student files", "One case file per pair, the Student Guide (one per student), and the slide template."],
  ].map((r) => [cell(r[0], { w: 2600, bold: true, size: 18, fill: C.tan }), cell(r[1], { w: CONTENT_W - 2600, size: 18 })])),
  h2("How the Scoring Works", { before: 180 }),
  ...bullets([
    "Unit cost = base cost + every feature added.",
    "Fit starts at 100%, rises 5% for each nice-to-have (30 to 59%) included, then halves for each must-have (60% or more) left out.",
    "Buyers = segment size × % who would buy at that price × Fit, rounded to a whole number.",
    "Profit = buyers × (price − unit cost).",
  ], { size: 18 }),
  h2("Grading Guidance", { before: 180 }),
  ...bullets([
    "The “most profitable” builds in this key are maximums found by checking every possible combination. Do not expect students to match them.",
    "Full credit on feature choices: every must-have included and nothing the segment rated under 30%. Nice-to-haves are a judgment call either way.",
    "Full credit on pricing: at least two prices tested per version and the more profitable one chosen.",
    "A lineup within about 80% of the key's total is excellent work.",
    "Check that the one-version comparison in Step 6 comes out lower than their lineup. If it doesn't, their versions probably include features a segment doesn't want.",
  ], { size: 18 }),
  h2("Think It Through: Look-Fors", { before: 180 }),
  ...[
    ["1. Most profitable version", "Rarely the highest price. Strong answers point to segment size and % who would buy, not just price per unit."],
    ["2. Price-sensitive segment", "The line with the steepest drop on the price chart. Strong answers say to keep that version lean so its price can stay low."],
    ["3. Cannibalization", "Premium customers would trade down if the cheap version had their must-haves. Good lineups keep each segment's must-haves out of the cheaper versions (fences)."],
  ].map((r) => p([run(r[0] + ": ", { bold: true, size: 18 }), run(r[1], { size: 18 })], { after: 60 })),
];

(async () => {
  const pages = data.companies.flatMap((co, i) => companyPage(co, i + 1));
  const docu = H.doc([{ headerLabel: "Market Segmentation  |  Teacher Key", footerLabel: "Market Segmentation Project  |  Teacher Key  |  Do not distribute",
    children: [...intro, ...pages] }], { title: "Build the Lineup - Teacher Key" });
  await H.save(docu, path.join(ROOT, "out", "Teacher_Key_Build_the_Lineup.docx"));
  console.log("key ok");
})();
