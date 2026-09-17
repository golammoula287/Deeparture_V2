const express = require("express");
const multer = require("multer");
const v2Auth = require("../middleware/v2Auth");
const organisationAccess = require("../middleware/organisationAccess");
const { mine, dashboard } = require("../controllers/organisation.controller");
const inventory = require("../controllers/inventory.controller");
const { runImport } = require("../controllers/inventoryImport.controller");
const { setAttributes } = require("../controllers/attribute.controller");
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

router.get("/mine", v2Auth(), mine);
router.get("/:organisationId/dashboard", v2Auth(), organisationAccess("viewer"), dashboard);
router.post("/:organisationId/vessels", v2Auth(), organisationAccess("editor"), inventory.createVessel);
router.patch("/:organisationId/vessels/:id", v2Auth(), organisationAccess("editor"), inventory.updateVessel);
router.post("/:organisationId/itineraries", v2Auth(), organisationAccess("editor"), inventory.createItinerary);
router.patch("/:organisationId/itineraries/:id", v2Auth(), organisationAccess("editor"), inventory.updateItinerary);
router.post("/:organisationId/departures", v2Auth(), organisationAccess("editor"), inventory.createDeparture);
router.patch("/:organisationId/departures/:id", v2Auth(), organisationAccess("editor"), inventory.updateDeparture);
router.post("/:organisationId/resorts", v2Auth(), organisationAccess("editor"), inventory.createResort);
router.patch("/:organisationId/resorts/:id", v2Auth(), organisationAccess("editor"), inventory.updateResort);
router.post("/:organisationId/room-types", v2Auth(), organisationAccess("editor"), inventory.createRoomType);
router.post("/:organisationId/resort-packages", v2Auth(), organisationAccess("editor"), inventory.createPackage);
router.post("/:organisationId/rate-periods", v2Auth(), organisationAccess("editor"), inventory.createRatePeriod);
router.put("/:organisationId/resort-availability", v2Auth(), organisationAccess("editor"), inventory.upsertAvailability);
router.post("/:organisationId/import/:importType", v2Auth(), organisationAccess("editor"), upload.single("file"), runImport);
router.put("/:organisationId/product-attributes", v2Auth(), organisationAccess("editor"), setAttributes);

module.exports = router;
