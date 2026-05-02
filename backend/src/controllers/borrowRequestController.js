const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { createNotification } = require("../services/notificationService");
const {
  priorityWeight,
  canViewRequest,
  ensureStatusTransition
} = require("../services/borrowRequestService");
const Item = require("../models/Item");
const BorrowRequest = require("../models/BorrowRequest");
const {
  validateCreateBorrowRequestInput,
  validateListBorrowRequestsQuery,
  validateUpdateBorrowRequestStatusInput,
  validateUpdateBorrowRequestPriorityInput
} = require("../validation/borrowRequestValidation");

function populateBorrowRequestQuery(query) {
  return query
    .populate("item_id", "title category condition is_available address owner_id")
    .populate("borrower_id", "name email")
    .populate("lender_id", "name email");
}

const createBorrowRequest = asyncHandler(async (req, res, next) => {
  const { errors, value } = validateCreateBorrowRequestInput(req.body);
  if (errors.length > 0) {
    return next(new AppError(errors.join(", "), 400));
  }

  const item = await Item.findById(value.item_id);
  if (!item) {
    return next(new AppError("Item not found", 404));
  }

  if (!item.is_available) {
    return next(new AppError("Item is currently unavailable", 400));
  }

  if (item.owner_id.toString() === req.user._id.toString()) {
    return next(new AppError("You cannot request your own item", 400));
  }

  const existingPending = await BorrowRequest.findOne({
    item_id: item._id,
    borrower_id: req.user._id,
    status: { $in: ["pending", "approved"] }
  });

  if (existingPending) {
    return next(new AppError("You already have an active request for this item", 409));
  }

  const now = new Date();
  if (value.requested_start_date && value.requested_start_date < now) {
    return next(new AppError("Requested start date cannot be in the past", 400));
  }

  const request = await BorrowRequest.create({
    item_id: item._id,
    borrower_id: req.user._id,
    lender_id: item.owner_id,
    note: value.note,
    requested_start_date: value.requested_start_date,
    requested_end_date: value.requested_end_date
  });

  await createNotification({
    userId: item.owner_id,
    type: "borrow_request_created",
    title: "New borrow request",
    body: `${req.user.name} requested to borrow ${item.title}.`,
    data: {
      borrow_request_id: request._id.toString(),
      item_id: item._id.toString()
    },
    io: req.app.get("io")
  });

  const populated = await populateBorrowRequestQuery(BorrowRequest.findById(request._id));

  return sendSuccess(
    res,
    {
      request: populated
    },
    { statusCode: 201 }
  );
});

const listMyBorrowRequests = asyncHandler(async (req, res, next) => {
  const { errors, value } = validateListBorrowRequestsQuery(req.query);
  if (errors.length > 0) {
    return next(new AppError(errors.join(", "), 400));
  }

  const filter = {};
  if (value.type === "sent") filter.borrower_id = req.user._id;
  if (value.type === "received") filter.lender_id = req.user._id;
  if (value.type === "all") {
    filter.$or = [{ borrower_id: req.user._id }, { lender_id: req.user._id }];
  }
  if (value.status) filter.status = value.status;
  if (value.priority) filter.priority = value.priority;

  let requests = await populateBorrowRequestQuery(
    BorrowRequest.find(filter).sort({ created_at: -1 })
  );

  // Orphan requests can exist from legacy item deletions; hide them from normal lists.
  requests = requests.filter((request) => Boolean(request.item_id));

  if (value.sort === "priority") {
    requests = requests.sort((a, b) => {
      const priorityDiff = priorityWeight(b.priority) - priorityWeight(a.priority);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  return sendSuccess(res, {
    requests
  });
});

const getBorrowRequestById = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.requestId)) {
    return next(new AppError("Borrow request not found", 404));
  }

  const request = await populateBorrowRequestQuery(BorrowRequest.findById(req.params.requestId));
  if (!request) {
    return next(new AppError("Borrow request not found", 404));
  }

  if (!request.item_id) {
    return next(new AppError("Borrow request item no longer exists", 404));
  }

  if (!canViewRequest(request, req.user)) {
    return next(new AppError("You do not have permission to view this request", 403));
  }

  return sendSuccess(res, {
    request
  });
});

