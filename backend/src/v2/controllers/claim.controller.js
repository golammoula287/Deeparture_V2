const httpStatus = require("http-status");
const catchAsync = require("../../utilities/catchAsync");
const sendResponse = require("../../utilities/sendResponse");
const { createClaimInvitation, acceptClaim } = require("../services/claim.service");

const invite = catchAsync(async (req, res) => {
  const data = await createClaimInvitation({
    organisationId: req.params.organisationId,
    email: req.body.email,
    createdBy: req.v2User._id,
  });
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Claim invitation sent", data });
});

const accept = catchAsync(async (req, res) => {
  const data = await acceptClaim(req.body);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Operator account claimed", data });
});

module.exports = { invite, accept };
