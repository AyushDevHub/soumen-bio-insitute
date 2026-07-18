const express = require("express");
const { v4: uuid } = require("uuid");
const { query, queryOne } = require("../db");
const { authRequired, adminOnly } = require("../middleware/auth");
const { buildReportCardBuffer } = require("../utils/reportcard");

const router = express.Router();

function canAccessStudent(req, student) {
  if (!student) return false;
  if (req.user.role === "admin") return true;
  if (student.user_id === req.user.id) return true;
  if (student.parent_user_id === req.user.id) return true;
  return false;
}

router.post("/", authRequired, adminOnly, async (req, res) => {
  try {
    const {
      student_id,
      exam_name,
      topic,
      marks_obtained,
      total_marks,
      remarks,
    } = req.body;
    if (
      !student_id ||
      !exam_name ||
      !topic ||
      marks_obtained === undefined ||
      !total_marks
    ) {
      return res
        .status(400)
        .json({ error: "Please fill in all marks fields." });
    }
    const id = uuid();
    await query(
      `INSERT INTO marks (id, student_id, exam_name, topic, marks_obtained, total_marks, remarks)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        id,
        student_id,
        exam_name,
        topic,
        marks_obtained,
        total_marks,
        remarks || null,
      ]
    );
    res.json({ message: "Marks recorded successfully.", id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Something went wrong while saving marks." });
  }
});

router.get("/student/:studentId", authRequired, async (req, res) => {
  const student = await queryOne("SELECT * FROM students WHERE id = $1", [
    req.params.studentId,
  ]);
  if (!canAccessStudent(req, student)) {
    return res
      .status(403)
      .json({ error: "You do not have access to these records." });
  }
  const rows = await query(
    "SELECT * FROM marks WHERE student_id = $1 ORDER BY created_at DESC",
    [req.params.studentId]
  );
  res.json(rows);
});

router.delete("/:id", authRequired, adminOnly, async (req, res) => {
  await query("DELETE FROM marks WHERE id = $1", [req.params.id]);
  res.json({ message: "Mark entry removed." });
});

router.get("/report-card/:studentId", authRequired, async (req, res) => {
  try {
    const student = await queryOne("SELECT * FROM students WHERE id = $1", [
      req.params.studentId,
    ]);
    if (!canAccessStudent(req, student)) {
      return res
        .status(403)
        .json({ error: "You do not have access to this report card." });
    }
    const marksRows = await query(
      "SELECT * FROM marks WHERE student_id = $1 ORDER BY created_at ASC",
      [req.params.studentId]
    );

    // Chapter-wise MCQ + DPP performance, pulled straight from quiz activity,
    // scored using each set's positive/negative marking scheme.
    const statRows = await query(
      `SELECT
         c.name AS chapter_name,
         ms.content_type,
         ms.positive_marks,
         ms.negative_marks,
         COUNT(mq.id)::int AS total_questions,
         COUNT(mr.id)::int AS attempted,
         COUNT(mr.id) FILTER (WHERE mr.is_correct)::int AS correct
       FROM mcq_sets ms
       JOIN chapters c ON c.id = ms.chapter_id
       JOIN mcq_questions mq ON mq.set_id = ms.id
       LEFT JOIN mcq_responses mr
         ON mr.question_id = mq.id AND mr.student_id = $1
       GROUP BY c.name, ms.content_type, ms.positive_marks, ms.negative_marks
       ORDER BY c.name`,
      [req.params.studentId]
    );

    if (marksRows.length === 0 && statRows.every((r) => r.attempted === 0)) {
      return res.status(400).json({
        error:
          "No marks or quiz activity have been recorded for this student yet.",
      });
    }

    const byChapter = {};
    const mcqScoreRows = [];
    for (const r of statRows) {
      if (!byChapter[r.chapter_name]) {
        byChapter[r.chapter_name] = {
          chapter_name: r.chapter_name,
          mcq_total: 0,
          mcq_correct: 0,
          dpp_total: 0,
          dpp_attempted: 0,
          dpp_correct: 0,
        };
      }
      const bucket = byChapter[r.chapter_name];
      const wrong = r.attempted - r.correct;
      const scoreObtained =
        r.correct * Number(r.positive_marks) - wrong * Number(r.negative_marks);
      const scoreMax = r.total_questions * Number(r.positive_marks);

      if (r.content_type === "mcq") {
        bucket.mcq_total += r.total_questions;
        bucket.mcq_correct += r.correct;
      } else {
        bucket.dpp_total += r.total_questions;
        bucket.dpp_attempted += r.attempted;
        bucket.dpp_correct += r.correct;
      }

      // Only fold attempted quizzes into the scored total — an untouched
      // set shouldn't silently drag the student's percentage down.
      if (r.attempted > 0) {
        mcqScoreRows.push({
          exam_name: `${r.chapter_name} — ${
            r.content_type === "dpp" ? "DPP" : "MCQ"
          } Quiz`,
          topic: "Auto-graded",
          marks_obtained: Math.max(0, Math.round(scoreObtained * 100) / 100),
          total_marks: Math.round(scoreMax * 100) / 100,
        });
      }
    }
    const chapterStats = Object.values(byChapter);
    const combinedMarksRows = [...marksRows, ...mcqScoreRows];

    const generatedFor = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const buffer = await buildReportCardBuffer({
      student,
      marksRows: combinedMarksRows,
      chapterStats,
      generatedFor,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${student.name.replace(
        /\s+/g,
        "_"
      )}_Report_Card.pdf"`
    );
    res.send(buffer);
  } catch (e) {
    console.error(e);
    res.status(500).json({
      error: "Something went wrong while generating the report card.",
    });
  }
});

module.exports = router;
