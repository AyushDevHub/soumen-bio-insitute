import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { Alert, Spinner, SectionHeading } from '../components/Ui.jsx';

const empty = {
  name: '',
  class: '',
  school_name: '',
  guardian_name: '',
  guardian_contact: '',
  address: ''
};

export default function StudentRegistration() {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await api.registerStudent(form, token);
      setMessage('Registration completed successfully.');
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-body">
      <SectionHeading
        eyebrow={user?.role === 'parent' ? "Your Ward's Admission" : 'New Student Admission'}
        title="Student Registration"
        sub="Please provide accurate details — these will appear on the report card and institute records."
      />

      <div className="card fade-up" style={{ maxWidth: 640, margin: '0 auto' }}>
        <Alert type="error">{error}</Alert>
        <Alert type="success">{message}</Alert>

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Student's Full Name</label>
            <input name="name" required value={form.name} onChange={onChange} placeholder="Full name" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Class</label>
              <input name="class" required value={form.class} onChange={onChange} placeholder="e.g. Class 10" />
            </div>
            <div className="form-group">
              <label>Name of School</label>
              <input name="school_name" required value={form.school_name} onChange={onChange} placeholder="School name" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Guardian's Name</label>
              <input name="guardian_name" required value={form.guardian_name} onChange={onChange} placeholder="Guardian's name" />
            </div>
            <div className="form-group">
              <label>Guardian's Contact Number</label>
              <input
                name="guardian_contact"
                required
                value={form.guardian_contact}
                onChange={onChange}
                placeholder="10-digit mobile number"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Present Address</label>
            <textarea name="address" required value={form.address} onChange={onChange} placeholder="Full present address" />
          </div>

          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? <Spinner /> : 'Complete Registration'}
          </button>
        </form>
      </div>
    </div>
  );
}
