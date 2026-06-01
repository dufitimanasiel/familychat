const Message = require('../models/Message');
const Chat = require('../models/Chat');
const Notification = require('../models/Notification');
const db = require('../config/database');

// @desc    Send message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { receiver_id, group_id, content, message_type, file_url, file_name, file_size, reply_to } = req.body;
    const normalizedContent = typeof content === 'string' ? content.trim() : content;

    if (!receiver_id && !group_id) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID or Group ID is required'
      });
    }

    // Check if users are friends (for private messages)
    if (receiver_id) {
      const [friendship] = await db.query(
        `SELECT status FROM friends 
         WHERE ((user1_id = $1 AND user2_id = $2) OR (user1_id = $3 AND user2_id = $4)) 
         AND status = 'accepted'`,
        [req.user.id, receiver_id, receiver_id, req.user.id]
      );
      
      if (friendship.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You can only send messages to users who are your friends'
        });
      }
    }

    // Allow file-only messages or text-only messages
    const hasFile = Boolean(file_url || req.file);
    const hasContent = Boolean(normalizedContent);
    if (!hasContent && !hasFile) {
      return res.status(400).json({
        success: false,
        message: 'Content or file is required'
      });
    }

    // Handle file upload
    let fileUrl = file_url;
    let fileName = file_name;
    let fileSize = file_size;
    
    if (req.file) {
      fileUrl = `/uploads/messages/${req.file.filename}`;
      fileName = req.file.originalname;
      fileSize = req.file.size;
    }

    // Create message
    const messageId = await Message.create({
      sender_id: req.user.id,
      receiver_id,
      group_id,
      content: normalizedContent || '',
      message_type: message_type || 'text',
      file_url: fileUrl,
      file_name: fileName,
      file_size: fileSize,
      reply_to,
      delivery_status: 'sent'
    });

    // Get or create chat
    if (receiver_id) {
      const chat = await Chat.getOrCreateChat(req.user.id, receiver_id);
      await Chat.updateLastMessage(chat.id, messageId);

      // Create notification
      await Notification.create({
        user_id: receiver_id,
        type: 'message',
        title: 'New Message',
        content: content?.substring(0, 50) || 'Sent you a file',
        data: { sender_id: req.user.id, message_id: messageId }
      });
    }

    // Get message details
    const message = await Message.findById(messageId);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get conversation
// @route   GET /api/messages/conversation/:userId
// @access  Private
exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const messages = await Message.getConversation(req.user.id, userId, limit, offset);

    // Mark messages as seen
    await Message.markAsSeen(userId, req.user.id);

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get group messages
// @route   GET /api/messages/group/:groupId
// @access  Private
exports.getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const messages = await Message.getGroupMessages(groupId, limit, offset);

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update message
// @route   PUT /api/messages/:id
// @access  Private
exports.updateMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message || message === null) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.sender_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this message'
      });
    }

    const { content } = req.body;

    await Message.update(req.params.id, { content });

    const updatedMessage = await Message.findById(req.params.id);

    res.status(200).json({
      success: true,
      data: updatedMessage
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message || message === null) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const canDeleteMessage =
      message.sender_id === req.user.id ||
      message.receiver_id === req.user.id ||
      req.user.role === 'admin';

    if (!canDeleteMessage) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }

    await Message.delete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get unread count
// @route   GET /api/messages/unread
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Message.getUnreadCount(req.user.id);

    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
