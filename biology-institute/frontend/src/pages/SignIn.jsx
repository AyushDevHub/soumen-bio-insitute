import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { Alert, Spinner } from '../components/Ui.jsx';
import { LeafDecor } from '../components/Decor.jsx';

export default function SignIn() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await api.signIn(form);
      login(token, user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <LeafDecor className="float-slow" style={{ top: '-40px', left: '-100px' }} />
      <div className="auth-card fade-up">
        <h1>Welcome Back</h1>
        <p className="auth-sub">Sign in to your institute account</p>

        <Alert type="error">{error}</Alert>

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" name="email" required value={form.email} onChange={onChange} placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              required
              value={form.password}
              onChange={onChange}
              placeholder="Enter your password"
            />
          </div>
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? <Spinner /> : 'Sign In'}
          </button>
        </form>

        <p className="auth-switch">
          <Link to="/forgot-password">Forgot your password?</Link>
        </p>
        <p className="auth-switch">
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
