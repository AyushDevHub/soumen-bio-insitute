import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { api } from "../api.js";
import { Alert, SectionHeading, Spinner } from "../components/Ui.jsx";

export default function Chapters() {
  const { token, user } = useAuth();
  const [chapters, setChapters] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setChapters(await api.getChapters(token));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="page-body">
      <SectionHeading
        eyebrow="Chapter-wise"
        title="Biology Chapters"
        sub="Every chapter has its own MCQs, DPPs and Doubt Desk — pick a chapter to get started."
      />
      <Alert type="error">{error}</Alert>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spinner />
        </div>
      ) : chapters.length === 0 ? (
        <div className="empty-state">
          <span className="glyph">—</span>
          {user.role === "admin"
            ? "No chapters yet — add one from Manage Institute."
            : "No chapters have been published yet."}
        </div>
      ) : (
        <div className="chapter-grid">
          {chapters.map((c, i) => (
            <Link
              to={`/chapters/${c.id}`}
              key={c.id}
              className={`card card-hover chapter-card fade-up delay-${
                (i % 4) + 1
              }`}
            >
              <div className="chapter-card-top">
                <span className="chapter-index">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {c.class && (
                  <span className="badge badge-role">Class {c.class}</span>
                )}
              </div>
              <h3 style={{ margin: "10px 0 4px" }}>{c.name}</h3>
              {c.description && (
                <p
                  style={{
                    margin: "0 0 14px",
                    fontSize: "0.85rem",
                    color: "var(--ink-400)",
                  }}
                >
                  {c.description}
                </p>
              )}
              <div className="chapter-stats">
                <span className="chapter-stat mcq">{c.mcq_count} MCQ</span>
                <span className="chapter-stat dpp">{c.dpp_count} DPP</span>
                <span className="chapter-stat doubt">
                  {c.doubt_count} Doubts
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
