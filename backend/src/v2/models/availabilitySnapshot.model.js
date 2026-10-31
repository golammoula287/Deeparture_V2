const { Schema, model } = require('mongoose');

const availabilitySnapshotSchema = new Schema({
  inventoryKey: { type: String, required: true, index: true },
  productType: { type: String, enum: ['vessel', 'resort'], required: true, index: true },
  organisation: { type: Schema.Types.ObjectId, ref: 'OrganisationV2', required: true, index: true },
  vessel: { type: Schema.Types.ObjectId, ref: 'VesselV2', index: true },
  departure: { type: Schema.Types.ObjectId, ref: 'DepartureV2', index: true },
  cabinType: { type: Schema.Types.ObjectId, ref: 'CabinTypeV2', index: true },
  resort: { type: Schema.Types.ObjectId, ref: 'ResortV2', index: true },
  roomType: { type: Schema.Types.ObjectId, ref: 'RoomTypeV2', index: true },
  date: { type: Date, index: true },
  status: { type: String, enum: ['unknown', 'available', 'limited', 'sold_out', 'on_request', 'stop_sell'], required: true, index: true },
  totalCabins: Number,
  cabinsAvailable: Number,
  totalSpaces: Number,
  spacesAvailable: Number,
  roomsAvailable: Number,
  sourceType: { type: String, required: true, index: true },
  sourceReference: String,
  sourceKey: { type: String, required: true, index: true },
  providerName: String,
  sourceConfig: { type: Schema.Types.ObjectId, ref: 'SourceConfigV2' },
  sourceUpdatedAt: { type: Date, index: true },
  receivedAt: { type: Date, default: Date.now, index: true },
  operationId: { type: String, index: true },
}, { timestamps: true });

availabilitySnapshotSchema.index({ inventoryKey: 1, sourceKey: 1 }, { unique: true });
availabilitySnapshotSchema.index({ organisation: 1, sourceType: 1, sourceUpdatedAt: -1 });
module.exports = model('AvailabilitySnapshotV2', availabilitySnapshotSchema);
