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

// ---------------------------------------------------------------------------
// Decorative motifs
// ---------------------------------------------------------------------------

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

// A single plant cell: rounded wall, nucleus, a few organelle dots.
// Purely decorative background texture — kept very low-opacity.
function drawCell(doc, cx, cy, r, color, opacity) {
  doc.save();
  doc.opacity(opacity !== undefined ? opacity : 1);
  doc
    .roundedRect(cx - r, cy - r * 0.8, r * 2, r * 1.6, r * 0.5)
    .lineWidth(1.1)
    .stroke(color);
  doc
    .circle(cx - r * 0.15, cy - r * 0.05, r * 0.32)
    .lineWidth(1)
    .stroke(color);
  doc.circle(cx - r * 0.15, cy - r * 0.05, r * 0.1).fill(color);
  const dots = [
    [r * 0.4, r * 0.35],
    [-r * 0.55, r * 0.3],
    [r * 0.15, -r * 0.45],
    [r * 0.55, -r * 0.1],
  ];
  dots.forEach(([dx, dy]) => {
    doc.circle(cx + dx, cy + dy, r * 0.06).fill(color);
  });
  doc.restore();
  doc.opacity(1);
}

// A short run of DNA double-helix: two interleaved sine strands with
// connecting base-pair rungs. Oriented vertically.
function drawDNAHelix(doc, x, yTop, height, amplitude, turns, color, opacity) {
  doc.save();
  doc.opacity(opacity !== undefined ? opacity : 1);
  const steps = 60;
  const rungEvery = Math.floor(steps / (turns * 6));
  const strandA = [];
  const strandB = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const yy = yTop + t * height;
    const phase = t * turns * Math.PI * 2;
    strandA.push([x + Math.sin(phase) * amplitude, yy]);
    strandB.push([x + Math.sin(phase + Math.PI) * amplitude, yy]);
  }
  for (let i = 0; i < strandA.length; i += Math.max(rungEvery, 4)) {
    doc
      .moveTo(strandA[i][0], strandA[i][1])
      .lineTo(strandB[i][0], strandB[i][1])
      .lineWidth(1)
      .strokeOpacity(0.6)
      .stroke(color);
  }
  [strandA, strandB].forEach((strand) => {
    doc.moveTo(strand[0][0], strand[0][1]);
    for (let i = 1; i < strand.length; i++) {
      doc.lineTo(strand[i][0], strand[i][1]);
    }
    doc.lineWidth(2).strokeOpacity(1).stroke(color);
  });
  doc.restore();
  doc.opacity(1);
}

// Full decorative backdrop for a page: faint DNA strands down the edges,
// a scatter of cells, and leaf sprigs. Kept very low-opacity so it reads
// as texture, not clutter, and never competes with foreground content.
function drawPageBackdrop(doc, pageWidth, pageHeight) {
  drawDNAHelix(doc, pageWidth - 34, 150, pageHeight - 300, 13, 5, FOREST, 0.07);
  drawDNAHelix(doc, 26, 170, pageHeight - 340, 10, 4, GOLD_DARK, 0.06);

  drawCell(doc, 95, 250, 30, FOREST, 0.06);
  drawCell(doc, pageWidth - 110, 420, 24, LEAF, 0.06);
  drawCell(doc, 70, pageHeight - 260, 26, GOLD_DARK, 0.05);
  drawCell(doc, pageWidth - 90, pageHeight - 340, 20, FOREST, 0.05);

  drawWatermarkSprig(doc, pageWidth - 90, 260, 1.4);
  drawWatermarkSprig(doc, 70, pageHeight - 200, 1.2);
}

function sectionHeading(doc, text, x, y, width) {
  doc
    .fillColor(FOREST)
    .font("Heading-Bold")
    .fontSize(13)
    .text(text.toUpperCase(), x, y, { characterSpacing: 1 });
  const ty = doc.y + 3;
  doc
    .moveTo(x, ty)
    .lineTo(x + width, ty)
    .lineWidth(1.4)
    .strokeColor(GOLD)
    .stroke();
  doc.moveDown(0.6);
}

function drawTableRow(doc, cols, x, y, colWidths, opts = {}) {
  const rowHeight = opts.height || 23;
  if (opts.header) {
    doc
      .rect(
        x,
        y,
        colWidths.reduce((a, b) => a + b, 0),
        rowHeight
      )
      .fill(FOREST);
  } else if (opts.stripe) {
    doc
      .rect(
        x,
        y,
        colWidths.reduce((a, b) => a + b, 0),
        rowHeight
      )
      .fill(LEAF_LIGHT);
  }
  let cx = x;
  doc
    .font(opts.header ? "Body-Bold" : "Body")
    .fontSize(opts.fontSize || 9.5)
    .fillColor(opts.header ? WHITE : INK);
  cols.forEach((c, i) => {
    doc.text(String(c), cx + 8, y + rowHeight / 2 - 5, {
      width: colWidths[i] - 16,
      align: opts.aligns ? opts.aligns[i] : "left",
    });
    cx += colWidths[i];
  });
  return y + rowHeight;
}

