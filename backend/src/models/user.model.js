const { Schema, model } = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config');

const userSchema = new Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  phone: String,
  whatsapp: String,
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'operator', 'agent', 'internal'], default: 'operator', index: true },
  status: { type: String, enum: ['active', 'restricted'], default: 'active', index: true },
  isValid: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, config.bcrypt_salt_rounds);
  next();
});

userSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = model('User', userSchema);
