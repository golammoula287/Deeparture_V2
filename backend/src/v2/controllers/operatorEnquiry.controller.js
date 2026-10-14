const httpStatus = require("http-status");
const catchAsync = require("../../utilities/catchAsync");
const sendResponse = require("../../utilities/sendResponse");
const AppError = require("../../error/appError");
const Enquiry = require("../models/enquiry.model");
const { logAudit } = require("../services/audit.service");
const { publishDomainEvent } = require("../services/domainEvent.service");

const updateStatus = catchAsync(async (req, res) => {
  const allowed = ["operator_accepted", "operator_replied", "quoted"];
  if (!allowed.includes(req.body.status)) throw new AppError(httpStatus.BAD_REQUEST, "Unsupported operator enquiry status");
  const enquiry = await Enquiry.findOne({ _id: req.params.id, organisation: req.params.organisationId });
  if (!enquiry) throw new AppError(httpStatus.NOT_FOUND, "Enquiry not found for this organisation");
  if (!["sent_to_operator", "operator_accepted", "operator_replied", "quoted"].includes(enquiry.status)) throw new AppError(httpStatus.BAD_REQUEST, `Enquiry cannot be updated from ${enquiry.status}`);
  enquiry.status = req.body.status;
  enquiry.statusHistory.push({ status: req.body.status, actorUser: req.v2User._id, note: req.body.note });
  await enquiry.save();
  await logAudit({ req, organisation: enquiry.organisation, action: "enquiry.operator_status", entityType: "enquiry", entityId: enquiry._id, after: { status: enquiry.status }, source: "operator" });
  await publishDomainEvent({ name: "enquiry.operator_status", aggregateType: "enquiry", aggregateId: enquiry._id, organisation: enquiry.organisation, actorUser: req.v2User._id, operationId: req.operationId, payload: { status: enquiry.status }, retentionClass: "business" });
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Enquiry status updated", data: enquiry });
});
module.exports = { updateStatus };
