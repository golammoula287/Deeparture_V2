const { Schema, model } = require('mongoose');

const availabilityOverrideSchema = new Schema({
  inventoryKey: { type: String, required: true, index: true },
  productType: { type: String, enum: ['vessel', 'resort'], required: true },
  organisation: { type: Schema.Types.ObjectId, ref: 'OrganisationV2', required: true, index: true },
  status: { type: String, enum: ['unknown', 'available', 'limited', 'sold_out', 'on_request', 'stop_sell'], required: true },
  totalCabins: Number,
  cabinsAvailable: Number,
  totalSpaces: Number,
  spacesAvailable: Number,
  roomsAvailable: Number,
  reason: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, index: true },
  expiredAt: { type: Date, index: true },
  clearedAt: Date,
  clearedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  clearReason: String,
  operationId: { type: String, index: true },
}, { timestamps: true });

availabilityOverrideSchema.index({ inventoryKey: 1, clearedAt: 1, expiredAt: 1, expiresAt: 1, createdAt: -1 });
availabilityOverrideSchema.index({ clearedAt: 1, expiredAt: 1, expiresAt: 1 });
module.exports = model('AvailabilityOverrideV2', availabilityOverrideSchema);
