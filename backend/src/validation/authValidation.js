const { isNonEmptyString, validateEmail, sanitizeString } = require("./common");

function validateRegisterInput(body) {
  const errors = [];
  const name = isNonEmptyString(body.name) ? body.name.trim() : "";
  const email = validateEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";
  const phone = sanitizeString(body.phone);
  const address = sanitizeString(body.address);

  if (!name) errors.push("Name is required");
  if (!email) errors.push("Valid email is required");
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(password)) {
    errors.push("Password must contain at least one uppercase letter, one lowercase letter, and one number");
  }
  if (!phone) errors.push("Phone is required");
  if (!address) errors.push("Address is required");

  return {
    errors,
    value: {
      name,
      email,
      password,
      phone,
      address,
      role: "user",
      location: body.location && typeof body.location === "object" ? body.location : undefined,
      avatar_url: sanitizeString(body.avatar_url),
      fcm_token: sanitizeString(body.fcm_token)
    }
  };
}

function validateLoginInput(body) {
  const errors = [];
  const email = validateEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";

  if (!email) errors.push("Valid email is required");
  if (!password) errors.push("Password is required");

  return {
    errors,
    value: {
      email,
      password
    }
  };
}

function validateProfileUpdateInput(body) {
  const update = {};
  const errors = [];

  if (body.name !== undefined) {
    if (!isNonEmptyString(body.name)) errors.push("Name cannot be empty");
    else update.name = sanitizeString(body.name);
  }

  if (body.phone !== undefined) {
    if (!isNonEmptyString(body.phone)) errors.push("Phone cannot be empty");
    else update.phone = sanitizeString(body.phone);
  }

  if (body.address !== undefined) {
    if (!isNonEmptyString(body.address)) errors.push("Address cannot be empty");
    else update.address = sanitizeString(body.address);
  }

  if (body.avatar_url !== undefined) {
    update.avatar_url = sanitizeString(body.avatar_url);
  }

  if (body.fcm_token !== undefined) {
    update.fcm_token = sanitizeString(body.fcm_token);
  }

  if (body.location !== undefined) {
    if (!body.location || typeof body.location !== "object") errors.push("Location must be an object");
    else update.location = body.location;
  }

  return { errors, value: update };
}

module.exports = {
  validateRegisterInput,
  validateLoginInput,
  validateProfileUpdateInput
};
