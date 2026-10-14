const { Schema, model } = require('mongoose');

const sourceConfigSchema = new Schema({
  providerName: { type: String, required: true, trim: true },
  providerKey: { type: String, required: true, lowercase: true, trim: true, index: true },
  sourceType: { type: String, required: true, trim: true, index: true },
  organisation: { type: Schema.Types.ObjectId, ref: 'OrganisationV2', index: true },
  enabled: { type: Boolean, default: true, index: true },
  priority: { type: Number, default: 100, min: 0, max: 10000, index: true },
  freshnessThresholdMinutes: { type: Number, default: 1440, min: 1 },
  lastSuccessfulSyncAt: Date,
  lastAttemptAt: Date,
  status: { type: String, enum: ['unconfigured', 'healthy', 'warning', 'error', 'disabled'], default: 'unconfigured', index: true },
  lastError: String,
  metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

sourceConfigSchema.index({ providerKey: 1, organisation: 1 }, { unique: true });
sourceConfigSchema.index({ enabled: 1, status: 1, priority: 1 });
module.exports = model('SourceConfigV2', sourceConfigSchema);
