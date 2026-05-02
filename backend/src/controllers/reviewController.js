const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { createNotification } = require("../services/notificationService");
const { refreshUserRating } = require("../services/reviewService");
const Review = require("../models/Review");
const User = require("../models/User");
const BorrowRequest = require("../models/BorrowRequest");
const {
  validateCreateReviewInput,
  validateUpdateReviewInput,
  validateUserReviewsParams
} = require("../validation/reviewValidation");

const createReview = asyncHandler(async (req, res, next) => {
  const { errors, value } = validateCreateReviewInput(req.body);
  if (errors.length > 0) {
    return next(new AppError(errors.join(", "), 400));
  }

  const request = await BorrowRequest.findById(value.borrow_request_id);
  if (!request) {
    return next(new AppError("Borrow request not found", 404));
  }

  if (request.status !== "returned") {
    return next(new AppError("Review is allowed only after item is returned", 400));
  }

  const reviewerId = req.user._id.toString();
  const borrowerId = request.borrower_id.toString();
  const lenderId = request.lender_id.toString();

  if (reviewerId !== borrowerId && reviewerId !== lenderId) {
    return next(new AppError("You can only review requests you participated in", 403));
  }

  const revieweeId = reviewerId === borrowerId ? lenderId : borrowerId;

  const existingReview = await Review.findOne({
    borrow_request_id: request._id,
    reviewer_id: req.user._id
  });

  if (existingReview) {
    return next(new AppError("You have already submitted a review for this request", 409));
  }

  const review = await Review.create({
    borrow_request_id: request._id,
    reviewer_id: req.user._id,
    reviewee_id: revieweeId,
    rating: value.rating,
    comment: value.comment
  });

  await refreshUserRating(review.reviewee_id);

  await createNotification({
    userId: review.reviewee_id,
    type: "review_received",
    title: "You received a new review",
    body: `${req.user.name} rated your interaction ${value.rating}/5.`,
    data: {
      review_id: review._id.toString(),
      borrow_request_id: request._id.toString(),
      rating: value.rating
    },
    io: req.app.get("io")
  });

  const populatedReview = await Review.findById(review._id)
    .populate("reviewer_id", "name email")
    .populate("reviewee_id", "name email");

  return sendSuccess(
    res,
    {
      review: populatedReview
    },
    { statusCode: 201 }
  );
});

const getReviewsForUser = asyncHandler(async (req, res, next) => {
  const { errors, value } = validateUserReviewsParams(req.params);
  if (errors.length > 0) {
    return next(new AppError(errors.join(", "), 400));
  }

  const reviews = await Review.find({ reviewee_id: value.userId })
    .sort({ created_at: -1 })
    .populate("reviewer_id", "name email");

  const user = await User.findById(value.userId).select("name email rating_avg rating_count");
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  return sendSuccess(res, {
    user,
    reviews
  });
});

const updateReview = asyncHandler(async (req, res, next) => {
  const reviewId = req.params.reviewId;
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return next(new AppError("Review not found", 404));
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  if (review.reviewer_id.toString() !== req.user._id.toString()) {
    return next(new AppError("You do not have permission to update this review", 403));
  }

  const { errors, value } = validateUpdateReviewInput(req.body);
  if (errors.length > 0) {
    return next(new AppError(errors.join(", "), 400));
  }

  if (value.rating !== undefined) review.rating = value.rating;
  if (value.comment !== undefined) review.comment = value.comment;

  await review.save();
  await refreshUserRating(review.reviewee_id);

  return sendSuccess(res, { review });
});

const deleteReview = asyncHandler(async (req, res, next) => {
  const reviewId = req.params.reviewId;
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return next(new AppError("Review not found", 404));
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  const isOwner = review.reviewer_id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    return next(new AppError("You do not have permission to delete this review", 403));
  }

  const revieweeId = review.reviewee_id;
  await review.deleteOne();
  await refreshUserRating(revieweeId);

  return sendSuccess(res, { message: "Review deleted successfully" });
});

module.exports = {
  createReview,
  getReviewsForUser,
  updateReview,
  deleteReview
};