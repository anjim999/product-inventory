const nodemailer = require("nodemailer");
const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM
} = require("../config/env");

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT) || 587,
  secure: Number(SMTP_PORT) === 465, // true for 465, false for 587/25
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

// Optional: verify transporter at startup
transporter.verify((err, success) => {
  if (err) {
    console.error("Error configuring mail transporter:", err.message);
  } else {
    console.log("Mail transporter ready");
  }
});

/**
 * Send OTP email
 * @param {object} options
 * @param {string} options.to
 * @param {string} options.otp
 * @param {string} options.purpose "REGISTER" | "RESET"
 */
async function sendOtpEmail({ to, otp, purpose }) {
  try {
    const subject =
      purpose === "REGISTER"
        ? "Your Registration OTP - Inventory App"
        : "Your Password Reset OTP - Inventory App";

    const html = `
      <div style="font-family: Arial, sans-serif; font-size:14px; color:#333;">
        <p>Dear user,</p>
        <p>Your OTP for <strong>${purpose === "REGISTER" ? "registration" : "password reset"}</strong> is:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 12px 0;">
          ${otp}
        </p>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
        <br/>
        <p>Regards,<br/>Inventory Management App</p>
      </div>
    `;

    // Attempt to send email
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    });

    console.log("OTP Email Sent Successfully:", info.messageId);
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending OTP email:", error);

    // Return error instead of throwing, to prevent 500 in route
    return { success: false, error };
  }
}

module.exports = { sendOtpEmail };
