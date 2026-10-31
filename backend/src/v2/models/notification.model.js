const { Schema, model } = require('mongoose');

const notificationSchema = new Schema({
  type: { type: String, required: true, index: true, trim: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true },
  recipientUser: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  recipientOrganisation: { type: Schema.Types.ObjectId, ref: 'OrganisationV2', index: true },
  audience: { type: String, enum: ['admin', 'operator', 'system'], default: 'admin', index: true },
  relatedRecordType: String,
  relatedRecordId: Schema.Types.ObjectId,
  actionTarget: String,
  readAt: { type: Date, index: true },
  operationId: { type: String, index: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
  retentionClass: { type: String, enum: ['operational', 'business'], default: 'operational', index: true },
}, { timestamps: true });

notificationSchema.index({ audience: 1, recipientUser: 1, readAt: 1, createdAt: -1 });
notificationSchema.index({ recipientOrganisation: 1, readAt: 1, createdAt: -1 });
module.exports = model('NotificationV2', notificationSchema);
