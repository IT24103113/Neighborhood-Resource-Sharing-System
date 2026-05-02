const jwt = require("jsonwebtoken");
const AppError = require("../utils/appError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const User = require("../models/User");
const {
  validateRegisterInput,
  validateLoginInput,
  validateProfileUpdateInput
} = require("../validation/authValidation");

function createToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d"
    }
  );
}

function buildUserResponse(user) {
  const plainUser = user.toObject ? user.toObject() : { ...user };
  delete plainUser.password_hash;
  return plainUser;
}

const register = asyncHandler(async (req, res, next) => {
  const { errors, value } = validateRegisterInput(req.body);
  if (errors.length > 0) {
    return next(new AppError(errors.join(", "), 400));
  }

  const existingUser = await User.findOne({ email: value.email });
  if (existingUser) {
    return next(new AppError("Email already exists", 409));
  }

  const user = await User.create({
    name: value.name,
    email: value.email,
    password_hash: value.password,
    phone: value.phone,
    address: value.address,
    role: value.role,
    location: value.location,
    avatar_url: value.avatar_url,
    fcm_token: value.fcm_token
  });

  const token = createToken(user);

  return sendSuccess(res, {
    token,
    user: buildUserResponse(user)
  }, { statusCode: 201 });
});

const login = asyncHandler(async (req, res, next) => {
  const { errors, value } = validateLoginInput(req.body);
  if (errors.length > 0) {
    return next(new AppError(errors.join(", "), 400));
  }

  const user = await User.findOne({ email: value.email }).select("+password_hash");
  if (!user) {
    return next(new AppError("Invalid email or password", 401));
  }

  const isPasswordValid = await user.comparePassword(value.password);
  if (!isPasswordValid) {
    return next(new AppError("Invalid email or password", 401));
  }

  const token = createToken(user);

  return sendSuccess(res, {
    token,
    user: buildUserResponse(user)
  });
});

const getMe = asyncHandler(async (req, res) => {
  return sendSuccess(res, {
    user: buildUserResponse(req.user)
  });
});

const logout = asyncHandler(async (req, res) => {
  // Clear push token so this device stops receiving notifications after logout.
  if (req.user.fcm_token) {
    req.user.fcm_token = "";
    await req.user.save();
  }

  return sendSuccess(res, {
    message: "Logged out successfully"
  });
});

const updateProfile = asyncHandler(async (req, res, next) => {
  const { errors, value } = validateProfileUpdateInput(req.body);
  if (errors.length > 0) {
    return next(new AppError(errors.join(", "), 400));
  }

  const user = req.user;

  Object.entries(value).forEach(([key, updateValue]) => {
    if (updateValue !== undefined) {
      user[key] = updateValue;
    }
  });

  const savedUser = await user.save();

  return sendSuccess(res, {
    user: buildUserResponse(savedUser)
  });
});

module.exports = {
  register,
  login,
  getMe,
  logout,
  updateProfile
};
