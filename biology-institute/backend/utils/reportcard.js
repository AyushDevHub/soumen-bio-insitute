const path = require("path");
const PDFDocument = require("pdfkit");

// Palette — deep forest green + gold, biology/botanical feel.
const FOREST = "#1F4A2C";
const FOREST_DARK = "#123018";
const LEAF = "#2F6B3A";
const LEAF_LIGHT = "#E7F3E4";
const GOLD = "#C9A24B";
const GOLD_DARK = "#9C7A2E";
const INK = "#22301F";
const MUTED = "#6B7A63";
const CREAM = "#FBF9F2";
const WHITE = "#FFFFFF";

const FONT_DIR = path.join(__dirname, "..", "assets", "fonts");
const FONTS = {
  headingBlack: path.join(FONT_DIR, "Fraunces-Black.woff"),
  headingBold: path.join(FONT_DIR, "Fraunces-Bold.woff"),
  body: path.join(FONT_DIR, "Manrope-Regular.woff"),
  bodyBold: path.join(FONT_DIR, "Manrope-Bold.woff"),
  bodyExtraBold: path.join(FONT_DIR, "Manrope-ExtraBold.woff"),
  signature: path.join(FONT_DIR, "DancingScript-Bold.woff"),
};

function registerFonts(doc) {
  doc.registerFont("Heading-Black", FONTS.headingBlack);
  doc.registerFont("Heading-Bold", FONTS.headingBold);
  doc.registerFont("Body", FONTS.body);
  doc.registerFont("Body-Bold", FONTS.bodyBold);
  doc.registerFont("Body-XBold", FONTS.bodyExtraBold);
  doc.registerFont("Signature", FONTS.signature);
}

function gradeFor(pct) {
  if (pct >= 90) return { grade: "A+", note: "Outstanding" };
  if (pct >= 80) return { grade: "A", note: "Excellent" };
  if (pct >= 70) return { grade: "B+", note: "Very Good" };
  if (pct >= 60) return { grade: "B", note: "Good" };
  if (pct >= 50) return { grade: "C", note: "Satisfactory" };
  if (pct >= 33) return { grade: "D", note: "Needs Improvement" };
  return { grade: "F", note: "Needs Improvement" };
}

// A simple stylised leaf, drawn with bezier curves, used as a recurring motif.
function drawLeaf(doc, x, y, size, angle, color, opacity) {
  doc.save();
  doc.translate(x, y).rotate(angle);
  doc.opacity(opacity !== undefined ? opacity : 1);
  doc
    .moveTo(0, 0)
    .bezierCurveTo(size * 0.5, -size * 0.6, size, -size * 0.2, size * 1.1, 0)
    .bezierCurveTo(size, size * 0.2, size * 0.5, size * 0.6, 0, 0)
    .fill(color);
  doc
    .moveTo(0, 0)
    .lineTo(size * 1.05, 0)
    .lineWidth(0.6)
    .strokeOpacity(0.5)
    .stroke(FOREST_DARK);
  doc.restore();
  doc.opacity(1);
}

function drawWatermarkSprig(doc, cx, cy, scale) {
  doc.save();
  doc.opacity(0.06);
  for (let i = -2; i <= 2; i++) {
    drawLeaf(doc, cx, cy - i * 6 * scale, 40 * scale, i * 18, FOREST, 1);
  }
  doc.restore();
  doc.opacity(1);
}

function sectionHeading(doc, text, x, y, width) {
  doc
    .fillColor(FOREST)
    .font("Heading-Bold")
    .fontSize(13)
    .text(text.toUpperCase(), x, y, { characterSpacing: 1, width });
  const ty = doc.y + 3;
  doc
    .moveTo(x, ty)
    .lineTo(x + width, ty)
    .lineWidth(1.4)
    .strokeColor(GOLD)
    .stroke();
  doc.moveDown(0.6);
}

