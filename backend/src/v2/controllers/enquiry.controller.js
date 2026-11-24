const httpStatus = require("http-status");
const catchAsync = require("../../utilities/catchAsync");
const sendResponse = require("../../utilities/sendResponse");
const { isObjectIdOrHexString } = require("mongoose");
const Departure = require("../models/departure.model");
const { vesselPromotions, resortPromotions } = require("../services/catalogueOffers.service");
const AppError = require("../../error/appError");
const Enquiry = require("../models/enquiry.model");
const Vessel = require("../models/vessel.model");
const Resort = require("../models/resort.model");
const { sendEnquiryReceivedNotifications } = require("../services/notification.service");
const { publishDomainEvent } = require("../services/domainEvent.service");

const interests = ["Liveaboard", "Resort", "Special Offer", "Other"];
const field = (value, limit) => typeof value === "string" ? value.trim().slice(0, limit) : "";

function enquiryInput(body) {
  const name = field(body.customer?.name, 150);
  const email = field(body.customer?.email, 254);
  const message = field(body.message, 5000);
  const guests = body.customer?.guests;
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message) {
    throw new AppError(400, "Enter your name, a valid email address, and a message.");
  }
  if (guests != null && (!['number', 'string'].includes(typeof guests) || !Number.isInteger(Number(guests)) || Number(guests) < 1 || Number(guests) > 100)) {
    throw new AppError(400, "Enter a guest count from 1 to 100.");
  }
  return {
    customer: {
      name, email,
      phone: field(body.customer?.phone, 40) || undefined,
      whatsapp: field(body.customer?.whatsapp, 40) || undefined,
      guests,
    },
    message,
  };
}

async function saveEnquiry(req, res, input, product) {
  const enquiry = await Enquiry.create({
    ...input, source: "website", status: "new",
    statusHistory: [{ status: "new", note: "Customer enquiry received; awaiting Deeparture review" }],
  });
  const actions = await Promise.allSettled([
    sendEnquiryReceivedNotifications({ enquiry, product, operationId: req.operationId }),
    publishDomainEvent({ name: "enquiry.created", aggregateType: "enquiry", aggregateId: enquiry._id, organisation: enquiry.organisation, operationId: req.operationId, payload: { productType: enquiry.productType, product: enquiry.product }, retentionClass: "business" }),
  ]);
  if (actions.some(action => action.status === "rejected")) console.error("V2 enquiry follow-up failed for record", String(enquiry._id));
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: "Enquiry received and awaiting Deeparture review", data: enquiry });
}

const createGeneral = catchAsync(async (req, res) => {
  req.body ||= {};
  const input = enquiryInput(req.body);
  if (!interests.includes(req.body.interest)) throw new AppError(400, "Choose what you are interested in.");
  await saveEnquiry(req, res, {
    ...input,
    productType: "general",
    interest: req.body.interest,
    destination: field(req.body.destination, 200) || undefined,
  });
});

const create = catchAsync(async (req, res) => {
  req.body ||= {};
  if (!['resort','vessel'].includes(req.body.productType) || !isObjectIdOrHexString(req.body.product)) throw new AppError(400, 'Invalid listing selection');
  const input = enquiryInput(req.body);
  const Model = req.body.productType === "resort" ? Resort : Vessel;
  const modelName = req.body.productType === "resort" ? "ResortV2" : "VesselV2";
  const product = await Model.findById(req.body.product);
  if (!product || product.listingStatus !== "published") throw new AppError(httpStatus.NOT_FOUND, "Listing not found");
  const context = {};
  for (const [field, model, parent] of [['itinerary','itinerary','vessel'],['departure','departure','vessel'],['package','resortPackage','resort']]) {
    if (!req.body[field]) continue;
    if (!isObjectIdOrHexString(req.body[field]) || (parent === 'resort') !== (req.body.productType === 'resort')) throw new AppError(400, 'Invalid enquiry context');
    if (!(await require('../models/'+model+'.model').exists({ _id: req.body[field], [parent]: product._id, organisation: product.organisation }))) throw new AppError(400, 'Enquiry selection does not belong to this listing');
    context[field] = req.body[field];
  }
  if (context.departure && context.itinerary && !(await Departure.exists({ _id: context.departure, itinerary: context.itinerary }))) {
    throw new AppError(400, "The departure does not belong to the selected itinerary.");
  }
  if (req.body.offer) {
    if (!isObjectIdOrHexString(req.body.offer)) throw new AppError(400, "Invalid offer selection.");
    let promotions = [];
    const now = new Date();
    if (req.body.productType === "vessel" && context.departure) {
      promotions = await vesselPromotions(now, { _id: context.departure, organisation: product.organisation }, [product._id]);
    } else if (req.body.productType === "resort" && context.package) {
      promotions = await resortPromotions(now, { resortIds: [product._id], packages: [{ _id: context.package }], packageFilter: { organisation: product.organisation } });
    }
    const offer = promotions.find(({ promotion }) => String(promotion.offerId) === req.body.offer)?.promotion;
    if (!offer) throw new AppError(400, "This offer is no longer available. Choose another offer or send a general enquiry.");
    context.offer = req.body.offer;
    context.offerName = offer.name;
  }
  await saveEnquiry(req, res, { ...input, ...context, product: product._id, productType: req.body.productType, organisation: product.organisation, productModel: modelName }, product);
});
module.exports = { create, createGeneral };
