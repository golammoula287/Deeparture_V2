const transporter = require("../../config/smtp");
const User = require("../../models/user.model");
const OrganisationMembership = require("../models/organisationMembership.model");

const FROM = process.env.EMAIL_FROM || process.env.SMTP_USER || "deeparture.reservations@gmail.com";

const safeSend = async (mail) => {
  if (!mail.to) return null;
  return transporter.sendMail({ from: FROM, ...mail });
};

const getOrganisationRecipients = async (organisationId) => {
  const memberships = await OrganisationMembership.find({ organisation: organisationId, status: "active" }).populate("user");
  return [...new Set(memberships.map((m) => m.user?.email).filter(Boolean))];
};

const sendClaimInvitation = async ({ organisation, email, claimUrl }) =>
  safeSend({
    to: email,
    subject: `Claim your Deeparture listing – ${organisation.name}`,
    html: `<div><h2>Your Deeparture listing is ready</h2><p>We have prepared listings for <strong>${organisation.name}</strong>.</p><p><a href="${claimUrl}">Claim your operator account</a> to verify information, add departures, availability, prices and offers.</p></div>`,
  });

const sendEnquiryNotifications = async ({ enquiry, product, organisation }) => {
  const operatorRecipients = await getOrganisationRecipients(organisation._id);
  if (!operatorRecipients.length && organisation.primaryEmail) operatorRecipients.push(organisation.primaryEmail);
  const admin = await User.findOne({ role: "admin" });
  const productUrl = product?.slug
    ? `${process.env.FRONTEND_URL || ""}/${enquiry.productType === "vessel" ? "liveaboards" : "resorts"}/${product.slug}`
    : process.env.FRONTEND_URL;

  const detailHtml = `<div><h2>New Deeparture enquiry</h2><p><strong>Product:</strong> ${product?.name || ""}</p><p><strong>Name:</strong> ${enquiry.customer.name}</p><p><strong>Email:</strong> ${enquiry.customer.email}</p><p><strong>Phone:</strong> ${enquiry.customer.phone || ""}</p><p><strong>Guests:</strong> ${enquiry.customer.guests || ""}</p><p><strong>Message:</strong> ${enquiry.message || ""}</p><p><a href="${productUrl}">View listing</a></p></div>`;

  await Promise.all([
    ...operatorRecipients.map((to) => safeSend({ to, subject: `New enquiry – ${product?.name || organisation.name}`, html: detailHtml })),
    admin?.email ? safeSend({ to: admin.email, subject: `New Deeparture enquiry – ${product?.name || organisation.name}`, html: detailHtml }) : null,
    safeSend({
      to: enquiry.customer.email,
      subject: "We received your Deeparture enquiry",
      html: `<div><h2>Thank you, ${enquiry.customer.name}</h2><p>We have received your enquiry for <strong>${product?.name || "your selected property"}</strong> and passed it to the relevant team.</p></div>`,
    }),
  ].filter(Boolean));
};

module.exports = { safeSend, sendClaimInvitation, sendEnquiryNotifications, getOrganisationRecipients };
