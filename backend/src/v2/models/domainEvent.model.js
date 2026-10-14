const { Schema, model } = require('mongoose');

const domainEventSchema = new Schema({
  name: { type: String, required: true, index: true },
  aggregateType: String,
  aggregateId: Schema.Types.ObjectId,
  organisation: { type: Schema.Types.ObjectId, ref: 'OrganisationV2', index: true },
  actorUser: { type: Schema.Types.ObjectId, ref: 'User' },
  operationId: { type: String, index: true },
  payload: { type: Schema.Types.Mixed, default: {} },
  status: { type: String, enum: ['recorded', 'handled', 'failed'], default: 'recorded', index: true },
  handledAt: Date,
  errorMessage: String,
  retentionClass: { type: String, enum: ['operational', 'business'], default: 'operational', index: true },
}, { timestamps: true });

domainEventSchema.index({ name: 1, createdAt: -1 });
module.exports = model('DomainEventV2', domainEventSchema);
