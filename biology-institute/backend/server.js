require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { init } = require("./db");

const authRoutes = require("./routes/auth");
const studentRoutes = require("./routes/students");
const marksRoutes = require("./routes/marks");
const doubtRoutes = require("./routes/doubts");
const noticeRoutes = require("./routes/notices");
const mcqRoutes = require("./routes/mcq");
const chapterRoutes = require("./routes/chapters");

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
  })
);
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/marks", marksRoutes);
app.use("/api/doubts", doubtRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/mcq", mcqRoutes);
app.use("/api/chapters", chapterRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    institute: "Soumendra Sir Biology Coaching Institute",
  });
});

const PORT = process.env.PORT || 5000;

// Bind the port immediately so Render's health check sees it right away —
// don't make the whole server wait on the database to be reachable.
app.listen(PORT, () => {
  console.log(
    `Soumendra Sir Biology Coaching Institute backend running on port ${PORT}`
  );
});

init()
  .then(() => {
    console.log("NeonDB schema ready — database connected.");
  })
  .catch((err) => {
    console.error("Failed to initialize NeonDB schema:", err);
  });
