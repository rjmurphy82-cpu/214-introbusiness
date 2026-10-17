// Builds one case file .docx per company.
const fs = require("fs");
const path = require("path");
const H = require("./hersey");
const { C, run, p, h1, h2, h3, cell, table, dataTable, callout, image, CONTENT_W, d } = H;

const ROOT = path.join(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "data.json")));
const OUT = path.join(ROOT, "out", "case_files");
fs.mkdirSync(OUT, { recursive: true });

const money = (v) => (Number.isInteger(v) ? `$${v.toLocaleString()}` : `$${v.toFixed(2)}`);
const fmt = (n) => n.toLocaleString();
const singular = (w) => (w.endsWith("sses") ? w.slice(0, -2) : w.replace(/s$/, ""));

function segCards(co) {
  const w = Math.floor(CONTENT_W / 3);
  const widths = [w, w, CONTENT_W - 2 * w];
  const head = co.segs.map((s, i) => cell([
    p([run(`SEGMENT ${s.letter}`, { size: 20, bold: true, color: C.white })], { after: 0 }),
    p([run(`${fmt(s.size)} potential customers`, { size: 16, color: C.orangeLt })], { after: 0 }),
  ], { w: widths[i], fill: C.brown, ml: 140 }));
  const body = co.segs.map((s, i) => cell([
    ...s.bullets.map((b) => new d.Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 40 },
      children: [run(b, { size: 17 })] })),
    p([run(`“${s.quote}”`, { size: 17, italics: true, color: C.brown })], { before: 60, after: 60 }),
  ], { w: widths[i], valign: d.VerticalAlign.TOP, mt: 100, ml: 120, mr: 120 }));
  const name = co.segs.map((s, i) => cell([
    p([run("Our name for them:", { size: 15, bold: true, color: C.grey })], { after: 140 }),
    new d.Paragraph({ children: [run(" ")], spacing: { after: 20 }, border: { bottom: { style: d.BorderStyle.SINGLE, size: 4, color: "8C8C8C", space: 1 } } }),
  ], { w: widths[i], fill: C.cream, ml: 120, mr: 120, mt: 80, mb: 80 }));
  return table(widths, [head, body, name]);
}

function warmup(co) {
  const must = co.segs.map((_, si) => co.feats.filter((f) => f.pct[si] >= 60).length);
  const top = co.feats.reduce((a, f) => (f.cost > a.cost ? f : a));
  const b = co.segs[1];
  const pA = co.segs[0].best.price;
  const pctA = co.segs[0].wtp[co.prices.indexOf(pA)];
  const qs = [
    `Which segment has the most must-have features (60% or higher)? How many does it have?`,
    `What is the most expensive feature on the menu? Which segment, if any, says it is a must-have?`,
    `What is the lowest price at which fewer than half of Segment B would buy?`,
    `If ${co.name} sold a version with a Fit of 100% to Segment A at ${money(pA)}, how many people would buy it?`,
  ];
  const kids = [h2("Warm-Up: Read the Data First", { before: 200 })];
  qs.forEach((q, i) => {
    kids.push(p([run(`${i + 1}.  `, { bold: true, size: 18, color: C.brown }), run(q, { size: 18 })], { before: 60, after: 0, keepNext: true }));
    kids.push(...H.lines(1, { line: 380 }));
  });
  return kids;
}

