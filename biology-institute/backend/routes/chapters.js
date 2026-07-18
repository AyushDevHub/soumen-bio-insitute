const express = require("express");
const { v4: uuid } = require("uuid");
const { query, queryOne } = require("../db");
const { authRequired, adminOnly } = require("../middleware/auth");
const { viewerClasses } = require("../utils/access");

const router = express.Router();

// List all chapters with counts of MCQs, DPPs and doubts (Physics-Wallah style hub).
// Students/parents only see chapters for their own class (or class-agnostic chapters).
router.get("/", authRequired, async (req, res) => {
  const classes = await viewerClasses(req);
  const chapters = await query(
    "SELECT * FROM chapters ORDER BY order_index ASC, created_at ASC"
  );
  const visible =
    classes === null
      ? chapters
      : chapters.filter((c) => !c.class || classes.includes(c.class));

  const mcqCounts = await query(
    `SELECT chapter_id, content_type, COUNT(*)::int AS count
     FROM mcq_sets WHERE chapter_id IS NOT NULL
     GROUP BY chapter_id, content_type`
  );
  const doubtCounts = await query(
    `SELECT chapter_id, COUNT(*)::int AS count
     FROM doubts WHERE chapter_id IS NOT NULL
     GROUP BY chapter_id`
  );

  const shaped = visible.map((c) => {
    const mcq = mcqCounts.find(
      (m) => m.chapter_id === c.id && m.content_type === "mcq"
    );
    const dpp = mcqCounts.find(
      (m) => m.chapter_id === c.id && m.content_type === "dpp"
    );
    const doubt = doubtCounts.find((d) => d.chapter_id === c.id);
    return {
      ...c,
      mcq_count: mcq ? mcq.count : 0,
      dpp_count: dpp ? dpp.count : 0,
      doubt_count: doubt ? doubt.count : 0,
    };
  });

  res.json(shaped);
});

router.get("/:id", authRequired, async (req, res) => {
  const chapter = await queryOne("SELECT * FROM chapters WHERE id = $1", [
    req.params.id,
  ]);
  if (!chapter) return res.status(404).json({ error: "Chapter not found." });

  const classes = await viewerClasses(req);
  if (classes !== null && chapter.class && !classes.includes(chapter.class)) {
    return res
      .status(403)
      .json({ error: "This chapter is not available for your class." });
  }

  res.json(chapter);
});

router.post("/", authRequired, adminOnly, async (req, res) => {
  try {
    const { name, class: className, description, order_index } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Please give the chapter a name." });
    }
    const id = uuid();
    await query(
      `INSERT INTO chapters (id, name, class, description, order_index) VALUES ($1,$2,$3,$4,$5)`,
      [
        id,
        name.trim(),
        className || null,
        description || null,
        order_index || 0,
      ]
    );
    res.json({ message: "Chapter created.", id });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ error: "Something went wrong while creating the chapter." });
  }
});

router.put("/:id", authRequired, adminOnly, async (req, res) => {
  const { name, class: className, description, order_index } = req.body;
  await query(
    `UPDATE chapters SET name = COALESCE($1, name), class = COALESCE($2, class),
     description = COALESCE($3, description), order_index = COALESCE($4, order_index)
     WHERE id = $5`,
    [
      name || null,
      className || null,
      description || null,
      order_index ?? null,
      req.params.id,
    ]
  );
  res.json({ message: "Chapter updated." });
});

router.delete("/:id", authRequired, adminOnly, async (req, res) => {
  const inUse = await queryOne(
    `SELECT 1 FROM mcq_sets WHERE chapter_id = $1
     UNION SELECT 1 FROM doubts WHERE chapter_id = $1 LIMIT 1`,
    [req.params.id]
  );
  if (inUse) {
    return res.status(400).json({
      error:
        "This chapter still has MCQs, DPPs or doubts linked to it. Remove those first.",
    });
  }
  await query("DELETE FROM chapters WHERE id = $1", [req.params.id]);
  res.json({ message: "Chapter removed." });
});

module.exports = router;
