import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { api } from "../api.js";
import { Alert } from "../components/Ui.jsx";

export default function Dashboard() {
  const { user, token } = useAuth();
  const [students, setStudents] = useState([]);
  const [notices, setNotices] = useState([]);
  const [doubts, setDoubts] = useState([]);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [s, n, d] = await Promise.all([
          api.getStudents(token),
          api.getNotices(token),
          api.getDoubts(token),
        ]);
        setStudents(s);
        setNotices(n);
        setDoubts(d);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoaded(true);
      }
    })();
  }, [token]);

  const needsRegistration =
    loaded &&
    !error &&
    (user.role === "student" || user.role === "parent") &&
    students.length === 0;

  const quickLinks = [
    {
      to: "/notices",
      glyph: "I",
      title: "Notice Board",
      text: `${notices.length} announcements posted`,
    },
    {
      to: "/chapters",
      glyph: "II",
      title: "Doubt Desk",
      text: `${
        doubts.filter((d) => d.status === "pending").length
      } awaiting an answer`,
    },
    {
      to: "/chapters",
      glyph: "III",
      title: "MCQ & DPP Practice",
      text: "Chapter-wise MCQs, DPPs and worksheets",
    },
  ];
  if (user.role !== "admin") {
    quickLinks.push({
      to: "/report-card",
      glyph: "IV",
      title: "Report Card",
      text: "Download your latest performance record",
    });
  }
  if (user.role === "admin") {
    quickLinks.push({
      to: "/admin",
      glyph: "IV",
      title: "Manage Institute",
      text: "Marks, notices, quizzes and doubts",
    });
  }

  return (
    <div>
      <div className="page-header fade-up">
        <span className="eyebrow">
          {user.role === "admin"
            ? "Faculty"
            : user.role === "parent"
            ? "Parent"
            : "Student"}{" "}
          Dashboard
        </span>
        <h1>Welcome, {user.name.split(" ")[0]}</h1>
        <p>Here is what's happening at the institute today.</p>
      </div>

      <div className="page-body">
        <Alert type="error">{error}</Alert>

        {needsRegistration && (
          <Alert type="info">
            Registration is not complete yet.{" "}
            <Link
              to="/register"
              style={{ fontWeight: 700, color: "var(--green-800)" }}
            >
              Complete it now →
            </Link>
          </Alert>
        )}

        {user.role === "admin" && (
          <div className="stat-grid fade-up">
            <div className="stat-card">
              <div className="stat-number">{students.length}</div>
              <div className="stat-label">Registered Students</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">
                {doubts.filter((d) => d.status === "pending").length}
              </div>
              <div className="stat-label">Doubts Pending</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{notices.length}</div>
              <div className="stat-label">Notices Published</div>
            </div>
          </div>
        )}

        <div className="quick-links">
          {quickLinks.map((q, i) => (
            <Link
              to={q.to}
              key={q.to}
              className={`card card-hover quick-link fade-up delay-${
                (i % 4) + 1
              }`}
            >
              <span className="glyph">{q.glyph}</span>
              <div>
                <h4>{q.title}</h4>
                <p>{q.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
