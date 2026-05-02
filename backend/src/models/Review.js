const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    borrow_request_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BorrowRequest",
      required: true,
      index: true
    },
    reviewer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    reviewee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 600,
      default: ""
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

reviewSchema.index({ reviewer_id: 1, borrow_request_id: 1 }, { unique: true });
reviewSchema.index({ reviewee_id: 1, created_at: -1 });

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;