// Truncate text with an ellipsis so it never wraps/overflows a fixed-height cell.
function fitText(doc, text, maxWidth) {
  const str = String(text ?? "");
  if (doc.widthOfString(str) <= maxWidth) return str;
  const ell = "…";
  let lo = 0,
    hi = str.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (doc.widthOfString(str.slice(0, mid) + ell) <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return str.slice(0, lo) + ell;
}

// Row height computed from the actual content instead of a fixed guess,
// so long topics/chapter names never spill outside the row background.
function drawTableRow(doc, cols, x, y, colWidths, opts = {}) {
  const fontSize = opts.fontSize || 9.5;
  doc.font(opts.header ? "Body-Bold" : "Body").fontSize(fontSize);

  const padX = 8;
  const padY = 7;
  let maxLines = 1;
  cols.forEach((c, i) => {
    const h = doc.heightOfString(String(c), { width: colWidths[i] - padX * 2 });
    const lines = Math.max(1, Math.round(h / (fontSize * 1.2)));
    maxLines = Math.max(maxLines, lines);
  });
  const rowHeight = Math.max(
    opts.height || 23,
    maxLines * fontSize * 1.25 + padY * 2
  );

  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  if (opts.header) {
    doc.rect(x, y, totalWidth, rowHeight).fill(FOREST);
  } else if (opts.stripe) {
    doc.rect(x, y, totalWidth, rowHeight).fill(LEAF_LIGHT);
  }

  let cx = x;
  doc
    .font(opts.header ? "Body-Bold" : "Body")
    .fontSize(fontSize)
    .fillColor(opts.header ? WHITE : INK);
  cols.forEach((c, i) => {
    doc.text(
      String(c),
      cx + padX,
      y + rowHeight / 2 - (maxLines * fontSize * 1.2) / 2 + 2,
      {
        width: colWidths[i] - padX * 2,
        align: opts.aligns ? opts.aligns[i] : "left",
      }
    );
    cx += colWidths[i];
  });
  return y + rowHeight;
}

async function buildReportCardBuffer({
  student,
  marksRows,
  chapterStats,
  generatedFor,
}) {
  const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true });
  registerFonts(doc);

  const chunks = [];
  doc.on("data", (c) => chunks.push(c));
  const done = new Promise((resolve) =>
    doc.on("end", () => resolve(Buffer.concat(chunks)))
  );

  const pageWidth = doc.page.width;
  const margin = 42;
  const contentWidth = pageWidth - margin * 2;

  const newPage = () => {
    doc.addPage();
    doc.rect(0, 0, pageWidth, doc.page.height).fill(CREAM);
  };

  // ---- Background & header banner ----
  doc.rect(0, 0, pageWidth, doc.page.height).fill(CREAM);
  doc.rect(0, 0, pageWidth, 132).fill(FOREST);
  doc.rect(0, 128, pageWidth, 4).fill(GOLD);

  drawWatermarkSprig(doc, pageWidth - 90, 260, 1.4);
  drawWatermarkSprig(doc, 70, doc.page.height - 200, 1.2);

  // Emblem: simple circular leaf badge
  doc.save();
  doc.circle(margin + 30, 62, 26).fill(GOLD);
  doc.circle(margin + 30, 62, 21).fill(FOREST);
  drawLeaf(doc, margin + 18, 62, 18, -20, GOLD, 1);
  drawLeaf(doc, margin + 30, 62, 18, 25, GOLD, 0.9);
  doc.restore();

  const titleMaxWidth = pageWidth - margin - 70 - 170; // leave room for the right-aligned block
  doc
    .fillColor(WHITE)
    .font("Heading-Black")
    .fontSize(21)
    .text(fitText(doc, "SOUMENDRA SIR", titleMaxWidth), margin + 70, 32, {
      characterSpacing: 0.4,
      width: titleMaxWidth,
    });
  doc
    .fillColor(GOLD)
    .font("Body-XBold")
    .fontSize(11.5)
    .text(
      fitText(doc, "BIOLOGY COACHING INSTITUTE", titleMaxWidth),
      margin + 70,
      59,
      {
        characterSpacing: 2.2,
        width: titleMaxWidth,
      }
    );
  doc
    .fillColor("#D7E4D2")
    .font("Body")
    .fontSize(9.5)
    .text(
      "Contact: 8910587106   |   Academic Progress Report",
      margin + 70,
      79,
      { width: titleMaxWidth }
    );

  doc
    .fillColor(WHITE)
    .font("Body-XBold")
    .fontSize(11)
    .text("REPORT CARD", pageWidth - margin - 160, 40, {
      width: 160,
      align: "right",
      characterSpacing: 0.6,
    });
  doc
    .fillColor("#D7E4D2")
    .font("Body")
    .fontSize(9)
    .text(`Issued: ${generatedFor}`, pageWidth - margin - 160, 58, {
      width: 160,
      align: "right",
    });

  let y = 160;

  // ---- Student details card ----
  sectionHeading(doc, "Student Details", margin, y, contentWidth);
  y = doc.y + 4;

  const colW = contentWidth / 2;
  const valueWidth = colW - 32;
  const rowsData = [
    ["Name", student.name, "Class", student.class],
    ["School", student.school_name, "Guardian", student.guardian_name],
    [
      "Guardian Contact",
      student.guardian_contact,
      "Report Generated",
      generatedFor,
    ],
  ];

  // Measure each row's real height first (labels are single-line by design;
  // values can wrap to 2 lines max, then truncate) so the card never clips content.
  doc.font("Body").fontSize(10.5);
  const rowHeights = rowsData.map((r) => {
    const hLeft = doc.heightOfString(fitText(doc, r[1], valueWidth * 2), {
      width: valueWidth,
    });
    const hRight = doc.heightOfString(fitText(doc, r[3], valueWidth * 2), {
      width: valueWidth,
    });
    return Math.max(
      30,
      Math.min(hLeft, hRight === hLeft ? hLeft : Math.max(hLeft, hRight)) + 24
    );
  });
  const cardH = 24 + rowHeights.reduce((a, b) => a + b, 0);

  doc
    .roundedRect(margin, y, contentWidth, cardH, 8)
    .fillAndStroke(WHITE, "#E1E8DC");

  let ry = y + 12;
  rowsData.forEach((r, i) => {
    doc
      .font("Body-Bold")
      .fontSize(8.5)
      .fillColor(MUTED)
      .text(r[0].toUpperCase(), margin + 16, ry, { characterSpacing: 0.4 });
    doc
      .font("Body")
      .fontSize(10.5)
      .fillColor(INK)
      .text(fitText(doc, r[1], valueWidth * 2), margin + 16, ry + 12, {
        width: valueWidth,
      });
    doc
      .font("Body-Bold")
      .fontSize(8.5)
      .fillColor(MUTED)
      .text(r[2].toUpperCase(), margin + colW + 8, ry, {
        characterSpacing: 0.4,
      });
    doc
      .font("Body")
      .fontSize(10.5)
      .fillColor(INK)
      .text(fitText(doc, r[3], valueWidth * 2), margin + colW + 8, ry + 12, {
        width: valueWidth,
      });
    ry += rowHeights[i];
  });
  y += cardH + 26;

  // ---- Performance record table ----
  sectionHeading(doc, "Performance Record", margin, y, contentWidth);
  y = doc.y + 6;

  const totalObtained = marksRows.reduce(
    (s, m) => s + Number(m.marks_obtained),
    0
  );
  const totalMax = marksRows.reduce((s, m) => s + Number(m.total_marks), 0);
  const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
  const { grade, note } = gradeFor(percentage);

  const widths = [
    contentWidth * 0.32,
    contentWidth * 0.32,
    contentWidth * 0.18,
    contentWidth * 0.18,
  ];
  y = drawTableRow(
    doc,
    ["Exam / Test", "Topic", "Marks", "Total"],
    margin,
    y,
    widths,
    {
      header: true,
      aligns: ["left", "left", "center", "center"],
    }
  );
  marksRows.forEach((m, i) => {
    if (y > doc.page.height - 60) {
      newPage();
      y = 50;
    }
    y = drawTableRow(
      doc,
      [m.exam_name, m.topic, m.marks_obtained, m.total_marks],
      margin,
      y,
      widths,
      { stripe: i % 2 === 1, aligns: ["left", "left", "center", "center"] }
    );
  });
  y += 14;

  // ---- Summary strip: total / percentage / grade badge ----
  // Three clean columns, nothing floats outside the box.
  if (y > doc.page.height - 100) {
    newPage();
    y = 50;
  }
  const stripH = 68;
  doc.roundedRect(margin, y, contentWidth, stripH, 8).fill(FOREST);

  const col1X = margin + 24;
  const col2X = margin + contentWidth * 0.38;
  const badgeCx = margin + contentWidth - 62;
  const badgeCy = y + stripH / 2;

  doc
    .fillColor("#CFE0C9")
    .font("Body-Bold")
    .fontSize(8.5)
    .text("TOTAL OBTAINED", col1X, y + 14, { characterSpacing: 0.4 });
  doc
    .fillColor(WHITE)
    .font("Heading-Bold")
    .fontSize(17)
    .text(`${totalObtained} / ${totalMax}`, col1X, y + 28);

  doc
    .fillColor("#CFE0C9")
    .font("Body-Bold")
    .fontSize(8.5)
    .text("PERCENTAGE", col2X, y + 14, { characterSpacing: 0.4 });
  doc
    .fillColor(WHITE)
    .font("Heading-Bold")
    .fontSize(17)
    .text(`${percentage.toFixed(2)}%`, col2X, y + 28);

  // Grade badge: circle + letter, with the note stacked directly beneath it,
  // both centered as one unit so nothing can drift outside the strip.
  doc.circle(badgeCx, badgeCy - 6, 22).fill(GOLD);
  doc.circle(badgeCx, badgeCy - 6, 17.5).fill(FOREST_DARK);
  doc
    .fillColor(GOLD)
    .font("Heading-Bold")
    .fontSize(14)
    .text(grade, badgeCx - 30, badgeCy - 13, { width: 60, align: "center" });
  doc
    .fillColor("#CFE0C9")
    .font("Body-Bold")
    .fontSize(7.5)
    .text(fitText(doc, note.toUpperCase(), 100), badgeCx - 60, badgeCy + 20, {
      width: 120,
      align: "center",
      characterSpacing: 0.3,
    });

  y += stripH + 26;

  // ---- Quiz performance (MCQ + DPP), chapter-wise ----
  if (chapterStats && chapterStats.length > 0) {
    if (y > doc.page.height - 140) {
      newPage();
      y = 50;
    }
    sectionHeading(
      doc,
      "Chapter-wise Quiz Performance (MCQ & DPP)",
      margin,
      y,
      contentWidth
    );
    y = doc.y + 6;
    const qw = [
      contentWidth * 0.34,
      contentWidth * 0.22,
      contentWidth * 0.22,
      contentWidth * 0.22,
    ];
    y = drawTableRow(
      doc,
      ["Chapter", "MCQ Accuracy", "DPP Attempted", "DPP Accuracy"],
      margin,
      y,
      qw,
      { header: true, aligns: ["left", "center", "center", "center"] }
    );
    chapterStats.forEach((c, i) => {
      const mcqAcc = c.mcq_total
        ? `${Math.round((c.mcq_correct / c.mcq_total) * 100)}% (${
            c.mcq_correct
          }/${c.mcq_total})`
        : "—";
      const dppAtt = c.dpp_total ? `${c.dpp_attempted}/${c.dpp_total}` : "—";
      const dppAcc = c.dpp_attempted
        ? `${Math.round((c.dpp_correct / c.dpp_attempted) * 100)}%`
        : "—";
      if (y > doc.page.height - 80) {
        newPage();
        y = 50;
      }
      y = drawTableRow(
        doc,
        [c.chapter_name, mcqAcc, dppAtt, dppAcc],
        margin,
        y,
        qw,
        {
          stripe: i % 2 === 1,
          aligns: ["left", "center", "center", "center"],
        }
      );
    });
    y += 20;
  }

  // ---- Footer / signature ----
  if (y > doc.page.height - 130) {
    newPage();
  }
  const footerY = doc.page.height - 110;
  doc
    .moveTo(margin, footerY)
    .lineTo(pageWidth - margin, footerY)
    .lineWidth(0.7)
    .strokeColor("#C9D4C2")
    .stroke();
  doc
    .fillColor(MUTED)
    .font("Body")
    .fontSize(8.5)
    .text(
      "This report reflects recorded exam marks and quiz activity as of the date of issue.",
      margin,
      footerY + 12,
      { width: contentWidth - 220 }
    );

  // Cursive signature, sitting just above a thin gold flourish rule.
  const sigRight = pageWidth - margin;
  doc
    .fillColor(FOREST_DARK)
    .font("Signature")
    .fontSize(28)
    .text("S. Sinha", sigRight - 200, footerY + 20, {
      width: 200,
      align: "right",
    });

  doc.save();
  doc
    .moveTo(sigRight - 170, footerY + 58)
    .bezierCurveTo(
      sigRight - 130,
      footerY + 64,
      sigRight - 60,
      footerY + 52,
      sigRight,
      footerY + 58
    )
    .lineWidth(1.1)
    .strokeColor(GOLD_DARK)
    .stroke();
  doc.restore();

  doc
    .fillColor(MUTED)
    .font("Body-Bold")
    .fontSize(8.5)
    .text("SIGNATURE OF BIOLOGY FACULTY", sigRight - 200, footerY + 66, {
      width: 200,
      align: "right",
      characterSpacing: 0.6,
    });

  doc.end();
  return done;
}

module.exports = { buildReportCardBuffer };
