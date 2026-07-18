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

app.use(cors());
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

init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(
        `Soumendra Sir Biology Coaching Institute backend running on port ${PORT}`
      );
    });
  })
  .catch((err) => {
    console.error("Failed to initialize NeonDB schema:", err);
    process.exit(1);
  });
