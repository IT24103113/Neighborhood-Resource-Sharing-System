const mongoose = require("mongoose");

const borrowRequestSchema = new mongoose.Schema(
  {
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
      index: true
    },
    borrower_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    lender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "returned", "canceled"],
      default: "pending",
      index: true
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },
    requested_start_date: {
      type: Date,
      default: null
    },
    requested_end_date: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

borrowRequestSchema.index({ item_id: 1, borrower_id: 1, status: 1 });
borrowRequestSchema.index({ lender_id: 1, status: 1 });
borrowRequestSchema.index({ borrower_id: 1, status: 1 });

const BorrowRequest = mongoose.model("BorrowRequest", borrowRequestSchema);

module.exports = BorrowRequest;