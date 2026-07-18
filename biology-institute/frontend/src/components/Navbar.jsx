import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { Monogram } from "./Decor.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  const links = user
    ? [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/notices", label: "Notice Board" },
        { to: "/chapters", label: "Chapters" },
        ...(user.role !== "admin"
          ? [{ to: "/report-card", label: "Report Card" }]
          : []),
        ...(user.role === "admin"
          ? [{ to: "/admin", label: "Manage Institute" }]
          : []),
      ]
    : [];

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <Monogram size={38} />
          <div className="brand-text">
            <span className="brand-name">Soumendra Sir</span>
            <span className="brand-sub">Biology Coaching Institute</span>
          </div>
        </Link>

        <button
          className={`nav-toggle ${open ? "is-open" : ""}`}
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`nav-links ${open ? "is-open" : ""}`}>
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="nav-link"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <button className="btn btn-ghost nav-cta" onClick={handleLogout}>
              Sign Out
            </button>
          ) : (
            <Link
              to="/signin"
              className="btn btn-primary nav-cta"
              onClick={() => setOpen(false)}
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
