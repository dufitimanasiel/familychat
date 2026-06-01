const db = require('../config/database');

class Chat {
  static async getOrCreateChat(user1Id, user2Id) {
    // Try to find existing chat
    const [rows] = await db.query(
      `SELECT * FROM chats WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $3 AND user2_id = $4)`,
      [user1Id, user2Id, user2Id, user1Id]
    );

    if (rows.length > 0) {
      return rows[0];
    }

    // Create new chat
    const [resultRows] = await db.query(
      `INSERT INTO chats (user1_id, user2_id) VALUES ($1, $2) RETURNING id`,
      [user1Id, user2Id]
    );

    return { id: resultRows[0].id, user1_id: user1Id, user2_id: user2Id };
  }

  static async getUserChats(userId) {
    const [rows] = await db.query(
      `SELECT c.*, 
        u1.id as other_user_id, u1.username as other_username, u1.full_name as other_name, u1.profile_picture as other_picture, u1.online_status,
        m.content as last_message, m.created_at as last_message_time, m.sender_id as last_sender_id
       FROM chats c
       LEFT JOIN users u1 ON (CASE WHEN c.user1_id = $1 THEN c.user2_id ELSE c.user1_id END) = u1.id
       LEFT JOIN messages m ON c.last_message_id = m.id
       WHERE c.user1_id = $2 OR c.user2_id = $3
       ORDER BY c.updated_at DESC`,
      [userId, userId, userId]
    );
    return rows;
  }

  static async updateLastMessage(chatId, messageId) {
    await db.query(
      `UPDATE chats SET last_message_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [messageId, chatId]
    );
  }

  static async updateUnreadCount(chatId, count) {
    await db.query(
      `UPDATE chats SET unread_count = $1 WHERE id = $2`,
      [count, chatId]
    );
  }

  static async archiveChat(chatId) {
    await db.query(
      `UPDATE chats SET is_archived = TRUE WHERE id = $1`,
      [chatId]
    );
  }

  static async unarchiveChat(chatId) {
    await db.query(
      `UPDATE chats SET is_archived = FALSE WHERE id = $1`,
      [chatId]
    );
  }

  static async pinChat(chatId) {
    await db.query(
      `UPDATE chats SET is_pinned = TRUE WHERE id = $1`,
      [chatId]
    );
  }

  static async unpinChat(chatId) {
    await db.query(
      `UPDATE chats SET is_pinned = FALSE WHERE id = $1`,
      [chatId]
    );
  }

  static async muteChat(chatId) {
    await db.query(
      `UPDATE chats SET is_muted = TRUE WHERE id = $1`,
      [chatId]
    );
  }

  static async unmuteChat(chatId) {
    await db.query(
      `UPDATE chats SET is_muted = FALSE WHERE id = $1`,
      [chatId]
    );
  }

  static async deleteChat(chatId) {
    await db.query(`DELETE FROM chats WHERE id = $1`, [chatId]);
  }
}

module.exports = Chat;
