const httpStatus = require("http-status");
const catchAsync = require("../../utilities/catchAsync");
const sendResponse = require("../../utilities/sendResponse");
const AppError = require("../../error/appError");
const Enquiry = require("../models/enquiry.model");
const Vessel = require("../models/vessel.model");
const Resort = require("../models/resort.model");
const { sendEnquiryReceivedNotifications } = require("../services/notification.service");
const { publishDomainEvent } = require("../services/domainEvent.service");

const create = catchAsync(async (req, res) => {
  if (!['resort','vessel'].includes(req.body.productType)) throw new AppError(400, 'Invalid product type');
  const Model = req.body.productType === "resort" ? Resort : Vessel;
  const modelName = req.body.productType === "resort" ? "ResortV2" : "VesselV2";
  const product = await Model.findById(req.body.product);
  if (!product || product.listingStatus !== "published") throw new AppError(httpStatus.NOT_FOUND, "Listing not found");
  const context = {};
  for (const [field, model, parent] of [['itinerary','itinerary','vessel'],['departure','departure','vessel'],['package','resortPackage','resort']]) {
    if (!req.body[field]) continue;
    if ((parent === 'resort') !== (req.body.productType === 'resort')) throw new AppError(400, 'Invalid enquiry context');
    if (!(await require('../models/'+model+'.model').exists({ _id: req.body[field], [parent]: product._id, organisation: product.organisation }))) throw new AppError(400, 'Enquiry selection does not belong to this listing');
    context[field] = req.body[field];
  }
  const enquiry = await Enquiry.create({
    ...context,
    product: product._id,
    productType: req.body.productType,
    customer: req.body.customer,
    message: req.body.message,
    source: 'website',
    organisation: product.organisation,
    productModel: modelName,
    status: "new",
    statusHistory: [{ status: "new", note: "Customer enquiry received; awaiting Deeparture review" }],
  });
  try { await sendEnquiryReceivedNotifications({ enquiry, product, operationId: req.operationId }); }
  catch (error) { console.error("V2 enquiry receipt email failed:", error.message); }
  await publishDomainEvent({ name: "enquiry.created", aggregateType: "enquiry", aggregateId: enquiry._id, organisation: enquiry.organisation, operationId: req.operationId, payload: { productType: enquiry.productType, product: enquiry.product }, retentionClass: "business" });
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: "Enquiry received and awaiting Deeparture review", data: enquiry });
});
module.exports = { create };
