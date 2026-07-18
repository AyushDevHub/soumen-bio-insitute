import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export function Alert({ type = 'info', children }) {
  if (!children) return null;
  return <div className={`alert alert-${type}`}>{children}</div>;
}

export function Spinner() {
  return <span className="spinner" aria-label="Loading" />;
}

export function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/signin" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export function SectionHeading({ eyebrow, title, sub }) {
  return (
    <div className="section-heading fade-up">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      {sub && <p className="section-sub">{sub}</p>}
    </div>
  );
}
