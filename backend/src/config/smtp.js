const nodemailer = require('nodemailer');
const config = require('./index');

// For local/staging runs without SMTP credentials, Nodemailer returns the email as JSON
// instead of attempting to contact a real mail server. This prevents accidental email sends.
const transporter = config.smtp_host && config.smtp_user
  ? nodemailer.createTransport({
      host: config.smtp_host,
      port: config.smtp_port,
      secure: config.smtp_secure,
      auth: { user: config.smtp_user, pass: config.smtp_pass },
    })
  : nodemailer.createTransport({ jsonTransport: true });

module.exports = transporter;
