const mongoose = require("mongoose");
const { sanitizeString } = require("./common");

const allowedStatuses = ["pending", "approved", "rejected", "returned", "canceled"];
const allowedPriorities = ["low", "medium", "high", "urgent"];
const allowedSortModes = ["latest", "priority"];

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function validateCreateBorrowRequestInput(body) {
  const errors = [];
  const item_id = sanitizeString(body.item_id);
  const note = sanitizeString(body.note);
  const requested_start_date = parseDate(body.requested_start_date);
  const requested_end_date = parseDate(body.requested_end_date);

  if (!item_id) {
    errors.push("item_id is required");
  } else if (!mongoose.Types.ObjectId.isValid(item_id)) {
    errors.push("item_id is invalid");
  }

  if (body.requested_start_date !== undefined && !requested_start_date) {
    errors.push("requested_start_date is invalid");
  }

  if (body.requested_end_date !== undefined && !requested_end_date) {
    errors.push("requested_end_date is invalid");
  }

  if (requested_start_date && requested_end_date && requested_end_date < requested_start_date) {
    errors.push("requested_end_date must be after requested_start_date");
  }

  return {
    errors,
    value: {
      item_id,
      note,
      requested_start_date,
      requested_end_date
    }
  };
}

function validateListBorrowRequestsQuery(query) {
  const errors = [];
  const type = sanitizeString(query.type).toLowerCase() || "all";
  const status = sanitizeString(query.status).toLowerCase();
  const priority = sanitizeString(query.priority).toLowerCase();
  const sort = sanitizeString(query.sort).toLowerCase() || "latest";

  if (!["all", "sent", "received"].includes(type)) {
    errors.push("type must be all, sent, or received");
  }

  if (status && !allowedStatuses.includes(status)) {
    errors.push("status is invalid");
  }

  if (priority && !allowedPriorities.includes(priority)) {
    errors.push("priority must be low, medium, high, or urgent");
  }

  if (!allowedSortModes.includes(sort)) {
    errors.push("sort must be latest or priority");
  }

  return {
    errors,
    value: {
      type,
      status,
      priority,
      sort
    }
  };
}

function validateUpdateBorrowRequestStatusInput(body) {
  const errors = [];
  const status = sanitizeString(body.status).toLowerCase();

  if (!status) {
    errors.push("status is required");
  } else if (!["approved", "rejected", "returned", "canceled"].includes(status)) {
    errors.push("status must be approved, rejected, returned, or canceled");
  }

  return {
    errors,
    value: {
      status
    }
  };
}

function validateUpdateBorrowRequestPriorityInput(body) {
  const errors = [];
  const priority = sanitizeString(body.priority).toLowerCase();

  if (!priority) {
    errors.push("priority is required");
  } else if (!allowedPriorities.includes(priority)) {
    errors.push("priority must be low, medium, high, or urgent");
  }

  return {
    errors,
    value: {
      priority
    }
  };
}

module.exports = {
  validateCreateBorrowRequestInput,
  validateListBorrowRequestsQuery,
  validateUpdateBorrowRequestStatusInput,
  validateUpdateBorrowRequestPriorityInput
};