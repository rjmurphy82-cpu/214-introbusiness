// hersey.js : reusable John Hersey Intro to Business branding for docx builds.
// Brown band header + orange stripe, footer with page numbers, and helpers
// for headings, tables, callout boxes, and write-in lines. Letter size, Arial.
const d = require("docx");
const {
  Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  AlignmentType, Header, Footer, PageNumber, VerticalAlign, ImageRun, TabStopType,
} = d;

const C = {
  brown: "4C3629", orange: "E26F39", orangeLt: "F2955F", cream: "FBF3EC",
  tan: "EFE4DA", grey: "6B6B6B", ink: "222222", line: "B9AFA8", white: "FFFFFF",
};
const FONT = "Arial";
const PAGE = { width: 12240, height: 15840 };
const MARGIN = 864;                        // 0.6"
const CONTENT_W = PAGE.width - 2 * MARGIN; // 10512 dxa

const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };
const thin = (color = C.line) => ({ style: BorderStyle.SINGLE, size: 4, color });
const box = (color = C.line) => ({ top: thin(color), bottom: thin(color), left: thin(color), right: thin(color) });

function run(text, o = {}) {
  return new TextRun({ text, font: FONT, size: o.size || 20, bold: o.bold, italics: o.italics,
    color: o.color || C.ink, break: o.break });
}
function p(children, o = {}) {
  if (typeof children === "string") children = [run(children, o)];
  return new Paragraph({ children, alignment: o.align, spacing: { before: o.before ?? 0, after: o.after ?? 80, line: o.line },
    indent: o.indent, keepNext: o.keepNext, keepLines: o.keepLines, pageBreakBefore: o.pageBreak,
    tabStops: o.tabStops, border: o.border, numbering: o.numbering });
}
function h1(text, o = {}) {
  return p([run(text, { size: 34, bold: true, color: C.brown })], { after: 40, before: 0, keepNext: true, pageBreak: o.pageBreak });
}
function h2(text, o = {}) {
  return p([run(text.toUpperCase(), { size: 21, bold: true, color: C.brown })],
    { before: o.before ?? 160, after: 80, keepNext: true, pageBreak: o.pageBreak,
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: C.orange, space: 2 } } });
}
function h3(text, o = {}) {
  return p([run(text, { size: 21, bold: true, color: C.ink })], { before: o.before ?? 100, after: 40, keepNext: true });
}
function bullets(items, o = {}) {
  return items.map((t) => new Paragraph({ numbering: { reference: "bullets", level: 0 },
    children: Array.isArray(t) ? t : [run(t, { size: o.size || 19 })], spacing: { after: o.after ?? 30 } }));
}
function cell(children, o = {}) {
  if (!Array.isArray(children)) children = [children];
  children = children.map((c) => (typeof c === "string" ? p(c, { size: o.size, bold: o.bold, color: o.color, after: 0, align: o.align }) : c));
  return new TableCell({ children, width: { size: o.w, type: WidthType.DXA },
    shading: o.fill ? { type: ShadingType.CLEAR, color: "auto", fill: o.fill } : undefined,
    margins: { top: o.mt ?? 60, bottom: o.mb ?? 60, left: o.ml ?? 100, right: o.mr ?? 100 },
    verticalAlign: o.valign || VerticalAlign.CENTER, columnSpan: o.span, borders: o.borders });
}
function table(widths, rows, o = {}) {
  const total = widths.reduce((a, b) => a + b, 0);
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: widths,
    borders: o.borders || { top: thin(), bottom: thin(), left: thin(), right: thin(), insideHorizontal: thin(), insideVertical: thin() },
    rows: rows.map((r, ri) => new TableRow({ tableHeader: o.header && ri === 0, cantSplit: true,
      children: r.map((c, ci) => (c instanceof TableCell ? c : cell(c, { w: widths[ci], ...(o.cellOpts ? o.cellOpts(ri, ci) : {}) }))) })) });
}
// Brown header-row table: first row brown with white bold text.
function dataTable(widths, head, rows, o = {}) {
  const all = [head.map((h, i) => cell(h, { w: widths[i], fill: C.brown, bold: true, color: C.white, size: o.size || 18, align: o.align?.[i] })),
    ...rows.map((r, ri) => r.map((v, i) => (v instanceof TableCell ? v : cell(String(v), { w: widths[i], size: o.size || 18,
      fill: o.zebra && ri % 2 ? C.cream : undefined, align: o.align?.[i], bold: o.boldCol === i })))) ];
  return table(widths, all, { header: true });
}
function callout(children, o = {}) {
  if (!Array.isArray(children)) children = [children];
  return table([o.w || CONTENT_W], [[cell(children, { w: o.w || CONTENT_W, fill: o.fill || C.cream, ml: 160, mr: 160, mt: 100, mb: 100 })]],
    { borders: { top: thin(o.border || C.orange), bottom: thin(o.border || C.orange), left: { style: BorderStyle.SINGLE, size: 24, color: o.border || C.orange }, right: thin(o.border || C.orange) } });
}
function lines(n, o = {}) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(new Paragraph({ children: [run(" ")], spacing: { before: 0, after: 0, line: o.line || 400 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: i % 2 ? "8D8D8D" : "8C8C8C", space: 1 } } }));
  return out;
}
function spacer(after = 120) { return p([run("")], { after }); }
function image(buf, w, h) {
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
    children: [new ImageRun({ type: "png", data: buf, transformation: { width: w, height: h } })] });
}

