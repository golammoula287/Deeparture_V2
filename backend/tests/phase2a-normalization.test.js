const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeCatalogRow } = require("../src/v2/services/catalogImportAdapter.service");
const { normalizeAvailabilityInput } = require("../src/v2/services/availability.service");

test("catalog rows normalize source-specific fields into Deeparture contract", () => {
  const item = normalizeCatalogRow({ productType: "vessel", rowNumber: 1, sourceType: "xlsx", row: { operatorName: "Example Operator", operatorEmail: "TEST@EXAMPLE.COM", vesselName: "MV Example", facilities: "Wi-Fi; Camera Room", publish: "yes" } });
  assert.equal(item.organisation.primaryEmail, "test@example.com");
  assert.equal(item.product.name, "MV Example");
  assert.deepEqual(item.product.facilities, ["wi_fi", "camera_room"]);
  assert.equal(item.product.publishRequested, true);
  assert.deepEqual(item.errors, []);
});

test("availability input retains source and timestamps", () => {
  const item = normalizeAvailabilityInput({ status: "limited", spacesAvailable: 2 }, { sourceType: "xlsx", sourceReference: "row-7", sourceUpdatedAt: "2026-09-30T10:00:00Z" });
  assert.equal(item.status, "limited");
  assert.equal(item.spacesAvailable, 2);
  assert.equal(item.sourceType, "xlsx");
  assert.equal(item.sourceReference, "row-7");
  assert.ok(item.sourceUpdatedAt instanceof Date);
  assert.ok(item.receivedAt instanceof Date);
});

test('invalid inventory cannot become stored availability', () => {
  for (const spacesAvailable of [-1, 1.5, 'invalid']) assert.throws(() => normalizeAvailabilityInput({ spacesAvailable }), /non-negative integers/);
  assert.throws(() => normalizeAvailabilityInput({ spacesAvailable: 3, totalSpaces: 2 }), /exceed/);
  assert.throws(() => normalizeAvailabilityInput({ sourceUpdatedAt: 'invalid' }), /timestamp/);
  assert.equal(normalizeAvailabilityInput({ spacesAvailable: 0 }).status, 'sold_out');
});

test('preview identifies skipped and invalid numeric source rows', () => {
  assert.equal(normalizeCatalogRow({ row: { skip: true }, productType: 'vessel', rowNumber: 1 }).skip, true);
  const row = normalizeCatalogRow({ row: { operatorName:'Test', vesselName:'Test', maxGuests:'invalid' }, productType:'vessel', rowNumber:1 });
  assert.ok(row.errors.some(error => error.includes('maxGuests')));
});
