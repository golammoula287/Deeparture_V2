const AppError = require("../../error/appError");
const ImportBatch = require("../models/importBatch.model");
const Vessel = require("../models/vessel.model");
const Resort = require("../models/resort.model");
const Itinerary = require("../models/itinerary.model");
const { importInventoryRows } = require("./inventoryImport.service");

const { IMPORT_RULES: RULES, productTypeForImport: productTypeFor, requiredImportErrors: requiredErrors, validateImportValues } = require("./operatorPortal.helpers");

const validateReference = async ({ organisationId, importType, row }) => {
  if (importType === "itineraries" || importType === "departures") {
    const vessel = await Vessel.findOne({ organisation: organisationId, name: new RegExp(`^${String(row.vesselName || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }).select("_id").lean();
    if (!vessel) return [`Unknown vessel: ${row.vesselName}`];
    if (importType === "departures") {
      const itinerary = await Itinerary.findOne({ organisation: organisationId, vessel: vessel._id, name: new RegExp(`^${String(row.itineraryName || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }).select("_id").lean();
      if (!itinerary) return [`Unknown itinerary: ${row.itineraryName}`];
    }
  } else {
    const resort = await Resort.findOne({ organisation: organisationId, name: new RegExp(`^${String(row.resortName || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }).select("_id").lean();
    if (!resort) return [`Unknown resort: ${row.resortName}`];
  }
  return [];
};

const previewOperatorImport = async ({ organisationId, importType, rows, sourceType, sourceFilename, createdBy, operationId }) => {
  if (!RULES[importType]) throw new AppError(400, "Unsupported operator import type");
  if (!Array.isArray(rows) || !rows.length) throw new AppError(400, "Import contains no rows");
  const previewRows = [];
  let ready = 0, errors = 0;
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index] || {};
    const rowErrors = [...requiredErrors(importType, row), ...validateImportValues(importType, row)];
    if (!rowErrors.length) rowErrors.push(...await validateReference({ organisationId, importType, row }));
    const classification = rowErrors.length ? "ERROR" : "READY";
    if (classification === "READY") ready += 1; else errors += 1;
    previewRows.push({ rowNumber: index + 2, classification, errors: rowErrors, raw: row });
  }
  const batch = await ImportBatch.create({
    kind: "operator_inventory", productType: productTypeFor(importType), importType, organisation: organisationId,
    sourceType, sourceFilename, adapterType: `operator_${importType}_v1`, schemaVersion: 1, operationId,
    status: "awaiting_confirmation", rows: previewRows,
    summary: { total: rows.length, create: ready, error: errors }, createdBy,
  });
  return batch;
};

const commitOperatorImport = async ({ batchId, organisationId, userId, operationId }) => {
  const batch = await ImportBatch.findOne({ _id: batchId, organisation: organisationId, kind: "operator_inventory" });
  if (!batch) throw new AppError(404, "Operator import batch not found");
  if (!['awaiting_confirmation','failed'].includes(batch.status)) throw new AppError(409, `Import batch cannot be committed from ${batch.status}`);
  const readyRows = batch.rows.filter(row => row.classification === "READY").map(row => row.raw);
  if (!readyRows.length) throw new AppError(400, "No valid rows are available to commit");
  const locked = await ImportBatch.findOneAndUpdate(
    { _id: batch._id, status: batch.status }, { $set: { status: "committing", committedBy: userId } }, { new: true }
  );
  if (!locked) throw new AppError(409, "Import batch is already being committed");
  batch.status = "committing";
  batch.committedBy = userId;
  try {
    const items = await importInventoryRows({ organisationId, importType: batch.importType, rows: readyRows, sourceType: batch.sourceType, actorUserId: userId, operationId });
    batch.status = batch.summary.error ? "completed_with_errors" : "completed";
    batch.committedAt = new Date();
    batch.results = items.map(item => ({ id: item._id, type: batch.importType, status: "committed" }));
    batch.summary.committed = items.length;
    await batch.save();
    return batch;
  } catch (error) {
    batch.status = "failed";
    batch.rowErrors.push({ message: error.message, operationId });
    batch.summary.commitErrors += 1;
    await batch.save();
    throw error;
  }
};

module.exports = { RULES, productTypeFor, requiredErrors, previewOperatorImport, commitOperatorImport };
