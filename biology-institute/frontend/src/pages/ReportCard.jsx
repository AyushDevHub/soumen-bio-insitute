import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthContext.jsx";
import { api } from "../api.js";
import { Alert, SectionHeading, Spinner } from "../components/Ui.jsx";

export default function ReportCard() {
  const { token } = useAuth();
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [marks, setMarks] = useState([]);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await api.getStudents(token);
        setStudents(list);
        if (list.length > 0) setSelected(list[0].id);
      } catch (err) {
        setError(err.message);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selected) return;
    (async () => {
      try {
        setMarks(await api.getMarks(selected, token));
      } catch (err) {
        setError(err.message);
      }
    })();
  }, [selected]);

  const totalObtained = marks.reduce((s, m) => s + Number(m.marks_obtained), 0);
  const totalMax = marks.reduce((s, m) => s + Number(m.total_marks), 0);
  const percentage =
    totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(2) : "0.00";

  const download = async () => {
    setError("");
    setDownloading(true);
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
    } finally {
      setDownloading(false);
    }
  };

  if (students.length === 0) {
    return (
      <div className="page-body">
        <SectionHeading eyebrow="Performance" title="Report Card" />
        <div className="empty-state">
          <span className="glyph">—</span>
          Complete student registration first to view a report card.
        </div>
      </div>
    );
  }

  return (
    <div className="page-body">
      <SectionHeading
        eyebrow="Performance"
        title="Report Card"
        sub="Every recorded assessment plus chapter-wise MCQ & DPP performance, in a premium PDF."
      />
      <Alert type="error">{error}</Alert>

      {students.length > 1 && (
        <div
          className="form-group"
          style={{ maxWidth: 320, margin: "0 auto 24px" }}
        >
          <label>Select Student</label>
          <select
            value={selected || ""}
            onChange={(e) => setSelected(e.target.value)}
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.class}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="card fade-up" style={{ maxWidth: 780, margin: "0 auto" }}>
        <div className="report-hero">
          <h3 style={{ marginBottom: 2 }}>
            {students.find((s) => s.id === selected)?.name}
          </h3>
          <p style={{ margin: 0, color: "var(--ink-400)" }}>
            Class {students.find((s) => s.id === selected)?.class}
          </p>
        </div>

        {marks.length === 0 ? (
          <div className="empty-state">
            <span className="glyph">—</span>
            No marks have been recorded yet.
          </div>
        ) : (
          <>
            <div className="table-wrap" style={{ marginTop: 20 }}>
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

            <div className="stat-grid" style={{ marginTop: 22 }}>
              <div className="stat-card">
                <div className="stat-number">
                  {totalObtained}/{totalMax}
                </div>
                <div className="stat-label">Total Score</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{percentage}%</div>
                <div className="stat-label">Percentage</div>
              </div>
            </div>

            <button
              className="btn btn-primary btn-block"
              style={{ marginTop: 24 }}
              onClick={download}
              disabled={downloading}
            >
              {downloading ? <Spinner /> : "Download Report Card (PDF)"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
