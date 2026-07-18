import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { Alert, Spinner } from '../components/Ui.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [devToken, setDevToken] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await api.forgotPassword(email);
      setMessage(res.message);
      if (res.devResetToken) setDevToken(res.devResetToken);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const proceed = () => {
    navigate(`/reset-password?email=${encodeURIComponent(email)}&token=${devToken}`);
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-up">
        <h1>Reset Password</h1>
        <p className="auth-sub">Enter your email and we will generate a reset link</p>

        <Alert type="error">{error}</Alert>
        <Alert type="success">{message}</Alert>

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? <Spinner /> : 'Send Reset Link'}
          </button>
        </form>

        {devToken && (
          <button className="btn btn-gold btn-block" style={{ marginTop: 14 }} onClick={proceed}>
            Continue to Reset Password →
          </button>
        )}

        <p className="auth-switch">
          <Link to="/signin">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