function build(co, num) {
  const n = String(num).padStart(2, "0");
  const fc = fs.readFileSync(path.join(ROOT, "charts", `${co.id}_features.png`));
  const wc = fs.readFileSync(path.join(ROOT, "charts", `${co.id}_wtp.png`));
  const unitShort = co.unit.replace(/^per /, "");

  const page1 = [
    p([run(`CASE FILE ${n}`, { size: 18, bold: true, color: C.orange })], { after: 0 }),
    h1(co.name),
    p([run(`Product line: ${co.product}`, { size: 20, color: C.grey })], { after: 140 }),
    p(co.blurb, { size: 20, after: 140 }),
    callout([
      p([run("Your job: ", { bold: true, size: 19, color: C.brown }), run(
        `Build a lineup of three versions, one for each segment below. For every version, choose its features and set its price. Your goal is the most total profit across all three.`, { size: 19 })], { after: 0 }),
    ]),
    h2("The Market: Three Segments", { before: 200 }),
    p([run(`${co.name} surveyed people in the Chicago area. The survey split them into three groups. Read the profiles, then give each segment a name.`, { size: 18, color: C.grey })], { after: 100 }),
    segCards(co),
    h2("Product Basics", { before: 200 }),
    table([3400, CONTENT_W - 3400], [
      [cell("Base cost of every version", { w: 3400, bold: true, size: 18, fill: C.tan }),
       cell(`${money(co.base)} ${co.unit}, before any features are added`, { w: CONTENT_W - 3400, size: 18 })],
      [cell("Price options", { w: 3400, bold: true, size: 18, fill: C.tan }),
       cell(`${co.prices.map(money).join("    ")}   (each version must use one of these prices)`, { w: CONTENT_W - 3400, size: 18 })],
    ]),
    ...warmup(co),
  ];

  const page2 = [
    h2("Survey Results: What Each Segment Requires", { pageBreak: true, before: 0 }),
    p([run(`Question asked: “Which of these would a ${singular(co.product)} need to have before you would buy it?”`, { size: 18, italics: true, color: C.grey })], { after: 80 }),
    image(fc, 624, 425),
    h2("Feature Menu", { before: 120 }),
    p([run(`Every feature you add raises your cost ${co.unit}. Add a feature to any version you want.`, { size: 18, color: C.grey })], { after: 80 }),
    dataTable([3300, CONTENT_W - 3300 - 1900, 1900], ["Feature", "What it is", `Cost to add`],
      co.feats.map((f) => [f.name, f.desc, money(f.cost)]), { size: 18, zebra: true, align: [null, null, d.AlignmentType.CENTER], boldCol: 0 }),
  ];

  const lw = 2016, pw = Math.floor((CONTENT_W - lw) / co.prices.length);
  const widths = [lw, ...co.prices.map((_, i) => (i === co.prices.length - 1 ? CONTENT_W - lw - pw * (co.prices.length - 1) : pw))];
  const ctr = widths.map((_, i) => (i ? d.AlignmentType.CENTER : null));
  const page3 = [
    h2("Survey Results: What Each Segment Will Pay", { pageBreak: true, before: 0 }),
    p([run(`Question asked: “If it had everything you need, would you buy it at this price?”`, { size: 18, italics: true, color: C.grey })], { after: 80 }),
    image(wc, 624, 286),
    p([run(`% of each segment who would buy at each price`, { size: 18, bold: true })], { before: 80, after: 60 }),
    dataTable(widths, ["Price", ...co.prices.map(money)],
      co.segs.map((s) => [`Segment ${s.letter}`, ...s.wtp.map((v) => `${v}%`)]), { size: 18, zebra: true, align: ctr, boldCol: 0 }),
    h2("Quick Rules", { before: 200 }),
    table([2700, CONTENT_W - 2700], [
      ["Must-have", "A feature that 60% or more of a segment requires. Leave one out and that segment's buyers are cut in half. Leave two out and they're cut in half again."],
      ["Nice-to-have", "A feature that 30% to 59% of a segment requires. Each one you include adds 5% to Fit."],
      ["Under 30%", "That segment doesn't care. It adds cost and nothing else."],
      ["Fit", "Start at 100%. Add 5% for each nice-to-have included. Then cut in half for each must-have left out."],
      ["Buyers", "Segment size × % who would buy at your price × Fit. Round to a whole number."],
      ["Profit", "Buyers × (Price − Unit cost). Unit cost = base cost + cost of every feature you added."],
    ].map((r) => [cell(r[0], { w: 2700, bold: true, size: 18, fill: C.tan }), cell(r[1], { w: CONTENT_W - 2700, size: 18 })])),
  ];

  const docu = H.doc([{ headerLabel: `Case File ${n}  |  ${co.name}`, footerLabel: "Market Segmentation Project  |  Build the Lineup",
    children: [...page1, ...page2, ...page3] }], { title: `Case File ${n} - ${co.name}` });
  const file = path.join(OUT, `Case_File_${n}_${co.name.replace(/[^A-Za-z0-9]+/g, "_").replace(/_$/, "")}.docx`);
  return H.save(docu, file).then(() => file);
}

(async () => {
  for (let i = 0; i < data.companies.length; i++) console.log(await build(data.companies[i], i + 1));
})();