const updateBorrowRequestStatus = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.requestId)) {
    return next(new AppError("Borrow request not found", 404));
  }

  const { errors, value } = validateUpdateBorrowRequestStatusInput(req.body);
  if (errors.length > 0) {
    return next(new AppError(errors.join(", "), 400));
  }

  const request = await populateBorrowRequestQuery(BorrowRequest.findById(req.params.requestId));
  if (!request) {
    return next(new AppError("Borrow request not found", 404));
  }

  // BUSINESS RULE: If approving, check if item is still available
  if (value.status === "approved") {
    const item = await Item.findOne({ _id: request.item_id?._id, is_available: true });
    if (!item) {
      return next(new AppError("Item is no longer available or has been deleted", 400));
    }
  }

  ensureStatusTransition(request, value.status, req.user);

  request.status = value.status;
  await request.save();

  const itemTitle = request.item_id?.title || "your item";

  if (value.status === "approved") {
    // 1. Mark item as unavailable
    await Item.findByIdAndUpdate(request.item_id._id, { is_available: false });

    // 2. AUTO-REJECT: Automatically reject all other pending requests for this item
    const otherPendingRequests = await BorrowRequest.find({
      item_id: request.item_id._id,
      _id: { $ne: request._id },
      status: "pending"
    });

    if (otherPendingRequests.length > 0) {
      await BorrowRequest.updateMany(
        { _id: { $in: otherPendingRequests.map((r) => r._id) } },
        { $set: { status: "rejected" } }
      );

      // 3. Notify other borrowers about auto-rejection
      await Promise.all(
        otherPendingRequests.map((otherReq) =>
          createNotification({
            userId: otherReq.borrower_id,
            type: "borrow_request_rejected",
            title: "Request automatically rejected",
            body: `Your request for ${itemTitle} was rejected because it was approved for another user.`,
            data: {
              borrow_request_id: otherReq._id.toString(),
              item_id: request.item_id._id.toString()
            },
            io: req.app.get("io")
          })
        )
      );
    }

    // 4. Notify the approved borrower
    await createNotification({
      userId: request.borrower_id._id,
      type: "borrow_request_approved",
      title: "Borrow request approved",
      body: `Your request for ${itemTitle} was approved.`,
      data: {
        borrow_request_id: request._id.toString(),
        item_id: request.item_id._id.toString()
      },
      io: req.app.get("io")
    });
  }

  if (value.status === "rejected") {
    await createNotification({
      userId: request.borrower_id._id,
      type: "borrow_request_rejected",
      title: "Borrow request rejected",
      body: `Your request for ${itemTitle} was rejected.`,
      data: {
        borrow_request_id: request._id.toString(),
        item_id: request.item_id._id.toString()
      },
      io: req.app.get("io")
    });
  }

  if (value.status === "returned") {
    await Item.findByIdAndUpdate(request.item_id._id, { is_available: true });
    await createNotification({
      userId: request.borrower_id._id,
      type: "borrow_request_returned",
      title: "Item marked as returned",
      body: `${request.lender_id?.name || "Lender"} marked ${itemTitle} as returned.`,
      data: {
        borrow_request_id: request._id.toString(),
        item_id: request.item_id._id.toString()
      },
      io: req.app.get("io")
    });
  }

  if (value.status === "canceled") {
    // If it was already approved, we need to free the item
    if (request.status === "approved" && request.item_id?._id) {
      await Item.findByIdAndUpdate(request.item_id._id, { is_available: true });
    }

    await createNotification({
      userId: request.lender_id._id,
      type: "borrow_request_canceled",
      title: "Borrow request canceled",
      body: `${request.borrower_id?.name || "Borrower"} canceled a request for ${itemTitle}.`,
      data: {
        borrow_request_id: request._id.toString(),
        item_id: request.item_id?._id?.toString()
      },
      io: req.app.get("io")
    });
  }

  // (Logic moved up for atomic execution)

  const updated = await populateBorrowRequestQuery(BorrowRequest.findById(request._id));

  return sendSuccess(res, {
    request: updated
  });
});

const updateBorrowRequestPriority = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.requestId)) {
    return next(new AppError("Borrow request not found", 404));
  }

  const { errors, value } = validateUpdateBorrowRequestPriorityInput(req.body);
  if (errors.length > 0) {
    return next(new AppError(errors.join(", "), 400));
  }

  const request = await BorrowRequest.findById(req.params.requestId);
  if (!request) {
    return next(new AppError("Borrow request not found", 404));
  }

  // Permission check: Only Admin or the Lender (item owner) can prioritize
  const isLender = request.lender_id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isLender && !isAdmin) {
    return next(new AppError("You do not have permission to prioritize this request", 403));
  }

  request.priority = value.priority;
  await request.save();

  await createNotification({
    userId: request.borrower_id,
    type: "borrow_request_priority_changed",
    title: "Request priority updated",
    body: `Your request priority is now ${value.priority}.`,
    data: {
      borrow_request_id: request._id.toString(),
      priority: value.priority
    },
    io: req.app.get("io")
  });

  const updated = await populateBorrowRequestQuery(BorrowRequest.findById(request._id));

  return sendSuccess(res, {
    request: updated
  });
});

module.exports = {
  createBorrowRequest,
  listMyBorrowRequests,
  getBorrowRequestById,
  updateBorrowRequestStatus,
  updateBorrowRequestPriority
};