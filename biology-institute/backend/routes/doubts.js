const express = require("express");
const multer = require("multer");
const { v4: uuid } = require("uuid");
const { query, queryOne } = require("../db");
const { authRequired, adminOnly } = require("../middleware/auth");
const { uploadBufferToCloudinary } = require("../utils/cloudinary");

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

router.post("/", authRequired, upload.single("photo"), async (req, res) => {
  try {
    const studentId = req.body.student_id || (await studentIdFor(req));
    if (!studentId) {
      return res
        .status(400)
        .json({ error: "Please complete student registration first." });
    }
    const { question, chapter_id } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ error: "Please describe your doubt." });
    }
    const id = uuid();
    let photoUrl = null;
    let photoPublicId = null;
    if (req.file) {
      const uploaded = await uploadBufferToCloudinary(
        req.file.buffer,
        "soumendra-biology-institute/doubts"
      );
      photoUrl = uploaded.url;
      photoPublicId = uploaded.publicId;
    }
    await query(
      `INSERT INTO doubts (id, student_id, chapter_id, question, photo_path, photo_public_id) VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        id,
        studentId,
        chapter_id || null,
        question.trim(),
        photoUrl,
        photoPublicId,
      ]
    );
    res.json({ message: "Your doubt has been submitted.", id });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ error: "Something went wrong while submitting your doubt." });
  }
});

router.get("/", authRequired, async (req, res) => {
  const { chapter_id } = req.query;
  let rows;
  if (req.user.role === "admin") {
    rows = await query(
      `SELECT d.*, s.name as student_name, s.class as student_class, c.name as chapter_name
       FROM doubts d
       JOIN students s ON s.id = d.student_id
       LEFT JOIN chapters c ON c.id = d.chapter_id
       ${chapter_id ? "WHERE d.chapter_id = $1" : ""}
       ORDER BY d.created_at DESC`,
      chapter_id ? [chapter_id] : []
    );
  } else if (req.user.role === "student") {
    const studentId = await studentIdFor(req);
    if (!studentId) {
      rows = [];
    } else {
      const params = [studentId];
      let where = "d.student_id = $1";
      if (chapter_id) {
        params.push(chapter_id);
        where += ` AND d.chapter_id = $${params.length}`;
      }
      rows = await query(
        `SELECT d.*, c.name as chapter_name FROM doubts d
         LEFT JOIN chapters c ON c.id = d.chapter_id
         WHERE ${where} ORDER BY d.created_at DESC`,
        params
      );
    }
  } else {
    const params = [req.user.id];
    let where = "s.parent_user_id = $1";
    if (chapter_id) {
      params.push(chapter_id);
      where += ` AND d.chapter_id = $${params.length}`;
    }
    rows = await query(
      `SELECT d.*, c.name as chapter_name FROM doubts d
       JOIN students s ON s.id = d.student_id
       LEFT JOIN chapters c ON c.id = d.chapter_id
       WHERE ${where} ORDER BY d.created_at DESC`,
      params
    );
  }
  res.json(rows);
});

router.put("/:id/answer", authRequired, adminOnly, async (req, res) => {
  const { answer } = req.body;
  if (!answer || !answer.trim()) {
    return res
      .status(400)
      .json({ error: "Please write an answer before submitting." });
  }
  await query(
    `UPDATE doubts SET answer = $1, status = 'answered', answered_at = NOW() WHERE id = $2`,
    [answer.trim(), req.params.id]
  );
  res.json({ message: "Answer submitted." });
});

module.exports = router;
