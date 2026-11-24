const transporter = require('../../config/smtp');
const User = require('../../models/user.model');
const OrganisationMembership = require('../models/organisationMembership.model');
const Notification = require('../models/notification.model');

const FROM = process.env.EMAIL_FROM || process.env.SMTP_USER || 'deeparture.reservations@gmail.com';
const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
const safeSend = async (mail) => {
  if (!mail.to) return null;
  return transporter.sendMail({ from: FROM, ...mail });
};
const getOrganisationRecipients = async (organisationId) => {
  const memberships = await OrganisationMembership.find({ organisation: organisationId, status: 'active' }).populate('user');
  return [...new Set(memberships.map((m) => m.user?.email).filter(Boolean))];
};
const adminUsers = async () => User.find({ role: 'admin', status: 'active', isValid: true }).select('_id email').lean();
const adminRecipients = async () => (await adminUsers()).map((u) => u.email).filter(Boolean);

const createInAppNotification = async ({ type, title, message, recipientUserId, recipientOrganisationId, audience = 'admin', relatedRecordType, relatedRecordId, actionTarget, operationId, metadata = {}, retentionClass = 'operational' }) => Notification.create({
  type, title, message, recipientUser: recipientUserId, recipientOrganisation: recipientOrganisationId,
  audience, relatedRecordType, relatedRecordId, actionTarget, operationId, metadata, retentionClass,
});

const notifyAdminsInApp = async (input) => {
  const users = await adminUsers();
  if (!users.length) return [];
  return Promise.all(users.map((user) => createInAppNotification({ ...input, recipientUserId: user._id, audience: 'admin' })));
};

const notifyOrganisationInApp = async ({ organisationId, ...input }) => {
  const memberships = await OrganisationMembership.find({ organisation: organisationId, status: 'active' }).select('user').lean();
  if (!memberships.length) return [await createInAppNotification({ ...input, recipientOrganisationId: organisationId, audience: 'operator' })];
  return Promise.all(memberships.map(m => createInAppNotification({ ...input, recipientUserId: m.user, recipientOrganisationId: organisationId, audience: 'operator' })));
};

const sendClaimInvitation = async ({ organisation, email, claimUrl }) => safeSend({
  to: email,
  subject: `Claim your Deeparture listing - ${organisation.name}`,
  html: `<div><h2>Your Deeparture listing is ready</h2><p>We have prepared listings for <strong>${escapeHtml(organisation.name)}</strong>.</p><p><a href="${escapeHtml(claimUrl)}">Claim your operator account</a> to verify information, add departures, availability, prices and offers.</p></div>`,
});

const enquiryDetailHtml = ({ enquiry, product }) => `<div><h2>Deeparture enquiry</h2><p><strong>Product or interest:</strong> ${escapeHtml(product?.name || enquiry.interest)}</p><p><strong>Destination or trip:</strong> ${escapeHtml(enquiry.destination)}</p><p><strong>Offer:</strong> ${escapeHtml(enquiry.offerName)}</p><p><strong>Name:</strong> ${escapeHtml(enquiry.customer.name)}</p><p><strong>Email:</strong> ${escapeHtml(enquiry.customer.email)}</p><p><strong>WhatsApp / Phone:</strong> ${escapeHtml(enquiry.customer.whatsapp || enquiry.customer.phone)}</p><p><strong>Guests:</strong> ${escapeHtml(enquiry.customer.guests)}</p><p><strong>Message:</strong> ${escapeHtml(enquiry.message)}</p></div>`;

const sendEnquiryReceivedNotifications = async ({ enquiry, product, operationId }) => {
  const label = product?.name || enquiry.interest || 'General';
  const detailHtml = enquiryDetailHtml({ enquiry, product });
  const notifyDeeparture = async () => {
    const configured = process.env.ENQUIRY_NOTIFICATION_EMAIL?.trim();
    const recipients = configured ? [configured] : await adminRecipients();
    await Promise.all(recipients.map(to => safeSend({ to, subject: `New Deeparture enquiry - ${label}`, html: detailHtml })));
  };
  const actions = await Promise.allSettled([
    notifyAdminsInApp({
      type: 'enquiry.received', title: `New enquiry - ${label}`,
      message: `${enquiry.customer.name} submitted an enquiry requiring Admin review.`, relatedRecordType: 'enquiry', relatedRecordId: enquiry._id,
      actionTarget: '/admin/v2/enquiries?status=new', operationId, retentionClass: 'business',
    }),
    notifyDeeparture(),
    safeSend({
      to: enquiry.customer.email,
      subject: 'We received your Deeparture enquiry',
      html: `<div><h2>Thank you, ${escapeHtml(enquiry.customer.name)}</h2><p>We have received your enquiry. The Deeparture team will review your message and contact you about the next steps. Pricing and availability are subject to confirmation.</p></div>`,
    }),
  ]);
  const failures = actions.filter(action => action.status === 'rejected');
  if (failures.length) throw new AggregateError(failures.map(action => action.reason), 'Enquiry notification failed');
};

const sendEnquiryToOperator = async ({ enquiry, product, organisation, operationId }) => {
  const recipients = await getOrganisationRecipients(organisation._id);
  if (!recipients.length && organisation.primaryEmail) recipients.push(organisation.primaryEmail);
  if (!recipients.length) throw new Error('Operator has no enquiry recipient email');
  await notifyOrganisationInApp({
    organisationId: organisation._id, type: 'enquiry.approved', title: `Approved enquiry - ${product?.name || organisation.name}`,
    message: `${enquiry.customer.name} has an approved Deeparture enquiry.`, relatedRecordType: 'enquiry', relatedRecordId: enquiry._id,
    actionTarget: `/operator/v2/enquiries`, operationId, retentionClass: 'business',
  });
  const productUrl = product?.slug ? `${process.env.FRONTEND_URL || ''}/${enquiry.productType === 'vessel' ? 'liveaboards' : 'resorts'}/${product.slug}` : process.env.FRONTEND_URL;
  const html = `${enquiryDetailHtml({ enquiry, product })}<p><a href="${escapeHtml(productUrl || '#')}">View listing</a></p>`;
  await Promise.all(recipients.map((to) => safeSend({ to, subject: `Approved Deeparture enquiry - ${product?.name || organisation.name}`, html })));
};

const sendEnquiryNotifications = sendEnquiryReceivedNotifications;
module.exports = {
  safeSend, sendClaimInvitation, sendEnquiryReceivedNotifications, sendEnquiryToOperator, sendEnquiryNotifications,
  getOrganisationRecipients, createInAppNotification, notifyAdminsInApp, notifyOrganisationInApp, adminRecipients,
};
