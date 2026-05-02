const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    password_hash: {
      type: String,
      required: true,
      select: false
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    avatar_url: {
      type: String,
      default: ""
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
    address: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },
    rating_avg: {
      type: Number,
      default: 0
    },
    rating_count: {
      type: Number,
      default: 0
    },
    is_verified: {
      type: Boolean,
      default: false
    },
    fcm_token: {
      type: String,
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

userSchema.index({ location: "2dsphere" });

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password_hash")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
    return next();
  } catch (error) {
    return next(error);
  }
});

userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
