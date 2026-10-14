const slugify = require("../utilities/slugify");

const asList = (value) => {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (value === undefined || value === null || value === "") return [];
  return String(value).split(/[|;,]/).map((v) => v.trim()).filter(Boolean);
};
const lowerList = (value) => asList(value).map((v) => v.toLowerCase());
const optionalList = (value, mapper = (v) => v) => {
  if (value === undefined || value === null || value === '') return undefined;
  return asList(value).map(mapper);
};
const normalizeFacet = (value) => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const numberOrUndefined = (value) => value === undefined || value === null || value === "" ? undefined : Number(value);
const bool = (value) => [true, 1, "1", "true", "yes", "y"].includes(typeof value === "string" ? value.trim().toLowerCase() : value);

const normalizeWebsite = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return undefined;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return url.toString().replace(/\/$/, "");
  } catch (_) { return raw; }
};

const normalizeOrganisation = (row) => ({
  externalId: String(row.organisationId || row.operatorId || row.operatorKey || "").trim() || undefined,
  name: String(row.operatorName || row.organisationName || row.companyName || "").trim(),
  primaryEmail: String(row.operatorEmail || row.email || "").trim().toLowerCase() || undefined,
  website: normalizeWebsite(row.operatorWebsite || row.website),
  country: String(row.operatorCountry || "").trim() || undefined,
  sourceUrl: String(row.sourceUrl || row.operatorWebsite || row.website || "").trim() || undefined,
});

const normalizeProduct = (row, productType) => {
  const name = String(productType === "resort" ? (row.resortName || row.name || "") : (row.vesselName || row.name || "")).trim();
  const common = {
    name,
    requestedSlug: String(row.slug || "").trim() || (name ? slugify(name) : undefined),
    summary: row.summary === undefined || row.summary === null || row.summary === '' ? undefined : String(row.summary),
    description: row.description === undefined || row.description === null || row.description === '' ? undefined : String(row.description),
    featuredImage: row.featuredImage === undefined || row.featuredImage === null || row.featuredImage === '' ? undefined : String(row.featuredImage).trim(),
    gallery: optionalList(row.gallery),
    destinationSlugs: optionalList(row.destinations, (v) => slugify(String(v).toLowerCase())),
    facilities: optionalList(row.facilities, (v) => normalizeFacet(String(v).toLowerCase())),
    dietary: optionalList(row.dietary, (v) => normalizeFacet(String(v).toLowerCase())),
    accessibility: optionalList(row.accessibility, (v) => normalizeFacet(String(v).toLowerCase())),
    divingFeatures: optionalList(row.divingFeatures, (v) => normalizeFacet(String(v).toLowerCase())),
    veganRating: numberOrUndefined(row.veganRating),
    environmentalRating: numberOrUndefined(row.environmentalRating),
    sourceUrl: String(row.sourceUrl || row.vesselWebsite || row.resortWebsite || "").trim() || undefined,
    publishRequested: bool(row.publish),
  };
  if (productType === "resort") return {
    ...common,
    country: String(row.country || "").trim() || undefined,
    region: String(row.region || "").trim() || undefined,
    district: String(row.district || "").trim() || undefined,
  };
  return {
    ...common,
    vesselType: String(row.vesselType || "").trim() || undefined,
    yearBuilt: numberOrUndefined(row.yearBuilt),
    yearRefit: numberOrUndefined(row.yearRefit),
    lengthMeters: numberOrUndefined(row.lengthMeters),
    beamMeters: numberOrUndefined(row.beamMeters),
    maxGuests: numberOrUndefined(row.maxGuests),
    cabinCount: numberOrUndefined(row.cabinCount),
  };
};

const normalizeCatalogRow = ({ row, rowNumber, productType, sourceType = "json", schemaVersion = 1 }) => {
  const organisation = normalizeOrganisation(row || {});
  const product = normalizeProduct(row || {}, productType);
  const errors = [];
  const skip = bool(row?.skip) || Object.values(row || {}).every(value => value === '' || value == null);
  if (!organisation.name) errors.push("operatorName is required");
  if (!product.name) errors.push(productType === "resort" ? "resortName is required" : "vesselName is required");
  for (const field of ["veganRating", "environmentalRating"]) {
    if (product[field] !== undefined && (!Number.isFinite(product[field]) || product[field] < 0 || product[field] > 5)) errors.push(`${field} must be between 0 and 5`);
  }
  for (const field of ['yearBuilt','yearRefit','lengthMeters','beamMeters','maxGuests','cabinCount']) {
    if (product[field] !== undefined && (!Number.isFinite(product[field]) || product[field] < 0)) errors.push(`${field} must be a non-negative number`);
  }
  return {
    schemaVersion,
    rowNumber,
    sourceType,
    organisation,
    productType,
    product,
    errors,
    skip,
  };
};

const normalizeCatalogRows = ({ rows, productType, sourceType, schemaVersion = 1 }) => rows.map((row, index) => normalizeCatalogRow({ row, rowNumber: index + 1, productType, sourceType, schemaVersion }));

module.exports = { asList, normalizeFacet, normalizeWebsite, normalizeOrganisation, normalizeProduct, normalizeCatalogRow, normalizeCatalogRows };
