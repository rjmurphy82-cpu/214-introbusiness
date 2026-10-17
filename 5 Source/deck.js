// Launch deck: Build the Lineup (Market Segmentation). 16:9, Google Slides friendly.
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const { applyTheme } = require("/mnt/skills/public/pptx/scripts/apply_theme.js");

const ROOT = path.join(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "data.json")));
const M = data.maya;
const money = (v) => (Number.isInteger(v) ? `$${v.toLocaleString()}` : `$${v.toFixed(2)}`);

const BR = "4C3629", OR = "E26F39", OL = "F2955F", CR = "FBF3EC", TAN = "EFE4DA", INK = "222222", GR = "6B6B6B", WH = "FFFFFF";
const THEME = { name: "Hersey Intro to Business", headFontFace: "Arial", bodyFontFace: "Arial",
  colors: { dk1: "222222", lt1: "FFFFFF", dk2: BR, lt2: CR, accent1: BR, accent2: OR, accent3: OL, accent4: "8A7F78", accent5: "B9AFA8", accent6: "2F6F73", hlink: OR, folHlink: BR } };

async function icon(Comp, color, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color: "#" + color, size: String(size) }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9"; // 10 x 5.625
  pres.title = "Build the Lineup - Market Segmentation";
  pres.theme = { headFontFace: "Arial", bodyFontFace: "Arial" };

  pres.defineSlideMaster({ title: "DARK", background: { color: BR },
    objects: [{ rect: { x: 0, y: 5.45, w: 10, h: 0.175, fill: { color: OR } } },
      { text: { text: "INTRO TO BUSINESS  |  JOHN HERSEY HIGH SCHOOL", options: { x: 0.5, y: 5.08, w: 6, h: 0.3, fontSize: 9, bold: true, color: OL, charSpacing: 2, margin: 0 } } }],
    placeholders: [] });
  pres.defineSlideMaster({ title: "CONTENT", background: { color: WH },
    objects: [{ rect: { x: 0, y: 0, w: 10, h: 0.08, fill: { color: OR } } },
      { text: { text: "Intro to Business  |  Market Segmentation", options: { x: 0.5, y: 5.25, w: 5, h: 0.25, fontSize: 8, color: GR, margin: 0 } } }],
    slideNumber: { x: 9.1, y: 5.22, w: 0.4, h: 0.25, fontSize: 8, color: GR, align: "right" },
  });

  const notes = [];
  const S = (layout) => pres.addSlide({ masterName: layout });
  const title = (s, t) => s.addText(t, { isTextBox: true, x: 0.5, y: 0.3, w: 9, h: 0.75, fontSize: 28, bold: true, color: BR, valign: "middle", margin: 0, fontFace: "Arial", objectName: "Title" });
  const txt = (s, t, o) => s.addText(t, { isTextBox: true, fontFace: "Arial", color: INK, margin: 0, ...o });
  const card = (s, x, y, w, h, fill = CR, line = TAN) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: line, width: 1 }, rectRadius: 0.08 });

  // 1. Title
  let s = S("DARK");
  txt(s, "MARKET SEGMENTATION PROJECT", { x: 0.6, y: 1.25, w: 8, h: 0.4, fontSize: 14, bold: true, color: OL, charSpacing: 3 });
  txt(s, "Build the Lineup", { x: 0.6, y: 1.7, w: 8.8, h: 1.1, fontSize: 54, bold: true, color: WH });
  txt(s, "One market. Three kinds of customers. Three versions of your product.", { x: 0.6, y: 2.85, w: 8.5, h: 0.5, fontSize: 18, color: CR });
  s.addImage({ data: await icon(fa.FaLayerGroup, OL), x: 8.0, y: 3.4, w: 1.3, h: 1.3 });
  s.addNotes("Today we take everything from the last two projects and flip it. Instead of being handed the segments, you find them, and instead of one product, you build three.");

  // 2. Where we've been
  s = S("CONTENT"); title(s, "Where We've Been");
  const steps = [[fa.FaBullseye, "Target Marketing", "You read survey data and found who buys."],
    [fa.FaMoneyBillWave, "Million Dollar Media Buy", "You spent money reaching segments we gave you."],
    [fa.FaLayerGroup, "Build the Lineup", "You find the segments and build a product for each one."]];
  for (let i = 0; i < 3; i++) {
    const x = 0.5 + i * 3.1;
    const now = i === 2;
    card(s, x, 1.35, 2.8, 3.3, now ? BR : CR, now ? BR : TAN);
    s.addImage({ data: await icon(steps[i][0], now ? OL : OR), x: x + 1.0, y: 1.6, w: 0.8, h: 0.8 });
    txt(s, steps[i][1], { x: x + 0.2, y: 2.6, w: 2.4, h: 0.6, fontSize: 16, bold: true, align: "center", color: now ? WH : BR });
    txt(s, steps[i][2], { x: x + 0.25, y: 3.25, w: 2.3, h: 1.0, fontSize: 13, align: "center", color: now ? CR : INK });
    if (i < 2) s.addShape(pres.shapes.CHEVRON, { x: x + 2.84, y: 2.85, w: 0.22, h: 0.32, fill: { color: OR }, line: { color: OR } });
    txt(s, now ? "TODAY" : `STEP ${i + 1}`, { x: x, y: 4.75, w: 2.8, h: 0.3, fontSize: 10, bold: true, align: "center", color: now ? OR : GR, charSpacing: 2 });
  }
  s.addNotes("Quick recap. Ask: in Media Buy, who decided what the segments were? (We did.) Today that's your job.");

  // 3. Big question
  s = S("DARK");
  txt(s, "Why does one product come in three versions?", { x: 0.8, y: 1.4, w: 8.4, h: 1.8, fontSize: 40, bold: true, color: WH });
  txt(s, "Think of something you've bought that had a basic, a middle, and a premium option.", { x: 0.8, y: 3.3, w: 8, h: 0.8, fontSize: 18, color: OL });
  s.addNotes("Turn and talk, 60 seconds. Collect examples: phone storage sizes, streaming plans, car trims, meal sizes, concert tickets, sports camp packages.");

  // 4. Good / Better / Best
  s = S("CONTENT"); title(s, "Good, Better, Best Is Everywhere");
  const tiers = [[fa.FaTv, "Streaming", ["With ads", "No ads", "4K + extra screens"]],
    [fa.FaMobileAlt, "Phones", ["Base storage", "More storage", "Pro camera"]],
    [fa.FaCar, "Cars", ["Base trim", "Sport trim", "Luxury trim"]]];
  for (let i = 0; i < 3; i++) {
    const x = 0.5 + i * 3.1;
    s.addImage({ data: await icon(tiers[i][0], BR), x: x + 1.1, y: 1.25, w: 0.6, h: 0.6 });
    txt(s, tiers[i][1], { x, y: 1.9, w: 2.8, h: 0.4, fontSize: 16, bold: true, align: "center", color: BR });
    tiers[i][2].forEach((t, k) => {
      const fill = [TAN, OL, BR][k];
      s.addShape(pres.shapes.RECTANGLE, { x: x + 0.2, y: 2.45 + k * 0.72, w: 2.4, h: 0.6, fill: { color: fill }, line: { color: fill } });
      txt(s, t, { x: x + 0.2, y: 2.45 + k * 0.72, w: 2.4, h: 0.6, fontSize: 13, bold: k === 2, align: "center", valign: "middle", color: k === 2 ? WH : INK });
    });
  }
  s.addNotes("Same company, same core product. Each version is built for a different group of customers, and each one has a different price.");

  // 5. Definition with doughnut
  s = S("CONTENT"); title(s, "Market Segmentation");
  s.addChart(pres.charts.DOUGHNUT, [{ name: "Market", labels: ["Segment A", "Segment B", "Segment C"], values: [55, 30, 15] }],
    { x: 0.4, y: 1.1, w: 3.9, h: 3.9, holeSize: 55, chartColors: [BR, OR, "B9AFA8"], showLegend: false, showValue: false,
      showLabel: true, dataLabelColor: WH, dataLabelFontSize: 11, dataLabelFontBold: true, dataLabelFontFace: "+mn-lt", showPercent: false });
  txt(s, [{ text: "Dividing a whole market into smaller groups of customers who share the same needs, wants, or buying habits.", options: { fontSize: 22, bold: true, color: INK, breakLine: true } },
    { text: " ", options: { fontSize: 10, breakLine: true } },
    { text: "You already know the lenses: demographic, geographic, psychographic, behavioral, socioeconomic. Segmentation uses them to split the market.", options: { fontSize: 15, color: GR } }],
    { x: 4.6, y: 1.5, w: 4.9, h: 3 });
  s.addNotes("Connect to target marketing: the lenses are how you describe a segment. Segmentation is splitting the whole market into those groups before you pick who to serve.");

  // 6. Good segment test
  s = S("CONTENT"); title(s, "What Makes a Good Segment?");
  const good = [[fa.FaUsers, "Similar inside", "People in it want the same things."], [fa.FaArrowsAltH, "Different outside", "It wants different things than other segments."],
    [fa.FaChartBar, "Big enough", "Enough customers to be worth a version."], [fa.FaBullhorn, "Reachable", "You can actually get your message to them."]];
  for (let i = 0; i < 4; i++) {
    const x = 0.5 + i * 2.3;
    card(s, x, 1.35, 2.1, 3.2);
    s.addImage({ data: await icon(good[i][0], OR), x: x + 0.7, y: 1.6, w: 0.7, h: 0.7 });
    txt(s, good[i][1], { x: x + 0.1, y: 2.5, w: 1.9, h: 0.6, fontSize: 15, bold: true, align: "center", color: BR });
    txt(s, good[i][2], { x: x + 0.15, y: 3.15, w: 1.8, h: 1.2, fontSize: 12, align: "center" });
  }
  s.addNotes("Media Buy callback: Reachable is why the media channels mattered. A segment you can't reach is a segment you can't sell to.");

  // 7. Features cost money (stacked bar)
  s = S("CONTENT"); title(s, "Every Feature Costs Money");
  const col = M.segs[1].best; // Collectors
  const parts = [["Base cost", M.base], ...col.feats.map((f) => [M.feats[f].name, M.feats[f].cost])];
  s.addChart(pres.charts.BAR, parts.map((pp) => ({ name: pp[0], labels: ["Unit cost"], values: [pp[1]] })),
    { x: 0.4, y: 1.2, w: 5.2, h: 3.8, barDir: "bar", barGrouping: "stacked", chartColors: [BR, OR, OL, "B9AFA8", "8A7F78"],
      showLegend: true, legendPos: "b", legendFontSize: 10, legendFontFace: "+mn-lt", showValue: true, dataLabelPosition: "ctr", dataLabelColor: WH,
      dataLabelFormatCode: "$#,##0", dataLabelFontSize: 11, dataLabelFontFace: "+mn-lt", catAxisHidden: true, valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" } });
  txt(s, [{ text: "Unit cost", options: { fontSize: 14, bold: true, color: OR, breakLine: true } },
    { text: `Base cost + every feature you add`, options: { fontSize: 20, bold: true, color: BR, breakLine: true } },
    { text: " ", options: { fontSize: 8, breakLine: true } },
    { text: `Maya's Collector package: ${parts.map((pp) => money(pp[1])).join(" + ")} = ${money(col.cost)} a pair before she charges a cent.`, options: { fontSize: 15, color: INK } }],
    { x: 5.9, y: 1.6, w: 3.7, h: 3 });
  s.addNotes("Every feature makes the product better for someone and more expensive for the company. The question is never 'is this feature good?' It's 'does THIS segment care enough to pay for it?'");

  // 8. Must / nice / don't care
  s = S("CONTENT"); title(s, "Must-Have, Nice-to-Have, or Don't Care?");
  const zones = [["Don't care", "Under 30%", "Adds cost, nothing else", TAN, INK, 0, 3], ["Nice-to-have", "30% to 59%", "+5% Fit for each one", OL, INK, 3, 3], ["Must-have", "60% or more", "Leave it out: buyers cut in half", BR, WH, 6, 4]];
  zones.forEach((z) => {
    const x = 0.5 + z[5] * 0.9, w = z[6] * 0.9;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.6, w, h: 1.1, fill: { color: z[3] }, line: { color: WH, width: 2 } });
    txt(s, z[0], { x, y: 1.65, w, h: 0.55, fontSize: 18, bold: true, align: "center", color: z[4] });
    txt(s, z[1], { x, y: 2.15, w, h: 0.45, fontSize: 13, align: "center", color: z[4] });
    txt(s, z[2], { x: x + 0.1, y: 2.9, w: w - 0.2, h: 0.7, fontSize: 13, bold: true, align: "center", color: BR });
  });
  ["0%", "30%", "60%", "100%"].forEach((t, i) => txt(s, t, { x: 0.5 + [0, 2.7, 5.4, 9][i] - 0.3, y: 1.25, w: 0.6, h: 0.3, fontSize: 11, align: "center", color: GR }));
  txt(s, "The survey asked each segment: “Would you only buy it if it had this?”", { x: 0.5, y: 4.1, w: 9, h: 0.5, fontSize: 15, italics: true, color: GR, align: "center" });
  s.addNotes("These cutoffs come from the survey in your case file. Must-haves are deal-breakers: a version missing one loses half its buyers.");

  // 9. Willingness to pay
  s = S("CONTENT"); title(s, "Higher Price, Fewer Buyers");
  s.addChart(pres.charts.LINE, M.segs.map((sg) => ({ name: sg.key, labels: M.prices.map(money), values: sg.wtp })),
    { x: 0.3, y: 1.1, w: 6.1, h: 4.0, chartColors: [BR, OR, "8A7F78"], lineSize: 3, lineDataSymbol: "circle", lineDataSymbolSize: 8,
      showLegend: true, legendPos: "b", legendFontSize: 11, legendFontFace: "+mn-lt", valAxisMaxVal: 100, valAxisMinVal: 0, valAxisMajorUnit: 25,
      valAxisLabelFormatCode: "0\"%\"", valAxisLabelFontSize: 10, catAxisLabelFontSize: 10, valAxisLabelFontFace: "+mn-lt", catAxisLabelFontFace: "+mn-lt",
      catAxisLabelColor: GR, valAxisLabelColor: GR, valGridLine: { color: "E5E5E5", size: 0.5 }, catGridLine: { style: "none" },
      showValAxisTitle: true, valAxisTitle: "% who would buy", valAxisTitleFontSize: 10, valAxisTitleColor: GR });
  txt(s, [{ text: "Willingness to pay", options: { fontSize: 14, bold: true, color: OR, breakLine: true } },
    { text: "Every segment has a price where people start walking away.", options: { fontSize: 18, bold: true, color: BR, breakLine: true } },
    { text: " ", options: { fontSize: 8, breakLine: true } },
    { text: "Which of Maya's segments could she charge the most? Which one bails first?", options: { fontSize: 15, color: INK } }],
    { x: 6.6, y: 1.5, w: 3.0, h: 3.2 });
  s.addNotes(`Collectors barely drop until $80. Weekend Wearers fall off a cliff after $30. Same service, totally different price tolerance.`);

  // 10. The rules
  s = S("CONTENT"); title(s, "How You Score a Version");
  const rules = [["Unit cost", "Base cost + features"], ["Fit", "100%, +5% per nice-to-have, ÷2 per missing must-have"], ["Buyers", "Size × % who'd buy × Fit"], ["Profit", "Buyers × (Price − Unit cost)"]];
  rules.forEach((r, i) => {
    const x = 0.5 + i * 2.3;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.5, w: 2.1, h: 0.7, fill: { color: i === 3 ? OR : BR }, line: { color: i === 3 ? OR : BR } });
    txt(s, `${i + 1}. ${r[0]}`, { x, y: 1.5, w: 2.1, h: 0.7, fontSize: 17, bold: true, color: WH, align: "center", valign: "middle" });
    card(s, x, 2.3, 2.1, 1.8);
    txt(s, r[1], { x: x + 0.15, y: 2.4, w: 1.8, h: 1.6, fontSize: 14, align: "center", valign: "middle" });
  });
  txt(s, "Prices come from your case file's price list. Test at least two for every version.", { x: 0.5, y: 4.35, w: 9, h: 0.4, fontSize: 14, italics: true, color: GR, align: "center" });
  s.addNotes("These four steps are on your case file and in your guide. Walk through them once now, then we'll do Maya's numbers together.");

  // 11. Maya segments
  s = S("DARK");
  txt(s, "WORKED EXAMPLE", { x: 0.6, y: 0.45, w: 6, h: 0.35, fontSize: 13, bold: true, color: OL, charSpacing: 3 });
  txt(s, "Maya's Sneaker Restoration", { x: 0.6, y: 0.8, w: 9, h: 0.7, fontSize: 32, bold: true, color: WH });
  M.segs.forEach((sg, i) => {
    const x = 0.6 + i * 2.95;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.75, w: 2.7, h: 3.0, fill: { color: "5E4638" }, line: { color: OL, width: 1 } });
    txt(s, sg.key, { x: x + 0.15, y: 1.85, w: 2.4, h: 0.45, fontSize: 17, bold: true, color: OL });
    txt(s, `${sg.size} potential customers`, { x: x + 0.15, y: 2.3, w: 2.4, h: 0.3, fontSize: 11, color: CR });
    txt(s, `“${sg.quote}”`, { x: x + 0.15, y: 2.75, w: 2.4, h: 1.8, fontSize: 15, italics: true, color: WH });
  });
  s.addNotes("Maya is back. She restores sneakers and wants three packages instead of pricing every job by hand. Read the quotes. What does each group care about?");

  // 12. Maya survey chart
  s = S("CONTENT"); title(s, "What Does Each Segment Require?");
  s.addImage({ path: path.join(ROOT, "charts", "maya_features.png"), x: 0.4, y: 1.05, w: 5.9, h: 4.0 });
  txt(s, [{ text: "Read it like a scout", options: { fontSize: 14, bold: true, color: OR, breakLine: true } },
    { text: "Which features cross the must-have line for Collectors?", options: { fontSize: 16, bold: true, color: BR, breakLine: true } },
    { text: " ", options: { fontSize: 8, breakLine: true } },
    { text: "Which feature does nobody require?", options: { fontSize: 16, bold: true, color: BR } }],
    { x: 6.5, y: 1.4, w: 3.1, h: 3.2 });
  const mustB = M.feats.filter((f) => f.pct[1] >= 60).map((f) => f.name).join(", ");
  s.addNotes(`Collectors' must-haves: ${mustB}. Nobody requires the display box (top value ${Math.max(...M.feats[7].pct)}%).`);

  // 13-15. Version slides
  const verSlide = (si, label) => {
    const sg = M.segs[si], b = sg.best;
    const sl = S("CONTENT"); title(sl, `Version ${si + 1}: ${label}`);
    txt(sl, `For the ${sg.key}`, { x: 0.5, y: 1.0, w: 5, h: 0.35, fontSize: 14, bold: true, color: OR });
    card(sl, 0.5, 1.45, 4.2, 3.55);
    txt(sl, "Features", { x: 0.7, y: 1.55, w: 3.8, h: 0.35, fontSize: 13, bold: true, color: BR });
    const fl = b.feats.map((f) => {
      const ft = M.feats[f], tag = ft.pct[si] >= 60 ? "must" : ft.pct[si] >= 30 ? "nice" : "";
      return { text: `${ft.name}  ${money(ft.cost)}${tag ? `  (${tag})` : ""}`, options: { bullet: true, fontSize: 15, breakLine: true } };
    });
    fl[fl.length - 1].options.breakLine = false;
    txt(sl, fl, { x: 0.7, y: 2.0, w: 3.8, h: 2.0, paraSpaceAfter: 10, valign: "top" });
    txt(sl, `Unit cost: ${money(M.base)} base + features = ${money(b.cost)}`, { x: 0.7, y: 4.2, w: 3.9, h: 0.6, fontSize: 13, bold: true, color: BR });
    const rows = [["Price", "% buy", "Fit", "Buyers", "Profit"]];
    const tests = [b.pi - 1, b.pi, b.pi + 1].filter((k) => k >= 0 && k < M.prices.length);
    tests.forEach((k) => {
      const buyers = Math.round(sg.size * sg.wtp[k] / 100 * b.fit);
      rows.push([money(M.prices[k]), `${sg.wtp[k]}%`, `${Math.round(b.fit * 100)}%`, String(buyers), money(buyers * (M.prices[k] - b.cost))]);
    });
    sl.addTable(rows.map((r, ri) => r.map((c) => ({ text: c, options: {
      bold: ri === 0 || tests[ri - 1] === b.pi, color: ri === 0 ? WH : INK, fill: { color: ri === 0 ? BR : tests[ri - 1] === b.pi ? OL : WH },
      fontSize: 13, align: "center", valign: "middle" } }))),
      { x: 5.0, y: 1.45, w: 4.5, colW: [0.85, 0.8, 0.75, 0.9, 1.2], rowH: 0.45, border: { type: "solid", pt: 0.75, color: "B9AFA8" }, fontFace: "Arial" });
    txt(sl, `Best price: ${money(b.price)}  →  ${money(b.profit)} profit`, { x: 5.0, y: 3.55, w: 4.5, h: 0.45, fontSize: 16, bold: true, color: BR });
    return [sl, sg, b];
  };
  let [v, sg, b] = verSlide(0, "The Fresh Start");
  txt(v, "She skips repaint and the display box. Weekend Wearers would never pay for them.", { x: 5.0, y: 4.1, w: 4.5, h: 0.8, fontSize: 13, color: GR });
  v.addNotes(`Walk the math on the board: ${sg.size} x ${b.pct}% x 100% = ${b.buyers} buyers. ${b.buyers} x (${money(b.price)} - ${money(b.cost)}) = ${money(b.profit)}. Point out the higher price earns more per pair but less in total.`);
  [v, sg, b] = verSlide(1, "The Grail Treatment");
  txt(v, `Fresh laces is only a nice-to-have here, but it's cheap, so Fit goes to ${Math.round(b.fit * 100)}%.`, { x: 5.0, y: 4.1, w: 4.5, h: 0.8, fontSize: 13, color: GR });
  v.addNotes(`Collectors will pay ${money(b.price)}. Fewer customers, but each one is worth a lot more. Nice-to-have bonus: 5% for laces.`);
  [v, sg, b] = verSlide(2, "Game Day Rush");
  txt(v, "Totally different features: athletes care about rain, mud, and speed.", { x: 5.0, y: 4.1, w: 4.5, h: 0.8, fontSize: 13, color: GR });
  v.addNotes("Notice how little overlap there is with the Collector version besides deep clean. That's segmentation working.");

  // 16. The lineup
  s = S("CONTENT"); title(s, "Maya's Lineup");
  s.addChart(pres.charts.BAR, [{ name: "Profit", labels: M.segs.map((x) => x.key), values: M.segs.map((x) => x.best.profit) }],
    { x: 0.4, y: 1.1, w: 5.6, h: 3.9, barDir: "col", chartColors: [BR, OR, "8A7F78"], varyColors: true, showValue: true, dataLabelPosition: "outEnd",
      dataLabelFormatCode: "$#,##0", dataLabelFontSize: 13, dataLabelFontBold: true, dataLabelFontFace: "+mn-lt", dataLabelColor: INK, showLegend: false,
      valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" }, catAxisLabelFontSize: 12, catAxisLabelColor: INK, catAxisLabelFontFace: "+mn-lt" });
  txt(s, [{ text: "Total lineup profit", options: { fontSize: 14, bold: true, color: OR, breakLine: true } },
    { text: money(M.lineup), options: { fontSize: 44, bold: true, color: BR, breakLine: true } },
    { text: `Prices: ${M.segs.map((x) => money(x.best.price)).join(", ")}`, options: { fontSize: 15, color: INK } }],
    { x: 6.3, y: 1.7, w: 3.3, h: 2.5 });
  s.addNotes("Three packages, three prices, three different customers. Now: was all this work worth it?");

  // 17. Lineup vs one
  s = S("CONTENT"); title(s, "Was Three Versions Worth It?");
  s.addChart(pres.charts.BAR, [{ name: "Profit", labels: ["One version for everyone", "Three-version lineup"], values: [M.single.profit, M.lineup] }],
    { x: 0.4, y: 1.1, w: 5.6, h: 3.9, barDir: "col", chartColors: ["B9AFA8", OR], varyColors: true, showValue: true, dataLabelPosition: "outEnd",
      dataLabelFormatCode: "$#,##0", dataLabelFontSize: 14, dataLabelFontBold: true, dataLabelFontFace: "+mn-lt", dataLabelColor: INK, showLegend: false,
      valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" }, catAxisLabelFontSize: 12, catAxisLabelColor: INK, catAxisLabelFontFace: "+mn-lt" });
  const lift = Math.round((M.lineup / M.single.profit - 1) * 100);
  txt(s, [{ text: `${lift}% more profit`, options: { fontSize: 32, bold: true, color: BR, breakLine: true } },
    { text: " ", options: { fontSize: 8, breakLine: true } },
    { text: `Her best single package (${money(M.single.price)}) is too pricey for Weekend Wearers and leaves Collector money on the table.`, options: { fontSize: 15, color: INK } }],
    { x: 6.3, y: 1.6, w: 3.3, h: 3 });
  s.addNotes(`The best one-size-fits-all package (every segment, same features, same price) earns ${money(M.single.profit)}. That's Step 6 of your project.`);

  // 18. Trap: load everything
  s = S("CONTENT"); title(s, "Trap #1: Put Everything in Everything");
  const ww = M.segs[0];
  [[`All 8 features`, money(ww.loaded.cost) + " unit cost", money(ww.loaded.profit), "B9AFA8", INK], [`Just the must-haves`, money(ww.best.cost) + " unit cost", money(ww.best.profit), OR, WH]].forEach((r, i) => {
    const x = 0.8 + i * 4.4;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.4, w: 4.0, h: 2.8, fill: { color: r[3] }, line: { color: r[3] } });
    txt(s, r[0], { x, y: 1.55, w: 4.0, h: 0.5, fontSize: 18, bold: true, align: "center", color: r[4] });
    txt(s, r[1], { x, y: 2.05, w: 4.0, h: 0.4, fontSize: 14, align: "center", color: r[4] });
    txt(s, r[2], { x, y: 2.6, w: 4.0, h: 0.9, fontSize: 44, bold: true, align: "center", color: r[4] });
    txt(s, "profit from Weekend Wearers", { x, y: 3.5, w: 4.0, h: 0.4, fontSize: 13, align: "center", color: r[4] });
  });
  txt(s, "More features is not a better product if the customer won't pay for them.", { x: 0.5, y: 4.45, w: 9, h: 0.5, fontSize: 16, bold: true, color: BR, align: "center" });
  s.addNotes("Loading up raises the unit cost so much she has to charge a price Weekend Wearers won't pay.");

  // 19. Trap: cannibalization
  s = S("CONTENT"); title(s, "Trap #2: Cannibalization");
  s.addImage({ data: await icon(fa.FaExchangeAlt, OR), x: 0.8, y: 1.6, w: 1.6, h: 1.6 });
  txt(s, [{ text: "What stops a Collector from buying the $30 Fresh Start instead of the $80 Grail Treatment?", options: { fontSize: 22, bold: true, color: BR, breakLine: true } },
    { text: " ", options: { fontSize: 10, breakLine: true } },
    { text: "Cannibalization is when your cheaper version steals customers from your expensive one. Smart lineups keep each segment's must-haves in that segment's version.", options: { fontSize: 16, color: INK } }],
    { x: 2.9, y: 1.35, w: 6.6, h: 3.2 });
  s.addNotes("Answer: the Fresh Start doesn't have crease removal or repaint, the Collectors' must-haves. That missing must-have is the fence. You'll answer this question for your own lineup.");

  // 20. Quick check (graph reading)
  s = S("CONTENT"); title(s, "Quick Check");
  const ta = M.segs[2];
  const ansIdx = M.prices.indexOf(60);
  txt(s, `Using Maya's price chart, about what percent of ${ta.key} would buy a package priced at $60?`, { x: 0.5, y: 1.15, w: 9, h: 0.8, fontSize: 20, bold: true, color: BR });
  const opts = [`${ta.wtp[ansIdx]}%`, `${ta.wtp[ansIdx - 1]}%`, `${M.segs[0].wtp[ansIdx]}%`, `${M.segs[1].wtp[ansIdx]}%`];
  const order = [1, 0, 3, 2];
  order.forEach((oi, k) => {
    const x = 0.5 + (k % 2) * 4.6, y = 2.2 + Math.floor(k / 2) * 1.2;
    card(s, x, y, 4.3, 0.95);
    txt(s, `${"ABCD"[k]}.   ${opts[oi]}`, { x: x + 0.3, y, w: 3.8, h: 0.95, fontSize: 22, bold: true, valign: "middle", color: INK });
  });
  s.addNotes(`Answer: ${"ABCD"[order.indexOf(0)]} (${opts[0]}). Distractors: ${opts[1]} is the $45 point, ${opts[2]} is Weekend Wearers, ${opts[3]} is Collectors.`);

  // 21. Your mission
  s = S("CONTENT"); title(s, "Your Mission");
  const miss = ["Read your case file and do the warm-up", "Name your 3 segments", "Sort the features: must, nice, or blank", "Build a version for each segment", "Test at least 2 prices per version", "Compare your lineup to one version", "Build your slides and pitch it"];
  miss.forEach((m, i) => {
    const col = i < 4 ? 0 : 1, row = i < 4 ? i : i - 4;
    const x = 0.5 + col * 4.6, y = 1.25 + row * 0.92;
    s.addShape(pres.shapes.OVAL, { x, y, w: 0.6, h: 0.6, fill: { color: i === 6 ? OR : BR }, line: { color: i === 6 ? OR : BR } });
    txt(s, String(i + 1), { x, y, w: 0.6, h: 0.6, fontSize: 18, bold: true, color: WH, align: "center", valign: "middle" });
    txt(s, m, { x: x + 0.8, y, w: 3.6, h: 0.6, fontSize: 16, valign: "middle" });
  });
  s.addNotes("Pairs. Every step has a page in the Student Guide. Aim to finish through Step 5 today.");

  // 22. Deliverables + rubric
  s = S("CONTENT"); title(s, "What You'll Present");
  const del = ["Title: company + team", "Meet the Market: 3 segment names", "One slide per version", "The Lineup side by side", "Lineup vs. One Version", "Recommendation + one risk"];
  txt(s, del.map((t, i) => ({ text: t, options: { bullet: true, fontSize: 15, breakLine: i < del.length - 1 } })), { x: 0.5, y: 1.2, w: 4.3, h: 3.5, paraSpaceAfter: 8, valign: "top" });
  const rub = [["Segments", "4"], ["Feature choices", "6"], ["Pricing", "5"], ["Math", "5"], ["Presentation", "5"], ["Total", "25"]];
  s.addTable(rub.map((r, i) => r.map((c, j) => ({ text: c, options: { bold: i === 5 || j === 0, fontSize: 14, color: i === 5 ? WH : INK, fill: { color: i === 5 ? BR : i % 2 ? CR : WH }, align: j ? "center" : "left" } }))),
    { x: 5.3, y: 1.25, w: 4.2, colW: [3.0, 1.2], rowH: 0.48, border: { type: "solid", pt: 0.75, color: "B9AFA8" }, fontFace: "Arial" });
  s.addNotes("The template has every slide already laid out. Full rubric is on the last page of the guide.");

  // 23. Go
  s = S("DARK");
  txt(s, "Grab your case file.", { x: 0.6, y: 1.6, w: 8.8, h: 1.0, fontSize: 44, bold: true, color: WH });
  txt(s, "Start with the warm-up. Read the data before you build anything.", { x: 0.6, y: 2.7, w: 8.5, h: 0.6, fontSize: 20, color: OL });
  s.addNotes("Hand out case files. Circulate during the feature sort; that's where most mistakes start.");

  const out = path.join(ROOT, "out", "Build_the_Lineup_Launch_Deck.pptx");
  await pres.writeFile({ fileName: out });
  await applyTheme(out, THEME);
  console.log("deck ok");
})();
