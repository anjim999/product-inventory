const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const db = require("../db");
const { generateOtp, getExpiry } = require("../utils/otp");
const { JWT_SECRET } = require("../config/env");
const { sendOtpEmail } = require("../utils/mailer");

const router = express.Router();

/**
 * POST /api/auth/register-request-otp
 * body: { email }
 * Sends OTP for registration to email
 */
router.post(
  "/register-request-otp",
  body("email").isEmail(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email } = req.body;

    db.get("SELECT id FROM users WHERE email = ?", [email], async (err, user) => {
      if (err) return res.status(500).json({ message: "DB error" });
      if (user) return res.status(400).json({ message: "Email already registered" });

      const code = generateOtp();
      const expiresAt = getExpiry(10);

      db.run(
        "INSERT INTO otps (email, code, purpose, expires_at) VALUES (?, ?, ?, ?)",
        [email, code, "REGISTER", expiresAt],
        async function (err2) {
          if (err2) return res.status(500).json({ message: "DB error" });

          try {
            // Send OTP via email
            await sendOtpEmail({ to: email, otp: code, purpose: "REGISTER" });
            console.log("Registration OTP for", email, "=>", code); // debug log
            return res.json({
              message: "OTP sent to email for registration"
            });
          } catch (mailErr) {
            console.error("Error sending OTP email:", mailErr);
            return res
              .status(500)
              .json({ message: "Failed to send OTP email. Try again." });
          }
        }
      );
    });
  }
);

/**
 * POST /api/auth/register-verify
 * body: { email, otp, password }
 */
router.post(
  "/register-verify",
  body("email").isEmail(),
  body("otp").isLength({ min: 4 }),
  body("password").isLength({ min: 6 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, otp, password } = req.body;

    db.get(
      "SELECT * FROM otps WHERE email = ? AND code = ? AND purpose = ? AND used = 0",
      [email, otp, "REGISTER"],
      (err, otpRow) => {
        if (err) return res.status(500).json({ message: "DB error" });
        if (!otpRow) return res.status(400).json({ message: "Invalid OTP" });

        const now = new Date().toISOString();
        if (otpRow.expires_at < now) {
          return res.status(400).json({ message: "OTP expired" });
        }

        const hashed = bcrypt.hashSync(password, 10);
        const createdAt = new Date().toISOString();

        db.run(
          "INSERT INTO users (email, password, is_verified, created_at) VALUES (?, ?, ?, ?)",
          [email, hashed, 1, createdAt],
          function (err2) {
            if (err2) {
              console.error(err2);
              return res.status(500).json({ message: "DB error" });
            }

            db.run("UPDATE otps SET used = 1 WHERE id = ?", [otpRow.id]);

            const token = jwt.sign(
              { userId: this.lastID, email },
              JWT_SECRET,
              { expiresIn: "1d" }
            );

            return res.json({
              message: "Registration successful",
              token,
              user: { id: this.lastID, email }
            });
          }
        );
      }
    );
  }
);

/**
 * POST /api/auth/login
 * body: { email, password }
 */router.post(
  "/login",
  body("email").isEmail(),
  body("password").exists(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
      if (err) return res.status(500).json({ message: "DB error" });
      if (!user) return res.status(400).json({ message: "Invalid credentials" });

      const ok = require("bcryptjs").compareSync(password, user.password);
      if (!ok) return res.status(400).json({ message: "Invalid credentials" });

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.json({
        message: "Login successful",
        token,
        user: { id: user.id, email: user.email }
      });
    });
  }
);


/**
 * POST /api/auth/forgot-password-request
 * body: { email }
 */
router.post(
  "/forgot-password-request",
  body("email").isEmail(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email } = req.body;

    db.get("SELECT id FROM users WHERE email = ?", [email], (err, user) => {
      if (err) return res.status(500).json({ message: "DB error" });

      // Even if user doesn't exist, behave the same to avoid leaking info
      const code = generateOtp();
      const expiresAt = getExpiry(10);

      db.run(
        "INSERT INTO otps (email, code, purpose, expires_at) VALUES (?, ?, ?, ?)",
        [email, code, "RESET", expiresAt],
        async function (err2) {
          if (err2) return res.status(500).json({ message: "DB error" });

          try {
            await sendOtpEmail({ to: email, otp: code, purpose: "RESET" });
            console.log("Reset OTP for", email, "=>", code); // debug
            return res.json({
              message:
                "If the email exists, an OTP has been sent to reset the password"
            });
          } catch (mailErr) {
            console.error("Error sending reset OTP email:", mailErr);
            return res
              .status(500)
              .json({ message: "Failed to send OTP email. Try again." });
          }
        }
      );
    });
  }
);

/**
 * POST /api/auth/forgot-password-verify
 * body: { email, otp, newPassword }
 */
router.post(
  "/forgot-password-verify",
  body("email").isEmail(),
  body("otp").isLength({ min: 4 }),
  body("newPassword").isLength({ min: 6 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, otp, newPassword } = req.body;

    db.get(
      "SELECT * FROM otps WHERE email = ? AND code = ? AND purpose = ? AND used = 0",
      [email, otp, "RESET"],
      (err, otpRow) => {
        if (err) return res.status(500).json({ message: "DB error" });
        if (!otpRow) return res.status(400).json({ message: "Invalid OTP" });

        const now = new Date().toISOString();
        if (otpRow.expires_at < now) {
          return res.status(400).json({ message: "OTP expired" });
        }

        const hashed = bcrypt.hashSync(newPassword, 10);

        db.run(
          "UPDATE users SET password = ? WHERE email = ?",
          [hashed, email],
          function (err2) {
            if (err2) return res.status(500).json({ message: "DB error" });

            db.run("UPDATE otps SET used = 1 WHERE id = ?", [otpRow.id]);

            return res.json({ message: "Password reset successful" });
          }
        );
      }
    );
  }
);

module.exports = router;
