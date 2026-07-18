const express = require("express");
const { v4: uuid } = require("uuid");
const { query, queryOne } = require("../db");
const { authRequired, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.post("/register", authRequired, async (req, res) => {
  try {
    const {
      name,
      class: className,
      school_name,
      guardian_name,
      guardian_contact,
      address,
    } = req.body;

    if (
      !name ||
      !className ||
      !school_name ||
      !guardian_name ||
      !guardian_contact ||
      !address
    ) {
      return res
        .status(400)
        .json({
          error: "Please fill in every field of the registration form.",
        });
    }

    const existing = await queryOne(
      "SELECT id FROM students WHERE user_id = $1",
      [req.user.id]
    );
    if (req.user.role === "student" && existing) {
      return res
        .status(400)
        .json({ error: "You have already completed registration." });
    }

    const id = uuid();
    await query(
      `INSERT INTO students (id, user_id, name, class, school_name, guardian_name, guardian_contact, address, parent_user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        id,
        req.user.role === "student" ? req.user.id : null,
        name,
        className,
        school_name,
        guardian_name,
        guardian_contact,
        address,
        req.user.role === "parent" ? req.user.id : null,
      ]
    );

    res.json({
      message: "Registration completed successfully.",
      studentId: id,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Something went wrong while registering." });
  }
});

router.get("/", authRequired, async (req, res) => {
  let rows;
  if (req.user.role === "admin") {
    rows = await query("SELECT * FROM students ORDER BY created_at DESC");
  } else if (req.user.role === "student") {
    rows = await query("SELECT * FROM students WHERE user_id = $1", [
      req.user.id,
    ]);
  } else {
    rows = await query("SELECT * FROM students WHERE parent_user_id = $1", [
      req.user.id,
    ]);
  }
  res.json(rows);
});

router.get("/:id", authRequired, async (req, res) => {
  const student = await queryOne("SELECT * FROM students WHERE id = $1", [
    req.params.id,
  ]);
  if (!student) return res.status(404).json({ error: "Student not found." });
  if (
    req.user.role !== "admin" &&
    student.user_id !== req.user.id &&
    student.parent_user_id !== req.user.id
  ) {
    return res
      .status(403)
      .json({ error: "You do not have access to this profile." });
  }
  res.json(student);
});

router.delete("/:id", authRequired, adminOnly, async (req, res) => {
  await query("DELETE FROM students WHERE id = $1", [req.params.id]);
  res.json({ message: "Student profile removed." });
});

module.exports = router;
