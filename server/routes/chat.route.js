const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat.controller.js");
const messageController = require("../controllers/message.controller.js");
const { protect } = require("../middlewares/auth.middleware.js");
const { uploadChatAttachment, handleMulterError } = require("../middlewares/upload.middleware.js");
const { chatUploadLimiter } = require("../middlewares/security.js");

router.use(protect);

// ============== CHAT ROUTES ==============

// Get all chats for current user.
router.get("/", chatController.getUserChats);

// Create or get existing chat between users (only with candidates)
router.post("/create", chatController.createOrGetChat);

// Get all chats for current user (only chats with candidates)
router.get("/user/:userId", chatController.getUserChats);

// Get all available candidates for chatting
router.get("/candidates/available", chatController.getAvailableCandidates);

// Get specific chat by ID
router.get("/:chatId", chatController.getChatById);

// Delete a chat
router.delete("/:chatId", chatController.deleteChat);

// Mark all messages in chat as read
router.patch("/:chatId/read", chatController.markChatAsRead);

// ============== MESSAGE ROUTES ==============

// Send text message over REST.
router.post("/:chatId/message", messageController.sendChatMessage);

// Upload file and create attachment message.
router.post(
  "/:chatId/attachment",
  chatUploadLimiter,
  uploadChatAttachment.single("file"),
  handleMulterError,
  messageController.sendChatAttachment
);

// Participant-only secure attachment download.
router.get("/download/:messageId", messageController.downloadAttachment);

// Get all messages for a specific chat (with pagination)
router.get("/:chatId/messages", messageController.getChatMessages);

// Mark message as read
router.patch("/message/:messageId/read", messageController.markAsRead);

// Edit a message
router.patch("/message/:messageId/edit", messageController.editMessage);

// Delete a message
router.delete("/message/:messageId", messageController.deleteMessage);

module.exports = router;
