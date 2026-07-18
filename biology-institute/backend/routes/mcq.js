const express = require("express");
const multer = require("multer");
const { v4: uuid } = require("uuid");
const { query, queryOne } = require("../db");
const { authRequired, adminOnly } = require("../middleware/auth");
const { uploadBufferToCloudinary } = require("../utils/cloudinary");
const { viewerClasses } = require("../utils/access");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

async function studentIdFor(req) {
  if (req.user.role !== "student") return null;
  const student = await queryOne("SELECT id FROM students WHERE user_id = $1", [
    req.user.id,
  ]);
  return student ? student.id : null;
}

router.post(
  "/sets",
  authRequired,
  adminOnly,
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "worksheet", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        title,
        class: className,
        questions,
        chapter_id,
        content_type,
      } = req.body;
      const type = content_type === "dpp" ? "dpp" : "mcq";

      if (!title) {
        return res.status(400).json({ error: "Please provide a title." });
      }
      if (!chapter_id) {
        return res.status(400).json({ error: "Please choose a chapter." });
      }

      let parsedQuestions = [];
      if (questions) {
        parsedQuestions = JSON.parse(questions);
        if (!Array.isArray(parsedQuestions)) parsedQuestions = [];
      }

      const photoFile = req.files?.photo?.[0];
      const worksheetFile = req.files?.worksheet?.[0];

      // DPPs can be a downloadable worksheet with no auto-graded questions,
      // an auto-graded question set, or both together.
      if (type === "dpp" && parsedQuestions.length === 0 && !worksheetFile) {
        return res.status(400).json({
          error:
            "Please add at least one question or attach a worksheet PDF for this DPP.",
        });
      }
      if (type === "mcq" && parsedQuestions.length === 0) {
        return res
          .status(400)
          .json({ error: "Please add at least one question." });
      }

      const setId = uuid();
      let photoUrl = null;
      let photoPublicId = null;
      if (photoFile) {
        const uploaded = await uploadBufferToCloudinary(
          photoFile.buffer,
          "soumendra-biology-institute/mcq"
        );
        photoUrl = uploaded.url;
        photoPublicId = uploaded.publicId;
      }

      let worksheetUrl = null;
      let worksheetPublicId = null;
      if (worksheetFile) {
        const uploaded = await uploadBufferToCloudinary(
          worksheetFile.buffer,
          "soumendra-biology-institute/dpp-worksheets",
          "raw"
        );
        worksheetUrl = uploaded.url;
        worksheetPublicId = uploaded.publicId;
      }

      await query(
        `INSERT INTO mcq_sets
          (id, title, class, chapter_id, content_type, photo_path, photo_public_id, worksheet_path, worksheet_public_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          setId,
          title,
          className || null,
          chapter_id,
          type,
          photoUrl,
          photoPublicId,
          worksheetUrl,
          worksheetPublicId,
        ]
      );

      for (const q of parsedQuestions) {
        if (!q.question || !q.a || !q.b || !q.c || !q.d || !q.correct) continue;
        await query(
          `INSERT INTO mcq_questions (id, set_id, question, option_a, option_b, option_c, option_d, correct_option)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [uuid(), setId, q.question, q.a, q.b, q.c, q.d, q.correct]
        );
      }

      res.json({
        message: type === "dpp" ? "DPP published." : "MCQ set published.",
        setId,
      });
    } catch (e) {
      console.error(e);
      res
        .status(500)
        .json({ error: "Something went wrong while publishing this content." });
    }
  }
);

