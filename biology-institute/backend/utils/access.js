const { query, queryOne } = require("../db");

// Returns null for admins (no restriction), or an array of class strings
// the viewer is allowed to see (their own class for a student, their
// children's classes for a parent).
async function viewerClasses(req) {
  if (req.user.role === "admin") return null;

  if (req.user.role === "student") {
    const student = await queryOne(
      "SELECT class FROM students WHERE user_id = $1",
      [req.user.id]
    );
    return student && student.class ? [student.class] : [];
  }

  if (req.user.role === "parent") {
    const rows = await query(
      "SELECT DISTINCT class FROM students WHERE parent_user_id = $1",
      [req.user.id]
    );
    return rows.map((r) => r.class).filter(Boolean);
  }

  return [];
}

module.exports = { viewerClasses };
