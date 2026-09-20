const jwt = require("jsonwebtoken");
const httpStatus = require("http-status");
const config = require("../../config");
const User = require("../../models/user.model");
const OrganisationMembership = require("../models/organisationMembership.model");
const AppError = require("../../error/appError");
const catchAsync = require("../../utilities/catchAsync");

const v2Auth = (...requiredLegacyRoles) =>
  catchAsync(async (req, res, next) => {
    const raw = req.headers.authorization;
    if (!raw) throw new AppError(httpStatus.UNAUTHORIZED, "Authentication required");

    const token = raw.startsWith("Bearer ") ? raw.slice(7) : raw;
    let decoded;
    try { decoded = jwt.verify(token, config.jwt_secret); }
    catch (_) { throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid or expired authentication token'); }
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) throw new AppError(httpStatus.UNAUTHORIZED, "User no longer exists");
    if (!user.isValid) throw new AppError(httpStatus.FORBIDDEN, "Account is not verified");
    if (user.status === "restricted") throw new AppError(httpStatus.FORBIDDEN, "User account is restricted");

    if (requiredLegacyRoles.length && !requiredLegacyRoles.includes(user.role)) {
      throw new AppError(httpStatus.FORBIDDEN, "Insufficient permission");
    }

    req.user = { ...decoded, userId: user._id.toString(), role: user.role };
    req.v2User = user;
    req.organisationMemberships = await OrganisationMembership.find({ user: user._id, status: "active" });
    next();
  });

module.exports = v2Auth;
