import React, { useState } from "react";
import { Alert } from "./Ui.jsx";

export default function QuizSet({ set, token, role, api }) {
  const [open, setOpen] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setQuestions(await api.getMcqQuestions(set.id, token));
    } catch (err) {
      setError(err.message);
    }
  };

  const toggle = () => {
    setOpen(!open);
    if (!open && questions.length === 0 && set.hasQuestions !== false) load();
  };

  const answer = async (qid, opt) => {
    try {
      await api.answerMcq(qid, opt, token);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const letters = ["a", "b", "c", "d"];
  const isDpp = set.content_type === "dpp";

  return (
    <div className="card card-hover fade-up" style={{ marginBottom: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          cursor: "pointer",
        }}
        onClick={toggle}
      >
        <div>
          <h3 style={{ marginBottom: 2 }}>{set.title}</h3>
          <p
            style={{ margin: 0, fontSize: "0.82rem", color: "var(--ink-400)" }}
          >
            {isDpp ? "Daily Practice Problem" : "MCQ Set"}
            {set.class ? ` · Class ${set.class}` : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {isDpp && set.worksheet_path && (
            <a
              href={set.worksheet_path}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost btn-sm"
              onClick={(e) => e.stopPropagation()}
            >
              Download Sheet
            </a>
          )}
          <button className="btn btn-ghost btn-sm">
            {open ? "Hide" : "Practice"}
          </button>
        </div>
      </div>

      {open && (
        <div style={{ marginTop: 18 }}>
          <Alert type="error">{error}</Alert>
          {set.photo_path && (
            <img
              src={set.photo_path}
              alt=""
              className="notice-photo"
              style={{ width: "100%", height: 180, marginBottom: 16 }}
            />
          )}
          {questions.length === 0 ? (
            <p style={{ color: "var(--ink-400)", fontSize: "0.9rem" }}>
              {isDpp
                ? "This DPP has no auto-graded questions — use the worksheet above."
                : "No questions in this set yet."}
            </p>
          ) : (
            questions.map((q, qi) => (
              <div key={q.id} style={{ marginBottom: 24 }}>
                <p className="doubt-question">
                  {qi + 1}. {q.question}
                </p>
                {letters.map((l) => {
                  const text = q[`option_${l}`];
                  const answered = q.correct_option !== undefined;
                  let cls = "mcq-option";
                  if (answered) {
                    cls += " disabled";
                    if (l === q.correct_option) cls += " correct";
                    else if (l === q.chosen_option) cls += " incorrect";
                  }
                  return (
                    <div
                      key={l}
                      className={cls}
                      onClick={() =>
                        role !== "admin" && !answered && answer(q.id, l)
                      }
                    >
                      <span className="option-letter">{l.toUpperCase()}</span>
                      <span>{text}</span>
                      {answered &&
                        l === q.chosen_option &&
                        l !== q.correct_option && (
                          <span className="option-tag wrong-tag">
                            Your answer
                          </span>
                        )}
                      {answered && l === q.correct_option && (
                        <span className="option-tag correct-tag">
                          Correct answer
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
