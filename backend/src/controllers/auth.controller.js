const httpStatus = require('http-status');
const User = require('../models/user.model');
const AppError = require('../error/appError');
const catchAsync = require('../utilities/catchAsync');
const sendResponse = require('../utilities/sendResponse');
const { generateToken } = require('../config/jwt');

const login = catchAsync(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(req.body.password || ''))) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid email or password');
  }
  if (user.status === 'restricted') throw new AppError(httpStatus.FORBIDDEN, 'Account is restricted');
  if (!user.isValid) throw new AppError(httpStatus.FORBIDDEN, 'Account is not verified');
  const token = generateToken(user);
  const safeUser = user.toObject();
  delete safeUser.password;
  sendResponse(res, { statusCode: 200, success: true, message: 'Login successful', data: { user: safeUser, token } });
});

const me = catchAsync(async (req, res) => {
  sendResponse(res, { statusCode: 200, success: true, message: 'Current user', data: req.v2User });
});

module.exports = { login, me };
