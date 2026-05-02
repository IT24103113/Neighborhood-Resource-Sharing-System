const mongoose = require("mongoose");
const { sanitizeString } = require("./common");

function validateCreateReviewInput(body) {
  const errors = [];
  const borrow_request_id = sanitizeString(body.borrow_request_id);
  const ratingRaw = Number(body.rating);
  const comment = sanitizeString(body.comment);

  if (!borrow_request_id) {
    errors.push("borrow_request_id is required");
  } else if (!mongoose.Types.ObjectId.isValid(borrow_request_id)) {
    errors.push("borrow_request_id is invalid");
  }

  if (!Number.isInteger(ratingRaw) || ratingRaw < 1 || ratingRaw > 5) {
    errors.push("rating must be an integer between 1 and 5");
  }

  return {
    errors,
    value: {
      borrow_request_id,
      rating: ratingRaw,
      comment
    }
  };
}

function validateUpdateReviewInput(body) {
  const errors = [];
  const value = {};

  if (body.rating !== undefined) {
    const ratingRaw = Number(body.rating);
    if (!Number.isInteger(ratingRaw) || ratingRaw < 1 || ratingRaw > 5) {
      errors.push("rating must be an integer between 1 and 5");
    } else {
      value.rating = ratingRaw;
    }
  }

  if (body.comment !== undefined) {
    value.comment = sanitizeString(body.comment);
  }

  return { errors, value };
}

function validateUserReviewsParams(params) {
  const errors = [];
  const userId = sanitizeString(params.userId);

  if (!userId) {
    errors.push("userId is required");
  } else if (!mongoose.Types.ObjectId.isValid(userId)) {
    errors.push("userId is invalid");
  }

  return {
    errors,
    value: { userId }
  };
}

module.exports = {
  validateCreateReviewInput,
  validateUpdateReviewInput,
  validateUserReviewsParams
};