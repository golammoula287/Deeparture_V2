const { Schema, model } = require('mongoose');

const claimInvitationHistorySchema = new Schema({
  organisation: { type: Schema.Types.ObjectId, ref: 'OrganisationV2', required: true, index: true },
  claimTokenId: { type: Schema.Types.ObjectId, ref: 'ClaimTokenV2', index: true },
  invitedEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
  status: { type: String, enum: ['sent', 'revoked', 'expired', 'claimed', 'delivery_failed'], default: 'sent', index: true },
  sentAt: { type: Date, default: Date.now, index: true },
  expiresAt: Date,
  revokedAt: Date,
  claimedAt: Date,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  operationId: { type: String, index: true },
  errorMessage: String,
}, { timestamps: true });

claimInvitationHistorySchema.index({ organisation: 1, sentAt: -1 });
module.exports = model('ClaimInvitationHistoryV2', claimInvitationHistorySchema);
