const httpStatus = require("http-status");
const catchAsync = require("../../utilities/catchAsync");
const sendResponse = require("../../utilities/sendResponse");
const Organisation = require("../models/organisation.model");
const OrganisationMembership = require("../models/organisationMembership.model");
const Vessel = require("../models/vessel.model");
const Resort = require("../models/resort.model");
const Enquiry = require("../models/enquiry.model");

const mine = catchAsync(async (req, res) => {
  if (req.v2User.role === "admin") {
    const organisations = await Organisation.find().sort({ name: 1 }).lean();
    return sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Organisations retrieved", data: organisations });
  }
  const memberships = await OrganisationMembership.find({ user: req.v2User._id, status: "active" }).populate("organisation").lean();
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Organisations retrieved", data: memberships });
});

const dashboard = catchAsync(async (req, res) => {
  const id = req.params.organisationId;
  const [organisation, vessels, resorts, enquiries] = await Promise.all([
    Organisation.findById(id).lean(),
    Vessel.find({ organisation: id }).sort({ name: 1 }).lean(),
    Resort.find({ organisation: id }).sort({ name: 1 }).lean(),
    Enquiry.find({ organisation: id }).sort({ createdAt: -1 }).limit(50).lean(),
  ]);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Operator dashboard", data: { organisation, vessels, resorts, enquiries } });
});

module.exports = { mine, dashboard };
