const { Schema, model } = require('mongoose');

const verificationRecordSchema = new Schema({
  entityType: { type: String, enum: ['organisation', 'vessel', 'resort'], required: true, index: true },
  entityId: { type: Schema.Types.ObjectId, required: true, index: true },
  organisation: { type: Schema.Types.ObjectId, ref: 'OrganisationV2', index: true },
  status: { type: String, enum: ['unverified', 'operator_verified', 'deeparture_verified', 'revoked'], required: true, index: true },
  verifiedByUser: { type: Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: Date,
  verificationSourceType: String,
  verificationSourceRef: String,
  verificationScope: String,
  verificationNotes: String,
  operationId: { type: String, index: true },
}, { timestamps: true });

verificationRecordSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
module.exports = model('VerificationRecordV2', verificationRecordSchema);
