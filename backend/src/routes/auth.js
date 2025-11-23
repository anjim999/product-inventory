// backend/src/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const db = require("../db");
const { generateOtp, getExpiry } = require("../utils/otp");
const { JWT_SECRET } = require("../config/env");
const { sendOtpEmail } = require("../utils/mailer");

const router = express.Router();

// helper: validation wrapper
const validate = (rules) => [
  ...rules,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error("Validation error:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

/**
 * POST /api/auth/register-request-otp
 * body: { email }
 */
/**
 * POST /api/auth/register-request-otp
 * body: { email }
 */
router.post('/register-request-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const code = generateOtp();
    const expiresAt = getExpiry(10);

    db.run(
      "INSERT INTO otps (email, code, purpose, expires_at) VALUES (?, ?, ?, ?)",
      [email, code, "REGISTER", expiresAt],
      async (err) => {
        if (err) {
          console.error('DB error inserting register OTP:', err);
          return res.status(500).json({ message: 'DB error' });
        }

        // Try to send email, but do NOT fail the whole request if Resend blocks it
        const mailResult = await sendOtpEmail({
          to: email,
          otp: code,
          purpose: 'REGISTER'
        });

        if (!mailResult.success) {
          console.warn(
            'OTP email not delivered (Resend sandbox or other issue). OTP is logged on server only.'
          );
        }

        return res.json({
          message:
            "OTP generated. If email doesn't arrive (sandbox), use the OTP from server logs.",
          // For local development, you can expose OTP to frontend for easier testing:
          devOtp: process.env.NODE_ENV !== 'production' ? code : undefined
        });
      }
    );
  } catch (err) {
    console.error('Error in /register-request-otp:', err);
    return res.status(500).json({ message: 'Failed to generate OTP' });
  }
});



/**
 * POST /api/auth/register-verify
 * body: { email, otp, password }
 */
/**
 * POST /api/auth/register-verify
 * body: { name, email, otp, password }
 */
router.post(
  "/register-verify",
  validate([
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail(),
    body("otp").isLength({ min: 4 }),
    body("password").isLength({ min: 6 })
  ]),
  (req, res) => {
    const { name, email, otp, password } = req.body;

    db.get(
      "SELECT * FROM otps WHERE email = ? AND code = ? AND purpose = ? AND used = 0",
      [email, otp, "REGISTER"],
      (err, otpRow) => {
        if (err) {
          console.error("DB error reading OTP:", err);
          return res.status(500).json({ message: "DB error" });
        }
        if (!otpRow) {
          return res.status(400).json({ message: "Invalid OTP" });
        }

        const nowIso = new Date().toISOString();
        if (otpRow.expires_at < nowIso) {
          return res.status(400).json({ message: "OTP expired" });
        }

        const hashed = bcrypt.hashSync(password, 10);
        const createdAt = new Date().toISOString();

        db.run(
          "INSERT INTO users (name, email, password, is_verified, created_at) VALUES (?, ?, ?, ?, ?)",
          [name, email, hashed, 1, createdAt],
          function (err2) {
            if (err2) {
              console.error("DB error inserting user:", err2);
              return res.status(500).json({ message: "DB error" });
            }

            db.run("UPDATE otps SET used = 1 WHERE id = ?", [otpRow.id]);

            const userId = this.lastID;

            // Include name in token
            const token = jwt.sign(
              { userId, email, name },
              JWT_SECRET,
              { expiresIn: "1d" }
            );

            return res.json({
              message: "Registration successful",
              token,
              user: { id: userId, name, email }
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
 */
router.post(
  "/login",
  validate([
    body("email").isEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password is required")
  ]),
  (req, res) => {
    const { email, password } = req.body;

    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
      if (err) {
        console.error("DB error on login:", err);
        return res.status(500).json({ message: "DB error" });
      }
      if (!user) {
        console.warn("Login failed: user not found for", email);
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const ok = bcrypt.compareSync(password, user.password);
      if (!ok) {
        console.warn("Login failed: wrong password for", email);
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "1d" }
      );

      console.log("Login successful for", email);
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
  validate([body("email").isEmail()]),
  (req, res) => {
    const { email } = req.body;

    db.get("SELECT id FROM users WHERE email = ?", [email], (err) => {
      if (err) {
        console.error("DB error on forgot-password-request:", err);
        return res.status(500).json({ message: "DB error" });
      }

      const code = generateOtp();
      const expiresAt = getExpiry(10);

      db.run(
        "INSERT INTO otps (email, code, purpose, expires_at) VALUES (?, ?, ?, ?)",
        [email, code, "RESET", expiresAt],
        async (err2) => {
          if (err2) {
            console.error("DB error inserting reset OTP:", err2);
            return res.status(500).json({ message: "DB error" });
          }

          try {
            await sendOtpEmail({ to: email, otp: code, purpose: "RESET" });
            console.log("Reset OTP for", email, "=>", code);
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
  validate([
    body("email").isEmail(),
    body("otp").isLength({ min: 4 }),
    body("newPassword").isLength({ min: 6 })
  ]),
  (req, res) => {
    const { email, otp, newPassword } = req.body;

    db.get(
      "SELECT * FROM otps WHERE email = ? AND code = ? AND purpose = ? AND used = 0",
      [email, otp, "RESET"],
      (err, otpRow) => {
        if (err) {
          console.error("DB error on reset verify:", err);
          return res.status(500).json({ message: "DB error" });
        }
        if (!otpRow) {
          return res.status(400).json({ message: "Invalid OTP" });
        }

        const nowIso = new Date().toISOString();
        if (otpRow.expires_at < nowIso) {
          return res.status(400).json({ message: "OTP expired" });
        }

        const hashed = bcrypt.hashSync(newPassword, 10);

        db.run(
          "UPDATE users SET password = ? WHERE email = ?",
          [hashed, email],
          function (err2) {
            if (err2) {
              console.error("DB error updating password:", err2);
              return res.status(500).json({ message: "DB error" });
            }

            db.run("UPDATE otps SET used = 1 WHERE id = ?", [otpRow.id]);
            return res.json({ message: "Password reset successful" });
          }
        );
      }
    );
  }
);

module.exports = router;
