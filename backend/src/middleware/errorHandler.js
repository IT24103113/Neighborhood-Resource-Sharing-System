function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const response = {
    status: err.status || "error",
    message: err.message || "Internal server error"
  };

  if (err.name === "ValidationError") {
    response.status = "fail";
    response.message = Object.values(err.errors)
      .map((error) => error.message)
      .join(", ");
  }

  if (err.code === 11000) {
    response.status = "fail";
    const field = Object.keys(err.keyValue || {})[0];
    response.message = field ? `${field} already exists` : "Duplicate key error";
  }

  if (err.name === "JsonWebTokenError") {
    response.status = "fail";
    response.message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    response.status = "fail";
    response.message = "Token expired";
  }

  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
