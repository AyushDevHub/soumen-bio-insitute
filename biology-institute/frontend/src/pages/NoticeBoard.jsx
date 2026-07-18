import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext.jsx';
import { api } from '../api.js';
import { Alert, SectionHeading } from '../components/Ui.jsx';

export default function NoticeBoard() {
  const { token } = useAuth();
  const [notices, setNotices] = useState([]);
  const [error, setError] = useState('');

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

  const formatDate = (ts) =>
    new Date(ts * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="page-body">
      <SectionHeading eyebrow="Stay Informed" title="Notice Board" sub="Announcements and updates from the institute." />
      <Alert type="error">{error}</Alert>

      {notices.length === 0 ? (
        <div className="empty-state">
          <span className="glyph">—</span>
          No notices have been posted yet.
        </div>
      ) : (
        <div className="notice-list">
          {notices.map((n, i) => (
            <div key={n.id} className={`card notice-card fade-up delay-${(i % 4) + 1}`}>
              {n.photo_path && <img src={n.photo_path} alt="" className="notice-photo" />}
              <div>
                <div className="notice-date">{formatDate(n.created_at)}</div>
                <h3 className="notice-title">{n.title}</h3>
                <p>{n.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
