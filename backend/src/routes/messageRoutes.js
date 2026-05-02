const express = require("express");
const { protect } = require("../middleware/auth");
const {
  startConversation,
  listMyConversations,
  listMessages,
  sendMessage,
  markConversationAsRead
} = require("../controllers/messageController");

const router = express.Router();

router.use(protect);

router.post("/conversations", startConversation);
router.get("/conversations", listMyConversations);
router.get("/conversations/:conversationId/messages", listMessages);
router.post("/conversations/:conversationId/messages", sendMessage);
router.patch("/conversations/:conversationId/read", markConversationAsRead);

module.exports = router;