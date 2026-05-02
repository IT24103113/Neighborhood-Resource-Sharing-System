const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const Conversation = require("./models/Conversation");

function extractToken(socket) {
  const authToken = socket.handshake?.auth?.token;
  if (typeof authToken === "string" && authToken.trim().length > 0) {
    return authToken.trim();
  }

  const header = socket.handshake?.headers?.authorization;
  if (typeof header === "string" && header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }

  return "";
}

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.use((socket, next) => {
    try {
      const token = extractToken(socket);
      if (!token) {
        return next(new Error("Socket auth token is required"));
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = {
        id: payload.sub,
        role: payload.role
      };

      return next();
    } catch (error) {
      return next(new Error("Invalid socket token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user?.id;
    if (!userId) {
      socket.disconnect();
      return;
    }

    socket.join(`user:${userId}`);

    socket.on("conversation:join", async ({ conversationId } = {}) => {
      if (!conversationId) return;

      const conversation = await Conversation.findById(conversationId).select("participants");
      if (!conversation) return;

      const isParticipant = conversation.participants.some(
        (participant) => participant.toString() === userId.toString()
      );

      if (!isParticipant) return;
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("conversation:leave", ({ conversationId } = {}) => {
      if (!conversationId) return;
      socket.leave(`conversation:${conversationId}`);
    });
  });

  return io;
}

module.exports = {
  initSocket
};
