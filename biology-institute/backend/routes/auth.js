const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { v4: uuid } = require("uuid");
const { query, queryOne } = require("../db");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

router.post("/signup", async (req, res) => {
  try {
    const { role, name, email, phone, password, adminCode } = req.body;

    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ error: "Please fill in all required fields." });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password should be at least 6 characters." });
    }
    if (!["student", "parent", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid account type." });
    }

    if (role === "admin") {
      const existingAdmin = await queryOne(
        "SELECT id FROM users WHERE role = $1",
        ["admin"]
      );
      if (existingAdmin) {
        return res.status(400).json({
          error: "An admin account already exists for this institute.",
        });
      }
      if (
        adminCode !== (process.env.ADMIN_SETUP_CODE || "SOUMENDRA-BIO-2026")
      ) {
        return res
          .status(403)
          .json({ error: "Invalid setup code for admin registration." });
      }
    }

    const existing = await queryOne("SELECT id FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);
    if (existing) {
      return res
        .status(400)
        .json({ error: "An account with this email already exists." });
    }

    const id = uuid();
    const password_hash = bcrypt.hashSync(password, 10);
    await query(
      `INSERT INTO users (id, role, name, email, phone, password_hash) VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, role, name, email.toLowerCase(), phone || null, password_hash]
    );

    const user = { id, role, name, email: email.toLowerCase() };
    const token = signToken(user);
    res.json({ token, user });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ error: "Something went wrong while creating the account." });
  }
});

router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Please enter your email and password." });
    }
    const user = await queryOne("SELECT * FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }
    const token = signToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Something went wrong while signing in." });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await queryOne("SELECT * FROM users WHERE email = $1", [
      (email || "").toLowerCase(),
    ]);
    if (!user) {
      return res.json({
        message:
          "If that email is registered, a reset link has been generated.",
      });
    }
    const token = crypto.randomBytes(24).toString("hex");
    const expiry = Date.now() + 1000 * 60 * 30;
    await query(
      "UPDATE users SET reset_token = $1, reset_expiry = $2 WHERE id = $3",
      [token, expiry, user.id]
    );

    res.json({
      message: "If that email is registered, a reset link has been generated.",
      devResetToken: token,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "Password should be at least 6 characters." });
    }
    const user = await queryOne("SELECT * FROM users WHERE email = $1", [
      (email || "").toLowerCase(),
    ]);
    if (
      !user ||
      user.reset_token !== token ||
      !user.reset_expiry ||
      Number(user.reset_expiry) < Date.now()
    ) {
      return res
        .status(400)
        .json({ error: "This reset link is invalid or has expired." });
    }
    const password_hash = bcrypt.hashSync(newPassword, 10);
    await query(
      "UPDATE users SET password_hash = $1, reset_token = NULL, reset_expiry = NULL WHERE id = $2",
      [password_hash, user.id]
    );
    res.json({ message: "Password updated successfully. Please sign in." });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

module.exports = router;
