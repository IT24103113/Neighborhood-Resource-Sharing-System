const AppError = require("../utils/appError");

function priorityWeight(priority) {
  const rank = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1
  };

  return rank[priority] || rank.medium;
}

function canViewRequest(request, user) {
  if (!request || !user) return false;
  if (user.role === "admin") return true;
  const userId = user._id.toString();
  return request.borrower_id._id.toString() === userId || request.lender_id._id.toString() === userId;
}

function ensureStatusTransition(request, nextStatus, user) {
  const isAdmin = user.role === "admin";
  const isBorrower = request.borrower_id._id.toString() === user._id.toString();
  const isLender = request.lender_id._id.toString() === user._id.toString();

  if (request.status === "pending") {
    if (["approved", "rejected"].includes(nextStatus) && (isLender || isAdmin)) return;
    if (nextStatus === "canceled" && (isBorrower || isAdmin)) return;
    throw new AppError("You do not have permission to perform this transition", 403);
  }

  if (request.status === "approved") {
    if (nextStatus === "returned" && isLender) return;
    if (nextStatus === "canceled" && (isBorrower || isLender || isAdmin)) return;
    if (nextStatus === "returned") {
      throw new AppError("Only lender can mark item as returned", 403);
    }
    throw new AppError("Only returned or canceled status is allowed after approval", 400);
  }

  throw new AppError("This request can no longer be updated", 400);
}

module.exports = {
  priorityWeight,
  canViewRequest,
  ensureStatusTransition
};