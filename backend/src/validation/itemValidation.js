const mongoose = require("mongoose");
const { sanitizeString } = require("./common");

const allowedConditions = ["new", "like_new", "good", "fair", "poor"];

function normalizeCondition(value) {
  const normalized = sanitizeString(value).toLowerCase();
  return allowedConditions.includes(normalized) ? normalized : "";
}

function normalizeImageUrls(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((url) => sanitizeString(url))
    .filter((url) => url.length > 0);
}

function normalizeLocation(location) {
  if (!location || typeof location !== "object") return undefined;
  const coordinates = Array.isArray(location.coordinates) ? location.coordinates : [];
  if (coordinates.length !== 2) return undefined;

  const lng = Number(coordinates[0]);
  const lat = Number(coordinates[1]);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return undefined;

  return {
    type: "Point",
    coordinates: [lng, lat]
  };
}

function validateCreateItemInput(body) {
  const errors = [];
  const title = sanitizeString(body.title);
  const description = sanitizeString(body.description);
  const category = sanitizeString(body.category).toLowerCase();
  const condition = normalizeCondition(body.condition) || "good";
  const address = sanitizeString(body.address);
  const image_urls = normalizeImageUrls(body.image_urls);
  const location = normalizeLocation(body.location);

  if (!title) errors.push("Title is required");
  if (!description) errors.push("Description is required");
  if (!category) errors.push("Category is required");
  if (!address) errors.push("Address is required");
  if (body.condition !== undefined && !normalizeCondition(body.condition)) {
    errors.push("Condition is invalid");
  }
  if (body.location !== undefined && !location) {
    errors.push("Location must include numeric coordinates [lng, lat]");
  }

  return {
    errors,
    value: {
      title,
      description,
      category,
      condition,
      address,
      image_urls,
      location
    }
  };
}

function validateUpdateItemInput(body) {
  const errors = [];
  const value = {};

  if (body.title !== undefined) {
    const title = sanitizeString(body.title);
    if (!title) errors.push("Title cannot be empty");
    else value.title = title;
  }

  if (body.description !== undefined) {
    const description = sanitizeString(body.description);
    if (!description) errors.push("Description cannot be empty");
    else value.description = description;
  }

  if (body.category !== undefined) {
    const category = sanitizeString(body.category).toLowerCase();
    if (!category) errors.push("Category cannot be empty");
    else value.category = category;
  }

  if (body.condition !== undefined) {
    const condition = normalizeCondition(body.condition);
    if (!condition) errors.push("Condition is invalid");
    else value.condition = condition;
  }

  if (body.address !== undefined) {
    const address = sanitizeString(body.address);
    if (!address) errors.push("Address cannot be empty");
    else value.address = address;
  }

  if (body.image_urls !== undefined) {
    value.image_urls = normalizeImageUrls(body.image_urls);
  }

  if (body.is_available !== undefined) {
    if (typeof body.is_available !== "boolean") errors.push("is_available must be boolean");
    else value.is_available = body.is_available;
  }

  if (body.location !== undefined) {
    const location = normalizeLocation(body.location);
    if (!location) errors.push("Location must include numeric coordinates [lng, lat]");
    else value.location = location;
  }

  return { errors, value };
}

function parseBoolean(value) {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function validateListItemsQuery(query) {
  const errors = [];
  const page = Number.parseInt(query.page, 10) || 1;
  const limit = Number.parseInt(query.limit, 10) || 20;
  const category = sanitizeString(query.category).toLowerCase();
  const search = sanitizeString(query.search);
  const owner_id = sanitizeString(query.owner_id);
  const is_available = parseBoolean(query.is_available);

  if (page < 1) errors.push("page must be >= 1");
  if (limit < 1 || limit > 100) errors.push("limit must be between 1 and 100");
  if (owner_id && !mongoose.Types.ObjectId.isValid(owner_id)) {
    errors.push("owner_id is invalid");
  }
  if (is_available === null) {
    errors.push("is_available must be true or false");
  }

  return {
    errors,
    value: {
      page,
      limit,
      category,
      search,
      owner_id,
      is_available
    }
  };
}

module.exports = {
  validateCreateItemInput,
  validateUpdateItemInput,
  validateListItemsQuery
};