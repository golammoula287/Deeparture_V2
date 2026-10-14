const { Schema, model } = require('mongoose');

const websiteSourceSchema = new Schema({
  organisation: { type: Schema.Types.ObjectId, ref: 'OrganisationV2', index: true },
  productType: { type: String, enum: ['vessel', 'resort'], required: true, index: true },
  sourceUrl: { type: String, required: true, trim: true },
  productName: { type: String, required: true, trim: true },
  notes: String,
  status: { type: String, enum: ['queued', 'draft_created', 'needs_review', 'approved', 'rejected'], default: 'queued', index: true },
  draftProductId: Schema.Types.ObjectId,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  operationId: { type: String, index: true },
}, { timestamps: true });

websiteSourceSchema.index({ status: 1, createdAt: -1 });
websiteSourceSchema.index({ organisation: 1, sourceUrl: 1 });
module.exports = model('WebsiteSourceV2', websiteSourceSchema);
