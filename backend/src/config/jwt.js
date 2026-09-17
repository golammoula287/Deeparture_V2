const jwt = require('jsonwebtoken');
const config = require('./index');

const generateToken = (user) => jwt.sign(
  { userId: user._id.toString(), fullName: user.fullName, email: user.email, role: user.role },
  config.jwt_secret,
  { expiresIn: '10d' }
);

module.exports = { generateToken };
