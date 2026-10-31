const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
let failures = 0;
const check = (label, condition) => { console.log(`${condition ? 'PASS' : 'FAIL'} ${label}`); if (!condition) failures += 1; };
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));

const required = [
  'src/v2/routes/operator.routes.js',
  'src/v2/controllers/operator.controller.js',
  'src/v2/services/operatorPortal.service.js',
  'src/v2/services/operatorImport.service.js',
  'src/v2/services/operatorPortal.helpers.js',
  'src/v2/models/organisationMemberInvitation.model.js',
];
required.forEach(file => check(`file ${file}`, exists(file)));
const app = read('src/app.js');
const routes = read('src/v2/routes/operator.routes.js');
const controller = read('src/v2/controllers/operator.controller.js');
const portal = read('src/v2/services/operatorPortal.service.js');
const imports = read('src/v2/services/operatorImport.service.js');
const media = read('src/v2/models/mediaAsset.model.js');
const batch = read('src/v2/models/importBatch.model.js');
const invite = read('src/v2/models/organisationMemberInvitation.model.js');

check('operator routes mounted under /api/v2/operator', app.includes("app.use('/api/v2/operator', v2OperatorRoutes)"));
check('operator routes require authenticated operator/admin', routes.includes('v2Auth("operator", "admin")'));
check('catalogue edits enforce organisation editor access', routes.includes('organisationAccess("editor")'));
check('team management requires organisation admin access', routes.includes('/members/invitations') && routes.includes('organisationAccess("admin")'));
check('reservations access protects enquiry operations', routes.includes('organisationAccess("reservations")'));
check('operator dashboard exposes completeness, stale/conflicts and active offers', portal.includes('staleAvailability') && portal.includes('availabilityConflicts') && portal.includes('activeOffers'));
check('member invitations store hashed tokens', invite.includes('tokenHash') && portal.includes('hashToken(token)'));
check('team invite can onboard a new user without an existing session', routes.includes('router.post("/member-invitations/:token/accept", operator.acceptInvitation)') && portal.includes('password of at least 12 characters'));
check('existing team invite user must prove account password', portal.includes('Use your existing Deeparture password to accept this invitation'));
check('member invitation acceptance is bound to the invited email', portal.includes('User.findOne({ email: invite.email })') && portal.includes('email: invite.email'));
check('at least one owner is protected', controller.includes('must retain at least one active owner'));
check('operator media is scoped to entity type/id', media.includes('entityType') && media.includes('entityId'));
check('operator media remains source-attributed', controller.includes('source: "operator"'));
check('operator listing verification can only mark operator_verified', controller.includes('status: "operator_verified"'));
check('operator imports have preview before commit', routes.includes('/imports/:importType/preview') && routes.includes('/imports/:batchId/commit'));
check('operator inventory batches are organisation scoped', batch.includes('operator_inventory') && batch.includes('organisation'));
check('import preview keeps row-level classifications/errors', imports.includes('classification') && imports.includes('rowNumber') && imports.includes('errors'));
check('operator imports reuse shared inventory import service', imports.includes('importInventoryRows'));
check('operator availability reads normalized AvailabilityEffective', controller.includes('AvailabilityEffective.find'));
check('operator availability writes continue through shared inventory controller/service', routes.includes('inventory.updateDeparture') && routes.includes('inventory.upsertAvailability'));
check('notifications are recipient/user or organisation scoped', controller.includes('recipientOrganisation') && controller.includes('recipientUser'));
check('operator profile uses optimistic concurrency', controller.includes('expectedUpdatedAt') && controller.includes('Organisation changed since it was loaded'));
check('operator audit source is recorded', controller.includes('source: "operator"'));

const frontendRoot = path.resolve(root, '../frontend');
const frontExists = rel => fs.existsSync(path.join(frontendRoot, rel));
[
  'pages/operator/v2/index.jsx','pages/operator/v2/liveaboards/index.jsx','pages/operator/v2/liveaboards/[id].jsx',
  'pages/operator/v2/resorts/index.jsx','pages/operator/v2/resorts/[id].jsx','pages/operator/v2/availability.jsx',
  'pages/operator/v2/enquiries.jsx','pages/operator/v2/imports.jsx','pages/operator/v2/notifications.jsx',
  'pages/operator/v2/team.jsx','pages/operator/v2/profile.jsx','pages/team-invite/[token].jsx','src/components/operator/OperatorLayout.jsx',
].forEach(file => check(`frontend ${file}`, frontExists(file)));
const auth = fs.readFileSync(path.join(frontendRoot, 'src/components/auth/AuthProvider.jsx'),'utf8');
check('operator portal is a protected frontend area', auth.includes("router.pathname.startsWith('/operator')"));
const legacy = fs.readFileSync(path.join(frontendRoot, 'pages/dashboard/v2/index.jsx'),'utf8');
check('legacy operator dashboard redirects to Phase 3 portal', legacy.includes("router.replace('/operator/v2')"));

if (failures) { console.error(`Phase 3 static verification failed: ${failures}`); process.exit(1); }
console.log('Phase 3 static verification passed.');
