import React from "react";
import { Link } from "react-router-dom";
import {
  LeafDecor,
  HelixDecor,
  CellDecor,
  MoleculeDecor,
  GlowBlob,
} from "../components/Decor.jsx";
import { SectionHeading } from "../components/Ui.jsx";
import Reveal from "../components/Reveal.jsx";

const features = [
  {
    glyph: "I",
    title: "Guided Sign-Up",
    text: "Separate, simple onboarding for students and parents with secure sign in and password recovery.",
  },
  {
    glyph: "II",
    title: "Student Registration",
    text: "Capture name, class, school, guardian details and address in one tidy admission form.",
  },
  {
    glyph: "III",
    title: "Marks & Report Cards",
    text: "Every test recorded and turned into a downloadable Word report card in a click.",
  },
  {
    glyph: "IV",
    title: "Doubt Desk",
    text: "Students raise questions — with an optional photo — and receive faculty answers directly.",
  },
  {
    glyph: "V",
    title: "Notice Board",
    text: "Announcements, schedule changes and updates, always visible to every student and parent.",
  },
  {
    glyph: "VI",
    title: "MCQ Practice",
    text: "The faculty publishes diagram-led multiple choice quizzes for instant self-assessment.",
  },
];

const stats = [
  { value: "6", label: "Core Modules" },
  { value: "100%", label: "Digital Records" },
  { value: "24/7", label: "Doubt Desk Access" },
  { value: "1", label: "Institute, One Home" },
];

const steps = [
  {
    title: "Sign up in a minute",
    text: "Students or parents create an account, then complete a short registration form with class, school and guardian details.",
  },
  {
    title: "Faculty records progress",
    text: "Every test is logged as marks. A polished Word report card is generated automatically whenever it is needed.",
  },
  {
    title: "Doubts get answered",
    text: "Students post a question, with an optional photo of the problem, and the faculty replies directly on the same thread.",
  },
  {
    title: "Practice with MCQs",
    text: "Diagram-led quizzes are published for each class, with instant, per-question feedback as students answer.",
  },
];

// A handful of softly drifting particles behind the hero, purely decorative.
function ParticleField({ count = 14 }) {
  const particles = Array.from({ length: count }).map((_, i) => {
    const size = 3 + Math.round(Math.random() * 4);
    return {
      id: i,
      size,
      left: `${Math.round(Math.random() * 100)}%`,
      delay: `${(Math.random() * 8).toFixed(2)}s`,
      duration: `${(9 + Math.random() * 7).toFixed(2)}s`,
    };
  });
  return (
    <div className="particle-field">
      {particles.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={{
            width: p.size,
            height: p.size,
            left: p.left,
            bottom: "-20px",
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
}

export default function Landing() {
  return (
    <div>
      <section className="hero">
        <GlowBlob
          style={{ width: 420, height: 420, top: "-140px", left: "-120px" }}
        />
        <GlowBlob
          className="gold"
          style={{ width: 320, height: 320, top: "40px", right: "-100px" }}
        />
        <ParticleField />
        <LeafDecor
          className="float-slow"
          style={{ top: "-60px", left: "-90px" }}
        />
        <HelixDecor
          className="rotate-slow"
          style={{ top: "30px", right: "2%" }}
        />
        <div className="hero-inner">
          <div className="fade-up">
            <span className="hero-eyebrow">
              Est. for the pursuit of Biology
            </span>
            <h1>
              Soumendra Sir <br /> Biology Coaching Institute
            </h1>
            <p className="lead">
              A single, calm home for every student, parent and the faculty —
              attendance of marks, doubts, notices and practice, gathered under
              one roof.
            </p>
            <div className="hero-actions">
              <Link to="/signup" className="btn btn-primary">
                Create an Account
              </Link>
              <Link to="/signin" className="btn btn-ghost">
                Sign In
              </Link>
            </div>
          </div>

          <div className="hero-visual fade-up delay-2">
            <div className="hero-orb float-slow">
              <div className="hero-orb-text">
                <strong>Biology</strong>
                the study of life, taught with care
              </div>
            </div>
            <div className="contact-pill">Contact — 8910587106</div>
          </div>
        </div>
      </section>

      <section className="stats-strip">
        <CellDecor
          style={{
            width: 300,
            height: 300,
            top: "-80px",
            right: "-60px",
            color: "var(--gold-400)",
          }}
        />
        <div className="stats-inner">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 90}>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="features">
        <SectionHeading
          eyebrow="What the institute offers"
          title="Everything a coaching class needs"
          sub="Built around the daily rhythm of teaching biology — registration, records, doubts and practice."
        />
        <div className="feature-grid">
          {features.map((f, i) => (
            <Reveal
              key={f.title}
              delay={(i % 3) * 100}
              className="card card-hover feature-card"
            >
              <div className="feature-icon">{f.glyph}</div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="timeline">
        <MoleculeDecor
          className="float-slow"
          style={{ top: "20px", right: "6%" }}
        />
        <SectionHeading
          eyebrow="How it works"
          title="From sign-up to report card, in four steps"
          sub="A short, guided path so students, parents and faculty always know what happens next."
        />
        <div className="timeline-steps">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 110} className="timeline-step">
              <div className="timeline-dot">{i + 1}</div>
              <h4>{s.title}</h4>
              <p>{s.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal as="section" className="cta-banner">
        <HelixDecor
          className="rotate-slow"
          style={{ top: "-30px", left: "4%", opacity: 0.5 }}
        />
        <h2>Ready to bring your class online?</h2>
        <p>
          Create an account in a minute and have marks, doubts, notices and
          quizzes in one calm place.
        </p>
        <div className="hero-actions">
          <Link to="/signup" className="btn btn-gold">
            Create an Account
          </Link>
          <Link to="/signin" className="btn btn-ghost btn-ghost-on-dark">
            Sign In
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
