const httpStatus = require("http-status");
const catchAsync = require("../../utilities/catchAsync");
const sendResponse = require("../../utilities/sendResponse");
const Organisation = require("../models/organisation.model");
const { createClaimInvitation } = require("../services/claim.service");

const inviteBulk = catchAsync(async (req, res) => {
  const filter = { type: "operator", status: { $in: ["unclaimed", "invited"] }, primaryEmail: { $exists: true, $ne: "" } };
  if (Array.isArray(req.body.organisationIds) && req.body.organisationIds.length) filter._id = { $in: req.body.organisationIds };
  const limit = Math.min(500, Math.max(1, Number(req.body.limit || 100)));
  const organisations = await Organisation.find(filter).limit(limit);
  const sent = [];
  const errors = [];
  for (const organisation of organisations) {
    try {
      const result = await createClaimInvitation({ organisationId: organisation._id, email: organisation.primaryEmail, createdBy: req.v2User._id });
      sent.push({ organisationId: organisation._id, name: organisation.name, email: organisation.primaryEmail, expiresAt: result.expiresAt });
    } catch (error) {
      errors.push({ organisationId: organisation._id, name: organisation.name, email: organisation.primaryEmail, message: error.message });
    }
  }
  sendResponse(res, { statusCode: httpStatus.OK, success: errors.length === 0, message: "Bulk claim invitations processed", data: { sent, errors } });
});

module.exports = { inviteBulk };
