// require("dotenv").config();

// module.exports = {
//   PORT: process.env.PORT || 5000,
//   JWT_SECRET: process.env.JWT_SECRET || "devsecret",
//   CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5173",
//   SMTP_HOST: process.env.SMTP_HOST,
//   SMTP_PORT: process.env.SMTP_PORT,
//   SMTP_USER: process.env.SMTP_USER,
//   SMTP_PASS: process.env.SMTP_PASS,
//   EMAIL_FROM: process.env.EMAIL_FROM || process.env.SMTP_USER
// };



// require("dotenv").config();

// module.exports = {
//   PORT: process.env.PORT || 5000,
//   JWT_SECRET: process.env.JWT_SECRET || "dev-secret",

//   // For Resend (HTTP email API)
//   RESEND_API_KEY: process.env.RESEND_API_KEY,
//   EMAIL_FROM: process.env.EMAIL_FROM || "Inventory App <no-reply@example.com>",
// };



const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '..', '..', '.env'),
});

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET,
  EMAIL_FROM: process.env.EMAIL_FROM,
  BREVO_API_KEY: process.env.BREVO_API_KEY,
};



// require("dotenv").config();

// module.exports = {
//   PORT: process.env.PORT,
//   JWT_SECRET: process.env.JWT_SECRET,
//   BREVO_HOST: process.env.BREVO_HOST,
//   BREVO_PORT: process.env.BREVO_PORT,
//   BREVO_USER: process.env.BREVO_USER,
//   BREVO_PASS: process.env.BREVO_PASS,
//   EMAIL_FROM: process.env.EMAIL_FROM,
//   JWT_SECRET: process.env.JWT_SECRET,

// };


