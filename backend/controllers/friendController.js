const Friend = require('../models/Friend');
const Notification = require('../models/Notification');
const Chat = require('../models/Chat');
const db = require('../config/database');

// @desc    Send friend request
// @route   POST /api/friends/request
// @access  Private
exports.sendFriendRequest = async (req, res) => {
  try {
    const { receiver_id, message } = req.body;

    if (!receiver_id) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID is required'
      });
    }

    if (receiver_id == req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send friend request to yourself'
      });
    }

    const requestId = await Friend.sendRequest(req.user.id, receiver_id, message);

    // Create notification
    await Notification.create({
      user_id: receiver_id,
      type: 'friend_request',
      title: 'New Friend Request',
      content: 'You received a new friend request',
      data: { sender_id: req.user.id, request_id: requestId }
    });

    res.status(201).json({
      success: true,
      message: 'Friend request sent',
      data: { id: requestId }
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Friend request already sent or you are already friends'
      });
    }
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get friend requests
// @route   GET /api/friends/requests
// @access  Private
exports.getFriendRequests = async (req, res) => {
  try {
    const { type } = req.query;
    const requests = await Friend.getRequests(req.user.id, type || 'received');

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Accept friend request
// @route   PUT /api/friends/requests/:id/accept
// @access  Private
exports.acceptFriendRequest = async (req, res) => {
  try {
    const request = await Friend.acceptRequest(req.params.id);

    // Create notification for sender
    await Notification.create({
      user_id: request.sender_id,
      type: 'friend_request',
      title: 'Friend Request Accepted',
      content: 'Your friend request was accepted',
      data: { receiver_id: request.receiver_id }
    });

    // Automatically create a chat between the two users
    await Chat.getOrCreateChat(request.sender_id, request.receiver_id);

    res.status(200).json({
      success: true,
      message: 'Friend request accepted and chat created'
    });
  } catch (error) {
    console.error(error);
    
    // Handle duplicate friendship error
    if (error.code === '23505') {
      // Friendship already exists, just create the chat
      try {
        const [request] = await db.query(`SELECT * FROM friend_requests WHERE id = $1`, [req.params.id]);
        if (request.length > 0) {
          await Chat.getOrCreateChat(request[0].sender_id, request[0].receiver_id);
        }
        return res.status(200).json({
          success: true,
          message: 'Already friends, chat created'
        });
      } catch (chatError) {
        console.error(chatError);
        return res.status(500).json({
          success: false,
          message: 'Server error'
        });
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Decline friend request
// @route   PUT /api/friends/requests/:id/decline
// @access  Private
exports.declineFriendRequest = async (req, res) => {
  try {
    await Friend.declineRequest(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Friend request declined'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Cancel friend request
// @route   DELETE /api/friends/requests/:id
// @access  Private
exports.cancelFriendRequest = async (req, res) => {
  try {
    await Friend.cancelRequest(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Friend request cancelled'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get friends
// @route   GET /api/friends
// @access  Private
exports.getFriends = async (req, res) => {
  try {
    const friends = await Friend.getFriends(req.user.id);

    res.status(200).json({
      success: true,
      count: friends.length,
      data: friends
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Remove friend
// @route   DELETE /api/friends/:id
// @access  Private
exports.removeFriend = async (req, res) => {
  try {
    await Friend.removeFriend(req.user.id, req.params.id);

    res.status(200).json({
      success: true,
      message: 'Friend removed successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
