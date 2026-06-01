const db = require('../config/database');

class Notification {
  static async create(notificationData) {
    const { user_id, type, title, content, data } = notificationData;
    
    const [rows] = await db.query(
      `INSERT INTO notifications (user_id, type, title, content, data) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [user_id, type, title, content, JSON.stringify(data || {})]
    );
    
    return rows[0].id;
  }

  static async findByUserId(userId, limit = 50) {
    const [rows] = await db.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
    
    rows.forEach(row => {
      row.data = typeof row.data === 'string' ? JSON.parse(row.data || '{}') : (row.data || {});
    });
    
    return rows;
  }

  static async getUnreadCount(userId) {
    const [rows] = await db.query(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );
    return rows[0].count;
  }

  static async markAsRead(id) {
    await db.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1`,
      [id]
    );
  }

  static async markAllAsRead(userId) {
    await db.query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = $1`,
      [userId]
    );
  }

  static async delete(id) {
    await db.query(`DELETE FROM notifications WHERE id = $1`, [id]);
  }

  static async deleteAll(userId) {
    await db.query(`DELETE FROM notifications WHERE user_id = $1`, [userId]);
  }
}

module.exports = Notification;
