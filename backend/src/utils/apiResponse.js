function sendSuccess(res, payload = {}, options = {}) {
  const statusCode = options.statusCode || 200;
  return res.status(statusCode).json({
    status: "success",
    ...payload
  });
}

function sendFail(res, message, options = {}) {
  const statusCode = options.statusCode || 400;
  return res.status(statusCode).json({
    status: "fail",
    message
  });
}

module.exports = {
  sendSuccess,
  sendFail
};