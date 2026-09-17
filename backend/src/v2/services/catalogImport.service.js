const Organisation = require("../models/organisation.model");
const Vessel = require("../models/vessel.model");
const Resort = require("../models/resort.model");
const slugify = require("../utilities/slugify");

const uniqueSlug = async (Model, preferred, id) => {
  let slug = slugify(preferred);
  let candidate = slug;
  let counter = 2;
  while (await Model.exists({ slug: candidate, ...(id ? { _id: { $ne: id } } : {}) })) {
    candidate = `${slug}-${counter++}`;
  }
  return candidate;
};

const asList = (value) => {
  if (Array.isArray(value)) return value.map((v) => String(v).trim().toLowerCase()).filter(Boolean);
  if (value === undefined || value === null || value === "") return [];
  return String(value)
    .split(/[|;,]/)
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
};

const asRawList = (value) => {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (value === undefined || value === null || value === "") return [];
  return String(value).split(/[|;,]/).map((v) => v.trim()).filter(Boolean);
};

const normalizeFacet = (value) => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

const parseBoolean = (value) => [true, "true", "yes", "y", "1", 1].includes(typeof value === "string" ? value.toLowerCase().trim() : value);

const createOrMatchOrganisation = async (row) => {
  const name = row.operatorName || row.organisationName || row.companyName;
  if (!name) throw new Error("operatorName is required");
  const email = String(row.operatorEmail || row.email || "").trim().toLowerCase();
  const website = row.operatorWebsite || row.website;
  let organisation = null;
  if (email) organisation = await Organisation.findOne({ primaryEmail: email, type: "operator" });
  if (!organisation && website) organisation = await Organisation.findOne({ website, type: "operator" });
  if (!organisation) organisation = await Organisation.findOne({ name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"), type: "operator" });

  if (!organisation) {
    organisation = await Organisation.create({
      name,
      slug: await uniqueSlug(Organisation, name),
      type: "operator",
      status: "unclaimed",
      primaryEmail: email || undefined,
      website,
      country: row.operatorCountry,
      source: "deeparture_import",
      sourceUrl: row.sourceUrl || website,
      lastCheckedAt: new Date(),
    });
  } else {
    if (!organisation.primaryEmail && email) organisation.primaryEmail = email;
    if (!organisation.website && website) organisation.website = website;
    organisation.lastCheckedAt = new Date();
    await organisation.save();
  }
  return organisation;
};

const importVesselRow = async (row) => {
  const organisation = await createOrMatchOrganisation(row);
  const name = row.vesselName || row.name;
  if (!name) throw new Error("vesselName is required");
  let vessel = await Vessel.findOne({ organisation: organisation._id, name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
  const payload = {
    organisation: organisation._id,
    name,
    listingStatus: row.publish === false || String(row.publish).toLowerCase() === "false" ? "draft" : "published",
    verificationStatus: "unverified",
    source: "deeparture_import",
    sourceUrl: row.sourceUrl || row.vesselWebsite || organisation.website,
    lastCheckedAt: new Date(),
    summary: row.summary,
    description: row.description,
    featuredImage: row.featuredImage,
    gallery: asRawList(row.gallery),
    vesselType: row.vesselType,
    yearBuilt: row.yearBuilt ? Number(row.yearBuilt) : undefined,
    yearRefit: row.yearRefit ? Number(row.yearRefit) : undefined,
    lengthMeters: row.lengthMeters ? Number(row.lengthMeters) : undefined,
    beamMeters: row.beamMeters ? Number(row.beamMeters) : undefined,
    maxGuests: row.maxGuests ? Number(row.maxGuests) : undefined,
    cabinCount: row.cabinCount ? Number(row.cabinCount) : undefined,
    destinationSlugs: asList(row.destinations).map(slugify),
    facilities: asList(row.facilities).map(normalizeFacet),
    dietary: asList(row.dietary).map(normalizeFacet),
    accessibility: asList(row.accessibility).map(normalizeFacet),
    divingFeatures: asList(row.divingFeatures).map(normalizeFacet),
    veganRating: row.veganRating !== undefined && row.veganRating !== "" ? Number(row.veganRating) : undefined,
    environmentalRating: row.environmentalRating !== undefined && row.environmentalRating !== "" ? Number(row.environmentalRating) : undefined,
    metadata: { importedRow: row, veganMeals: parseBoolean(row.veganMeals) },
  };
  if (!vessel) {
    payload.slug = await uniqueSlug(Vessel, row.slug || name);
    vessel = await Vessel.create(payload);
  } else {
    Object.assign(vessel, payload);
    await vessel.save();
  }
  return { organisation, product: vessel, created: vessel.createdAt.getTime() === vessel.updatedAt.getTime() };
};

const importResortRow = async (row) => {
  const organisation = await createOrMatchOrganisation(row);
  const name = row.resortName || row.name;
  if (!name) throw new Error("resortName is required");
  let resort = await Resort.findOne({ organisation: organisation._id, name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
  const payload = {
    organisation: organisation._id,
    name,
    listingStatus: row.publish === false || String(row.publish).toLowerCase() === "false" ? "draft" : "published",
    verificationStatus: "unverified",
    source: "deeparture_import",
    sourceUrl: row.sourceUrl || row.resortWebsite || organisation.website,
    lastCheckedAt: new Date(),
    summary: row.summary,
    description: row.description,
    featuredImage: row.featuredImage,
    gallery: asRawList(row.gallery),
    country: row.country,
    region: row.region,
    district: row.district,
    destinationSlugs: asList(row.destinations).map(slugify),
    facilities: asList(row.facilities).map(normalizeFacet),
    dietary: asList(row.dietary).map(normalizeFacet),
    accessibility: asList(row.accessibility).map(normalizeFacet),
    divingFeatures: asList(row.divingFeatures).map(normalizeFacet),
    veganRating: row.veganRating !== undefined && row.veganRating !== "" ? Number(row.veganRating) : undefined,
    environmentalRating: row.environmentalRating !== undefined && row.environmentalRating !== "" ? Number(row.environmentalRating) : undefined,
    metadata: { importedRow: row },
  };
  if (!resort) {
    payload.slug = await uniqueSlug(Resort, row.slug || name);
    resort = await Resort.create(payload);
  } else {
    Object.assign(resort, payload);
    await resort.save();
  }
  return { organisation, product: resort };
};

const importCatalogRows = async ({ productType, rows }) => {
  if (!Array.isArray(rows)) throw new Error("rows must be an array");
  const successes = [];
  const errors = [];
  for (let index = 0; index < rows.length; index += 1) {
    try {
      const result = productType === "resort" ? await importResortRow(rows[index]) : await importVesselRow(rows[index]);
      successes.push({ row: index + 1, organisationId: result.organisation._id, productId: result.product._id, slug: result.product.slug });
    } catch (error) {
      errors.push({ row: index + 1, message: error.message });
    }
  }
  return { total: rows.length, imported: successes.length, failed: errors.length, successes, errors };
};

module.exports = { importCatalogRows, importVesselRow, importResortRow, createOrMatchOrganisation, asList, asRawList };
