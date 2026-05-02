const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const Notification = require("../models/Notification");
const BorrowRequest = require("../models/BorrowRequest");
const Conversation = require("../models/Conversation");
const Review = require("../models/Review");

async function isNotificationRelevant(notification, userId) {
  const type = notification.type;
  const data = notification.data || {};

  const borrowTypes = new Set([
    "borrow_request_created",
    "borrow_request_approved",
    "borrow_request_rejected",
    "borrow_request_returned",
    "borrow_request_canceled",
    "borrow_request_priority_changed"
  ]);

  if (borrowTypes.has(type)) {
    const requestId = data.borrow_request_id;
    if (!requestId || !mongoose.Types.ObjectId.isValid(requestId)) {
      return false;
    }

    const request = await BorrowRequest.findById(requestId).select("borrower_id lender_id");
    if (!request) return false;

    return (
      request.borrower_id.toString() === userId.toString() ||
      request.lender_id.toString() === userId.toString()
    );
  }

  if (type === "message_received") {
    const conversationId = data.conversation_id;
    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
      return false;
    }

    const conversation = await Conversation.findById(conversationId).select("participants");
    if (!conversation) return false;

    return conversation.participants.some((participantId) => participantId.toString() === userId.toString());
  }

  if (type === "review_received") {
    const reviewId = data.review_id;
    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
      return false;
    }

    const review = await Review.findById(reviewId).select("reviewee_id");
    if (!review) return false;

    return review.reviewee_id.toString() === userId.toString();
  }

  return true;
}

const listMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user_id: req.user._id })
    .sort({ created_at: -1 })
    .limit(200);

  const relevanceChecks = await Promise.all(
    notifications.map((notification) => isNotificationRelevant(notification, req.user._id))
  );

  const relevantNotifications = notifications.filter((_, index) => relevanceChecks[index]);
  const unreadCount = relevantNotifications.filter((notification) => !notification.is_read).length;

  return sendSuccess(res, {
    notifications: relevantNotifications,
    unread_count: unreadCount
  });
});

const markNotificationRead = asyncHandler(async (req, res, next) => {
  const notificationId = req.params.notificationId;

  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    return next(new AppError("Notification not found", 404));
  }

  const notification = await Notification.findOne({
    _id: notificationId,
    user_id: req.user._id
  });

  if (!notification) {
    return next(new AppError("Notification not found", 404));
  }

  if (!notification.is_read) {
    notification.is_read = true;
    notification.read_at = new Date();
    await notification.save();
  }

  return sendSuccess(res, {
    notification
  });
});

const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    {
      user_id: req.user._id,
      is_read: false
    },
    {
      $set: {
        is_read: true,
        read_at: new Date()
      }
    }
  );

  return sendSuccess(res, {
    message: "All notifications marked as read"
  });
});

module.exports = {
  listMyNotifications,
  markNotificationRead,
  markAllNotificationsRead
};