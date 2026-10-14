const express = require("express");
const multer = require("multer");
const v2Auth = require("../middleware/v2Auth");
const catalogImport = require("../controllers/catalogImport.controller");
const { createDefinition, updateDefinition } = require("../controllers/attribute.controller");
const { inviteBulk } = require("../controllers/adminClaim.controller");
const admin = require("../controllers/admin.controller");
const phase2b = require("../controllers/phase2b.controller");
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });
const auth = v2Auth("admin");

router.get("/dashboard", auth, admin.dashboard);
// Phase 2B - Admin automation and management enhancements
router.get("/dashboard/advanced", auth, phase2b.advancedDashboard);
router.get("/imports/history", auth, phase2b.listImports);
router.get("/catalog/import-batches/:batchId/errors", auth, phase2b.importErrors);
router.get("/catalog/import-batches/:batchId/errors.csv", auth, phase2b.downloadImportErrors);
router.post("/catalog/import-batches/:batchId/retry-preview", auth, phase2b.retryImport);
router.get("/duplicates", auth, phase2b.listDuplicates);
router.post("/duplicates/:batchId/:rowNumber/resolve", auth, phase2b.resolveDuplicate);
router.get("/notifications", auth, phase2b.listNotifications);
router.patch("/notifications/:id/read", auth, phase2b.markNotificationRead);
router.post("/notifications/read-all", auth, phase2b.markAllNotificationsRead);
router.get("/audit", auth, phase2b.listAudit);
router.get("/sources/mappings", auth, phase2b.listMappings);
router.post("/sources/mappings", auth, phase2b.saveMapping);
router.get("/sources/configs", auth, phase2b.listSourceConfigs);
router.post("/sources/configs", auth, phase2b.saveSourceConfig);
router.post("/verification/:entityType/:id", auth, phase2b.verifyEntity);
router.get("/verification/:entityType/:id/history", auth, phase2b.verificationHistory);
router.get("/organisations/:organisationId/claim-history", auth, phase2b.claimHistory);
router.post("/organisations/:organisationId/claim-history/:historyId/resend", auth, phase2b.resendClaim);
router.post("/organisations/:organisationId/claim-history/:historyId/revoke", auth, phase2b.revokeClaim);
router.get("/catalog/:productType/:id/completeness", auth, phase2b.productCompleteness);
router.post("/catalog/:productType/:id/completeness/refresh", auth, phase2b.refreshCompleteness);
router.get("/organisations/:organisationId/activity", auth, phase2b.organisationActivity);
router.get("/imports/website", auth, phase2b.listWebsiteSources);
router.post("/imports/website", auth, phase2b.createWebsiteSource);
router.patch("/imports/website/:id", auth, phase2b.updateWebsiteSource);
router.get("/availability", auth, phase2b.listAvailability);
router.post("/availability/refresh-state", auth, phase2b.refreshAvailabilityMaintenance);
router.get("/availability/:inventoryKey/sources", auth, phase2b.availabilitySources);
router.get("/availability/:inventoryKey/history", auth, phase2b.availabilityHistory);
router.post("/availability/override", auth, phase2b.setAvailabilityOverride);
router.delete("/availability/:inventoryKey/overrides/:overrideId", auth, phase2b.clearAvailabilityOverride);
router.post("/availability/:inventoryKey/resolve", auth, phase2b.reResolveAvailability);
router.post("/bulk", auth, phase2b.bulkAction);
router.get("/reports/operational", auth, phase2b.operationalReport);
router.get("/events", auth, phase2b.listEvents);


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
