const User = require('../models/User');
const db = require('../config/database');

// @desc    Get all users (Admin)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const { search, role, is_active, limit } = req.query;
    
    const filters = { search, role, is_active, limit };
    const users = await User.findAll(filters);

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Private
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const [rows] = await db.query(
      `SELECT id, username, full_name, profile_picture, bio, online_status 
       FROM users 
       WHERE (username LIKE $1 OR full_name LIKE $2) 
       AND id != $3 
       AND is_active = TRUE
       LIMIT 20`,
      [`%${q}%`, `%${q}%`, req.user.id]
    );

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { username, email, password, full_name, role, is_active, is_blocked } = req.body;

    const updateData = { username, email, full_name, role, is_active, is_blocked };
    if (password) {
      updateData.password = password;
    }

    await User.update(req.params.id, updateData);

    // Log audit
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'update_user', 'user', req.params.id, JSON.stringify(updateData)]
    );

    res.status(200).json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting admin
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin user'
      });
    }

    await User.delete(req.params.id);

    // Log audit
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'delete_user', 'user', req.params.id, JSON.stringify({ username: user.username })]
    );

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update own profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { full_name, bio, phone, gender, date_of_birth, location, website } = req.body;

    await User.update(req.user.id, {
      full_name,
      bio,
      phone,
      gender,
      date_of_birth,
      location,
      website
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update profile picture
// @route   PUT /api/users/profile-picture
// @access  Private
exports.updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileUrl = `/uploads/profiles/${req.file.filename}`;

    await User.update(req.user.id, { profile_picture: fileUrl });

    // Log upload
    await db.query(
      `INSERT INTO uploads (user_id, file_name, file_url, file_type, file_size, upload_type) VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.id, req.file.originalname, fileUrl, req.file.mimetype, req.file.size, 'profile']
    );

    res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      data: { profile_picture: fileUrl }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get suggested users
// @route   GET /api/users/suggested
// @access  Private
exports.getSuggestedUsers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const users = await User.getSuggestedUsers(req.user.id, limit);

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get online users
// @route   GET /api/users/online
// @access  Private
exports.getOnlineUsers = async (req, res) => {
  try {
    const users = await User.getOnlineUsers();

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all users for group creation
// @route   GET /api/users/all
// @access  Private
exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, username, full_name, profile_picture, bio, online_status 
       FROM users 
       WHERE id != $1 
       AND is_active = TRUE
       ORDER BY full_name ASC`,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Block user
// @route   POST /api/users/:id/block
// @access  Private
exports.blockUser = async (req, res) => {
  try {
    if (req.params.id == req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot block yourself'
      });
    }

    await db.query(
      `INSERT INTO blocked_users (blocker_id, blocked_id) VALUES ($1, $2)`,
      [req.user.id, req.params.id]
    );

    res.status(200).json({
      success: true,
      message: 'User blocked successfully'
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'User already blocked'
      });
    }
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Unblock user
// @route   DELETE /api/users/:id/block
// @access  Private
exports.unblockUser = async (req, res) => {
  try {
    await db.query(
      `DELETE FROM blocked_users WHERE blocker_id = $1 AND blocked_id = $2`,
      [req.user.id, req.params.id]
    );

    res.status(200).json({
      success: true,
      message: 'User unblocked successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Upload profile picture
// @route   POST /api/users/upload-profile-picture
// @access  Private
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const profilePictureUrl = `/uploads/profiles/${req.file.filename}`;

    await db.query(
      `UPDATE users SET profile_picture = $1 WHERE id = $2`,
      [profilePictureUrl, req.user.id]
    );

    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: { profile_picture: profilePictureUrl }
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
