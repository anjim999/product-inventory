// const nodemailer = require("nodemailer");
// const {
//   BREVO_HOST,
//   BREVO_PORT,
//   BREVO_USER,
//   BREVO_PASS,
//   EMAIL_FROM
// } = require("../config/env");

// const transporter = nodemailer.createTransport({
//   host: BREVO_HOST || "smtp-relay.brevo.com",
//   port: Number(BREVO_PORT) || 587,
//   secure: false,
//   auth: {
//     user: BREVO_USER,
//     pass: BREVO_PASS,
//   },
// });

// /**
//  * Send OTP email via Brevo SMTP
//  */
// async function sendOtpEmail({ to, otp, purpose }) {
//   try {
//     const subject =
//       purpose === "REGISTER"
//         ? "Your Registration OTP - Inventory App"
//         : "Your Password Reset OTP - Inventory App";

//     const html = `
//       <div style="font-family: Arial; font-size:14px; color:#333;">
//         <p><strong>Your OTP:</strong></p>
//         <h2 style="letter-spacing:4px">${otp}</h2>
//         <p>This OTP is valid for 10 minutes.</p>
//       </div>
//     `;

//     const info = await transporter.sendMail({
//       from: EMAIL_FROM,
//       to,
//       subject,
//       html,
//     });

//     console.log("OTP Email sent via Brevo:", info.messageId);
//     return { success: true };
//   } catch (error) {
//     console.error("Error sending Brevo email:", error);
//     return { success: false, error };
//   }
// }

// module.exports = { sendOtpEmail };


// backend/src/utils/mailer.js
const { BREVO_API_KEY, EMAIL_FROM } = require('../config/env');

/**
 * Send OTP email via Brevo HTTP API
 */
async function sendOtpEmail({ to, otp, purpose }) {
  try {
    const subject =
      purpose === 'REGISTER'
        ? 'Your Registration OTP - Inventory App'
        : 'Your Password Reset OTP - Inventory App';

    const htmlContent = `
      <div style="font-family: Arial; font-size:14px; color:#333;">
        <p><strong>Your OTP:</strong></p>
        <h2 style="letter-spacing:4px">${otp}</h2>
        <p>This OTP is valid for 10 minutes.</p>
      </div>
    `;

    // Brevo expects "name <email>" or just email for sender
    const [senderName, senderEmailRaw] = EMAIL_FROM.includes('<')
      ? EMAIL_FROM.split('<')
      : [null, EMAIL_FROM];

    const sender = {
      email: senderEmailRaw.replace('>', '').trim(),
      ...(senderName ? { name: senderName.trim() } : {}),
    };

    const body = {
      sender,
      to: [{ email: to }],
      subject,
      htmlContent,
    };

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Brevo API error:', res.status, text);
      return { success: false, error: new Error(`Brevo API ${res.status}`) };
    }

    const data = await res.json();
    console.log('OTP Email sent via Brevo API:', data.messageId || data);

    return { success: true };
  } catch (error) {
    console.error('Error sending Brevo email via API:', error);
    return { success: false, error };
  }
}

module.exports = { sendOtpEmail };





// backend/src/utils/mailer.js
// const axios = require("axios");
// const { RESEND_API_KEY, EMAIL_FROM } = require("../config/env");

// /**
//  * Send OTP email using Resend HTTP API (no nodemailer/SMTP)
//  * @param {object} options
//  * @param {string} options.to
//  * @param {string} options.otp
//  * @param {string} options.purpose "REGISTER" | "RESET"
//  */
// async function sendOtpEmail({ to, otp, purpose }) {
//   if (!RESEND_API_KEY) {
//     console.warn(
//       "RESEND_API_KEY is not set. Cannot send OTP email. OTP:",
//       otp,
//       "to:",
//       to
//     );
//     // Don't crash the app, just report failure
//     return { success: false, error: "Missing RESEND_API_KEY" };
//   }

//   const subject =
//     purpose === "REGISTER"
//       ? "Your Registration OTP - Inventory App"
//       : "Your Password Reset OTP - Inventory App";

//   const html = `
//     <div style="font-family: Arial, sans-serif; font-size:14px; color:#333;">
//       <p>Dear user,</p>
//       <p>Your OTP for <strong>${
//         purpose === "REGISTER" ? "registration" : "password reset"
//       }</strong> is:</p>
//       <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 12px 0;">
//         ${otp}
//       </p>
//       <p>This OTP will expire in 10 minutes.</p>
//       <p>If you did not request this, you can safely ignore this email.</p>
//       <br/>
//       <p>Regards,<br/>Inventory Management App</p>
//     </div>
//   `;

//   try {
//     const res = await axios.post(
//       "https://api.resend.com/emails",
//       {
//         from: EMAIL_FROM,
//         to,
//         subject,
//         html,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${RESEND_API_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     console.log("OTP Email Sent via Resend:", res.data);
//     return { success: true };
//   } catch (error) {
//     console.error("Error sending OTP email via Resend:", error.response?.data || error.message);
//     return { success: false, error };
//   }
// }

// module.exports = { sendOtpEmail };



// const nodemailer = require("nodemailer");
// const {
//   SMTP_HOST,
//   SMTP_PORT,
//   SMTP_USER,
//   SMTP_PASS,
//   EMAIL_FROM
// } = require("../config/env");

// const transporter = nodemailer.createTransport({
//   host: SMTP_HOST,
//   port: Number(SMTP_PORT) || 587,
//   secure: Number(SMTP_PORT) === 465, // true for 465, false for 587/25
//   auth: {
//     user: SMTP_USER,
//     pass: SMTP_PASS
//   }
// });

// // Optional: verify transporter at startup
// transporter.verify((err, success) => {
//   if (err) {
//     console.error("Error configuring mail transporter:", err.message);
//   } else {
//     console.log("Mail transporter ready");
//   }
// });

// /**
//  * Send OTP email
//  * @param {object} options
//  * @param {string} options.to
//  * @param {string} options.otp
//  * @param {string} options.purpose "REGISTER" | "RESET"
//  */
// async function sendOtpEmail({ to, otp, purpose }) {
//   try {
//     const subject =
//       purpose === "REGISTER"
//         ? "Your Registration OTP - Inventory App"
//         : "Your Password Reset OTP - Inventory App";

//     const html = `
//       <div style="font-family: Arial, sans-serif; font-size:14px; color:#333;">
//         <p>Dear user,</p>
//         <p>Your OTP for <strong>${purpose === "REGISTER" ? "registration" : "password reset"}</strong> is:</p>
//         <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 12px 0;">
//           ${otp}
//         </p>
//         <p>This OTP will expire in 10 minutes.</p>
//         <p>If you did not request this, you can safely ignore this email.</p>
//         <br/>
//         <p>Regards,<br/>Inventory Management App</p>
//       </div>
//     `;

//     // Attempt to send email
//     const info = await transporter.sendMail({
//       from: EMAIL_FROM,
//       to,
//       subject,
//       html,
//     });

//     console.log("OTP Email Sent Successfully:", info.messageId);
//     return { success: true };
//   } catch (error) {
//     console.error("Error sending OTP email:", error);

//     // Return error instead of throwing, to prevent 500 in route
//     return { success: false, error };
//   }
// }

// module.exports = { sendOtpEmail };
