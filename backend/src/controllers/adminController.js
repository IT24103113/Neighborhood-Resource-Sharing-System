const AppError = require("../utils/appError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const User = require("../models/User");
const mongoose = require("mongoose");
const Item = require("../models/Item");
const BorrowRequest = require("../models/BorrowRequest");
const Review = require("../models/Review");
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const Conversation = require("../models/Conversation");
const { validateEmail, sanitizeString } = require("../validation/common");

function validateAdminCreateUserInput(body) {
  const errors = [];
  const name = sanitizeString(body?.name);
  const email = validateEmail(body?.email);
  const password = typeof body?.password === "string" ? body.password : "";
  const phone = sanitizeString(body?.phone);
  const address = sanitizeString(body?.address);

  if (!name) errors.push("Name is required");
  if (!email) errors.push("Valid email is required");
  if (password.length < 8) errors.push("Password must be at least 8 characters");
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
      is_verified: true
    }
  };
}

async function deleteUserRelatedData(userId, session = null) {
  const options = session ? { session } : {};

  await Item.deleteMany({ owner_id: userId }, options);

  await BorrowRequest.deleteMany(
    {
      $or: [{ borrower_id: userId }, { lender_id: userId }]
    },
    options
  );

  await Review.deleteMany(
    {
      $or: [{ reviewer_id: userId }, { reviewee_id: userId }]
    },
    options
  );

  await Message.deleteMany({ sender_id: userId }, options);

  await Notification.deleteMany(
    {
      $or: [{ user_id: userId }, { actor_id: userId }]
    },
    options
  );

  await Conversation.deleteMany({ participants: userId }, options);
  await User.findByIdAndDelete(userId, options);
}

// Get all users
const getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find().select("-password_hash");
  
  return sendSuccess(res, {
    users,
    total: users.length
  });
});

// Get user by ID
const getUserById = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const user = await User.findById(userId).select("-password_hash");
  
  if (!user) {
    return next(new AppError("User not found", 404));
  }
  
  return sendSuccess(res, {
    user
  });
});

const createUser = asyncHandler(async (req, res, next) => {
  const { errors, value } = validateAdminCreateUserInput(req.body);
  if (errors.length > 0) {
    return next(new AppError(errors.join(", "), 400));
  }

  const existingUser = await User.findOne({ email: value.email }).select("_id");
  if (existingUser) {
    return next(new AppError("Email already exists", 409));
  }

  const createdUser = await User.create({
    name: value.name,
    email: value.email,
    password_hash: value.password,
    phone: value.phone,
    address: value.address,
    role: value.role,
    is_verified: value.is_verified
  });

  const safeUser = await User.findById(createdUser._id).select("-password_hash");

  return sendSuccess(
    res,
    {
      user: safeUser,
      message: "User created successfully"
    },
    { statusCode: 201 }
  );
});

// Delete user (admin only, cannot delete other admins)
const deleteUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  
  // Prevent deleting yourself
  if (userId === req.user._id.toString()) {
    return next(new AppError("Cannot delete your own account", 400));
  }
  
  const userToDelete = await User.findById(userId);
  
  if (!userToDelete) {
    return next(new AppError("User not found", 404));
  }
  
  // Prevent deleting other admin users
  if (userToDelete.role === "admin") {
    return next(new AppError("Cannot delete admin users", 403));
  }
  
  let deletedWithTransaction = false;

  try {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await deleteUserRelatedData(userId, session);
      });
      deletedWithTransaction = true;
    } finally {
      await session.endSession();
    }
  } catch (error) {
    const message = String(error?.message || "");
    const transactionsUnsupported =
      message.includes("Transaction numbers are only allowed") ||
      message.includes("replica set") ||
      message.includes("mongos");

    if (!transactionsUnsupported) {
      throw error;
    }
  }

  if (!deletedWithTransaction) {
    await deleteUserRelatedData(userId, null);
  }
  
  return sendSuccess(res, {
    message: `User ${userToDelete.name} (${userToDelete.email}) has been successfully deleted`,
    deleted_user_id: userId
  }, 200);
});

// Get admin profile
const getAdminProfile = asyncHandler(async (req, res, next) => {
  return sendSuccess(res, {
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      phone: req.user.phone,
      avatar_url: req.user.avatar_url
    }
  });
});

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  deleteUser,
  getAdminProfile
};
