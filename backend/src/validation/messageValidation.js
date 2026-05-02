const mongoose = require("mongoose");
const { sanitizeString } = require("./common");

function validateStartConversationInput(body) {
  const errors = [];
  const participant_id = sanitizeString(body.participant_id);

  if (!participant_id) {
    errors.push("participant_id is required");
  } else if (!mongoose.Types.ObjectId.isValid(participant_id)) {
    errors.push("participant_id is invalid");
  }

  return {
    errors,
    value: {
      participant_id
    }
  };
}

function validateSendMessageInput(body) {
  const errors = [];
  const text = sanitizeString(body.text);

  if (!text) {
    errors.push("text is required");
  }

  return {
    errors,
    value: { text }
  };
}

function validateConversationIdParam(params) {
  const errors = [];
  const conversationId = sanitizeString(params.conversationId);

  if (!conversationId) {
    errors.push("conversationId is required");
  } else if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    errors.push("conversationId is invalid");
  }

  return {
    errors,
    value: { conversationId }
  };
}

module.exports = {
  validateStartConversationInput,
  validateSendMessageInput,
  validateConversationIdParam
};