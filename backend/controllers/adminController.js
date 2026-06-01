const db = require('../config/database');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get all admins (including sub-admins)
// @route   GET /api/admin/admins
// @access  Private/Super Admin
exports.getAllAdmins = async (req, res) => {
  try {
    const [admins] = await db.query(
      `SELECT u.id, u.username, u.email, u.full_name, u.role, u.is_super_admin, u.parent_admin_id, u.is_active, u.created_at,
              p.username as parent_admin_username
       FROM users u
       LEFT JOIN users p ON u.parent_admin_id = p.id
       WHERE u.role = 'admin'
       ORDER BY u.is_super_admin DESC, u.created_at ASC`
    );

    res.status(200).json({
      success: true,
      count: admins.length,
      data: admins
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create sub-admin
// @route   POST /api/admin/admins
// @access  Private/Super Admin
exports.createSubAdmin = async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;

    // Validation
    if (!username || !email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user is super admin
    if (!req.user.is_super_admin) {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can create sub-admins'
      });
    }

    // Check if username already exists
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Check if email already exists
    const [existingEmail] = await db.query(
      `SELECT id FROM users WHERE email = $1`,
      [email]
    );
    if (existingEmail.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create sub-admin
    const [result] = await db.query(
      `INSERT INTO users (username, email, password, full_name, role, is_super_admin, parent_admin_id) 
       VALUES ($1, $2, $3, $4, 'admin', FALSE, $5) RETURNING id`,
      [username, email, hashedPassword, full_name, req.user.id]
    );

    const newAdminId = result[0].id;

    // Log audit
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'create_sub_admin', 'user', newAdminId, JSON.stringify({ username, email })]
    );

    res.status(201).json({
      success: true,
      message: 'Sub-admin created successfully',
      data: {
        id: newAdminId,
        username,
        email,
        full_name,
        role: 'admin',
        is_super_admin: false,
        parent_admin_id: req.user.id
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete sub-admin
// @route   DELETE /api/admin/admins/:id
// @access  Private/Super Admin
exports.deleteSubAdmin = async (req, res) => {
  try {
    const adminId = req.params.id;

    // Check if user is super admin
    if (!req.user.is_super_admin) {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can delete sub-admins'
      });
    }

    // Get the admin to be deleted
    const [admin] = await db.query(
      `SELECT * FROM users WHERE id = $1 AND role = 'admin'`,
      [adminId]
    );

    if (admin.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    const targetAdmin = admin[0];

    // Cannot delete super admin
    if (targetAdmin.is_super_admin) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete super admin'
      });
    }

    // Cannot delete yourself
    if (targetAdmin.id === req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete yourself'
      });
    }

    // Check if this admin was created by the current super admin
    if (targetAdmin.parent_admin_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete sub-admins created by you'
      });
    }

    // Delete the sub-admin
    await db.query(`DELETE FROM users WHERE id = $1`, [adminId]);

    // Log audit
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'delete_sub_admin', 'user', adminId, JSON.stringify({ username: targetAdmin.username })]
    );

    res.status(200).json({
      success: true,
      message: 'Sub-admin deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getStats = async (req, res) => {
  try {
    const [userCount] = await db.query(`SELECT COUNT(*) as count FROM users`);
    const [onlineUsers] = await db.query(`SELECT COUNT(*) as count FROM users WHERE online_status = 'online'`);
    const [messageCount] = await db.query(`SELECT COUNT(*) as count FROM messages`);
    const [postCount] = await db.query(`SELECT COUNT(*) as count FROM posts`);
    const [todayUsers] = await db.query(`SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = CURRENT_DATE`);
    const [todayMessages] = await db.query(`SELECT COUNT(*) as count FROM messages WHERE DATE(created_at) = CURRENT_DATE`);
    const [todayPosts] = await db.query(`SELECT COUNT(*) as count FROM posts WHERE DATE(created_at) = CURRENT_DATE`);

    res.status(200).json({
      success: true,
      data: {
        totalUsers: userCount[0].count,
        onlineUsers: onlineUsers[0].count,
        totalMessages: messageCount[0].count,
        totalPosts: postCount[0].count,
        todayUsers: todayUsers[0].count,
        todayMessages: todayMessages[0].count,
        todayPosts: todayPosts[0].count
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get audit logs
// @route   GET /api/admin/audit-logs
// @access  Private/Admin
exports.getAuditLogs = async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;

    const [logs] = await db.query(
      `SELECT al.*, u.username 
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC
       LIMIT $1 OFFSET $2`,
      [parseInt(limit), parseInt(offset)]
    );

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get reports
// @route   GET /api/admin/reports
// @access  Private/Admin
exports.getReports = async (req, res) => {
  try {
    const { status } = req.query;
    let query = `SELECT r.*, u1.username as reporter_username, u2.username as reported_username 
                 FROM reports r
                 LEFT JOIN users u1 ON r.reporter_id = u1.id
                 LEFT JOIN users u2 ON r.reported_user_id = u2.id
                 WHERE 1=1`;
    const params = [];

    if (status) {
      query += ` AND r.status = $1`;
      params.push(status);
    }

    query += ` ORDER BY r.created_at DESC`;

    const [reports] = await db.query(query, params);

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update report status
// @route   PUT /api/admin/reports/:id
// @access  Private/Admin
exports.updateReport = async (req, res) => {
  try {
    const { status, admin_notes } = req.body;

    await db.query(
      `UPDATE reports SET status = $1, admin_notes = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [status, admin_notes, req.params.id]
    );

    res.status(200).json({
      success: true,
      message: 'Report updated successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get system settings
// @route   GET /api/admin/settings
// @access  Private/Admin
exports.getSettings = async (req, res) => {
  try {
    const [settings] = await db.query(
      `SELECT * FROM settings WHERE user_id IS NULL`
    );

    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.setting_key] = s.setting_type === 'json' ? (typeof s.setting_value === 'string' ? JSON.parse(s.setting_value) : s.setting_value) : s.setting_value;
    });

    res.status(200).json({
      success: true,
      data: settingsObj
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update system settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
exports.updateSettings = async (req, res) => {
  try {
    const settings = req.body;

    for (const [key, value] of Object.entries(settings)) {
      const settingType = typeof value === 'object' ? 'json' : typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string';
      const settingValue = typeof value === 'object' ? JSON.stringify(value) : value;

      await db.query(
        `INSERT INTO settings (setting_key, setting_value, setting_type, user_id) VALUES ($1, $2, $3, NULL)
         ON CONFLICT (setting_key, user_id) WHERE user_id IS NULL DO UPDATE SET setting_value = $4, setting_type = $5`,
        [key, settingValue, settingType, settingValue, settingType]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Reset user password
// @route   POST /api/admin/users/:id/reset-password
// @access  Private/Admin
exports.resetPassword = async (req, res) => {
  try {
    const { new_password } = req.body;

    if (!new_password) {
      return res.status(400).json({
        success: false,
        message: 'New password is required'
      });
    }

    await User.update(req.params.id, { password: new_password });

    // Log audit
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'reset_password', 'user', req.params.id, JSON.stringify({ target_user: req.params.id })]
    );

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