// GET /api/mcq/sets?chapter_id=xxx&content_type=mcq|dpp
router.get("/sets", authRequired, async (req, res) => {
  const { chapter_id, content_type } = req.query;

  if (chapter_id) {
    const classes = await viewerClasses(req);
    if (classes !== null) {
      const chapter = await queryOne(
        "SELECT class FROM chapters WHERE id = $1",
        [chapter_id]
      );
      if (chapter && chapter.class && !classes.includes(chapter.class)) {
        return res
          .status(403)
          .json({ error: "This chapter is not available for your class." });
      }
    }
  }

  const clauses = [];
  const params = [];
  if (chapter_id) {
    params.push(chapter_id);
    clauses.push(`chapter_id = $${params.length}`);
  }
  if (content_type) {
    params.push(content_type);
    clauses.push(`content_type = $${params.length}`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = await query(
    `SELECT * FROM mcq_sets ${where} ORDER BY created_at DESC`,
    params
  );
  res.json(rows);
});

router.get("/sets/:id/questions", authRequired, async (req, res) => {
  const rows = await query("SELECT * FROM mcq_questions WHERE set_id = $1", [
    req.params.id,
  ]);

  const studentId = await studentIdFor(req);
  let answeredMap = new Map();
  if (studentId && rows.length > 0) {
    const ids = rows.map((r) => r.id);
    const answeredRows = await query(
      `SELECT question_id, chosen_option FROM mcq_responses WHERE student_id = $1 AND question_id = ANY($2::text[])`,
      [studentId, ids]
    );
    answeredMap = new Map(
      answeredRows.map((r) => [r.question_id, r.chosen_option])
    );
  }

  const shaped = rows.map((q) => {
    const chosen = answeredMap.get(q.id);
    const isAnswered = chosen !== undefined;
    return {
      id: q.id,
      question: q.question,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      chosen_option: isAnswered ? chosen : undefined,
      correct_option:
        req.user.role === "admin" || isAnswered ? q.correct_option : undefined,
    };
  });
  res.json(shaped);
});

router.post("/questions/:id/answer", authRequired, async (req, res) => {
  try {
    const studentId = await studentIdFor(req);
    if (!studentId)
      return res
        .status(400)
        .json({ error: "Please complete student registration first." });

    const { chosen_option } = req.body;
    if (!["a", "b", "c", "d"].includes(chosen_option)) {
      return res.status(400).json({ error: "Please choose a valid option." });
    }
    const question = await queryOne(
      "SELECT * FROM mcq_questions WHERE id = $1",
      [req.params.id]
    );
    if (!question)
      return res.status(404).json({ error: "Question not found." });

    const isCorrect = question.correct_option === chosen_option;
    const existing = await queryOne(
      "SELECT id FROM mcq_responses WHERE question_id = $1 AND student_id = $2",
      [req.params.id, studentId]
    );
    if (existing) {
      await query(
        "UPDATE mcq_responses SET chosen_option = $1, is_correct = $2 WHERE id = $3",
        [chosen_option, isCorrect, existing.id]
      );
    } else {
      await query(
        `INSERT INTO mcq_responses (id, question_id, student_id, chosen_option, is_correct) VALUES ($1,$2,$3,$4,$5)`,
        [uuid(), req.params.id, studentId, chosen_option, isCorrect]
      );
    }

    res.json({ correct: isCorrect, correct_option: question.correct_option });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ error: "Something went wrong while submitting your answer." });
  }
});

// GET /api/mcq/sets/:id/responses — admin only. Per-student breakdown of who
// attempted this set, how many they got right/wrong, and which questions.
router.get("/sets/:id/responses", authRequired, adminOnly, async (req, res) => {
  const set = await queryOne("SELECT * FROM mcq_sets WHERE id = $1", [
    req.params.id,
  ]);
  if (!set) return res.status(404).json({ error: "Set not found." });

  const totalQuestions = await queryOne(
    "SELECT COUNT(*)::int AS count FROM mcq_questions WHERE set_id = $1",
    [req.params.id]
  );

  const rows = await query(
    `SELECT s.id AS student_id, s.name AS student_name, s.class AS student_class,
            mq.question, mr.chosen_option, mq.correct_option, mr.is_correct
     FROM mcq_responses mr
     JOIN mcq_questions mq ON mq.id = mr.question_id
     JOIN students s ON s.id = mr.student_id
     WHERE mq.set_id = $1
     ORDER BY s.name`,
    [req.params.id]
  );

  const byStudent = {};
  for (const r of rows) {
    if (!byStudent[r.student_id]) {
      byStudent[r.student_id] = {
        student_id: r.student_id,
        student_name: r.student_name,
        student_class: r.student_class,
        attempted: 0,
        correct: 0,
        wrong_questions: [],
      };
    }
    const bucket = byStudent[r.student_id];
    bucket.attempted += 1;
    if (r.is_correct) {
      bucket.correct += 1;
    } else {
      bucket.wrong_questions.push({
        question: r.question,
        chosen_option: r.chosen_option,
        correct_option: r.correct_option,
      });
    }
  }

  res.json({
    set,
    total_questions: totalQuestions.count,
    students: Object.values(byStudent),
  });
});

router.delete("/sets/:id", authRequired, adminOnly, async (req, res) => {
  const qs = await query("SELECT id FROM mcq_questions WHERE set_id = $1", [
    req.params.id,
  ]);
  for (const q of qs) {
    await query("DELETE FROM mcq_responses WHERE question_id = $1", [q.id]);
  }
  await query("DELETE FROM mcq_questions WHERE set_id = $1", [req.params.id]);
  await query("DELETE FROM mcq_sets WHERE id = $1", [req.params.id]);
  res.json({ message: "Removed." });
});

module.exports = router;
