import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import { Alert, Spinner } from '../components/Ui.jsx';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get('email') || '');
  const [token, setToken] = useState(params.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await api.resetPassword({ email, token, newPassword });
      setMessage(res.message);
      setTimeout(() => navigate('/signin'), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-up">
        <h1>Set a New Password</h1>
        <p className="auth-sub">Enter the details from your reset link</p>

        <Alert type="error">{error}</Alert>
        <Alert type="success">{message}</Alert>

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Reset Token</label>
            <input type="text" required value={token} onChange={(e) => setToken(e.target.value)} />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? <Spinner /> : 'Update Password'}
          </button>
        </form>

        <p className="auth-switch">
          <Link to="/signin">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
