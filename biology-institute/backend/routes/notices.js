const express = require("express");
const multer = require("multer");
const { v4: uuid } = require("uuid");
const { query } = require("../db");
const { authRequired, adminOnly } = require("../middleware/auth");
const { uploadBufferToCloudinary } = require("../utils/cloudinary");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

router.get("/", authRequired, async (req, res) => {
  const rows = await query("SELECT * FROM notices ORDER BY created_at DESC");
  res.json(rows);
});

router.post(
  "/",
  authRequired,
  adminOnly,
  upload.single("photo"),
  async (req, res) => {
    try {
      const { title, content } = req.body;
      if (!title || !content) {
        return res.status(400).json({
          error: "Please provide a title and content for the notice.",
        });
      }
      const id = uuid();
      let photoUrl = null;
      let photoPublicId = null;
      if (req.file) {
        const uploaded = await uploadBufferToCloudinary(
          req.file.buffer,
          "soumendra-biology-institute/notices"
        );
        photoUrl = uploaded.url;
        photoPublicId = uploaded.publicId;
      }
      await query(
        "INSERT INTO notices (id, title, content, photo_path, photo_public_id) VALUES ($1,$2,$3,$4,$5)",
        [id, title, content, photoUrl, photoPublicId]
      );
      res.json({ message: "Notice published.", id });
    } catch (e) {
      console.error(e);
      res
        .status(500)
        .json({ error: "Something went wrong while publishing the notice." });
    }
  }
);

router.put(
  "/:id",
  authRequired,
  adminOnly,
  upload.single("photo"),
  async (req, res) => {
    try {
      const { title, content } = req.body;
      if (!title || !content) {
        return res.status(400).json({
          error: "Please provide a title and content for the notice.",
        });
      }
      let photoUrl;
      let photoPublicId;
      if (req.file) {
        const uploaded = await uploadBufferToCloudinary(
          req.file.buffer,
          "soumendra-biology-institute/notices"
        );
        photoUrl = uploaded.url;
        photoPublicId = uploaded.publicId;
      }
      if (photoUrl) {
        await query(
          "UPDATE notices SET title = $1, content = $2, photo_path = $3, photo_public_id = $4 WHERE id = $5",
          [title, content, photoUrl, photoPublicId, req.params.id]
        );
      } else {
        await query(
          "UPDATE notices SET title = $1, content = $2 WHERE id = $3",
          [title, content, req.params.id]
        );
      }
      res.json({ message: "Notice updated." });
    } catch (e) {
      console.error(e);
      res
        .status(500)
        .json({ error: "Something went wrong while updating the notice." });
    }
  }
);

router.delete("/:id", authRequired, adminOnly, async (req, res) => {
  await query("DELETE FROM notices WHERE id = $1", [req.params.id]);
  res.json({ message: "Notice removed." });
});

module.exports = router;
