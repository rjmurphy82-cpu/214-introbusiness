// Student slide template for the Build the Lineup presentation.
const path = require("path");
const pptxgen = require("pptxgenjs");
const { applyTheme } = require("/mnt/skills/public/pptx/scripts/apply_theme.js");

const BR = "4C3629", OR = "E26F39", OL = "F2955F", CR = "FBF3EC", TAN = "EFE4DA", INK = "222222", GR = "8A8A8A", WH = "FFFFFF";
const THEME = { name: "Hersey Intro to Business", headFontFace: "Arial", bodyFontFace: "Arial",
  colors: { dk1: INK, lt1: WH, dk2: BR, lt2: CR, accent1: BR, accent2: OR, accent3: OL, accent4: "8A7F78", accent5: "B9AFA8", accent6: "2F6F73", hlink: OR, folHlink: BR } };

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.title = "Build the Lineup - Student Template";
  pres.theme = { headFontFace: "Arial", bodyFontFace: "Arial" };
  pres.defineSlideMaster({ title: "DARK", background: { color: BR }, objects: [{ rect: { x: 0, y: 5.45, w: 10, h: 0.175, fill: { color: OR } } }] });
  pres.defineSlideMaster({ title: "CONTENT", background: { color: WH },
    objects: [{ rect: { x: 0, y: 0, w: 10, h: 0.08, fill: { color: OR } } },
      { text: { text: "Intro to Business  |  Build the Lineup", options: { x: 0.5, y: 5.25, w: 5, h: 0.25, fontSize: 8, color: GR, margin: 0 } } }] });

  const T = (s, t, o) => s.addText(t, { isTextBox: true, fontFace: "Arial", margin: 0.05, color: INK, ...o });
  const head = (s, t) => T(s, t, { x: 0.5, y: 0.3, w: 9, h: 0.75, fontSize: 28, bold: true, color: BR, valign: "middle", margin: 0 });
  const box = (s, x, y, w, h, prompt, o = {}) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: o.fill || CR }, line: { color: TAN, width: 1 }, rectRadius: 0.06 });
    T(s, prompt, { x: x + 0.15, y: y + 0.1, w: w - 0.3, h: h - 0.2, fontSize: o.size || 14, color: o.color || GR, valign: "top", italic: !o.bold, bold: o.bold });
  };

  let s = pres.addSlide({ masterName: "DARK" });
  T(s, "[Company Name]", { x: 0.6, y: 1.5, w: 8.8, h: 1.0, fontSize: 48, bold: true, color: WH });
  T(s, "Our Product Lineup", { x: 0.6, y: 2.5, w: 8.8, h: 0.6, fontSize: 22, color: OL });
  T(s, "[Partner 1]  &  [Partner 2]", { x: 0.6, y: 3.4, w: 8.8, h: 0.5, fontSize: 18, color: CR });

  s = pres.addSlide({ masterName: "CONTENT" }); head(s, "Meet the Market");
  ["A", "B", "C"].forEach((l, i) => {
    const x = 0.5 + i * 3.05;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.3, w: 2.85, h: 0.6, fill: { color: BR }, line: { color: BR } });
    T(s, `Segment ${l}: [Name]`, { x, y: 1.3, w: 2.85, h: 0.6, fontSize: 15, bold: true, color: WH, align: "center", valign: "middle" });
    box(s, x, 2.0, 2.85, 2.9, "[Size of segment]\n\n[Persona: describe one typical customer]\n\n[Add a picture that fits them]");
  });

  ["A", "B", "C"].forEach((l) => {
    s = pres.addSlide({ masterName: "CONTENT" }); head(s, `[Version Name] for Segment ${l}`);
    box(s, 0.5, 1.25, 4.3, 3.7, "Features included:\n• [Feature]  $[cost]\n• [Feature]  $[cost]\n• [Feature]  $[cost]\n\nUnit cost: $[base] + $[features] = $[total]");
    const rows = [["Price", "$[ ]"], ["% who would buy", "[ ]%"], ["Fit", "[ ]%"], ["Buyers", "[ ]"], ["Profit", "$[ ]"]];
    s.addTable(rows.map((r, i) => r.map((c, j) => ({ text: c, options: { fontSize: 14, bold: j === 0, color: j ? GR : INK, fill: { color: j ? WH : TAN } } }))),
      { x: 5.1, y: 1.25, w: 4.4, colW: [2.2, 2.2], rowH: 0.45, border: { type: "solid", pt: 0.75, color: "B9AFA8" }, fontFace: "Arial" });
    box(s, 5.1, 3.7, 4.4, 1.25, "Why this segment will want it: [use the survey data]");
  });

  s = pres.addSlide({ masterName: "CONTENT" }); head(s, "The Lineup");
  const hdr = ["Version", "Segment", "Price", "Unit cost", "Buyers", "Profit"];
  const body = [1, 2, 3].map(() => ["[ ]", "[ ]", "$[ ]", "$[ ]", "[ ]", "$[ ]"]);
  body.push(["Total", "", "", "", "[ ]", "$[ ]"]);
  s.addTable([hdr, ...body].map((r, i) => r.map((c) => ({ text: c, options: { fontSize: 14, bold: i === 0 || i === 4, color: i === 0 ? WH : i === 4 ? BR : GR,
    fill: { color: i === 0 ? BR : i === 4 ? TAN : WH }, align: "center", valign: "middle" } }))),
    { x: 0.5, y: 1.3, w: 9, colW: [2.0, 1.8, 1.2, 1.3, 1.2, 1.5], rowH: 0.55, border: { type: "solid", pt: 0.75, color: "B9AFA8" }, fontFace: "Arial" });
  box(s, 0.5, 4.2, 9, 0.75, "[Optional: add a bar chart of profit by version]");

  s = pres.addSlide({ masterName: "CONTENT" }); head(s, "One Version vs. Our Lineup");
  box(s, 0.5, 1.3, 4.3, 2.4, "If we sold our Segment B version to everyone at one price:\n\nTotal profit: $[ ]", { size: 16 });
  box(s, 5.2, 1.3, 4.3, 2.4, "Our three-version lineup:\n\nTotal profit: $[ ]", { size: 16 });
  box(s, 0.5, 3.9, 9, 1.05, "Was building three versions worth it? Why? [one or two sentences]");

  s = pres.addSlide({ masterName: "CONTENT" }); head(s, "Our Recommendation");
  box(s, 0.5, 1.3, 9, 1.6, "Launch first: [which version] because [reason backed by numbers]", { size: 16 });
  box(s, 0.5, 3.1, 9, 1.85, "One risk to watch: [cannibalization, a competitor, a segment that might shrink...] and how our lineup handles it", { size: 16 });

  const out = path.join(__dirname, "..", "out", "Build_the_Lineup_Student_Template.pptx");
  await pres.writeFile({ fileName: out });
  await applyTheme(out, THEME);
  console.log("template ok");
})();
