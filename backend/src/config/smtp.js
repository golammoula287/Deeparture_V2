const nodemailer = require('nodemailer');
const config = require('./index');

// Delivery requires an explicit opt-in, even when staging has SMTP credentials.
const transporter = process.env.EMAIL_DELIVERY_MODE === 'live' && config.smtp_host && config.smtp_user
  ? nodemailer.createTransport({
      host: config.smtp_host,
      port: config.smtp_port,
      secure: config.smtp_secure,
      auth: { user: config.smtp_user, pass: config.smtp_pass },
    })
  : nodemailer.createTransport({ jsonTransport: true });

module.exports = transporter;
