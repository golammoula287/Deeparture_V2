const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(process.cwd(), '.env') });

module.exports = {
  port: Number(process.env.PORT || 5000),
  database_url: process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/deeparture_v2',
  node_env: process.env.NODE_ENV || 'development',
  bcrypt_salt_rounds: Number(process.env.BCRYPT_SALT_ROUNDS || 10),
  jwt_secret: process.env.JWT_SECRET_KEY || 'dev-only-change-me',
  frontend_url: process.env.FRONTEND_URL || 'http://localhost:3000',
  smtp_host: process.env.SMTP_HOST,
  smtp_port: Number(process.env.SMTP_PORT || 587),
  smtp_secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
  smtp_user: process.env.SMTP_USER,
  smtp_pass: process.env.SMTP_PASS,
  email_from: process.env.EMAIL_FROM || process.env.SMTP_USER || 'deeparture-v2@localhost',
};
