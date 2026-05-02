function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function validateEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ? normalizedEmail : "";
}

function sanitizeString(value, fallback = "") {
  return isNonEmptyString(value) ? value.trim() : fallback;
}

module.exports = {
  isNonEmptyString,
  normalizeEmail,
  validateEmail,
  sanitizeString
};