const express = require("express");
const multer = require("multer");
const v2Auth = require("../middleware/v2Auth");
const catalogImport = require("../controllers/catalogImport.controller");
const { createDefinition, updateDefinition } = require("../controllers/attribute.controller");
const { inviteBulk } = require("../controllers/adminClaim.controller");
const admin = require("../controllers/admin.controller");
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });
const auth = v2Auth("admin");

router.get("/dashboard", auth, admin.dashboard);

router.get("/catalog/template-fields", auth, catalogImport.templateFields);
router.post("/catalog/import/preview", auth, catalogImport.previewJson);
router.post("/catalog/import-file/preview", auth, upload.single("file"), catalogImport.previewFile);
router.post("/catalog/import-batches/:batchId/commit", auth, catalogImport.commit);
router.get("/catalog/import-batches/:batchId", auth, catalogImport.batch);

router.get("/catalog/liveaboards", auth, admin.listVessels);
router.post("/catalog/liveaboards", auth, admin.createVessel);
router.get("/catalog/liveaboards/:id/preview", auth, admin.previewVessel);
router.get("/catalog/liveaboards/:id", auth, admin.getVessel);
router.patch("/catalog/liveaboards/:id", auth, admin.updateVessel);
router.patch("/catalog/liveaboards/:id/status", auth, admin.setVesselStatus);
router.get("/catalog/resorts", auth, admin.listResorts);
router.post("/catalog/resorts", auth, admin.createResort);
router.get("/catalog/resorts/:id/preview", auth, admin.previewResort);
router.get("/catalog/resorts/:id", auth, admin.getResort);
router.patch("/catalog/resorts/:id", auth, admin.updateResort);
router.patch("/catalog/resorts/:id/status", auth, admin.setResortStatus);

router.get("/organisations", auth, admin.listOrganisations);
router.post("/organisations", auth, admin.createOrganisation);
router.patch("/organisations/:id", auth, admin.updateOrganisation);
router.post("/organisations/:id/claim-invitation", auth, admin.inviteOrganisation);
router.post("/claim-invitations/bulk", auth, inviteBulk);

router.get("/attributes", auth, admin.listAttributes);
router.post("/attributes", auth, createDefinition);
router.patch("/attributes/:id", auth, updateDefinition);

router.get("/locations", auth, admin.listLocations);
router.post("/locations", auth, admin.createLocation);
router.patch("/locations/:id", auth, admin.updateLocation);

router.get("/enquiries", auth, admin.listEnquiries);
router.post("/enquiries/:id/approve", auth, admin.approveEnquiry);
router.patch("/enquiries/:id/status", auth, admin.updateEnquiryStatus);

module.exports = router;
