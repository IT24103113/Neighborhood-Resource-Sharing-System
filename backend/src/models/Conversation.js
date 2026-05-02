const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        }
      ],
      validate: {
        validator(value) {
          const unique = new Set((value || []).map((item) => item.toString()));
          return Array.isArray(value) && value.length >= 2 && unique.size === value.length;
        },
        message: "Conversation participants must include at least two unique users"
      },
      index: true
    },
    last_message_text: {
      type: String,
      trim: true,
      default: ""
    },
    last_message_at: {
      type: Date,
      default: null,
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

conversationSchema.index({ participants: 1, last_message_at: -1 });

const Conversation = mongoose.model("Conversation", conversationSchema);

module.exports = Conversation;