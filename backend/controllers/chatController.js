const Chat = require('../models/Chat');
const Message = require('../models/Message');

// @desc    Get user chats
// @route   GET /api/chats
// @access  Private
exports.getChats = async (req, res) => {
  try {
    const chats = await Chat.getUserChats(req.user.id);

    res.status(200).json({
      success: true,
      count: chats.length,
      data: chats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create chat with user
// @route   POST /api/chats
// @access  Private
exports.createChat = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (user_id == req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create chat with yourself'
      });
    }

    const chat = await Chat.getOrCreateChat(req.user.id, user_id);

    res.status(201).json({
      success: true,
      message: 'Chat created successfully',
      data: chat
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Archive chat
// @route   PUT /api/chats/:id/archive
// @access  Private
exports.archiveChat = async (req, res) => {
  try {
    await Chat.archiveChat(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Chat archived successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Unarchive chat
// @route   PUT /api/chats/:id/unarchive
// @access  Private
exports.unarchiveChat = async (req, res) => {
  try {
    await Chat.unarchiveChat(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Chat unarchived successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Mute chat
// @route   PUT /api/chats/:id/mute
// @access  Private
exports.muteChat = async (req, res) => {
  try {
    await Chat.muteChat(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Chat muted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Unmute chat
// @route   PUT /api/chats/:id/unmute
// @access  Private
exports.unmuteChat = async (req, res) => {
  try {
    await Chat.unmuteChat(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Chat unmuted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Pin chat
// @route   PUT /api/chats/:id/pin
// @access  Private
exports.pinChat = async (req, res) => {
  try {
    await Chat.pinChat(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Chat pinned successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Unpin chat
// @route   PUT /api/chats/:id/unpin
// @access  Private
exports.unpinChat = async (req, res) => {
  try {
    await Chat.unpinChat(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Chat unpinned successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Mute chat
// @route   PUT /api/chats/:id/mute
// @access  Private
exports.muteChat = async (req, res) => {
  try {
    await Chat.muteChat(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Chat muted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Unmute chat
// @route   PUT /api/chats/:id/unmute
// @access  Private
exports.unmuteChat = async (req, res) => {
  try {
    await Chat.unmuteChat(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Chat unmuted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete chat
// @route   DELETE /api/chats/:id
// @access  Private
exports.deleteChat = async (req, res) => {
  try {
    await Chat.deleteChat(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Chat deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
