// Student Guide: definitions, rules, worked example, step-by-step, Lineup Builder, rubric.
const fs = require("fs");
const path = require("path");
const H = require("./hersey");
const { C, run, p, h1, h2, h3, cell, table, dataTable, callout, lines, bullets, CONTENT_W, d } = H;

const ROOT = path.join(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "data.json")));
const m = data.maya;
const money = (v) => (Number.isInteger(v) ? `$${v.toLocaleString()}` : `$${v.toFixed(2)}`);
const A = m.segs[0];
const ex = (pi) => {
  const pct = A.wtp[pi], price = m.prices[pi];
  const buyers = Math.round(A.size * pct / 100 * 1.0);
  return { price, pct, buyers, profit: buyers * (price - A.best.cost) };
};
const e1 = ex(1), e2 = ex(2);
if (e1.profit !== A.best.profit) throw new Error("worked example mismatch");

const L = d.AlignmentType.LEFT, CT = d.AlignmentType.CENTER;

// ---------- Page 1: overview + terms ----------
const page1 = [
  p([run("MARKET SEGMENTATION PROJECT", { size: 18, bold: true, color: C.orange })], { after: 0 }),
  h1("Build the Lineup"),
  p([run("Student Guide", { size: 20, color: C.grey })], { after: 140 }),
  p([run("In the target marketing project you studied survey data to find who buys a product. In Million Dollar Media Buy you decided which customers to spend money reaching. Now you go one step further: ", { size: 20 }),
     run("instead of selling one product to everyone, you will design a different version for each segment of the market and decide what each version should cost.", { size: 20, bold: true })], { after: 120 }),
  callout([
    p([run("The big question: ", { bold: true, color: C.brown }), run("Why do companies sell a basic, a mid-level, and a premium version of the same product? And how do they decide what goes in each one and what each one costs?")], { after: 0 }),
  ]),
  h2("Key Terms", { before: 200 }),
  dataTable([2700, CONTENT_W - 2700], ["Term", "What it means"], [
    ["Market segmentation", "Dividing a whole market into smaller groups of customers who share the same needs, wants, or buying habits."],
    ["Market segment", "One of those groups. People inside a segment are similar to each other and different from people in other segments."],
    ["Product line", "A group of related products sold by one company, such as a basic, mid, and premium version. Also called a lineup."],
    ["Feature", "Something a product has or does. Every feature adds to what the product costs to make."],
    ["Unit cost", "What it costs the company to make one unit. Base cost + the cost of every feature added."],
    ["Price point", "The specific price a company charges for a version."],
    ["Willingness to pay", "The highest price a customer would pay. As price goes up, fewer people in a segment are willing to buy."],
    ["Must-have", "A feature 60% or more of a segment requires before they will buy."],
    ["Nice-to-have", "A feature 30% to 59% of a segment wants. It helps, but it is not a deal-breaker."],
    ["Profit per unit", "Price − unit cost. What the company keeps from each sale."],
    ["Total profit", "Buyers × profit per unit."],
    ["Cannibalization", "When a company's cheaper version steals customers who would have paid for its more expensive version."],
  ], { size: 18, zebra: true, boldCol: 0 }),
];