// Renders a single "LABEL / value" pair at a fixed top-left position and
// returns how tall the value ended up (it may wrap to 2 lines on long
// text, e.g. school names) so callers can size rows correctly instead of
// using a fixed increment that risks overlap — this was the root cause
// of the overflow in the previous layout.
function drawDetailField(doc, label, value, x, y, width) {
  doc
    .font("Body-Bold")
    .fontSize(8.5)
    .fillColor(MUTED)
    .text(String(label).toUpperCase(), x, y, { characterSpacing: 0.4 });
  doc
    .font("Body")
    .fontSize(10.5)
    .fillColor(INK)
    .text(String(value || "—"), x, y + 13, { width });
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
  const pageHeight = doc.page.height;
  const margin = 42;
  const contentWidth = pageWidth - margin * 2;

  // ---- Background & header banner ----
  doc.rect(0, 0, pageWidth, pageHeight).fill(CREAM);
  drawPageBackdrop(doc, pageWidth, pageHeight);
  doc.rect(0, 0, pageWidth, 132).fill(FOREST);
  doc.rect(0, 128, pageWidth, 4).fill(GOLD);

  // A faint DNA strand woven into the header band for a biology accent.
  drawDNAHelix(doc, pageWidth - 200, -10, 150, 9, 2.4, GOLD, 0.16);

  // Emblem: institute logo in the header
  const logoPath = path.join(
    __dirname,
    "..",
    "assets",
    "images",
    "institute-logo.jpeg"
  );
  doc.save();
  doc
    .circle(margin + 30, 66, 27)
    .lineWidth(2)
    .stroke(GOLD);
  doc.circle(margin + 30, 66, 27).clip();
  doc.image(logoPath, margin + 3, 39, { width: 54, height: 54 });
  doc.restore();

  doc
    .fillColor(WHITE)
    .font("Heading-Black")
    .fontSize(21)
    .text("SOUMENDRA SIR", margin + 70, 32, { characterSpacing: 0.4 });
  doc
    .fillColor(GOLD)
    .font("Body-XBold")
    .fontSize(11.5)
    .text("BIOLOGY COACHING INSTITUTE", margin + 70, 59, {
      characterSpacing: 2.2,
    });
  doc
    .fillColor("#D7E4D2")
    .font("Body")
    .fontSize(9.5)
    .text(
      "Contact: 8910587106   |   Academic Progress Report",
      margin + 70,
      79
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

  // Central emblem — Saraswati artwork, framed and centered.
  const emblemPath = path.join(
    __dirname,
    "..",
    "assets",
    "images",
    "saraswati-emblem.jpeg"
  );
  const emblemSize = 92;
  const emblemCx = pageWidth / 2;
  const emblemCy = y + emblemSize / 2;
  doc.save();
  doc.circle(emblemCx, emblemCy, emblemSize / 2 + 5).fill(WHITE);
  doc
    .circle(emblemCx, emblemCy, emblemSize / 2 + 5)
    .lineWidth(1.6)
    .stroke(GOLD);
  doc.circle(emblemCx, emblemCy, emblemSize / 2).clip();
  doc.image(emblemPath, emblemCx - emblemSize / 2, emblemCy - emblemSize / 2, {
    width: emblemSize,
    height: emblemSize,
  });
  doc.restore();
  drawLeaf(
    doc,
    emblemCx - emblemSize / 2 - 22,
    emblemCy,
    20,
    200,
    GOLD_DARK,
    0.8
  );
  drawLeaf(
    doc,
    emblemCx + emblemSize / 2 + 2,
    emblemCy,
    20,
    20,
    GOLD_DARK,
    0.8
  );

  // Small cell flourishes flanking the emblem for a biology accent.
  drawCell(doc, emblemCx - emblemSize / 2 - 60, emblemCy, 12, GOLD_DARK, 0.35);
  drawCell(doc, emblemCx + emblemSize / 2 + 60, emblemCy, 12, GOLD_DARK, 0.35);

  y = emblemCy + emblemSize / 2 + 22;

  // ---- Student details card ----
  sectionHeading(doc, "Student Details", margin, y, contentWidth);
  y = doc.y + 4;

  const cardX = margin;
  const cardWidth = contentWidth;
  const colW = cardWidth / 2;
  const padX = 18;
  const padTop = 16;
  const rowGap = 12;
  const fieldWidth = colW - padX - 14;

  const fieldRows = [
    ["Name", student.name, "Class", student.class],
    ["School", student.school_name, "Guardian", student.guardian_name],
    [
      "Guardian Contact",
      student.guardian_contact,
      "Report Generated",
      generatedFor,
    ],
  ];

  // Pre-measure each row's height (accounts for wrapped long values, like
  // school names) so the card background and every field position below
  // it are computed from real text height instead of a fixed guess.
  doc.font("Body").fontSize(10.5);
  const rowHeights = fieldRows.map((r) => {
    const leftH = doc.heightOfString(String(r[1] || "—"), {
      width: fieldWidth,
    });
    const rightH = doc.heightOfString(String(r[3] || "—"), {
      width: fieldWidth,
    });
    return Math.max(leftH, rightH, 13);
  });
  const cardH =
    padTop * 2 +
    rowHeights.reduce((a, h) => a + 13 + h, 0) +
    rowGap * (fieldRows.length - 1);

  doc
    .roundedRect(cardX, y, cardWidth, cardH, 8)
    .fillAndStroke(WHITE, "#E1E8DC");

  let ry = y + padTop;
  fieldRows.forEach((r, i) => {
    drawDetailField(doc, r[0], r[1], cardX + padX, ry, fieldWidth);
    drawDetailField(doc, r[2], r[3], cardX + colW + padX, ry, fieldWidth);
    ry += 13 + rowHeights[i] + rowGap;
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
  const stripH = 62;
  doc.roundedRect(margin, y, contentWidth, stripH, 8).fill(FOREST);
  drawCell(doc, margin + contentWidth * 0.55, y + stripH / 2, 20, WHITE, 0.05);

  doc
    .fillColor("#CFE0C9")
    .font("Body-Bold")
    .fontSize(8.5)
    .text("TOTAL OBTAINED", margin + 24, y + 12, { characterSpacing: 0.4 });
  doc
    .fillColor(WHITE)
    .font("Heading-Bold")
    .fontSize(17)
    .text(`${totalObtained} / ${totalMax}`, margin + 24, y + 25);

  doc
    .fillColor("#CFE0C9")
    .font("Body-Bold")
    .fontSize(8.5)
    .text("PERCENTAGE", margin + 220, y + 12, { characterSpacing: 0.4 });
  doc
    .fillColor(WHITE)
    .font("Heading-Bold")
    .fontSize(17)
    .text(`${percentage.toFixed(2)}%`, margin + 220, y + 25);

  const badgeCx = margin + contentWidth - 60;
  const badgeCy = y + stripH / 2;
  doc.circle(badgeCx, badgeCy, 26).fill(GOLD);
  doc.circle(badgeCx, badgeCy, 21).fill(FOREST_DARK);
  doc
    .fillColor(GOLD)
    .font("Heading-Bold")
    .fontSize(16)
    .text(grade, badgeCx - 20, badgeCy - 10, { width: 40, align: "center" });
  doc
    .fillColor("#CFE0C9")
    .font("Body")
    .fontSize(8)
    .text(note, margin + contentWidth - 150, y + stripH - 16, {
      width: 130,
      align: "right",
    });

  y += stripH + 26;

  // ---- Quiz performance (MCQ + DPP), chapter-wise ----
  if (chapterStats && chapterStats.length > 0) {
    if (y > pageHeight - 220) {
      doc.addPage();
      doc.rect(0, 0, pageWidth, pageHeight).fill(CREAM);
      drawPageBackdrop(doc, pageWidth, pageHeight);
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
      if (y > pageHeight - 80) {
        doc.addPage();
        doc.rect(0, 0, pageWidth, pageHeight).fill(CREAM);
        drawPageBackdrop(doc, pageWidth, pageHeight);
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
  if (y > pageHeight - 130) {
    doc.addPage();
    doc.rect(0, 0, pageWidth, pageHeight).fill(CREAM);
    drawPageBackdrop(doc, pageWidth, pageHeight);
  }
  const footerY = pageHeight - 110;
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
      footerY + 12
    );

  const sigRight = pageWidth - margin;
  doc
    .fillColor(FOREST_DARK)
    .font("Signature")
    .fontSize(30)
    .text("S. Sinha", sigRight - 200, footerY + 24, {
      width: 200,
      align: "right",
    });

  doc.save();
  doc
    .moveTo(sigRight - 170, footerY + 62)
    .bezierCurveTo(
      sigRight - 130,
      footerY + 68,
      sigRight - 60,
      footerY + 56,
      sigRight,
      footerY + 62
    )
    .lineWidth(1.1)
    .strokeColor(GOLD_DARK)
    .stroke();
  doc.restore();

  doc
    .fillColor(MUTED)
    .font("Body-Bold")
    .fontSize(8.5)
    .text("SIGNATURE OF BIOLOGY FACULTY", sigRight - 200, footerY + 70, {
      width: 200,
      align: "right",
      characterSpacing: 0.6,
    });

  doc.end();
  return done;
}

module.exports = { buildReportCardBuffer };
