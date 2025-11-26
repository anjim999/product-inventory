// backend/src/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const db = require("../db");
const { generateOtp, getExpiry } = require("../utils/otp");
const { JWT_SECRET, GOOGLE_CLIENT_ID } = require("../config/env");
const { sendOtpEmail } = require("../utils/mailer");
const { OAuth2Client } = require("google-auth-library");

const router = express.Router();

const googleClient = GOOGLE_CLIENT_ID
  ? new OAuth2Client(GOOGLE_CLIENT_ID)
  : null;

const validate = (rules) => [
  ...rules,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error("Validation error:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

const normalizeEmail = (email) => email.trim().toLowerCase();

router.post("/register-request-otp", async (req, res) => {
  try {
    const rawEmail = req.body.email || "";
    const email = normalizeEmail(rawEmail);

    const code = generateOtp();
    const expiresAt = getExpiry(10);

    db.run(
      "INSERT INTO otps (email, code, purpose, expires_at) VALUES (?, ?, ?, ?)",
      [email, code, "REGISTER", expiresAt],
      async (err) => {
        if (err) {
          console.error("DB error inserting register OTP:", err);
          return res.status(500).json({ message: "DB error" });
        }

        const mailResult = await sendOtpEmail({
          to: email,
          otp: code,
          purpose: "REGISTER",
        });

        if (!mailResult.success) {
          console.warn(
            "OTP email not delivered (Brevo issue). OTP is logged on server only."
          );
        }

        return res.json({
          message:
            "OTP generated. If email doesn't arrive, use the OTP from server logs.",
          devOtp: process.env.NODE_ENV !== "production" ? code : undefined,
        });
      }
    );
  } catch (err) {
    console.error("Error in /register-request-otp:", err);
    return res.status(500).json({ message: "Failed to generate OTP" });
  }
});

router.post(
  "/register-verify",
  validate([
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail(),
    body("otp").isLength({ min: 4 }),
    body("password").isLength({ min: 6 }),
  ]),
  (req, res) => {
    const { name, email: rawEmail, otp, password } = req.body;
    const email = normalizeEmail(rawEmail);

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
            const role = "user";

            const token = jwt.sign(
              { userId, email, name, role },
              JWT_SECRET,
              { expiresIn: "1d" }
            );

            return res.json({
              message: "Registration successful",
              token,
              user: { id: userId, name, email, role },
            });
          }
        );
      }
    );
  }
);

router.post(
  "/login",
  validate([
    body("email").isEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password is required"),
  ]),
  (req, res) => {
    const rawEmail = req.body.email || "";
    const email = normalizeEmail(rawEmail);
    const { password } = req.body;

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
        {
          userId: user.id,
          email: user.email,
          name: user.name,
          role: user.role || "user",
        },
        JWT_SECRET,
        { expiresIn: "1d" }
      );

      console.log("Login successful for", email);
      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role || "user",
        },
      });
    });
  }
);

router.post(
  "/forgot-password-request",
  validate([body("email").isEmail()]),
  (req, res) => {
    const rawEmail = req.body.email || "";
    const email = normalizeEmail(rawEmail);

    db.get(
      "SELECT id FROM users WHERE email = ?",
      [email],
      (err, userRow) => {
        if (err) {
          console.error("DB error on forgot-password-request:", err);
          return res.status(500).json({ message: "DB error" });
        }

        if (!userRow) {
          console.warn(
            "Forgot password requested for non-existing email:",
            email
          );

          return res.json({
            message:
              "If the email exists, an OTP has been sent to reset the password",
          });
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
                  "If the email exists, an OTP has been sent to reset the password",
              });
            } catch (mailErr) {
              console.error("Error sending reset OTP email:", mailErr);
              return res.status(500).json({
                message: "Failed to send OTP email. Try again.",
              });
            }
          }
        );
      }
    );
  }
);

router.post(
  "/forgot-password-verify",
  validate([
    body("email").isEmail(),
    body("otp").isLength({ min: 4 }),
    body("newPassword").isLength({ min: 6 }),
  ]),
  (req, res) => {
    const { email: rawEmail, otp, newPassword } = req.body;
    const email = normalizeEmail(rawEmail);

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
            if (this.changes === 0) {
              console.warn(
                "Password reset attempted for non-existing email:",
                email
              );
              return res
                .status(400)
                .json({ message: "User not found for this email" });
            }

            db.run("UPDATE otps SET used = 1 WHERE id = ?", [otpRow.id]);
            console.log("Password reset successful for", email);
            return res.json({ message: "Password reset successful" });
          }
        );
      }
    );
  }
);

/**
 * Google Login
 * POST /api/auth/google
 * Body: { idToken: string }
 */
/**
 * Google Login
 * POST /api/auth/google
 * Body: { idToken?: string, credential?: string }
 */
router.post("/google", async (req, res) => {
  try {
    const { idToken, credential } = req.body || {};

    // Accept either "idToken" or "credential" from frontend
    const token = idToken || credential;

    if (!token) {
      return res
        .status(400)
        .json({ message: "idToken (or credential) is required" });
    }

    if (!googleClient || !GOOGLE_CLIENT_ID) {
      console.error("Google auth not configured on server.");
      return res
        .status(500)
        .json({ message: "Google login is not configured on server." });
    }

    // Verify ID token with Google
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const googleId = payload.sub;
    const rawEmail = payload.email || "";
    const email = normalizeEmail(rawEmail);
    const name = payload.name || email;
    const avatar = payload.picture || null;

    if (!email) {
      return res
        .status(400)
        .json({ message: "Google account does not have a valid email." });
    }

    // TC: O(1) average lookup by email
    db.get(
      "SELECT * FROM users WHERE email = ?",
      [email],
      (err, userRow) => {
        if (err) {
          console.error("DB error on Google login:", err);
          return res.status(500).json({ message: "DB error" });
        }

        if (userRow) {
          // Existing user: log them in
          const role = userRow.role || "user";

          const jwtPayload = {
            userId: userRow.id,
            email: userRow.email,
            name: userRow.name,
            role,
          };

          const token = jwt.sign(jwtPayload, JWT_SECRET, {
            expiresIn: "1d",
          });

          console.log("Google login successful for existing user:", email);

          return res.json({
            message: "Login successful",
            token,
            user: {
              id: userRow.id,
              name: userRow.name,
              email: userRow.email,
              role,
              avatar: userRow.avatar || avatar || null,
            },
          });
        }

        // New user: create a record
        const createdAt = new Date().toISOString();
        const role = "user";

        // Dummy password to satisfy NOT NULL constraint
        const dummyPassword = bcrypt.hashSync(googleId + JWT_SECRET, 10);

        db.run(
          "INSERT INTO users (name, email, password, role, is_verified, created_at, google_id, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [name, email, dummyPassword, role, 1, createdAt, googleId, avatar],
          function (err2) {
            if (err2) {
              console.error("DB error inserting Google user:", err2);
              return res.status(500).json({ message: "DB error" });
            }

            const userId = this.lastID;

            const jwtPayload = { userId, email, name, role };

            const token = jwt.sign(jwtPayload, JWT_SECRET, {
              expiresIn: "1d",
            });

            console.log("Google login created new user:", email);

            return res.json({
              message: "Login successful",
              token,
              user: {
                id: userId,
                name,
                email,
                role,
                avatar,
              },
            });
          }
        );
      }
    );
  } catch (err) {
    console.error("Error in /api/auth/google:", err);
    return res.status(401).json({ message: "Invalid Google token" });
  }
});


module.exports = router;
