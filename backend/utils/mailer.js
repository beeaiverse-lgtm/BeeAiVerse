// Minimal mail sender used for password-reset OTP emails.
//
// Configure real delivery via SMTP env vars (see .env.example):
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
// If those aren't set (e.g. local/dev), the OTP is printed to the server
// console instead of emailed, so the flow still works end-to-end without
// requiring an SMTP account.
let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  nodemailer = null;
}

function smtpConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transporter = null;
function getTransporter() {
  if (!nodemailer || !smtpConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  }
  return transporter;
}

// Sends an email, or falls back to logging it to the console if SMTP isn't configured.
async function sendMail({ to, subject, text, html }) {
  const t = getTransporter();
  if (!t) {
    console.log('\n=== [DEV EMAIL - SMTP not configured, printing instead] ===');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(text || html);
    console.log('=============================================================\n');
    return { delivered: false, mode: 'console' };
  }

  await t.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html
  });
  return { delivered: true, mode: 'smtp' };
}

module.exports = { sendMail, smtpConfigured };
