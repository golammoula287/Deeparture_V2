const mongoose = require('mongoose');
const config = require('../src/config');
const User = require('../src/models/user.model');

(async () => {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_NAME || 'Deeparture Admin';
  if (!email || !password) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first.');
  await mongoose.connect(config.database_url);
  let user = await User.findOne({ email }).select('+password');
  if (!user) user = new User({ fullName, email, password, role: 'admin', status: 'active', isValid: true });
  else {
    user.fullName = fullName;
    user.password = password;
    user.role = 'admin';
    user.status = 'active';
    user.isValid = true;
  }
  await user.save();
  console.log(`Admin ready: ${email}`);
  await mongoose.disconnect();
})().catch(async (error) => { console.error(error); try { await mongoose.disconnect(); } catch (_) {} process.exit(1); });
