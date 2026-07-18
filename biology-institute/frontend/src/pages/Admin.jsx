import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthContext.jsx";
import { api } from "../api.js";
import { Alert, SectionHeading, Spinner } from "../components/Ui.jsx";

const TABS = [
  { id: "marks", label: "Students & Marks" },
  { id: "chapters", label: "Chapters" },
  { id: "notices", label: "Notice Board" },
  { id: "mcq", label: "MCQ & DPP Builder" },
];

function MarksTab({ token }) {
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [marks, setMarks] = useState([]);
  const [form, setForm] = useState({
    exam_name: "",
    topic: "",
    marks_obtained: "",
    total_marks: "",
    remarks: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const loadStudents = async () => {
    try {
      setStudents(await api.getStudents(token));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const loadMarks = async (id) => {
    try {
      setMarks(await api.getMarks(id, token));
    } catch (err) {
      setError(err.message);
    }
  };

  const selectStudent = (id) => {
    setSelected(id);
    loadMarks(id);
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addMark = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!selected) {
      setError("Please select a student first.");
      return;
    }
    setLoading(true);
    try {
      await api.addMark({ ...form, student_id: selected }, token);
      setMessage("Marks recorded.");
      setForm({
        exam_name: "",
        topic: "",
        marks_obtained: "",
        total_marks: "",
        remarks: "",
      });
      loadMarks(selected);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    try {
      const blob = await api.downloadReportCard(selected, token);
      const student = students.find((s) => s.id === selected);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(student?.name || "report").replace(
        /\s+/g,
        "_"
      )}_Report_Card.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="two-col">
      <div className="card">
        <h3 style={{ marginBottom: 14, fontSize: "1rem" }}>
          Registered Students
        </h3>
        {students.length === 0 ? (
          <p style={{ fontSize: "0.85rem" }}>No students registered yet.</p>
        ) : (
          <div className="student-select-list">
            {students.map((s) => (
              <div
                key={s.id}
                className={`student-select-item ${
                  selected === s.id ? "active" : ""
                }`}
                onClick={() => selectStudent(s.id)}
              >
                {s.name} · {s.class}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <Alert type="error">{error}</Alert>
        <Alert type="success">{message}</Alert>

        {!selected ? (
          <div className="empty-state">
            <span className="glyph">—</span>
            Select a student to record marks or generate a report card.
          </div>
        ) : (
          <>
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ marginBottom: 14, fontSize: "1rem" }}>
                Add Mark Entry
              </h3>
              <form onSubmit={addMark}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Exam / Test Name</label>
                    <input
                      name="exam_name"
                      required
                      value={form.exam_name}
                      onChange={onChange}
                      placeholder="e.g. Unit Test 1"
                    />
                  </div>
                  <div className="form-group">
                    <label>Topic</label>
                    <input
                      name="topic"
                      required
                      value={form.topic}
                      onChange={onChange}
                      placeholder="e.g. Cell Biology"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Marks Obtained</label>
                    <input
                      type="number"
                      name="marks_obtained"
                      required
                      value={form.marks_obtained}
                      onChange={onChange}
                      placeholder="e.g. 42"
                    />
                  </div>
                  <div className="form-group">
                    <label>Total Marks</label>
                    <input
                      type="number"
                      name="total_marks"
                      required
                      value={form.total_marks}
                      onChange={onChange}
                      placeholder="e.g. 50"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Remarks (optional)</label>
                  <input
                    name="remarks"
                    value={form.remarks}
                    onChange={onChange}
                    placeholder="Faculty remarks"
                  />
                </div>
                <button className="btn btn-primary" disabled={loading}>
                  {loading ? <Spinner /> : "Save Marks"}
                </button>
              </form>
            </div>

            <div className="card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <h3 style={{ margin: 0, fontSize: "1rem" }}>Recorded Marks</h3>
                {marks.length > 0 && (
                  <button
                    className="btn btn-gold btn-sm"
                    onClick={downloadReport}
                  >
                    Generate Report Card
                  </button>
                )}
              </div>
              {marks.length === 0 ? (
                <p style={{ fontSize: "0.85rem" }}>
                  No marks recorded for this student yet.
                </p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Exam</th>
                        <th>Topic</th>
                        <th>Marks</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marks.map((m) => (
                        <tr key={m.id}>
                          <td>{m.exam_name}</td>
                          <td>{m.topic}</td>
                          <td>{m.marks_obtained}</td>
                          <td>{m.total_marks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function NoticesTab({ token }) {
  const [notices, setNotices] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setNotices(await api.getNotices(token));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!title.trim() || !content.trim()) {
      setError("Please provide both a title and content.");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("content", content);
      if (photo) fd.append("photo", photo);
      await api.addNotice(fd, token);
      setMessage("Notice published.");
      setTitle("");
      setContent("");
      setPhoto(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.deleteNotice(id, token);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="two-col">
      <div className="card">
        <h3 style={{ marginBottom: 14, fontSize: "1rem" }}>Publish a Notice</h3>
        <Alert type="error">{error}</Alert>
        <Alert type="success">{message}</Alert>
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notice title"
            />
          </div>
          <div className="form-group">
            <label>Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Details of the notice"
            />
          </div>
          <div className="form-group">
            <label>Photo (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files[0])}
            />
          </div>
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? <Spinner /> : "Publish Notice"}
          </button>
        </form>
      </div>

      <div>
        {notices.length === 0 ? (
          <div className="empty-state">
            <span className="glyph">—</span>
            No notices published yet.
          </div>
        ) : (
          <div className="notice-list">
            {notices.map((n) => (
              <div key={n.id} className="card notice-card">
                {n.photo_path && (
                  <img src={n.photo_path} alt="" className="notice-photo" />
                )}
                <div style={{ flex: 1 }}>
                  <h3 className="notice-title">{n.title}</h3>
                  <p>{n.content}</p>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => remove(n.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ChaptersTab({ token }) {
  const [chapters, setChapters] = useState([]);
  const [name, setName] = useState("");
  const [className, setClassName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setChapters(await api.getChapters(token));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!name.trim()) {
      setError("Please give the chapter a name.");
      return;
    }
    setLoading(true);
    try {
      await api.createChapter(
        { name, class: className, description, order_index: chapters.length },
        token
      );
      setMessage("Chapter added.");
      setName("");
      setClassName("");
      setDescription("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.deleteChapter(id, token);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="two-col">
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 14, fontSize: "1rem" }}>Add a Chapter</h3>
        <Alert type="error">{error}</Alert>
        <Alert type="success">{message}</Alert>
        <form onSubmit={submit}>
          <div className="form-row">
            <div className="form-group">
              <label>Chapter Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Genetics and Evolution"
              />
            </div>
            <div className="form-group">
              <label>Class (optional)</label>
              <input
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g. Class 12"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Short Description (optional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this chapter covers"
            />
          </div>
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? <Spinner /> : "Add Chapter"}
          </button>
        </form>
      </div>

      <div>
        <h3 style={{ marginBottom: 14, fontSize: "1rem" }}>All Chapters</h3>
        {chapters.length === 0 ? (
          <div className="empty-state">
            <span className="glyph">—</span>
            No chapters added yet.
          </div>
        ) : (
          chapters.map((c) => (
            <div
              key={c.id}
              className="card"
              style={{
                marginBottom: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <strong>{c.name}</strong>
                {c.class && (
                  <span
                    style={{ color: "var(--ink-400)", fontSize: "0.82rem" }}
                  >
                    {" "}
                    · Class {c.class}
                  </span>
                )}
                <div style={{ fontSize: "0.78rem", color: "var(--ink-400)" }}>
                  {c.mcq_count} MCQ · {c.dpp_count} DPP · {c.doubt_count} Doubts
                </div>
              </div>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => remove(c.id)}
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function McqTab({ token }) {
  const [sets, setSets] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [contentType, setContentType] = useState("mcq");
  const [chapterId, setChapterId] = useState("");
  const [title, setTitle] = useState("");
  const [className, setClassName] = useState("");
  const [photo, setPhoto] = useState(null);
  const [worksheet, setWorksheet] = useState(null);
  const [questions, setQuestions] = useState([
    { question: "", a: "", b: "", c: "", d: "", correct: "a" },
  ]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const [chapterList, setList] = await Promise.all([
        api.getChapters(token),
        api.getMcqSets(token),
      ]);
      setChapters(chapterList);
      setSets(setList);
      if (!chapterId && chapterList.length > 0) setChapterId(chapterList[0].id);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateQuestion = (i, field, value) => {
    const next = [...questions];
    next[i][field] = value;
    setQuestions(next);
  };

  const addQuestion = () =>
    setQuestions([
      ...questions,
      { question: "", a: "", b: "", c: "", d: "", correct: "a" },
    ]);
  const removeQuestion = (i) =>
    setQuestions(questions.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!title.trim()) {
      setError(
        `Please give the ${contentType === "dpp" ? "DPP" : "quiz"} a title.`
      );
      return;
    }
    if (!chapterId) {
      setError("Please choose a chapter.");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("class", className);
      fd.append("chapter_id", chapterId);
      fd.append("content_type", contentType);
      const usableQuestions = questions.filter((q) => q.question.trim());
      fd.append("questions", JSON.stringify(usableQuestions));
      if (photo) fd.append("photo", photo);
      if (worksheet) fd.append("worksheet", worksheet);
      await api.createMcqSet(fd, token);
      setMessage(contentType === "dpp" ? "DPP published." : "Quiz published.");
      setTitle("");
      setClassName("");
      setPhoto(null);
      setWorksheet(null);
      setQuestions([
        { question: "", a: "", b: "", c: "", d: "", correct: "a" },
      ]);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.deleteMcqSet(id, token);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 14, fontSize: "1rem" }}>
          Create MCQ or DPP
        </h3>
        <Alert type="error">{error}</Alert>
        <Alert type="success">{message}</Alert>

        {chapters.length === 0 && (
          <Alert type="error">
            Add a chapter first, from the Chapters tab, before publishing
            content.
          </Alert>
        )}

        <form onSubmit={submit}>
          <div className="tab-row" style={{ marginBottom: 16 }}>
            <button
              type="button"
              className={`tab-btn ${contentType === "mcq" ? "active" : ""}`}
              onClick={() => setContentType("mcq")}
            >
              MCQ
            </button>
            <button
              type="button"
              className={`tab-btn ${contentType === "dpp" ? "active" : ""}`}
              onClick={() => setContentType("dpp")}
            >
              DPP
            </button>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Chapter</label>
              <select
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value)}
              >
                <option value="">Choose a chapter</option>
                {chapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.class ? ` (Class ${c.class})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Class (optional)</label>
              <input
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g. Class 10"
              />
            </div>
          </div>
          <div className="form-group">
            <label>{contentType === "dpp" ? "DPP Title" : "Quiz Title"}</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                contentType === "dpp"
                  ? "e.g. DPP 1 — Photosynthesis"
                  : "e.g. Photosynthesis Basics"
              }
            />
          </div>
          <div className="form-group">
            <label>Diagram / Photo (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files[0])}
            />
          </div>
          {contentType === "dpp" && (
            <div className="form-group">
              <label>Downloadable Worksheet (PDF, optional)</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setWorksheet(e.target.files[0])}
              />
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: "0.78rem",
                  color: "var(--ink-400)",
                }}
              >
                Students can download this as a practice sheet. Add questions
                below too if you want it auto-graded.
              </p>
            </div>
          )}

          {questions.map((q, i) => (
            <div className="mcq-builder-row" key={i}>
              {questions.length > 1 && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm remove-q"
                  onClick={() => removeQuestion(i)}
                >
                  Remove
                </button>
              )}
              <div className="form-group">
                <label>Question {i + 1}</label>
                <input
                  value={q.question}
                  onChange={(e) =>
                    updateQuestion(i, "question", e.target.value)
                  }
                  placeholder="Question text"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Option A</label>
                  <input
                    value={q.a}
                    onChange={(e) => updateQuestion(i, "a", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Option B</label>
                  <input
                    value={q.b}
                    onChange={(e) => updateQuestion(i, "b", e.target.value)}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Option C</label>
                  <input
                    value={q.c}
                    onChange={(e) => updateQuestion(i, "c", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Option D</label>
                  <input
                    value={q.d}
                    onChange={(e) => updateQuestion(i, "d", e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Correct Option</label>
                <select
                  value={q.correct}
                  onChange={(e) => updateQuestion(i, "correct", e.target.value)}
                >
                  <option value="a">A</option>
                  <option value="b">B</option>
                  <option value="c">C</option>
                  <option value="d">D</option>
                </select>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="btn btn-ghost"
            onClick={addQuestion}
            style={{ marginBottom: 18 }}
          >
            + Add Another Question
          </button>
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? (
              <Spinner />
            ) : contentType === "dpp" ? (
              "Publish DPP"
            ) : (
              "Publish Quiz"
            )}
          </button>
        </form>
      </div>

      {sets.length > 0 && (
        <div>
          <h3 style={{ fontSize: "1rem", marginBottom: 14 }}>
            Published MCQs & DPPs
          </h3>
          {sets.map((s) => {
            const chapter = chapters.find((c) => c.id === s.chapter_id);
            return (
              <div key={s.id} className="card" style={{ marginBottom: 12 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <span>{s.title}</span>
                    <div
                      style={{ fontSize: "0.78rem", color: "var(--ink-400)" }}
                    >
                      {s.content_type === "dpp" ? "DPP" : "MCQ"}
                      {chapter
                        ? ` · ${chapter.name}${
                            chapter.class ? ` (Class ${chapter.class})` : ""
                          }`
                        : ""}
                    </div>
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => remove(s.id)}
                  >
                    Remove
                  </button>
                </div>
                <SetResults set={s} token={token} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SetResults({ set, token }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setOpen(!open);
    if (!open && !data) {
      setLoading(true);
      try {
        setData(await api.getMcqSetResponses(set.id, token));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={{ marginTop: 10 }}>
      <button className="btn btn-ghost btn-sm" onClick={toggle}>
        {open ? "Hide Results" : "View Results"}
      </button>
      {open && (
        <div style={{ marginTop: 10 }}>
          <Alert type="error">{error}</Alert>
          {loading ? (
            <Spinner />
          ) : !data || data.students.length === 0 ? (
            <p style={{ fontSize: "0.82rem", color: "var(--ink-400)" }}>
              No student has attempted this yet.
            </p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Attempted</th>
                    <th>Correct</th>
                    <th>Wrong</th>
                    <th>Wrong Questions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.students.map((s) => (
                    <tr key={s.student_id}>
                      <td>
                        {s.student_name} · {s.student_class}
                      </td>
                      <td>
                        {s.attempted}/{data.total_questions}
                      </td>
                      <td>{s.correct}</td>
                      <td>{s.wrong_questions.length}</td>
                      <td style={{ fontSize: "0.78rem" }}>
                        {s.wrong_questions.length === 0
                          ? "—"
                          : s.wrong_questions
                              .map(
                                (w) =>
                                  `"${
                                    w.question
                                  }" (chose ${w.chosen_option.toUpperCase()}, correct ${w.correct_option.toUpperCase()})`
                              )
                              .join("; ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const { token } = useAuth();
  const [tab, setTab] = useState("marks");

  return (
    <div className="page-body">
      <SectionHeading
        eyebrow="Faculty Console"
        title="Manage Institute"
        sub="Marks, report cards, notices and MCQ practice — all in one place."
      />

      <div className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`admin-tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "marks" && <MarksTab token={token} />}
      {tab === "chapters" && <ChaptersTab token={token} />}
      {tab === "notices" && <NoticesTab token={token} />}
      {tab === "mcq" && <McqTab token={token} />}
    </div>
  );
}
