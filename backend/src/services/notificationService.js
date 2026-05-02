const Notification = require("../models/Notification");

async function createNotification({ userId, type, title, body, data = {}, io = null }) {
  if (!userId || !type || !title || !body) {
    return null;
  }

  const notification = await Notification.create({
    user_id: userId,
    type,
    title,
    body,
    data
  });

  if (io) {
    io.to(`user:${userId}`).emit("notification:new", {
      notification
    });
  }

  return notification;
}

module.exports = {
  createNotification
};