// ---------- Page 2: rules + worked example ----------
const page2 = [
  h2("How the Numbers Work", { pageBreak: true, before: 0 }),
  p("Your case file has two survey charts. The first shows which features each segment requires. The second shows how many people in each segment would buy at each price. Use them with these rules:", { size: 19, after: 100 }),
  table([2400, CONTENT_W - 2400], [
    ["1. Unit cost", "Base cost + the cost of every feature you add."],
    ["2. Fit", "Start at 100%. Add 5% for every nice-to-have you include. Then cut the result in half for every must-have you leave out."],
    ["3. Buyers", "Segment size × % who would buy at your price × Fit. Round to a whole number."],
    ["4. Profit", "Buyers × (Price − Unit cost)"],
  ].map((r) => [cell(r[0], { w: 2400, bold: true, size: 19, fill: C.tan }), cell(r[1], { w: CONTENT_W - 2400, size: 19 })])),
  p([run("Features under 30% for a segment do nothing for that segment except raise your cost.", { size: 18, italics: true, color: C.grey })], { before: 80, after: 60 }),

  h2("Worked Example: Maya's Sneaker Restoration", { before: 180 }),
  p([run(`Maya is building a package for her first segment, the `, { size: 19 }), run(A.key, { size: 19, bold: true }),
     run(` (${A.size} potential customers). Her base cost is ${money(m.base)} a pair. Her survey says this segment's must-haves are Deep clean (${m.feats[0].pct[0]}%), Sole whitening (${m.feats[1].pct[0]}%), and Fresh laces (${m.feats[6].pct[0]}%).`, { size: 19 })], { after: 100 }),
  dataTable([3200, 2200, CONTENT_W - 5400], ["Step", "Math", "Result"], [
    ["Unit cost", `${money(m.base)} + $3 + $4 + $2`, money(A.best.cost)],
    ["Fit", "All 3 must-haves, no nice-to-haves", "100%"],
    [`Test price ${money(e1.price)}`, `${A.size} × ${e1.pct}% × 100%`, `${e1.buyers} buyers × (${money(e1.price)} − ${money(A.best.cost)}) = ${money(e1.profit)}`],
    [`Test price ${money(e2.price)}`, `${A.size} × ${e2.pct}% × 100%`, `${e2.buyers} buyers × (${money(e2.price)} − ${money(A.best.cost)}) = ${money(e2.profit)}`],
  ], { size: 18 }),
  p([run(`The higher price makes more per pair but loses too many buyers. Maya charges ${money(e1.price)}. `, { size: 19 }),
     run("Notice she left out color repaint and the display box. Weekend Wearers barely care, so those features would only shrink her profit.", { size: 19 })], { before: 100, after: 60 }),

  h2("Your Steps", { before: 180 }),
  ...[
    ["Read your case file.", "Answer the warm-up questions on page 1 first."],
    ["Name each segment.", "Give each one a name and write a one-sentence persona of a typical customer."],
    ["Sort the features.", "Use the survey chart to mark each feature as Must, Nice, or blank for every segment (Feature Sort below)."],
    ["Build three versions.", "Choose features for each segment and figure out the unit cost."],
    ["Set the prices.", "Test at least two prices for each version. Keep the one with more profit."],
    ["Compare to one version.", "Sell your Segment B version to all three segments at one price. Is the lineup worth it?"],
    ["Present.", "Fill in the slide template and pitch your lineup to the class."],
  ].map((s, i) => new d.Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 40 },
    children: [run(s[0] + " ", { bold: true, size: 19 }), run(s[1], { size: 19 })] })),
];

// ---------- Page 3: Feature sort + names ----------
const page3 = [
  h2("Step 2: Name the Segments", { pageBreak: true, before: 0 }),
  table([1700, 2600, CONTENT_W - 4300], [
    [cell("", { w: 1700, fill: C.brown }), cell("Our name for them", { w: 2600, fill: C.brown, bold: true, color: C.white, size: 18 }),
     cell("Persona: describe one typical customer in a sentence", { w: CONTENT_W - 4300, fill: C.brown, bold: true, color: C.white, size: 18 })],
    ...["A", "B", "C"].map((l) => [cell(`Segment ${l}`, { w: 1700, bold: true, size: 18, fill: C.tan }), cell(" ", { w: 2600, mt: 360, mb: 360 }), cell(" ", { w: CONTENT_W - 4300 })]),
  ]),
  h2("Step 3: Feature Sort", { before: 220 }),
  p([run("Write M for must-have (60%+), N for nice-to-have (30–59%), or leave it blank (under 30%).", { size: 18, color: C.grey })], { after: 80 }),
  null,
];
page3[page3.length - 1] = table([2800, 1100, 2204, 2204, 2204], [
  [cell("Feature", { w: 2800, fill: C.brown, bold: true, color: C.white, size: 18 }),
   cell("Cost", { w: 1100, fill: C.brown, bold: true, color: C.white, size: 18, align: CT }),
   ...["A", "B", "C"].map((l) => cell(`Segment ${l}`, { w: 2204, fill: C.brown, bold: true, color: C.white, size: 18, align: CT }))],
  ...Array.from({ length: 8 }, () => [cell(" ", { w: 2800, mt: 150, mb: 150 }), cell(" ", { w: 1100 }), cell(" ", { w: 2204 }), cell(" ", { w: 2204 }), cell(" ", { w: 2204 })]),
]);

