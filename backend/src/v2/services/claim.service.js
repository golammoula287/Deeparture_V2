const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const httpStatus = require('http-status');
const User = require('../../models/user.model');
const AppError = require('../../error/appError');
const Organisation = require('../models/organisation.model');
const OrganisationMembership = require('../models/organisationMembership.model');
const ClaimToken = require('../models/claimToken.model');
const ClaimInvitationHistory = require('../models/claimInvitationHistory.model');
const { sendClaimInvitation, notifyAdminsInApp } = require('./notification.service');
const { publishDomainEvent } = require('./domainEvent.service');
const { logAudit } = require('./audit.service');

const tokenHash = (token) => crypto.createHash('sha256').update(token).digest('hex');

const expireHistory = async (organisationId) => {
  const now = new Date();
  await ClaimInvitationHistory.updateMany(
    { organisation: organisationId, status: 'sent', expiresAt: { $lt: now } },
    { $set: { status: 'expired' } }
  );
};

const createClaimInvitation = async ({ organisationId, email, createdBy, operationId }) => {
  const organisation = await Organisation.findById(organisationId);
  if (!organisation) throw new AppError(httpStatus.NOT_FOUND, 'Organisation not found');
  if (organisation.type !== 'operator') throw new AppError(httpStatus.BAD_REQUEST, 'Only operator organisations can be claimed through this flow');

  const normalizedEmail = String(email || organisation.primaryEmail || '').trim().toLowerCase();
  if (!normalizedEmail) throw new AppError(httpStatus.BAD_REQUEST, 'Operator email is required');

  await expireHistory(organisation._id);
  const active = await ClaimToken.find({ organisation: organisation._id, email: normalizedEmail, usedAt: { $exists: false }, revokedAt: { $exists: false } });
  if (active.length) {
    const now = new Date();
    for (const token of active) {
      token.revokedAt = now;
      token.revokeReason = 'superseded';
      await token.save();
      await ClaimInvitationHistory.updateMany({ claimTokenId: token._id, status: 'sent' }, { $set: { status: 'revoked', revokedAt: now } });
    }
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const claim = await ClaimToken.create({ organisation: organisation._id, email: normalizedEmail, tokenHash: tokenHash(rawToken), expiresAt, createdBy });
  const history = await ClaimInvitationHistory.create({ organisation: organisation._id, claimTokenId: claim._id, invitedEmail: normalizedEmail, status: 'sent', sentAt: new Date(), expiresAt, createdBy, operationId });

  if (organisation.status === 'unclaimed') organisation.status = 'invited';
  organisation.primaryEmail = normalizedEmail;
  await organisation.save();

  const claimUrl = `${process.env.FRONTEND_URL || ''}/claim-operator?token=${rawToken}`;
  try {
    await sendClaimInvitation({ organisation, email: normalizedEmail, claimUrl });
  } catch (error) {
    history.status = 'delivery_failed';
    history.errorMessage = String(error.message || error).slice(0, 1000);
    await history.save();
    throw error;
  }

  await publishDomainEvent({ name: 'claim.invited', aggregateType: 'organisation', aggregateId: organisation._id, organisation: organisation._id, actorUser: createdBy, operationId, payload: { invitedEmail: normalizedEmail, expiresAt } });
  return { organisation, expiresAt, historyId: history._id, claimUrl: process.env.NODE_ENV === 'production' ? undefined : claimUrl };
};

const revokeClaimInvitation = async ({ organisationId, historyId, actorUserId, reason = 'revoked_by_admin', operationId }) => {
  const history = await ClaimInvitationHistory.findOne({ _id: historyId, organisation: organisationId });
  if (!history) throw new AppError(404, 'Claim invitation history not found');
  if (!['sent','delivery_failed'].includes(history.status)) throw new AppError(409, `Invitation cannot be revoked from ${history.status}`);
  const now = new Date();
  if (history.claimTokenId) await ClaimToken.updateOne({ _id: history.claimTokenId, usedAt: { $exists: false } }, { $set: { revokedAt: now, revokeReason: reason } });
  history.status = 'revoked';
  history.revokedAt = now;
  history.operationId = operationId || history.operationId;
  await history.save();
  await publishDomainEvent({ name: 'claim.revoked', aggregateType: 'organisation', aggregateId: organisationId, organisation: organisationId, actorUser: actorUserId, operationId, payload: { historyId, reason } });
  return history;
};

const acceptClaim = async ({ token, fullName, password, phone, whatsapp, operationId }) => {
  if (!token || !password) throw new AppError(httpStatus.BAD_REQUEST, 'Token and password are required');
  const claim = await ClaimToken.findOne({ tokenHash: tokenHash(token), usedAt: { $exists: false }, revokedAt: { $exists: false } });
  if (!claim || claim.expiresAt < new Date()) throw new AppError(httpStatus.BAD_REQUEST, 'Claim link is invalid or expired');

  const organisation = await Organisation.findById(claim.organisation);
  if (!organisation) throw new AppError(httpStatus.NOT_FOUND, 'Organisation not found');

  let user = await User.findOne({ email: claim.email }).select('+password');
  if (user) {
    if (!['operator', 'admin'].includes(user.role) || user.status !== 'active' || !user.isValid) throw new AppError(httpStatus.FORBIDDEN, 'Existing account is not eligible to claim');
    if (!(await bcrypt.compare(password, user.password))) throw new AppError(httpStatus.UNAUTHORIZED, 'Use your existing account password to accept this invitation');
  } else if (password.length < 12) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Use a password of at least 12 characters');
  }

  const consumed = await ClaimToken.findOneAndUpdate(
    { _id: claim._id, usedAt: { $exists: false }, revokedAt: { $exists: false }, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } }, { new: true }
  );
  if (!consumed) throw new AppError(httpStatus.BAD_REQUEST, 'Claim link is invalid or expired');

  if (!user) {
    user = new User({ fullName: fullName || organisation.name, email: claim.email, phone: phone || 0, whatsapp, password, isValid: true, role: 'operator', status: 'active' });
    await user.save();
  }

  await OrganisationMembership.findOneAndUpdate(
    { user: user._id, organisation: organisation._id },
    { user: user._id, organisation: organisation._id, role: 'owner', status: 'active' },
    { new: true, upsert: true, runValidators: true }
  );

  organisation.status = organisation.status === 'verified' ? 'verified' : 'claimed';
  organisation.claimedAt = new Date();
  await organisation.save();
  await ClaimInvitationHistory.updateMany({ claimTokenId: claim._id }, { $set: { status: 'claimed', claimedAt: new Date() } });
  await logAudit({ actorUser: user._id, organisation: organisation._id, action: 'organisation.claim.completed', entityType: 'organisation', entityId: organisation._id, after: { status: organisation.status, claimedAt: organisation.claimedAt, userId: user._id }, source: 'claim', operationId });

  await notifyAdminsInApp({ type: 'claim.completed', title: `${organisation.name} claimed`, message: `${claim.email} completed the organisation claim.`, relatedRecordType: 'organisation', relatedRecordId: organisation._id, actionTarget: `/admin/v2/operators/${organisation._id}`, operationId, retentionClass: 'business' });
  await publishDomainEvent({ name: 'claim.completed', aggregateType: 'organisation', aggregateId: organisation._id, organisation: organisation._id, actorUser: user._id, operationId, payload: { userId: user._id, email: claim.email }, retentionClass: 'business' });
  return { user: await User.findById(user._id).select('-password'), organisation };
};

module.exports = { createClaimInvitation, acceptClaim, revokeClaimInvitation, expireHistory };
