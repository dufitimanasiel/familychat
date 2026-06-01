const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { username, email, password, full_name, role = 'user' } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [rows] = await db.query(
      `INSERT INTO users (username, email, password, full_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [username, email, hashedPassword, full_name, role]
    );
    
    return rows[0].id;
  }

  static async findByUsername(username) {
    const [rows] = await db.query(
      `SELECT * FROM users WHERE username = $1`,
      [username]
    );
    return rows[0];
  }

  static async findByEmail(email) {
    const [rows] = await db.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await db.query(
      `SELECT id, username, email, full_name, profile_picture, bio, phone, gender, date_of_birth, location, website, role, is_super_admin, parent_admin_id, is_active, is_blocked, last_seen, online_status, created_at FROM users WHERE id = $1`,
      [id]
    );
    return rows[0];
  }

  static async findAll(filters = {}) {
    let query = `SELECT id, username, email, full_name, profile_picture, bio, role, is_active, is_blocked, online_status, created_at FROM users WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (filters.search) {
      query += ` AND (username LIKE $${paramIndex} OR full_name LIKE $${paramIndex + 1})`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
      paramIndex += 2;
    }

    if (filters.role) {
      query += ` AND role = $${paramIndex}`;
      params.push(filters.role);
      paramIndex++;
    }

    if (filters.is_active !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(filters.is_active);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC`;

    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }

    const [rows] = await db.query(query, params);
    return rows;
  }

  static async update(id, userData) {
    const updates = [];
    const params = [];
    let paramIndex = 1;

    Object.keys(userData).forEach(key => {
      if (userData[key] !== undefined && key !== 'id') {
        updates.push(`${key} = $${paramIndex}`);
        params.push(userData[key]);
        paramIndex++;
      }
    });

    if (updates.length === 0) return false;

    params.push(id);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
    
    await db.query(query, params);
    return true;
  }

  static async delete(id) {
    await db.query(`DELETE FROM users WHERE id = $1`, [id]);
    return true;
  }

  static async updateLastSeen(id) {
    await db.query(
      `UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    );
  }

  static async updateOnlineStatus(id, status) {
    await db.query(
      `UPDATE users SET online_status = $1 WHERE id = $2`,
      [status, id]
    );
  }

  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  static async getSuggestedUsers(userId, limit = 10) {
    const [rows] = await db.query(
      `SELECT id, username, full_name, profile_picture, bio FROM users 
       WHERE id != $1 AND id NOT IN (
         SELECT user2_id FROM friends WHERE user1_id = $2 AND status = 'accepted'
         UNION
         SELECT user1_id FROM friends WHERE user2_id = $3 AND status = 'accepted'
       )
       ORDER BY created_at DESC 
       LIMIT $4`,
      [userId, userId, userId, limit]
    );
    return rows;
  }

  static async getOnlineUsers() {
    const [rows] = await db.query(
      `SELECT id, username, full_name, profile_picture, online_status FROM users 
       WHERE online_status = 'online' AND is_active = TRUE`
    );
    return rows;
  }
}

module.exports = User;
