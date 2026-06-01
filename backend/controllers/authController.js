const jwt = require("jsonwebtoken");
const User = require("../models/User");
const db = require("../config/database");
require("dotenv").config({ path: "./.env" });

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign(
    { id, role: "user" },
    process.env.JWT_SECRET || "facechat_secret_key_2024",
    {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    },
  );
};

// Generate Admin Token
const generateAdminToken = (id, isSuperAdmin = false) => {
  return jwt.sign(
    { id, role: "admin", is_super_admin: isSuperAdmin },
    process.env.JWT_SECRET || "facechat_secret_key_2024",
    {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    },
  );
};

// @desc    Register new user (Admin only)
// @route   POST /api/auth/register
// @access  Private/Admin
exports.register = async (req, res) => {
  try {
    const { username, email, password, full_name, role } = req.body;

    // Check if user exists
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username already exists",
      });
    }

    // Create user with role validation
    let userRole = role || "user";

    // Only main admin can create full admins
    if (role === "admin" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only main admin can create admin users",
      });
    }

    // Sub-admins can only create users, not admins
    if (role === "admin" && req.user.role === "admin") {
      userRole = "sub-admin";
    }

    const userId = await User.create({
      username,
      email,
      password,
      full_name,
      role: userRole,
    });

    // Log audit
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        "create_user",
        "user",
        userId,
        JSON.stringify({ username, email, role }),
      ],
    );

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: { id: userId, username, email, full_name, role },
    });
  } catch (error) {
    console.error(error);

    // Handle specific database errors
    if (error.code === "23505") {
      if (error.constraint && (error.constraint.includes("email") || error.detail?.includes("email"))) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      } else if (error.constraint && (error.constraint.includes("username") || error.detail?.includes("username"))) {
        return res.status(400).json({
          success: false,
          message: "Username already exists",
        });
      }
    }

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Signup new user
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;

    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username already exists",
      });
    }

    const existingEmail = email ? await User.findByEmail(email) : null;
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const userId = await User.create({
      username,
      email,
      password,
      full_name,
      role: "user",
    });

    const token = generateToken(userId);
    const user = {
      id: userId,
      username,
      email,
      full_name,
      role: "user",
    };

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user,
    });
  } catch (error) {
    console.error(error);

    if (error.code === "23505") {
      if (error.constraint && (error.constraint.includes("email") || error.detail?.includes("email"))) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      } else if (error.constraint && (error.constraint.includes("username") || error.detail?.includes("username"))) {
        return res.status(400).json({
          success: false,
          message: "Username already exists",
        });
      }
    }

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;

    // Check if user exists
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if user is blocked
    if (user.is_blocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked",
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "Your account is not active",
      });
    }

    // Check password
    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Update last seen and online status
    await User.updateLastSeen(user.id);
    await User.updateOnlineStatus(user.id, "online");

    // Create token
    const token =
      user.role === "admin"
        ? generateAdminToken(user.id, user.is_super_admin)
        : generateToken(user.id);

    // Log audit
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, details) VALUES ($1, $2, $3, $4)`,
      [user.id, "login", "auth", JSON.stringify({ rememberMe })],
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        profile_picture: user.profile_picture,
        role: user.role,
        is_super_admin: user.is_super_admin || false,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    // Update online status
    await User.updateOnlineStatus(req.user.id, "offline");
    await User.updateLastSeen(req.user.id);

    // Log audit
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type) VALUES ($1, $2, $3)`,
      [req.user.id, "logout", "auth"],
    );

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);

    // Check current password
    const userWithPassword = await User.findByUsername(user.username);
    const isMatch = await User.comparePassword(
      currentPassword,
      userWithPassword.password,
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    await User.update(user.id, { password: newPassword });

    // Log audit
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type) VALUES ($1, $2, $3)`,
      [req.user.id, "update_password", "auth"],
    );

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
