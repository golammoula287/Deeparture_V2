const Organisation = require("../models/organisation.model");
const Vessel = require("../models/vessel.model");
const Resort = require("../models/resort.model");
const ImportBatch = require("../models/importBatch.model");
const slugify = require("../utilities/slugify");
const { normalizeCatalogRows } = require("./catalogImportAdapter.service");
const { refreshProductCompleteness } = require("./completeness.service");
const { notifyAdminsInApp } = require("./notification.service");
const { publishDomainEvent } = require("./domainEvent.service");
const AppError = require('../../error/appError');
const ExternalSourceMapping = require('../models/externalSourceMapping.model');
const DuplicateResolution = require('../models/duplicateResolution.model');
const { normalizeProviderKey } = require('./source.service');

const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const canonicalWebsite = (value) => {
  if (!value) return "";
  try { return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`).hostname.replace(/^www\./, "").toLowerCase(); }
  catch (_) { return String(value).toLowerCase().replace(/^www\./, "").replace(/\/$/, ""); }
};

const uniqueSlug = async (Model, preferred, id) => {
  const base = slugify(preferred) || "listing";
  let candidate = base;
  let counter = 2;
  while (await Model.exists({ slug: candidate, ...(id ? { _id: { $ne: id } } : {}) })) candidate = `${base}-${counter++}`;
  return candidate;
};

const organisationCandidates = async (org) => {
  const candidates = new Map();
  const add = (items) => items.forEach((item) => candidates.set(String(item._id), item));
  if (org.primaryEmail) add(await Organisation.find({ type: "operator", primaryEmail: org.primaryEmail }).limit(5));
  if (org.website) {
    const host = canonicalWebsite(org.website);
    const possible = await Organisation.find({ type: "operator", website: { $exists: true, $ne: "" } }).limit(500);
    add(possible.filter((item) => canonicalWebsite(item.website) === host));
  }
  if (org.name) add(await Organisation.find({ type: "operator", name: new RegExp(`^${escapeRegex(org.name)}$`, "i") }).limit(5));
  return [...candidates.values()];
};

const productCandidates = async ({ productType, organisationId, product }) => {
  if (!organisationId) return [];
  const Model = productType === "resort" ? Resort : Vessel;
  const query = { organisation: organisationId, $or: [] };
  if (product.name) query.$or.push({ name: new RegExp(`^${escapeRegex(product.name)}$`, "i") });
  if (product.requestedSlug) query.$or.push({ slug: product.requestedSlug });
  if (!query.$or.length) return [];
  return Model.find(query).limit(5);
};

const classifyNormalizedRow = async (normalized) => {
  if (normalized.skip) return { ...normalized, action: 'SKIP', reason: 'Empty row or explicitly skipped by source' };
  if (normalized.errors?.length) return { ...normalized, action: "ERROR", reason: normalized.errors.join("; ") };
  if (normalized.providerKey && normalized.externalId) {
    const mapping = await ExternalSourceMapping.findOne({ providerKey: normalizeProviderKey(normalized.providerKey), externalEntityType: normalized.productType, externalId: normalized.externalId, internalEntityType: normalized.productType, active: true }).lean();
    if (mapping) {
      const Model = normalized.productType === 'resort' ? Resort : Vessel;
      const product = await Model.findById(mapping.internalEntityId).lean();
      const organisation = product && await Organisation.findById(product.organisation).lean();
      if (!product || !organisation) return { ...normalized, action: 'ERROR', reason: 'Mapped listing or organisation no longer exists; review the source mapping' };
      return { ...normalized, action: 'UPDATE', organisationMatchId: organisation._id, organisationMatchedUpdatedAt: organisation.updatedAt, productMatchId: product._id, productMatchedUpdatedAt: product.updatedAt };
    }
  }
  const orgMatches = await organisationCandidates(normalized.organisation);
  if (orgMatches.length > 1) return { ...normalized, action: "DUPLICATE_REVIEW", reason: "Organisation matches more than one existing record", organisationMatches: orgMatches.map((o) => ({ _id: o._id, name: o.name, primaryEmail: o.primaryEmail, website: o.website })) };
  const organisation = orgMatches[0];
  const productMatches = organisation ? await productCandidates({ productType: normalized.productType, organisationId: organisation._id, product: normalized.product }) : [];
  if (productMatches.length > 1) return { ...normalized, action: "DUPLICATE_REVIEW", reason: "Listing matches more than one existing record", organisationMatchId: organisation?._id, productMatches: productMatches.map((p) => ({ _id: p._id, name: p.name, slug: p.slug })) };
  if (productMatches.length === 1) return { ...normalized, action: "UPDATE", organisationMatchId: organisation._id, organisationMatchedUpdatedAt: organisation.updatedAt, productMatchId: productMatches[0]._id, productMatchedUpdatedAt: productMatches[0].updatedAt };
  return { ...normalized, action: "CREATE", organisationMatchId: organisation?._id, organisationMatchedUpdatedAt: organisation?.updatedAt };
};

const summarizeRows = (rows) => rows.reduce((summary, row) => {
  summary.total += 1;
  if (row.action === "CREATE") summary.create += 1;
  else if (row.action === "UPDATE") summary.update += 1;
  else if (row.action === "DUPLICATE_REVIEW") summary.duplicateReview += 1;
  else if (row.action === "ERROR") summary.error += 1;
  else summary.skip += 1;
  return summary;
}, { total: 0, create: 0, update: 0, duplicateReview: 0, error: 0, skip: 0, committed: 0, commitErrors: 0 });

const createPreview = async ({ productType, rows, sourceType = "json", sourceFilename, createdBy, adapterType, schemaVersion = 1, operationId, retryOfBatch }) => {
  if (!Array.isArray(rows)) throw new Error("rows must be an array");
  if (rows.length > 2000) throw new Error("Phase 2A preview is limited to 2,000 rows per batch");
  const normalized = normalizeCatalogRows({ rows, productType, sourceType, schemaVersion });
  const classified = [];
  const incomingKeys = new Set();
  for (const item of normalized) {
    const key = `${item.organisation.primaryEmail || item.organisation.website || item.organisation.name}|${item.product.name}`.trim().toLowerCase();
    if (key && incomingKeys.has(key)) {
      classified.push({ ...item, action: "DUPLICATE_REVIEW", reason: "Duplicate operator/listing row within this upload" });
      continue;
    }
    if (key) incomingKeys.add(key);
    classified.push(await classifyNormalizedRow(item));
  }
  const summary = summarizeRows(classified);
  const batch = await ImportBatch.create({ productType, sourceType, sourceFilename, adapterType: adapterType || `catalog_${sourceType}_v1`, schemaVersion, operationId, retryOfBatch, rows: classified, summary, createdBy });
  return { batchId: batch._id, status: batch.status, summary, rows: classified };
};

const applyOrganisation = async (row, batchOrganisationVersions) => {
  if (row.organisationMatchId) {
    const org = await Organisation.findById(row.organisationMatchId);
    if (!org) throw new Error("Matched organisation no longer exists");
    const expectedUpdatedAt = batchOrganisationVersions.get(String(org._id)) || row.organisationMatchedUpdatedAt;
    if (expectedUpdatedAt && new Date(expectedUpdatedAt).getTime() !== new Date(org.updatedAt).getTime()) {
      throw new AppError(409, "Matched organisation changed after preview; create a new preview before committing", { code: "conflict", details: { organisationId: org._id, currentUpdatedAt: org.updatedAt, previewUpdatedAt: row.organisationMatchedUpdatedAt } });
    }
    if (!org.primaryEmail && row.organisation.primaryEmail) org.primaryEmail = row.organisation.primaryEmail;
    if (!org.website && row.organisation.website) org.website = row.organisation.website;
    if (!org.country && row.organisation.country) org.country = row.organisation.country;
    org.lastCheckedAt = new Date();
    await org.save();
    batchOrganisationVersions.set(String(org._id), org.updatedAt);
    return org;
  }
  // Re-match at commit time so multiple rows for a newly-created operator reuse the first organisation.
  const freshMatches = await organisationCandidates(row.organisation);
  if (freshMatches.length > 1) throw new Error("Organisation became ambiguous before commit");
  if (freshMatches.length === 1) return freshMatches[0];
  return Organisation.create({
    name: row.organisation.name,
    slug: await uniqueSlug(Organisation, row.organisation.name),
    type: "operator",
    status: "unclaimed",
    primaryEmail: row.organisation.primaryEmail,
    website: row.organisation.website,
    country: row.organisation.country,
    source: "deeparture_import",
    sourceUrl: row.organisation.sourceUrl || row.organisation.website,
    lastCheckedAt: new Date(),
  });
};

const productPayload = (row, organisationId) => {
  const p = row.product;
  const payload = {
    organisation: organisationId,
    name: p.name,
    verificationStatus: "unverified",
    source: "deeparture_import",
    sourceUrl: p.sourceUrl || row.organisation.sourceUrl || row.organisation.website,
    lastCheckedAt: new Date(),
    summary: p.summary,
    description: p.description,
    featuredImage: p.featuredImage,
    gallery: p.gallery,
    destinationSlugs: p.destinationSlugs,
    facilities: p.facilities,
    dietary: p.dietary,
    accessibility: p.accessibility,
    divingFeatures: p.divingFeatures,
    veganRating: p.veganRating,
    environmentalRating: p.environmentalRating,
    metadata: { normalizedImportSchemaVersion: row.schemaVersion, importSourceType: row.sourceType },
  };
  if (row.productType === "resort") Object.assign(payload, { country: p.country, region: p.region, district: p.district });
  else Object.assign(payload, { vesselType: p.vesselType, yearBuilt: p.yearBuilt, yearRefit: p.yearRefit, lengthMeters: p.lengthMeters, beamMeters: p.beamMeters, maxGuests: p.maxGuests, cabinCount: p.cabinCount });
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
};

const commitBatch = async ({ batchId, committedBy, allowPartial = false, operationId }) => {
  let batch = await ImportBatch.findById(batchId);
  if (!batch) throw new AppError(404, "Import preview batch not found");
  if (!["preview","awaiting_confirmation"].includes(batch.status)) throw new AppError(409, `Import batch cannot be committed from status ${batch.status}`);
  if (!allowPartial && ((batch.summary?.duplicateReview || 0) > 0 || (batch.summary?.error || 0) > 0)) {
    throw new AppError(400, "Import batch has unresolved duplicate-review or error rows; correct the source or explicitly allow a partial commit");
  }
  batch = await ImportBatch.findOneAndUpdate({ _id: batchId, status: { $in: ['preview','awaiting_confirmation'] } }, { $set: { status: 'committing', operationId: operationId || batch.operationId } }, { new: true });
  if (!batch) throw new AppError(409, 'Import batch is already being committed');
  const successes = [];
  const errors = [];
  // Rows in one batch may update the same organisation. Keep the concurrency
  // precondition current for writes made by this batch, while detecting external edits.
  const batchOrganisationVersions = new Map();
  const Model = batch.productType === "resort" ? Resort : Vessel;
  for (const row of batch.rows) {
    if (!["CREATE", "UPDATE"].includes(row.action)) continue;
    try {
      const organisation = await applyOrganisation(row, batchOrganisationVersions);
      const payload = productPayload(row, organisation._id);
      let product;
      if (row.action === "UPDATE") {
        product = await Model.findById(row.productMatchId);
        if (!product) throw new Error("Matched listing no longer exists");
        if (row.productMatchedUpdatedAt && new Date(row.productMatchedUpdatedAt).getTime() !== new Date(product.updatedAt).getTime()) {
          throw new AppError(409, "Matched listing changed after preview; create a new preview before committing", { code: "conflict", details: { productId: product._id, currentUpdatedAt: product.updatedAt, previewUpdatedAt: row.productMatchedUpdatedAt } });
        }
        // Never let a file transfer a product, reset editorial verification/origin, or silently publish it.
        delete payload.organisation;
        delete payload.verificationStatus;
        delete payload.source;
        payload.metadata = { ...(product.metadata || {}), ...(payload.metadata || {}) };
        Object.assign(product, payload);
        await product.save();
      } else {
        const freshProducts = row.forceCreate ? [] : await productCandidates({ productType: row.productType, organisationId: organisation._id, product: row.product });
        if (freshProducts.length > 1) throw new Error("Listing became ambiguous before commit");
        if (freshProducts.length === 1) {
          product = freshProducts[0];
          delete payload.organisation;
          delete payload.verificationStatus;
          delete payload.source;
          payload.metadata = { ...(product.metadata || {}), ...(payload.metadata || {}) };
          Object.assign(product, payload);
          await product.save();
        } else {
          payload.slug = await uniqueSlug(Model, row.product.requestedSlug || row.product.name);
          payload.listingStatus = "draft";
          payload.verificationStatus = "unverified";
          payload.source = "deeparture_import";
          product = await Model.create(payload);
        }
      }
      await refreshProductCompleteness({ productType: row.productType, productId: product._id });
      await DuplicateResolution.updateOne({ importBatch: batch._id, rowNumber: row.rowNumber }, { $set: { productId: product._id, organisationId: organisation._id } });
      successes.push({ row: row.rowNumber, action: row.action, organisationId: organisation._id, productId: product._id, slug: product.slug });
    } catch (error) {
      errors.push({ row: row.rowNumber, action: row.action, message: error.message });
    }
  }
  batch.summary.committed = successes.length;
  batch.summary.commitErrors = errors.length;
  const incomplete = errors.length + (batch.summary.error || 0) + (batch.summary.duplicateReview || 0);
  batch.status = incomplete ? "completed_with_errors" : "completed";
  batch.committedBy = committedBy;
  batch.committedAt = new Date();
  batch.results = successes;
  batch.rowErrors = errors;
  batch.operationId = operationId || batch.operationId;
  await batch.save();
  const eventName = incomplete ? 'import.completed_with_errors' : 'import.completed';
  await publishDomainEvent({ name: eventName, aggregateType: 'importBatch', aggregateId: batch._id, actorUser: committedBy, operationId: batch.operationId, payload: { summary: batch.summary, productType: batch.productType, sourceType: batch.sourceType }, retentionClass: 'business' });
  await notifyAdminsInApp({ type: eventName, title: incomplete ? 'Import completed with errors' : 'Import completed', message: `${batch.productType} import committed ${successes.length} row(s); ${errors.length} commit error(s), ${batch.summary.error || 0} invalid row(s), ${batch.summary.duplicateReview || 0} unresolved duplicate(s).`, relatedRecordType: 'importBatch', relatedRecordId: batch._id, actionTarget: `/admin/v2/imports/history?batch=${batch._id}`, operationId: batch.operationId, retentionClass: 'business' });
  return { batchId: batch._id, status: batch.status, summary: batch.summary, successes, errors, operationId: batch.operationId };
};

const getBatch = async (batchId) => ImportBatch.findById(batchId).lean();

// Compatibility helper for internal scripts. Still normalizes first; new Admin UI must use preview + commit.
const importCatalogRows = async ({ productType, rows, createdBy }) => {
  const preview = await createPreview({ productType, rows, sourceType: "json", createdBy });
  return commitBatch({ batchId: preview.batchId, committedBy: createdBy });
};

module.exports = { createPreview, commitBatch, getBatch, importCatalogRows, classifyNormalizedRow, uniqueSlug };