// ---------- Pages 4-5: Lineup Builder ----------
function builder(letter, pageBreak) {
  const w1 = 3000, w2 = CONTENT_W - w1;
  const pw = [2102, 2102, 2102, 2102, CONTENT_W - 4 * 2102];
  const head = (t, w) => cell(t, { w, fill: C.brown, bold: true, color: C.white, size: 17, align: CT });
  return [
    h2(`Version for Segment ${letter}`, { pageBreak, before: pageBreak ? 0 : 220 }),
    table([w1, w2], [
      [cell("Segment name", { w: w1, bold: true, size: 18, fill: C.tan }), cell(" ", { w: w2 })],
      [cell("Version name", { w: w1, bold: true, size: 18, fill: C.tan }), cell(" ", { w: w2 })],
      [cell("Features included", { w: w1, bold: true, size: 18, fill: C.tan }), cell([p(" "), p(" ")], { w: w2, mt: 120, mb: 120 })],
      [cell("Unit cost (base + features)", { w: w1, bold: true, size: 18, fill: C.tan }), cell(" ", { w: w2, mt: 120, mb: 120 })],
      [cell("Must-haves left out?", { w: w1, bold: true, size: 18, fill: C.tan }), cell(" ", { w: w2 })],
    ]),
    p([run("Price tests", { bold: true, size: 18 })], { before: 100, after: 60 }),
    table(pw, [
      [head("Price", pw[0]), head("% who would buy", pw[1]), head("Fit", pw[2]), head("Buyers", pw[3]), head("Profit", pw[4])],
      ...[0, 1].map(() => pw.map((w) => cell(" ", { w, mt: 170, mb: 170 }))),
    ]),
    p([run("Why this segment will want this version:", { bold: true, size: 18 })], { before: 100, after: 0 }),
    ...lines(2, { line: 380 }),
  ];
}
const page4 = [...builder("A", true), ...builder("B", false)];
const page5 = [...builder("C", true),
  h2("Step 6: One Version for Everyone?", { before: 220 }),
  p("Take your Segment B version. Sell that same version, at the same price, to all three segments. Use the rules to find each segment's profit.", { size: 18, after: 80 }),
  table([2628, 2628, 2628, CONTENT_W - 3 * 2628], [
    ["", "Segment A", "Segment B", "Segment C"].map((t, i) => cell(t, { w: i < 3 ? 2628 : CONTENT_W - 3 * 2628, fill: C.brown, bold: true, color: C.white, size: 17, align: CT })),
    ...["Fit", "Buyers", "Profit"].map((r) => [cell(r, { w: 2628, bold: true, size: 18, fill: C.tan }), cell(" ", { w: 2628, mt: 150, mb: 150 }), cell(" ", { w: 2628 }), cell(" ", { w: CONTENT_W - 3 * 2628 })]),
  ]),
  table([CONTENT_W - 3000, 3000], [
    [cell("One-version total profit:", { w: CONTENT_W - 3000, bold: true, size: 18, fill: C.cream, align: d.AlignmentType.RIGHT }), cell(" ", { w: 3000 })],
    [cell("Lineup total profit (A + B + C versions):", { w: CONTENT_W - 3000, bold: true, size: 18, fill: C.cream, align: d.AlignmentType.RIGHT }), cell(" ", { w: 3000 })],
  ]),
];

// ---------- Page 6: Reflection + presentation + rubric ----------
const rw = [3300, CONTENT_W - 3300 - 1100, 1100];
const page6 = [
  h2("Think It Through", { pageBreak: true, before: 0 }),
  ...[
    "Which of your three versions earns the most total profit? Is it the one with the highest price? Explain why or why not.",
    "Look at the price chart. Which segment loses customers the fastest as the price rises? What does that tell you about how to price for them?",
    "What would stop a customer in your highest-priced segment from just buying your cheapest version? How do your features prevent that?",
  ].flatMap((q, i) => [p([run(`${i + 1}.  `, { bold: true, size: 18, color: C.brown }), run(q, { size: 18 })], { before: 80, after: 0, keepNext: true }), ...lines(2, { line: 380 })]),
  h2("Presentation (6 to 8 slides, use the template)", { before: 220 }),
  ...bullets([
    "Title: company and team names",
    "Meet the Market: your three segment names and personas",
    "One slide per version: name, features, price, buyers, profit, and why it fits that segment",
    "The Lineup: all three versions side by side with total profit",
    "One Version vs. Lineup: your Step 6 numbers",
    "Recommendation: which version to launch first and one risk to watch",
  ], { size: 18 }),
  h2("Rubric (25 points)", { before: 200 }),
  dataTable(rw, ["Category", "Full credit looks like", "Points"], [
    ["Segments", "Each segment has a fitting name and a persona backed by the profile data.", "/ 4"],
    ["Feature choices", "Every version includes its must-haves and skips features that segment doesn't care about.", "/ 6"],
    ["Pricing", "Each price was tested against at least one other price using the survey data.", "/ 5"],
    ["Math", "Unit cost, Fit, buyers, and profit are correct for all three versions.", "/ 5"],
    ["Presentation", "Clear slides, lineup vs. one-version comparison, and a recommendation backed by numbers.", "/ 5"],
  ].concat([[cell("Total", { w: rw[0], bold: true, size: 18, fill: C.tan }), cell("", { w: rw[1], fill: C.tan }), cell("/ 25", { w: rw[2], bold: true, size: 18, fill: C.tan, align: CT })]]),
  { size: 18, align: [null, null, CT], boldCol: 0 }),
];

(async () => {
  const docu = H.doc([{ headerLabel: "Market Segmentation  |  Student Guide", footerLabel: "Market Segmentation Project  |  Build the Lineup",
    children: [...page1, ...page2, ...page3, ...page4, ...page5, ...page6] }], { title: "Build the Lineup - Student Guide" });
  fs.mkdirSync(path.join(ROOT, "out"), { recursive: true });
  await H.save(docu, path.join(ROOT, "out", "Student_Guide_Build_the_Lineup.docx"));
  console.log("guide ok");
})();
