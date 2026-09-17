const httpStatus = require("http-status");
const OrganisationMembership = require("../models/organisationMembership.model");
const AppError = require("../../error/appError");
const catchAsync = require("../../utilities/catchAsync");

const ROLE_WEIGHT = { viewer: 1, reservations: 2, editor: 3, admin: 4, owner: 5 };

const organisationAccess = (minimumRole = "viewer") =>
  catchAsync(async (req, res, next) => {
    if (req.v2User?.role === "admin") return next();
    const organisationId = req.params.organisationId || req.body.organisation || req.query.organisation;
    if (!organisationId) throw new AppError(httpStatus.BAD_REQUEST, "Organisation is required");

    const membership = await OrganisationMembership.findOne({
      user: req.v2User._id,
      organisation: organisationId,
      status: "active",
    });
    if (!membership || ROLE_WEIGHT[membership.role] < ROLE_WEIGHT[minimumRole]) {
      throw new AppError(httpStatus.FORBIDDEN, "You do not have access to this organisation");
    }
    req.organisationMembership = membership;
    next();
  });

module.exports = organisationAccess;
