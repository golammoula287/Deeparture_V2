const express = require("express");
const v2Auth = require("../middleware/v2Auth");
const { invite, accept } = require("../controllers/claim.controller");
const router = express.Router();
router.post("/organisations/:organisationId/invite", v2Auth("admin"), invite);
router.post("/accept", accept);
module.exports = router;
