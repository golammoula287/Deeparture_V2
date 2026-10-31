const MEMBER_ROLES = ["admin", "editor", "reservations", "viewer"];
const ROLE_WEIGHT = { viewer: 1, reservations: 2, editor: 3, admin: 4, owner: 5 };
const safeRole = role => MEMBER_ROLES.includes(role) ? role : "viewer";
const canManageRole = ({ requesterRole, targetRole, nextRole }) => {
  if (requesterRole === "owner") return targetRole !== "owner" || nextRole === "owner";
  if (requesterRole === "admin") return targetRole !== "owner" && nextRole !== "owner";
  return false;
};
const IMPORT_RULES = {
  itineraries: ["vesselName", "itineraryName"],
  departures: ["vesselName", "itineraryName", "startDate", "endDate"],
  resort_packages: ["resortName", "packageName", "basePrice", "currency"],
  resort_availability: ["resortName", "roomType", "date"],
};
const requiredImportErrors = (type, row = {}) => (IMPORT_RULES[type] || [])
  .filter(key => row[key] === undefined || row[key] === null || String(row[key]).trim() === "")
  .map(key => `${key} is required`);
const validateImportValues = (type, row = {}) => {
  const errors = [];
  for (const key of ['basePrice','basePriceUsd','priceOverride','priceOverrideUsd','spacesAvailable','roomsAvailable','totalSpaces','totalCabins','cabinsAvailable','offerPercent']) {
    if (row[key] !== undefined && row[key] !== '') {
      const value = Number(row[key]);
      if (!Number.isFinite(value) || value < 0 || (key === 'offerPercent' && value > 100)) errors.push(`${key} is invalid`);
    }
  }
  for (const key of ['startDate','endDate','date','offerValidFrom','offerValidUntil']) {
    if (row[key] && !Number.isFinite(new Date(row[key]).getTime())) errors.push(`${key} is invalid`);
  }
  if (row.startDate && row.endDate && new Date(row.endDate) < new Date(row.startDate)) errors.push('endDate must follow startDate');
  return errors;
};
const enquiryTransitions = { sent_to_operator: ['operator_accepted'], operator_accepted: ['operator_replied','quoted'], operator_replied: ['operator_replied','quoted'], quoted: ['quoted'] };
const canTransitionEnquiry = (from, to) => (enquiryTransitions[from] || []).includes(to);
const productTypeForImport = type => String(type || "").startsWith("resort_") ? "resort" : "vessel";
const clampOperatorLimit = (value, fallback = 50, max = 250) => Math.min(max, Math.max(1, Number(value) || fallback));
module.exports = { validateImportValues, canTransitionEnquiry, MEMBER_ROLES, ROLE_WEIGHT, safeRole, canManageRole, IMPORT_RULES, requiredImportErrors, productTypeForImport, clampOperatorLimit };
