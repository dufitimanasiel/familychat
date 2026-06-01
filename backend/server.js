const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config({ path: path.join(__dirname, "./.env") });

const db = require("./config/database");
const errorHandler = require("./middleware/errorHandler");

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const messageRoutes = require("./routes/messages");
const chatRoutes = require("./routes/chats");
const postRoutes = require("./routes/posts");
const groupRoutes = require("./routes/groups");
const friendRoutes = require("./routes/friends");
const notificationRoutes = require("./routes/notifications");
const adminRoutes = require("./routes/admin");
const storyRoutes = require("./routes/stories");

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Store online users
const onlineUsers = new Map();

// Middleware
// Allow media files served from this API host to be embedded by the frontend origin.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
    ],
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Rate limiting (more lenient for development)
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 1000,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/stories", storyRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "FaceChat API is running" });
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // User joins with their ID
  socket.on("user:join", async (userId) => {
    try {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;

      // Update online status in database
      await db.query(
        `UPDATE users SET online_status = 'online', last_seen = NOW() WHERE id = $1`,
        [userId],
      );

      // Notify others
      socket.broadcast.emit("user:online", { userId });
    } catch (error) {
      console.error("Error in user:join:", error);
    }
  });

  // Join a chat room
  socket.on("chat:join", (chatId) => {
    socket.join(`chat:${chatId}`);
  });

  // Leave a chat room
  socket.on("chat:leave", (chatId) => {
    socket.leave(`chat:${chatId}`);
  });

  // Join a group room
  socket.on("group:join", (groupId) => {
    socket.join(`group:${groupId}`);
  });

  // Leave a group room
  socket.on("group:leave", (groupId) => {
    socket.leave(`group:${groupId}`);
  });

  // Typing indicators
  socket.on("typing:start", (data) => {
    const { userId } = data;
    const recipientSocketId = onlineUsers.get(userId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("typing:start", { userId: socket.userId });
    }
  });

  socket.on("typing:stop", (data) => {
    const { userId } = data;
    const recipientSocketId = onlineUsers.get(userId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("typing:stop", { userId: socket.userId });
    }
  });

  // Send message
  socket.on("message:send", async (data) => {
    const {
      sender_id,
      receiver_id,
      group_id,
      content,
      message_type,
      file_url,
    } = data;

    try {
      const [result] = await db.query(
        `INSERT INTO messages (sender_id, receiver_id, group_id, content, message_type, file_url)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          sender_id,
          receiver_id,
          group_id,
          content,
          message_type || "text",
          file_url,
        ],
      );

      const messageId = result[0].id;

      // Get message with user info
      const [messageRows] = await db.query(
        `SELECT m.*, u.username, u.full_name, u.profile_picture
         FROM messages m
         LEFT JOIN users u ON m.sender_id = u.id
         WHERE m.id = $1`,
        [messageId],
      );

      const message = messageRows[0];

      if (receiver_id) {
        // Private message
        const recipientSocketId = onlineUsers.get(receiver_id);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("message:receive", message);
        }
        io.to(socket.id).emit("message:sent", message);
      } else if (group_id) {
        // Group message
        io.to(`group:${group_id}`).emit("message:receive", message);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });

  // Typing indicator
  socket.on("typing:start", (data) => {
    const { receiver_id, group_id } = data;
    if (receiver_id) {
      const recipientSocketId = onlineUsers.get(receiver_id);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("typing:start", {
          user_id: socket.userId,
        });
      }
    } else if (group_id) {
      socket
        .to(`group:${group_id}`)
        .emit("typing:start", { user_id: socket.userId });
    }
  });

  socket.on("typing:stop", (data) => {
    const { receiver_id, group_id } = data;
    if (receiver_id) {
      const recipientSocketId = onlineUsers.get(receiver_id);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("typing:stop", {
          user_id: socket.userId,
        });
      }
    } else if (group_id) {
      socket
        .to(`group:${group_id}`)
        .emit("typing:stop", { user_id: socket.userId });
    }
  });

  // Mark messages as seen
  socket.on("messages:seen", async (data) => {
    const { sender_id } = data;
    try {
      await db.query(
        `UPDATE messages SET delivery_status = 'seen'
         WHERE sender_id = $1 AND receiver_id = $2 AND delivery_status != 'seen'`,
        [sender_id, socket.userId],
      );

      const senderSocketId = onlineUsers.get(sender_id);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messages:seen", { userId: socket.userId });
      }
    } catch (error) {
      console.error("Error marking messages as seen:", error);
    }
  });

  // User disconnects
  socket.on("disconnect", async () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);

      // Update user offline status in database
      await db.query(
        `UPDATE users SET online_status = 'offline', last_seen = NOW() WHERE id = $1`,
        [socket.userId],
      );

      // Broadcast user offline status to friends
      socket.broadcast.emit("user:offline", { userId: socket.userId });

      console.log(`User ${socket.userId} disconnected`);
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = { app, server, io };
