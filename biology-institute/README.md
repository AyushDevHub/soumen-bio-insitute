# Soumendra Sir Biology Coaching Institute — Web App

A full-stack educational platform for the institute: student/parent accounts,
student registration, marks and Word report cards, a doubt-solving desk, a
notice board, and MCQ practice with photo/diagram uploads — built with a
biology-themed, premium visual style (React + vanilla CSS on the frontend,
Node/Express + SQLite on the backend).

Contact — 8910587106

## Project structure

```
biology-institute/
├── backend/     Node.js + Express + SQLite API
└── frontend/    React (Vite) + vanilla CSS
```

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env       # edit JWT_SECRET and ADMIN_SETUP_CODE
npm start                  # runs on http://localhost:5000
```

The SQLite database file (`institute.db`) is created automatically on first
run, along with an `uploads/` folder for notice/doubt/MCQ photos.

### One-time admin account

There is only one admin (the faculty/owner) account for the whole institute.
It is created the same way as any other sign-up, but requires the
`ADMIN_SETUP_CODE` from your `.env` file. On the Sign Up page, click
"Institute admin setup" at the bottom of the form, fill in the details, and
enter the setup code. Once an admin account exists, this option is disabled
for anyone else.

## 2. Frontend setup

```bash
cd frontend
npm install
npm run dev                # runs on http://localhost:5173
```

The Vite dev server proxies `/api` and `/uploads` requests to the backend on
port 5000 (see `vite.config.js`), so both servers should run together during
development.

For production, build the frontend with `npm run build` and serve the
generated `dist/` folder with any static file host (or point Express at it).

## 3. How the pieces fit together

- **Accounts** — students and parents sign up from the same form (a simple
  toggle between the two); the single admin account is provisioned once with
  a setup code. Sign in is one shared form — there is no separate "sign in as
  teacher" option.
- **Student registration** — after signing up, a student or parent completes
  a registration form (name, class, school, guardian name & contact,
  present address) from `/register`.
- **Marks & report cards** — the admin records marks per exam/topic for each
  student from `/admin`. Students and parents can view all recorded marks
  and download a formatted `.docx` report card at any time from
  `/report-card`.
- **Doubt Desk** — students post a question (with an optional photo) from
  `/doubts`; the admin answers from the same page.
- **Notice Board** — the admin publishes announcements (with an optional
  photo) from `/admin`; everyone can read them at `/notices`.
- **MCQ Practice** — the admin builds multiple-choice quizzes, optionally
  with a diagram photo, from `/admin`; students attempt them at `/quizzes`
  and see the correct answer immediately after submitting.

## Notes

- No payment functionality is included anywhere in the app, per the brief.
- Passwords are hashed with bcrypt; sessions use JSON Web Tokens.
- Password reset currently returns the reset token directly in the API
  response (rather than emailing it), since no email service is configured.
  Wire up an email provider in `backend/routes/auth.js` before using this in
  production.
