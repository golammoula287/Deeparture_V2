const { Schema, model } = require('mongoose');

const availabilityHistorySchema = new Schema({
  inventoryKey: { type: String, required: true, index: true },
  productType: { type: String, enum: ['vessel', 'resort'], required: true, index: true },
  organisation: { type: Schema.Types.ObjectId, ref: 'OrganisationV2', required: true, index: true },
  eventType: { type: String, enum: ['source_reported', 'effective_changed', 'override_set', 'override_cleared', 'override_expired', 'conflict_detected'], required: true, index: true },
  sourceType: String,
  sourceReference: String,
  reported: Schema.Types.Mixed,
  effective: Schema.Types.Mixed,
  reason: String,
  actorUser: { type: Schema.Types.ObjectId, ref: 'User' },
  operationId: { type: String, index: true },
  retentionClass: { type: String, enum: ['business', 'operational'], default: 'business' },
}, { timestamps: true });

availabilityHistorySchema.index({ inventoryKey: 1, createdAt: -1 });
availabilityHistorySchema.index({ organisation: 1, createdAt: -1 });
module.exports = model('AvailabilityHistoryV2', availabilityHistorySchema);
