import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import { Alert, Spinner } from "../components/Ui.jsx";
import { HelixDecor } from "../components/Decor.jsx";

export default function SignUp() {
  const [role, setRole] = useState("student");
  const [adminMode, setAdminMode] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    adminCode: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to="/dashboard" replace />;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = { ...form, role: adminMode ? "admin" : role };
      const { token, user } = await api.signUp(payload);
      login(token, user);
      navigate(adminMode || role === "admin" ? "/admin" : "/register", {
        replace: true,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <HelixDecor className="float-slow" style={{ top: "10px", right: "2%" }} />
      <div className="auth-card fade-up">
        <h1>Join the Institute</h1>
        <p className="auth-sub">
          {adminMode
            ? "One-time setup for the institute administrator"
            : "Create your account to get started"}
        </p>

        <Alert type="error">{error}</Alert>

        {!adminMode && (
          <div className="role-tabs">
            <button
              type="button"
              className={`role-tab ${role === "student" ? "active" : ""}`}
              onClick={() => setRole("student")}
            >
              Student
            </button>
            <button
              type="button"
              className={`role-tab ${role === "parent" ? "active" : ""}`}
              onClick={() => setRole("parent")}
            >
              Parent
            </button>
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={onChange}
              placeholder="Your full name"
            />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={onChange}
              placeholder="you@example.com"
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={onChange}
              placeholder="10-digit mobile number"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              required
              value={form.password}
              onChange={onChange}
              placeholder="At least 6 characters"
            />
          </div>

          {adminMode && (
            <div className="form-group">
              <label>Admin Setup Code</label>
              <input
                type="text"
                name="adminCode"
                required
                value={form.adminCode}
                onChange={onChange}
                placeholder="Provided by the institute"
              />
              <p className="field-hint">
                This code is issued once, outside the app, to the institute
                owner.
              </p>
            </div>
          )}

          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? <Spinner /> : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          Already registered? <Link to="/signin">Sign in</Link>
        </p>
        <p className="auth-switch">
          <button
            type="button"
            onClick={() => setAdminMode(!adminMode)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--ink-400)",
              fontSize: "0.78rem",
            }}
          >
            {adminMode
              ? "← Back to student / parent sign up"
              : "Institute admin setup"}
          </button>
        </p>
      </div>
    </div>
  );
}
