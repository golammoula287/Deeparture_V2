const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const requiredFiles = [
  'src/v2/controllers/phase2b.controller.js',
  'src/v2/models/notification.model.js',
  'src/v2/models/externalSourceMapping.model.js',
  'src/v2/models/sourceConfig.model.js',
  'src/v2/models/verificationRecord.model.js',
  'src/v2/models/availabilitySnapshot.model.js',
  'src/v2/models/availabilityEffective.model.js',
  'src/v2/models/availabilityOverride.model.js',
  'src/v2/models/availabilityHistory.model.js',
  'src/v2/models/domainEvent.model.js',
  'src/v2/services/availability.service.js',
  'src/v2/services/completeness.service.js',
  'src/v2/services/domainEvent.service.js',
  'src/v2/services/pagination.service.js',
  'src/v2/services/source.service.js',
  'src/v2/services/verification.service.js',
  'src/middleware/operationId.js',
];

const assertions = [
  ['src/app.js', /operationId/,'global operation ID middleware'],
  ['src/v2/routes/admin.routes.js', /\/notifications/,'notification routes'],
  ['src/v2/routes/admin.routes.js', /\/availability/,'availability administration routes'],
  ['src/v2/routes/admin.routes.js', /\/bulk/,'bounded bulk route'],
  ['src/v2/services/search.service.js', /attr_/,'typed attribute filter support'],
  ['src/v2/services/search.service.js', /parsePagination/,'shared server pagination'],
  ['src/v2/services/availability.service.js', /freshnessFor/,'availability freshness semantics'],
  ['src/v2/services/availability.service.js', /conflictState/,'availability conflict semantics'],
  ['src/v2/services/availability.service.js', /admin_manual_override/,'manual override source enforcement'],
  ['src/v2/services/source.service.js', /allowReassign/,'protected external mapping reassignment'],
  ['src/v2/controllers/phase2b.controller.js', /ids\.length>100/,'bulk action maximum batch size'],
  ['src/v2/controllers/phase2b.controller.js', /availability\.override\.set/,'availability override audit'],
  ['src/v2/controllers/phase2b.controller.js', /claim\.invitation\.revoked/,'claim revocation audit'],
  ['src/v2/controllers/phase2b.controller.js', /expectedEffectiveUpdatedAt/,'availability override optimistic concurrency'],
  ['src/v2/controllers/phase2b.controller.js', /WebsiteSource\.create\(\{\.\.\.input,status:'queued'/,'website source queue cannot be pre-approved on create'],
  ['src/v2/models/productAttribute.model.js', /productModel.*definition.*value|definition.*value/s,'typed attribute search index'],
  ['src/v2/models/importBatch.model.js', /schemaVersion/,'import schema version history'],
  ['src/v2/models/importBatch.model.js', /operationId/,'import operation correlation ID'],
  ['src/v2/services/source.service.js', /assertNoSensitiveMetadata/,'source metadata secret guard'],
  ['src/v2/services/source.service.js', /SENSITIVE_KEY/,'source sensitive-key detection'],
  ['src/v2/controllers/admin.controller.js', /req\.query\.paged === 'true'/,'paginated organisation mode'],
  ['src/v2/controllers/admin.controller.js', /pagedResult\(\{ items: enriched/,'organisation paged result contract'],
  ['src/v2/services/catalogImport.service.js', /delete payload\.verificationStatus/,'import update preserves verification status'],
  ['src/v2/services/catalogImport.service.js', /delete payload\.source/,'import update preserves source provenance'],
];

let failed = false;
for (const rel of requiredFiles) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    console.error(`FAIL missing ${rel}`);
    failed = true;
  } else {
    console.log(`PASS file ${rel}`);
  }
}

for (const [rel, pattern, label] of assertions) {
  const full = path.join(root, rel);
  const text = fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : '';
  if (!pattern.test(text)) {
    console.error(`FAIL ${label} (${rel})`);
    failed = true;
  } else {
    console.log(`PASS ${label}`);
  }
}


// Public and ordinary GET/list/report reads must not perform availability maintenance writes.
const readPathFiles = [
  'src/v2/controllers/public.controller.js',
  'src/v2/services/search.service.js',
];
for (const rel of readPathFiles) {
  const full = path.join(root, rel);
  const text = fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : '';
  if (/refreshAvailabilityStates\s*\(/.test(text)) {
    console.error(`FAIL read path triggers availability maintenance writes (${rel})`);
    failed = true;
  } else {
    console.log(`PASS read path is side-effect free for availability maintenance (${rel})`);
  }
}

// The Phase 2B controller may expose maintenance only through its explicit maintenance handler.
{
  const rel = 'src/v2/controllers/phase2b.controller.js';
  const full = path.join(root, rel);
  const text = fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : '';
  const calls = (text.match(/refreshAvailabilityStates\s*\(/g) || []).length;
  if (calls !== 1 || !/const refreshAvailabilityMaintenance\s*=/.test(text)) {
    console.error(`FAIL availability maintenance call boundary (${rel})`);
    failed = true;
  } else {
    console.log('PASS availability maintenance is explicit/admin-only');
  }
}

if (failed) process.exit(1);
console.log('Phase 2B static verification passed.');
