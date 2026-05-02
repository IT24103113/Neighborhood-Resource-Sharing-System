const AppError = require("../utils/appError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { createNotification } = require("../services/notificationService");
const { isParticipant, findConversationForParticipants } = require("../services/messageService");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const {
  validateStartConversationInput,
  validateSendMessageInput,
  validateConversationIdParam
} = require("../validation/messageValidation");

const startConversation = asyncHandler(async (req, res, next) => {
  const { errors, value } = validateStartConversationInput(req.body);
  if (errors.length > 0) {
    return next(new AppError(errors.join(", "), 400));
  }

  if (value.participant_id === req.user._id.toString()) {
    return next(new AppError("You cannot start a conversation with yourself", 400));
  }

  const participant = await User.findById(value.participant_id).select("_id");
  if (!participant) {
    return next(new AppError("Participant not found", 404));
  }

  let conversation = await findConversationForParticipants(Conversation, req.user._id, value.participant_id);
  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user._id, value.participant_id]
    });
  }

  const populated = await Conversation.findById(conversation._id).populate("participants", "name email role");
  return sendSuccess(
    res,
    {
      conversation: populated
    },
    { statusCode: 201 }
  );
});

const listMyConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id })
    .sort({ last_message_at: -1, updated_at: -1 })
    .populate("participants", "name email role");

  const unreadCounts = await Promise.all(
    conversations.map((conversation) =>
      Message.countDocuments({
        conversation_id: conversation._id,
        sender_id: { $ne: req.user._id },
        read_by: { $ne: req.user._id }
      })
    )
  );

  const conversationPayload = conversations.map((conversation, index) => {
    const plain = conversation.toObject ? conversation.toObject() : { ...conversation };
    plain.unread_count = unreadCounts[index] || 0;
    return plain;
  });

  return sendSuccess(res, {
    conversations: conversationPayload
  });
});

const listMessages = asyncHandler(async (req, res, next) => {
  const { errors, value } = validateConversationIdParam(req.params);
  if (errors.length > 0) {
    return next(new AppError(errors.join(", "), 400));
  }

  const conversation = await Conversation.findById(value.conversationId);
  if (!conversation) {
    return next(new AppError("Conversation not found", 404));
  }

  if (!isParticipant(conversation, req.user._id)) {
    return next(new AppError("You do not have permission to access this conversation", 403));
  }

  const messages = await Message.find({ conversation_id: conversation._id })
    .sort({ created_at: 1 })
    .populate("sender_id", "name email role");

  return sendSuccess(res, {
    messages
  });
});

const sendMessage = asyncHandler(async (req, res, next) => {
  const { errors: paramErrors, value: paramValue } = validateConversationIdParam(req.params);
  if (paramErrors.length > 0) {
    return next(new AppError(paramErrors.join(", "), 400));
  }

  const { errors: bodyErrors, value: bodyValue } = validateSendMessageInput(req.body);
  if (bodyErrors.length > 0) {
    return next(new AppError(bodyErrors.join(", "), 400));
  }

  const conversation = await Conversation.findById(paramValue.conversationId);
  if (!conversation) {
    return next(new AppError("Conversation not found", 404));
  }

  if (!isParticipant(conversation, req.user._id)) {
    return next(new AppError("You do not have permission to send messages in this conversation", 403));
  }

  const message = await Message.create({
    conversation_id: conversation._id,
    sender_id: req.user._id,
    text: bodyValue.text,
    read_by: [req.user._id]
  });

  conversation.last_message_text = bodyValue.text;
  conversation.last_message_at = new Date();
  await conversation.save();

  const recipientIds = conversation.participants.filter(
    (participant) => participant.toString() !== req.user._id.toString()
  );

  await Promise.all(
    recipientIds.map((recipientId) =>
      createNotification({
        userId: recipientId,
        type: "message_received",
        title: "New message",
        body: `${req.user.name} sent you a message.`,
        data: {
          conversation_id: conversation._id.toString(),
          sender_id: req.user._id.toString()
        },
        io: req.app.get("io")
      })
    )
  );

  const populated = await Message.findById(message._id).populate("sender_id", "name email role");

  const io = req.app.get("io");
  if (io) {
    io.to(`conversation:${conversation._id.toString()}`).emit("message:new", {
      conversation_id: conversation._id.toString(),
      message: populated
    });
  }

  return sendSuccess(
    res,
    {
      message: populated
    },
    { statusCode: 201 }
  );
});

const markConversationAsRead = asyncHandler(async (req, res, next) => {
  const { errors, value } = validateConversationIdParam(req.params);
  if (errors.length > 0) {
    return next(new AppError(errors.join(", "), 400));
  }

  const conversation = await Conversation.findById(value.conversationId);
  if (!conversation) {
    return next(new AppError("Conversation not found", 404));
  }

  if (!isParticipant(conversation, req.user._id)) {
    return next(new AppError("You do not have permission to access this conversation", 403));
  }

  await Message.updateMany(
    {
      conversation_id: conversation._id,
      read_by: { $ne: req.user._id }
    },
    {
      $addToSet: {
        read_by: req.user._id
      }
    }
  );

  return sendSuccess(res, {
    message: "Conversation marked as read"
  });
});

module.exports = {
  startConversation,
  listMyConversations,
  listMessages,
  sendMessage,
  markConversationAsRead
};