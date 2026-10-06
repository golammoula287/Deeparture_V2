const transporter = require("../../config/smtp");
const User = require("../../models/user.model");
const OrganisationMembership = require("../models/organisationMembership.model");

const FROM = process.env.EMAIL_FROM || process.env.SMTP_USER || "deeparture.reservations@gmail.com";
const escapeHtml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");
const safeSend = async (mail) => {
  if (!mail.to) return null;
  return transporter.sendMail({ from: FROM, ...mail });
};
const getOrganisationRecipients = async (organisationId) => {
  const memberships = await OrganisationMembership.find({ organisation: organisationId, status: "active" }).populate("user");
  return [...new Set(memberships.map((m) => m.user?.email).filter(Boolean))];
};
const adminRecipients = async () => (await User.find({ role: "admin", status: "active", isValid: true }).select("email").lean()).map((u) => u.email).filter(Boolean);

const sendClaimInvitation = async ({ organisation, email, claimUrl }) => safeSend({
  to: email,
  subject: `Claim your Deeparture listing - ${organisation.name}`,
  html: `<div><h2>Your Deeparture listing is ready</h2><p>We have prepared listings for <strong>${organisation.name}</strong>.</p><p><a href="${claimUrl}">Claim your operator account</a> to verify information, add departures, availability, prices and offers.</p></div>`,
});

const enquiryDetailHtml = ({ enquiry, product }) => `<div><h2>Deeparture enquiry</h2><p><strong>Product:</strong> ${escapeHtml(product?.name)}</p><p><strong>Name:</strong> ${escapeHtml(enquiry.customer.name)}</p><p><strong>Email:</strong> ${escapeHtml(enquiry.customer.email)}</p><p><strong>Phone:</strong> ${escapeHtml(enquiry.customer.phone)}</p><p><strong>Guests:</strong> ${escapeHtml(enquiry.customer.guests)}</p><p><strong>Message:</strong> ${escapeHtml(enquiry.message)}</p></div>`;

const sendEnquiryReceivedNotifications = async ({ enquiry, product }) => {
  const admins = await adminRecipients();
  const detailHtml = enquiryDetailHtml({ enquiry, product });
  await Promise.all([
    ...admins.map((to) => safeSend({ to, subject: `New Deeparture enquiry - ${product?.name || "listing"}`, html: detailHtml })),
    safeSend({
      to: enquiry.customer.email,
      subject: "We received your Deeparture enquiry",
      html: `<div><h2>Thank you, ${escapeHtml(enquiry.customer.name)}</h2><p>We have received your enquiry for <strong>${escapeHtml(product?.name || "your selected property")}</strong>. The Deeparture team will review it and contact the operator as the next step.</p></div>`,
    }),
  ].filter(Boolean));
};

const sendEnquiryToOperator = async ({ enquiry, product, organisation }) => {
  const recipients = await getOrganisationRecipients(organisation._id);
  if (!recipients.length && organisation.primaryEmail) recipients.push(organisation.primaryEmail);
  if (!recipients.length) throw new Error("Operator has no enquiry recipient email");
  const productUrl = product?.slug ? `${process.env.FRONTEND_URL || ""}/${enquiry.productType === "vessel" ? "liveaboards" : "resorts"}/${product.slug}` : process.env.FRONTEND_URL;
  const html = `${enquiryDetailHtml({ enquiry, product })}<p><a href="${productUrl || "#"}">View listing</a></p>`;
  await Promise.all(recipients.map((to) => safeSend({ to, subject: `Approved Deeparture enquiry - ${product?.name || organisation.name}`, html })));
};

// Backwards-compatible export name; now intentionally means receipt notifications only.
const sendEnquiryNotifications = sendEnquiryReceivedNotifications;
module.exports = { safeSend, sendClaimInvitation, sendEnquiryReceivedNotifications, sendEnquiryToOperator, sendEnquiryNotifications, getOrganisationRecipients };
