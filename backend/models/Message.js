const db = require('../config/database');

class Message {
  static async create(messageData) {
    const { sender_id, receiver_id, group_id, content, message_type = 'text', file_url, file_name, file_size, reply_to, delivery_status = 'sent' } = messageData;
    
    const [rows] = await db.query(
      `INSERT INTO messages (sender_id, receiver_id, group_id, content, message_type, file_url, file_name, file_size, reply_to, delivery_status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [sender_id, receiver_id, group_id, content, message_type, file_url, file_name, file_size, reply_to, delivery_status]
    );
    
    return rows[0].id;
  }

  static async findById(id) {
    const [rows] = await db.query(
      `SELECT * FROM messages WHERE id = $1`,
      [id]
    );
    return rows[0];
  }

  static async getConversation(user1Id, user2Id, limit = 50, offset = 0) {
    const [rows] = await db.query(
      `SELECT m.*, 
        u1.username as sender_username, u1.full_name as sender_name, u1.profile_picture as sender_picture,
        u2.username as receiver_username, u2.full_name as receiver_name,
        mr.content as reply_content, mr.sender_id as reply_sender_id, u3.full_name as reply_sender_name
       FROM messages m
       LEFT JOIN users u1 ON m.sender_id = u1.id
       LEFT JOIN users u2 ON m.receiver_id = u2.id
       LEFT JOIN messages mr ON m.reply_to = mr.id
       LEFT JOIN users u3 ON mr.sender_id = u3.id
       WHERE ((m.sender_id = $1 AND m.receiver_id = $2) OR (m.sender_id = $3 AND m.receiver_id = $4))
       AND m.is_deleted = FALSE
       ORDER BY m.created_at DESC
       LIMIT $5 OFFSET $6`,
      [user1Id, user2Id, user2Id, user1Id, limit, offset]
    );
    
    // Format the reply data
    return rows.reverse().map(row => {
      if (row.reply_to) {
        row.reply_to = {
          id: row.reply_to,
          content: row.reply_content,
          sender_id: row.reply_sender_id,
          sender_name: row.reply_sender_name
        };
        delete row.reply_content;
        delete row.reply_sender_id;
        delete row.reply_sender_name;
      }
      return row;
    });
  }

  static async getGroupMessages(groupId, limit = 50, offset = 0) {
    const [rows] = await db.query(
      `SELECT m.*, u.username, u.full_name, u.profile_picture
       FROM messages m
       LEFT JOIN users u ON m.sender_id = u.id
       WHERE group_id = $1 AND is_deleted = FALSE
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [groupId, limit, offset]
    );
    return rows.reverse();
  }

  static async update(id, updateData) {
    const updates = [];
    const params = [];
    let paramIndex = 1;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        updates.push(`${key} = $${paramIndex}`);
        params.push(updateData[key]);
        paramIndex++;
      }
    });

    if (updates.length === 0) return false;

    params.push(id);
    const query = `UPDATE messages SET ${updates.join(', ')}, is_edited = TRUE, edited_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex}`;
    
    await db.query(query, params);
    return true;
  }

  static async delete(id) {
    await db.query(
      `UPDATE messages SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    );
    return true;
  }

  static async updateDeliveryStatus(messageId, status) {
    await db.query(
      `UPDATE messages SET delivery_status = $1 WHERE id = $2`,
      [status, messageId]
    );
  }

  static async getUnreadCount(userId) {
    const [rows] = await db.query(
      `SELECT COUNT(*) as count FROM messages 
       WHERE receiver_id = $1 AND delivery_status != 'seen' AND is_deleted = FALSE`,
      [userId]
    );
    return rows[0].count;
  }

  static async markAsSeen(senderId, receiverId) {
    await db.query(
      `UPDATE messages SET delivery_status = 'seen' 
       WHERE sender_id = $1 AND receiver_id = $2 AND delivery_status != 'seen'`,
      [senderId, receiverId]
    );
  }
}

module.exports = Message;
