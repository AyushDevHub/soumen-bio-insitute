const { Pool } = require("pg");

// NeonDB (serverless Postgres) connection.
// Set DATABASE_URL in your .env, e.g.:
// DATABASE_URL=postgresql://user:password@ep-xxxx.neon.tech/neondb?sslmode=require
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.on("error", (err) => {
  console.error("Unexpected Postgres pool error:", err);
});

// Small query helper so route files can stay close to their original shape.
async function query(text, params = []) {
  const result = await pool.query(text, params);
  return result.rows;
}

async function queryOne(text, params = []) {
  const rows = await query(text, params);
  return rows[0] || null;
}

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL CHECK(role IN ('admin','student','parent')),
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      reset_token TEXT,
      reset_expiry BIGINT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      name TEXT NOT NULL,
      class TEXT NOT NULL,
      school_name TEXT NOT NULL,
      guardian_name TEXT NOT NULL,
      guardian_contact TEXT NOT NULL,
      address TEXT NOT NULL,
      parent_user_id TEXT REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS marks (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id),
      exam_name TEXT NOT NULL,
      topic TEXT NOT NULL,
      marks_obtained REAL NOT NULL,
      total_marks REAL NOT NULL,
      remarks TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS chapters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      class TEXT,
      order_index INTEGER DEFAULT 0,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS doubts (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id),
      chapter_id TEXT REFERENCES chapters(id),
      question TEXT NOT NULL,
      photo_path TEXT,
      photo_public_id TEXT,
      answer TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','answered')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      answered_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS notices (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      photo_path TEXT,
      photo_public_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS mcq_sets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      class TEXT,
      chapter_id TEXT REFERENCES chapters(id),
      content_type TEXT NOT NULL DEFAULT 'mcq' CHECK(content_type IN ('mcq','dpp')),
      worksheet_path TEXT,
      worksheet_public_id TEXT,
      photo_path TEXT,
      photo_public_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS mcq_questions (
      id TEXT PRIMARY KEY,
      set_id TEXT NOT NULL REFERENCES mcq_sets(id),
      question TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_option TEXT NOT NULL CHECK(correct_option IN ('a','b','c','d'))
    );

    CREATE TABLE IF NOT EXISTS mcq_responses (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL REFERENCES mcq_questions(id),
      student_id TEXT NOT NULL REFERENCES students(id),
      chosen_option TEXT NOT NULL,
      is_correct BOOLEAN NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(question_id, student_id)
    );
  `);

  // Lightweight migrations for databases created before chapters/DPP existed.
  await pool.query(`
    ALTER TABLE doubts ADD COLUMN IF NOT EXISTS chapter_id TEXT REFERENCES chapters(id);
    ALTER TABLE mcq_sets ADD COLUMN IF NOT EXISTS chapter_id TEXT REFERENCES chapters(id);
    ALTER TABLE mcq_sets ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'mcq';
    ALTER TABLE mcq_sets ADD COLUMN IF NOT EXISTS worksheet_path TEXT;
    ALTER TABLE mcq_sets ADD COLUMN IF NOT EXISTS worksheet_public_id TEXT;
  `);

  console.log("NeonDB (Postgres) schema ready.");
}

module.exports = { pool, query, queryOne, init };