function header(rightLabel) {
  const w1 = 6200, w2 = CONTENT_W - w1;
  const band = new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [w1, w2], borders: noBorders,
    rows: [new TableRow({ children: [
      cell([p([run("INTRO TO BUSINESS", { size: 26, bold: true, color: C.white })], { after: 0 }),
            p([run("John Hersey High School", { size: 16, color: C.orangeLt })], { after: 0 })],
        { w: w1, fill: C.brown, ml: 180, mt: 90, mb: 90 }),
      cell([p([run(rightLabel, { size: 17, bold: true, color: C.white })], { after: 0, align: AlignmentType.RIGHT })],
        { w: w2, fill: C.brown, mr: 180 }),
    ] })] });
  const stripe = new Paragraph({ spacing: { before: 0, after: 160 }, children: [run("", { size: 4 })],
    border: { top: { style: BorderStyle.SINGLE, size: 24, color: C.orange, space: 0 } } });
  return new Header({ children: [band, stripe] });
}
function footer(label) {
  return new Footer({ children: [new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }],
    border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.line, space: 4 } },
    children: [run(label, { size: 15, color: C.grey }), new TextRun({ children: ["\t", PageNumber.CURRENT], font: FONT, size: 15, color: C.grey })],
  })] });
}
function doc(sections, o = {}) {
  return new d.Document({
    creator: "Intro to Business", title: o.title || "Intro to Business",
    styles: { default: { document: { run: { font: FONT, size: 20 } } } },
    numbering: { config: [
      { reference: "bullets", levels: [{ level: 0, format: d.LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 360, hanging: 220 } } } }] },
      { reference: "numbers", levels: [{ level: 0, format: d.LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 360, hanging: 300 } } } }] },
    ] },
    sections: sections.map((s) => ({
      properties: { page: { size: PAGE, margin: { top: 1500, bottom: 800, left: MARGIN, right: MARGIN, header: 400, footer: 380 } } },
      headers: { default: header(s.headerLabel) }, footers: { default: footer(s.footerLabel) }, children: s.children,
    })),
  });
}
async function save(document, path) {
  const fs = require("fs");
  fs.writeFileSync(path, await d.Packer.toBuffer(document));
}

module.exports = { d, C, FONT, CONTENT_W, run, p, h1, h2, h3, bullets, cell, table, dataTable, callout, lines, spacer, image,
  header, footer, doc, save, noBorders, box, thin };
