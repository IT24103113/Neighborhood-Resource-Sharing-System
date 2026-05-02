const express = require("express");
const { protect } = require("../middleware/auth");
const {
  listMyNotifications,
  markNotificationRead,
  markAllNotificationsRead
} = require("../controllers/notificationController");

const router = express.Router();

router.use(protect);

router.get("/", listMyNotifications);
router.patch("/:notificationId/read", markNotificationRead);
router.patch("/read-all", markAllNotificationsRead);

module.exports = router;