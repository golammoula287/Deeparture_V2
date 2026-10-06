const Organisation = require("../models/organisation.model");
const Vessel = require("../models/vessel.model");
const Resort = require("../models/resort.model");
const ImportBatch = require("../models/importBatch.model");
const slugify = require("../utilities/slugify");
const { normalizeCatalogRows } = require("./catalogImportAdapter.service");
const AppError = require('../../error/appError');

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
  const orgMatches = await organisationCandidates(normalized.organisation);
  if (orgMatches.length > 1) return { ...normalized, action: "DUPLICATE_REVIEW", reason: "Organisation matches more than one existing record", organisationMatches: orgMatches.map((o) => ({ _id: o._id, name: o.name, primaryEmail: o.primaryEmail, website: o.website })) };
  const organisation = orgMatches[0];
  const productMatches = organisation ? await productCandidates({ productType: normalized.productType, organisationId: organisation._id, product: normalized.product }) : [];
  if (productMatches.length > 1) return { ...normalized, action: "DUPLICATE_REVIEW", reason: "Listing matches more than one existing record", organisationMatchId: organisation?._id, productMatches: productMatches.map((p) => ({ _id: p._id, name: p.name, slug: p.slug })) };
  if (productMatches.length === 1) return { ...normalized, action: "UPDATE", organisationMatchId: organisation._id, productMatchId: productMatches[0]._id };
  return { ...normalized, action: "CREATE", organisationMatchId: organisation?._id };
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

const createPreview = async ({ productType, rows, sourceType = "json", sourceFilename, createdBy }) => {
  if (!Array.isArray(rows)) throw new Error("rows must be an array");
  if (rows.length > 2000) throw new Error("Phase 2A preview is limited to 2,000 rows per batch");
  const normalized = normalizeCatalogRows({ rows, productType, sourceType });
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
  const batch = await ImportBatch.create({ productType, sourceType, sourceFilename, rows: classified, summary, createdBy });
  return { batchId: batch._id, status: batch.status, summary, rows: classified };
};

const applyOrganisation = async (row) => {
  if (row.organisationMatchId) {
    const org = await Organisation.findById(row.organisationMatchId);
    if (!org) throw new Error("Matched organisation no longer exists");
    if (!org.primaryEmail && row.organisation.primaryEmail) org.primaryEmail = row.organisation.primaryEmail;
    if (!org.website && row.organisation.website) org.website = row.organisation.website;
    if (!org.country && row.organisation.country) org.country = row.organisation.country;
    org.lastCheckedAt = new Date();
    await org.save();
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
    gallery: p.gallery || [],
    destinationSlugs: p.destinationSlugs || [],
    facilities: p.facilities || [],
    dietary: p.dietary || [],
    accessibility: p.accessibility || [],
    divingFeatures: p.divingFeatures || [],
    veganRating: p.veganRating,
    environmentalRating: p.environmentalRating,
    metadata: { normalizedImportSchemaVersion: row.schemaVersion, importSourceType: row.sourceType },
  };
  if (row.productType === "resort") Object.assign(payload, { country: p.country, region: p.region, district: p.district });
  else Object.assign(payload, { vesselType: p.vesselType, yearBuilt: p.yearBuilt, yearRefit: p.yearRefit, lengthMeters: p.lengthMeters, beamMeters: p.beamMeters, maxGuests: p.maxGuests, cabinCount: p.cabinCount });
  return payload;
};

const commitBatch = async ({ batchId, committedBy, allowPartial = false }) => {
  let batch = await ImportBatch.findById(batchId);
  if (!batch) throw new AppError(404, "Import preview batch not found");
  if (batch.status !== "preview") throw new AppError(409, `Import batch cannot be committed from status ${batch.status}`);
  if (!allowPartial && ((batch.summary?.duplicateReview || 0) > 0 || (batch.summary?.error || 0) > 0)) {
    throw new AppError(400, "Import batch has unresolved duplicate-review or error rows; correct the source or explicitly allow a partial commit");
  }
  batch = await ImportBatch.findOneAndUpdate({ _id: batchId, status: 'preview' }, { $set: { status: 'committing' } }, { new: true });
  if (!batch) throw new AppError(409, 'Import batch is already being committed');
  const successes = [];
  const errors = [];
  const Model = batch.productType === "resort" ? Resort : Vessel;
  for (const row of batch.rows) {
    if (!["CREATE", "UPDATE"].includes(row.action)) continue;
    try {
      const organisation = await applyOrganisation(row);
      const payload = productPayload(row, organisation._id);
      let product;
      if (row.action === "UPDATE") {
        product = await Model.findById(row.productMatchId);
        if (!product) throw new Error("Matched listing no longer exists");
        // Never let a file transfer a product to another organisation or silently publish it.
        delete payload.organisation;
        payload.metadata = { ...(product.metadata || {}), ...(payload.metadata || {}) };
        Object.assign(product, payload);
        await product.save();
      } else {
        const freshProducts = await productCandidates({ productType: row.productType, organisationId: organisation._id, product: row.product });
        if (freshProducts.length > 1) throw new Error("Listing became ambiguous before commit");
        if (freshProducts.length === 1) {
          product = freshProducts[0];
          delete payload.organisation;
          payload.metadata = { ...(product.metadata || {}), ...(payload.metadata || {}) };
          Object.assign(product, payload);
          await product.save();
        } else {
          payload.slug = await uniqueSlug(Model, row.product.requestedSlug || row.product.name);
          payload.listingStatus = "draft";
          product = await Model.create(payload);
        }
      }
      successes.push({ row: row.rowNumber, action: row.action, organisationId: organisation._id, productId: product._id, slug: product.slug });
    } catch (error) {
      errors.push({ row: row.rowNumber, action: row.action, message: error.message });
    }
  }
  batch.summary.committed = successes.length;
  batch.summary.commitErrors = errors.length;
  batch.status = errors.length ? "completed_with_errors" : "completed";
  batch.committedBy = committedBy;
  batch.committedAt = new Date();
  batch.results = successes;
  batch.rowErrors = errors;
  await batch.save();
  return { batchId: batch._id, status: batch.status, summary: batch.summary, successes, errors };
};

const getBatch = async (batchId) => ImportBatch.findById(batchId).lean();

// Compatibility helper for internal scripts. Still normalizes first; new Admin UI must use preview + commit.
const importCatalogRows = async ({ productType, rows, createdBy }) => {
  const preview = await createPreview({ productType, rows, sourceType: "json", createdBy });
  return commitBatch({ batchId: preview.batchId, committedBy: createdBy });
};

module.exports = { createPreview, commitBatch, getBatch, importCatalogRows, classifyNormalizedRow, uniqueSlug };
