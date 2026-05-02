const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1200
    },
    category: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },
    condition: {
      type: String,
      enum: ["new", "like_new", "good", "fair", "poor"],
      default: "good"
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: {
        type: String,
        default: "Point"
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    },
    image_urls: {
      type: [String],
      default: []
    },
    is_available: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

itemSchema.index({ location: "2dsphere" });
itemSchema.index({ created_at: -1 });

const Item = mongoose.model("Item", itemSchema);

module.exports = Item;