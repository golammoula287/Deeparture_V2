const { Schema, model } = require('mongoose');

const duplicateResolutionSchema = new Schema({
  importBatch: { type: Schema.Types.ObjectId, ref: 'ImportBatchV2', required: true, index: true },
  rowNumber: { type: Number, required: true },
  productType: { type: String, enum: ['vessel', 'resort'], required: true },
  decision: { type: String, enum: ['match_existing', 'create_new', 'not_duplicate', 'merge_fields'], required: true, index: true },
  organisationId: Schema.Types.ObjectId,
  productId: Schema.Types.ObjectId,
  fieldSelections: { type: Schema.Types.Mixed, default: {} },
  decidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  operationId: { type: String, index: true },
  notes: String,
}, { timestamps: true });

duplicateResolutionSchema.index({ importBatch: 1, rowNumber: 1 }, { unique: true });
module.exports = model('DuplicateResolutionV2', duplicateResolutionSchema);
