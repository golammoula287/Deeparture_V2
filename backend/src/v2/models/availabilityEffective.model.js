const { Schema, model } = require('mongoose');

const effectiveSchema = new Schema({
  inventoryKey: { type: String, required: true, unique: true, index: true },
  productType: { type: String, enum: ['vessel','resort'], required: true, index: true },
  organisation: { type: Schema.Types.ObjectId, ref: 'OrganisationV2', required: true, index: true },
  vessel: { type: Schema.Types.ObjectId, ref: 'VesselV2', index: true },
  departure: { type: Schema.Types.ObjectId, ref: 'DepartureV2', index: true },
  cabinType: { type: Schema.Types.ObjectId, ref: 'CabinTypeV2' },
  resort: { type: Schema.Types.ObjectId, ref: 'ResortV2', index: true },
  roomType: { type: Schema.Types.ObjectId, ref: 'RoomTypeV2', index: true },
  date: { type: Date, index: true },
  status: { type: String, index: true },
  totalCabins: Number,
  cabinsAvailable: Number,
  totalSpaces: Number,
  spacesAvailable: Number,
  roomsAvailable: Number,
  sourceType: { type: String, index: true },
  sourceReference: String,
  effectiveSourceName: String,
  sourceUpdatedAt: Date,
  receivedAt: Date,
  freshnessState: { type: String, enum: ['fresh','aging','stale','unknown'], default: 'unknown', index: true },
  conflictState: { type: Boolean, default: false, index: true },
  manualOverride: { type: Boolean, default: false, index: true },
  overrideExpiresAt: { type: Date, index: true },
  resolvedAt: { type: Date, default: Date.now, index: true },
  operationId: { type: String, index: true },
}, { timestamps: true });

effectiveSchema.index({ organisation: 1, freshnessState: 1, conflictState: 1, resolvedAt: -1 });
effectiveSchema.index({ productType: 1, status: 1, resolvedAt: -1 });
effectiveSchema.index({ manualOverride: 1, overrideExpiresAt: 1 });
module.exports = model('AvailabilityEffectiveV2', effectiveSchema);
