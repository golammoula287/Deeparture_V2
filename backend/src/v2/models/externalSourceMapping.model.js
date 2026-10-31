const { Schema, model } = require('mongoose');

const mappingSchema = new Schema({
  providerKey: { type: String, required: true, lowercase: true, trim: true, index: true },
  providerName: { type: String, trim: true },
  sourceType: { type: String, trim: true, index: true },
  internalEntityType: { type: String, required: true, index: true },
  internalEntityId: { type: Schema.Types.ObjectId, required: true, index: true },
  externalEntityType: { type: String, required: true, trim: true },
  externalId: { type: String, required: true, trim: true },
  organisation: { type: Schema.Types.ObjectId, ref: 'OrganisationV2', index: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
  active: { type: Boolean, default: true, index: true },
}, { timestamps: true });

mappingSchema.index({ providerKey: 1, externalEntityType: 1, externalId: 1 }, { unique: true });
mappingSchema.index({ internalEntityType: 1, internalEntityId: 1, providerKey: 1 });
module.exports = model('ExternalSourceMappingV2', mappingSchema);
