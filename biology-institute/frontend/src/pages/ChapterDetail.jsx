import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { api } from "../api.js";
import { Alert, SectionHeading, Spinner } from "../components/Ui.jsx";
import QuizSet from "../components/QuizSet.jsx";

function DoubtTab({ chapter, token, user }) {
  const [doubts, setDoubts] = useState([]);
  const [question, setQuestion] = useState("");
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [answerDrafts, setAnswerDrafts] = useState({});

  const load = async () => {
    try {
      setDoubts(await api.getDoubts(token, chapter.id));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, [chapter.id]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!question.trim()) {
      setError("Please describe your doubt before submitting.");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("question", question);
      fd.append("chapter_id", chapter.id);
      if (photo) fd.append("photo", photo);
      await api.submitDoubt(fd, token);
      setMessage("Your doubt has been submitted to the faculty.");
      setQuestion("");
      setPhoto(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (id) => {
    const answer = answerDrafts[id];
    if (!answer || !answer.trim()) return;
    try {
      await api.answerDoubt(id, answer, token);
      setAnswerDrafts({ ...answerDrafts, [id]: "" });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (ts) =>
    new Date(ts * 1000).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div>
      <Alert type="error">{error}</Alert>
      <Alert type="success">{message}</Alert>

      {user.role === "student" && (
        <form
          onSubmit={onSubmit}
          className="card fade-up"
          style={{ maxWidth: 640, margin: "0 auto 32px" }}
        >
          <div className="form-group">
            <label>Your Doubt on {chapter.name}</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Describe the concept or question you're stuck on..."
            />
          </div>
          <div className="form-group">
            <label>Attach a Photo (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files[0])}
            />
          </div>
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? <Spinner /> : "Submit Doubt"}
          </button>
        </form>
      )}

      {doubts.length === 0 ? (
        <div className="empty-state">
          <span className="glyph">—</span>
          No doubts raised for this chapter yet.
        </div>
      ) : (
        doubts.map((d, i) => (
          <div
            key={d.id}
            className={`card doubt-card fade-up delay-${(i % 4) + 1}`}
          >
            <div className="doubt-meta">
              {user.role === "admin" && d.student_name && (
                <span className="badge badge-role">
                  {d.student_name} · {d.student_class}
                </span>
              )}
              <span
                className={`badge ${
                  d.status === "answered" ? "badge-answered" : "badge-pending"
                }`}
              >
                {d.status === "answered" ? "Answered" : "Pending"}
              </span>
              <span className="notice-date" style={{ marginBottom: 0 }}>
                {formatDate(d.created_at)}
              </span>
            </div>
            <p className="doubt-question">{d.question}</p>
            {d.photo_path && (
              <img
                src={d.photo_path}
                alt="Doubt attachment"
                className="doubt-photo"
              />
            )}
            {d.answer && (
              <div className="doubt-answer">Faculty's answer — {d.answer}</div>
            )}

            {user.role === "admin" && d.status !== "answered" && (
              <div style={{ marginTop: 14 }}>
                <div className="form-group">
                  <textarea
                    placeholder="Write your answer..."
                    value={answerDrafts[d.id] || ""}
                    onChange={(e) =>
                      setAnswerDrafts({
                        ...answerDrafts,
                        [d.id]: e.target.value,
                      })
                    }
                  />
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => submitAnswer(d.id)}
                >
                  Submit Answer
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default function ChapterDetail() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const [chapter, setChapter] = useState(null);
  const [tab, setTab] = useState("mcq");
  const [sets, setSets] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        setChapter(await api.getChapter(id, token));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (tab === "doubts" || !chapter) return;
    (async () => {
      try {
        setSets(
          await api.getMcqSets(token, { chapterId: id, contentType: tab })
        );
      } catch (err) {
        setError(err.message);
      }
    })();
  }, [tab, chapter, id]);

  if (loading) {
    return (
      <div className="page-body" style={{ textAlign: "center", padding: 40 }}>
        <Spinner />
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="page-body">
        <Alert type="error">{error || "Chapter not found."}</Alert>
        <Link to="/chapters" className="btn btn-ghost btn-sm">
          Back to chapters
        </Link>
      </div>
    );
  }

  const tabs = [
    { key: "mcq", label: "MCQ" },
    { key: "dpp", label: "DPP" },
    { key: "doubts", label: "Doubt Desk" },
  ];

  return (
    <div className="page-body">
      <Link to="/chapters" className="chapter-back-link">
        ← All Chapters
      </Link>
      <SectionHeading
        eyebrow={chapter.class ? `Class ${chapter.class}` : "Chapter"}
        title={chapter.name}
        sub={chapter.description}
      />
      <Alert type="error">{error}</Alert>

      <div className="tab-row">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`tab-btn ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "doubts" ? (
        <DoubtTab chapter={chapter} token={token} user={user} />
      ) : sets.length === 0 ? (
        <div className="empty-state">
          <span className="glyph">—</span>
          No {tab === "dpp" ? "DPPs" : "MCQ sets"} published for this chapter
          yet.
        </div>
      ) : (
        sets.map((s) => (
          <QuizSet
            key={s.id}
            set={s}
            token={token}
            role={user.role}
            api={api}
          />
        ))
      )}
    </div>
  );
}
