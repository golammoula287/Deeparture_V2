const express = require("express");
const multer = require("multer");
const v2Auth = require("../middleware/v2Auth");
const organisationAccess = require("../middleware/organisationAccess");
const operator = require("../controllers/operator.controller");
const inventory = require("../controllers/inventory.controller");
const { setAttributes } = require("../controllers/attribute.controller");
const operatorEnquiry = require("../controllers/operatorEnquiry.controller");

const router = express.Router();
const auth = v2Auth("operator", "admin");
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

router.get("/member-invitations/:token", operator.inspectInvitation);
router.post("/member-invitations/:token/accept", operator.acceptInvitation);
router.get("/organisations", auth, operator.organisations);

router.get("/organisations/:organisationId/dashboard", auth, organisationAccess("viewer"), operator.dashboard);
router.get("/organisations/:organisationId/profile", auth, organisationAccess("viewer"), operator.getProfile);
router.patch("/organisations/:organisationId/profile", auth, organisationAccess("admin"), operator.updateProfile);

router.get("/organisations/:organisationId/members", auth, organisationAccess("admin"), operator.members);
router.post("/organisations/:organisationId/members/invitations", auth, organisationAccess("admin"), operator.inviteMember);
router.delete("/organisations/:organisationId/members/invitations/:invitationId", auth, organisationAccess("admin"), operator.revokeInvitation);
router.patch("/organisations/:organisationId/members/:membershipId", auth, organisationAccess("admin"), operator.updateMember);

router.get("/organisations/:organisationId/vessels", auth, organisationAccess("viewer"), operator.listVessels);
router.post("/organisations/:organisationId/vessels", auth, organisationAccess("editor"), inventory.createVessel);
router.get("/organisations/:organisationId/vessels/:id", auth, organisationAccess("viewer"), operator.getVessel);
router.patch("/organisations/:organisationId/vessels/:id", auth, organisationAccess("editor"), inventory.updateVessel);
router.post("/organisations/:organisationId/vessels/:id/verify", auth, organisationAccess("editor"), (req,res,next) => { req.params.productType='vessel'; next(); }, operator.operatorVerify);
router.post("/organisations/:organisationId/cabins", auth, organisationAccess("editor"), operator.createCabin);
router.patch("/organisations/:organisationId/cabins/:id", auth, organisationAccess("editor"), operator.updateCabin);
router.post("/organisations/:organisationId/itineraries", auth, organisationAccess("editor"), inventory.createItinerary);
router.patch("/organisations/:organisationId/itineraries/:id", auth, organisationAccess("editor"), inventory.updateItinerary);
router.post("/organisations/:organisationId/departures", auth, organisationAccess("editor"), inventory.createDeparture);
router.patch("/organisations/:organisationId/departures/:id", auth, organisationAccess("editor"), inventory.updateDeparture);

router.get("/organisations/:organisationId/resorts", auth, organisationAccess("viewer"), operator.listResorts);
router.post("/organisations/:organisationId/resorts", auth, organisationAccess("editor"), inventory.createResort);
router.get("/organisations/:organisationId/resorts/:id", auth, organisationAccess("viewer"), operator.getResort);
router.patch("/organisations/:organisationId/resorts/:id", auth, organisationAccess("editor"), inventory.updateResort);
router.post("/organisations/:organisationId/resorts/:id/verify", auth, organisationAccess("editor"), (req,res,next) => { req.params.productType='resort'; next(); }, operator.operatorVerify);
router.post("/organisations/:organisationId/room-types", auth, organisationAccess("editor"), inventory.createRoomType);
router.patch("/organisations/:organisationId/room-types/:id", auth, organisationAccess("editor"), operator.updateRoomType);
router.post("/organisations/:organisationId/resort-packages", auth, organisationAccess("editor"), inventory.createPackage);
router.patch("/organisations/:organisationId/resort-packages/:id", auth, organisationAccess("editor"), operator.updatePackage);
router.post("/organisations/:organisationId/rate-periods", auth, organisationAccess("editor"), inventory.createRatePeriod);
router.patch("/organisations/:organisationId/rate-periods/:id", auth, organisationAccess("editor"), operator.updateRate);
router.put("/organisations/:organisationId/resort-availability", auth, organisationAccess("editor"), inventory.upsertAvailability);

router.get("/organisations/:organisationId/attributes/definitions", auth, organisationAccess("viewer"), operator.listDefinitions);
router.put("/organisations/:organisationId/product-attributes", auth, organisationAccess("editor"), setAttributes);

router.get("/organisations/:organisationId/media", auth, organisationAccess("viewer"), operator.listMedia);
router.post("/organisations/:organisationId/media", auth, organisationAccess("editor"), operator.createMedia);
router.patch("/organisations/:organisationId/media/:id", auth, organisationAccess("editor"), operator.updateMedia);
router.delete("/organisations/:organisationId/media/:id", auth, organisationAccess("editor"), operator.deleteMedia);

router.get("/organisations/:organisationId/notifications", auth, organisationAccess("viewer"), operator.notifications);
router.patch("/organisations/:organisationId/notifications/:id/read", auth, organisationAccess("viewer"), operator.markNotificationRead);
router.get("/organisations/:organisationId/enquiries", auth, organisationAccess("reservations"), operator.enquiries);
router.get("/organisations/:organisationId/availability", auth, organisationAccess("viewer"), operator.availability);
router.patch("/organisations/:organisationId/enquiries/:id/status", auth, organisationAccess("reservations"), operatorEnquiry.updateStatus);

router.get("/organisations/:organisationId/imports", auth, organisationAccess("viewer"), operator.importHistory);
router.get("/organisations/:organisationId/imports/:batchId", auth, organisationAccess("viewer"), operator.getImportBatch);
router.post("/organisations/:organisationId/imports/:importType/preview", auth, organisationAccess("editor"), upload.single("file"), operator.previewImport);
router.post("/organisations/:organisationId/imports/:batchId/commit", auth, organisationAccess("editor"), operator.commitImport);

module.exports = router;
