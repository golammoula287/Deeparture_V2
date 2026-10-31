const Organisation = require('../models/organisation.model');
const Vessel = require('../models/vessel.model');
const Resort = require('../models/resort.model');
const VerificationRecord = require('../models/verificationRecord.model');
const AppError = require('../../error/appError');

const modelFor = (entityType) => ({ organisation: Organisation, vessel: Vessel, resort: Resort }[entityType]);

const setVerification = async ({ entityType, entityId, status, actorUserId, sourceType, sourceRef, scope, notes, operationId }) => {
  const Model = modelFor(entityType);
  if (!Model) throw new AppError(400, 'Unsupported verification entity type');
  if (!['unverified','operator_verified','deeparture_verified','revoked'].includes(status)) throw new AppError(400, 'Unsupported verification status');
  const item = await Model.findById(entityId);
  if (!item) throw new AppError(404, 'Verification target not found');
  const current = status === 'revoked' ? 'unverified' : status;
  item.verificationStatus = current;
  item.verifiedAt = current === 'unverified' ? undefined : new Date();
  item.verifiedByUser = current === 'unverified' ? undefined : actorUserId;
  item.verificationSourceType = sourceType;
  item.verificationSourceRef = sourceRef;
  item.verificationScope = scope;
  item.verificationNotes = notes;
  if (entityType === 'organisation' && current === 'deeparture_verified') item.status = 'verified';
  await item.save();
  const record = await VerificationRecord.create({
    entityType, entityId, organisation: entityType === 'organisation' ? item._id : item.organisation,
    status, verifiedByUser: actorUserId, verifiedAt: new Date(), verificationSourceType: sourceType,
    verificationSourceRef: sourceRef, verificationScope: scope, verificationNotes: notes, operationId,
  });
  return { item, record };
};

module.exports = { setVerification };
