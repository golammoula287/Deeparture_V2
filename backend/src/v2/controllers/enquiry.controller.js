const httpStatus = require("http-status");
const catchAsync = require("../../utilities/catchAsync");
const sendResponse = require("../../utilities/sendResponse");
const AppError = require("../../error/appError");
const Enquiry = require("../models/enquiry.model");
const Vessel = require("../models/vessel.model");
const Resort = require("../models/resort.model");
const Organisation = require("../models/organisation.model");
const { sendEnquiryNotifications } = require("../services/notification.service");

const create = catchAsync(async (req, res) => {
  const Model = req.body.productType === "resort" ? Resort : Vessel;
  const modelName = req.body.productType === "resort" ? "ResortV2" : "VesselV2";
  const product = await Model.findById(req.body.product);
  if (!product || product.listingStatus !== "published") throw new AppError(httpStatus.NOT_FOUND, "Listing not found");
  const organisation = await Organisation.findById(product.organisation);
  const enquiry = await Enquiry.create({ ...req.body, organisation: product.organisation, productModel: modelName });
  try {
    await sendEnquiryNotifications({ enquiry, product, organisation });
    enquiry.status = "sent_to_operator";
    await enquiry.save();
  } catch (error) {
    console.error("V2 enquiry email failed:", error.message);
  }
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: "Enquiry received", data: enquiry });
});

module.exports = { create };
