// Legacy uploads now use the same no-inventory-write preview as the Phase 3 portal.
// Commit explicitly through /api/v2/operator/organisations/:organisationId/imports/:batchId/commit.
const { previewImport: runImport } = require("./operator.controller");
module.exports = { runImport };
