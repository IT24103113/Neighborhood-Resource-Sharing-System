const jwt = require("jsonwebtoken");
const AppError = require("../utils/appError");
const User = require("../models/User");

function getTokenFromRequest(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return "";
  }

  return token;
}

async function protect(req, res, next) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return next(new AppError("You are not logged in", 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.sub).select("+password_hash");

    if (!user) {
      return next(new AppError("The user belonging to this token no longer exists", 401));
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

function authorizeRoles(...allowedRoles) {
  return function authorizeRoleMiddleware(req, res, next) {
    if (!req.user) {
      return next(new AppError("You are not logged in", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to perform this action", 403));
    }

    return next();
  };
}

module.exports = {
  protect,
  authorizeRoles
};
