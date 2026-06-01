const db = require('../config/database');

class Friend {
  static async sendRequest(senderId, receiverId, message = '') {
    const [rows] = await db.query(
      `INSERT INTO friend_requests (sender_id, receiver_id, message) VALUES ($1, $2, $3) RETURNING id`,
      [senderId, receiverId, message]
    );
    return rows[0].id;
  }

  static async acceptRequest(requestId) {
    await db.query(
      `UPDATE friend_requests SET status = 'accepted' WHERE id = $1`,
      [requestId]
    );
    
    const [request] = await db.query(`SELECT * FROM friend_requests WHERE id = $1`, [requestId]);
    
    if (!request || request.length === 0) {
      throw new Error('Friend request not found');
    }
    
    // Check if friendship already exists
    const [existing] = await db.query(
      `SELECT * FROM friends WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $3 AND user2_id = $4)`,
      [request[0].sender_id, request[0].receiver_id, request[0].receiver_id, request[0].sender_id]
    );
    
    // Only add to friends table if not already friends
    if (existing.length === 0) {
      await db.query(
        `INSERT INTO friends (user1_id, user2_id, status, requested_by) VALUES ($1, $2, 'accepted', $3)`,
        [request[0].sender_id, request[0].receiver_id, request[0].sender_id]
      );
    }
    
    return request[0];
  }

  static async declineRequest(requestId) {
    await db.query(
      `UPDATE friend_requests SET status = 'declined' WHERE id = $1`,
      [requestId]
    );
  }

  static async cancelRequest(requestId) {
    await db.query(
      `UPDATE friend_requests SET status = 'cancelled' WHERE id = $1`,
      [requestId]
    );
  }

  static async getRequests(userId, type = 'received') {
    let query = `SELECT fr.*, u.username, u.full_name, u.profile_picture
                 FROM friend_requests fr
                 LEFT JOIN users u ON `;
    
    if (type === 'received') {
      query += `fr.sender_id = u.id WHERE fr.receiver_id = $1 AND fr.status = 'pending'`;
    } else {
      query += `fr.receiver_id = u.id WHERE fr.sender_id = $1 AND fr.status = 'pending'`;
    }
    
    query += ` ORDER BY fr.created_at DESC`;
    
    const [rows] = await db.query(query, [userId]);
    return rows;
  }

  static async getFriends(userId) {
    const [rows] = await db.query(
      `SELECT f.*, 
        CASE WHEN f.user1_id = $1 THEN f.user2_id ELSE f.user1_id END as friend_id,
        CASE WHEN f.user1_id = $2 THEN u2.username ELSE u1.username END as friend_username,
        CASE WHEN f.user1_id = $3 THEN u2.full_name ELSE u1.full_name END as friend_name,
        CASE WHEN f.user1_id = $4 THEN u2.profile_picture ELSE u1.profile_picture END as friend_picture,
        CASE WHEN f.user1_id = $5 THEN u2.online_status ELSE u1.online_status END as friend_online_status
       FROM friends f
       LEFT JOIN users u1 ON f.user1_id = u1.id
       LEFT JOIN users u2 ON f.user2_id = u2.id
       WHERE (f.user1_id = $6 OR f.user2_id = $7) AND f.status = 'accepted'
       ORDER BY f.updated_at DESC`,
      [userId, userId, userId, userId, userId, userId, userId]
    );
    return rows;
  }

  static async removeFriend(userId1, userId2) {
    await db.query(
      `DELETE FROM friends WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $3 AND user2_id = $4)`,
      [userId1, userId2, userId2, userId1]
    );
  }

  static async blockUser(blockerId, blockedId, reason = '') {
    await db.query(
      `INSERT INTO blocked_users (blocker_id, blocked_id, reason) VALUES ($1, $2, $3)`,
      [blockerId, blockedId, reason]
    );
    
    // Remove from friends if exists
    await db.query(
      `DELETE FROM friends WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $3 AND user2_id = $4)`,
      [blockerId, blockedId, blockedId, blockerId]
    );
  }

  static async unblockUser(blockerId, blockedId) {
    await db.query(
      `DELETE FROM blocked_users WHERE blocker_id = $1 AND blocked_id = $2`,
      [blockerId, blockedId]
    );
  }

  static async getBlockedUsers(userId) {
    const [rows] = await db.query(
      `SELECT bu.*, u.username, u.full_name, u.profile_picture
       FROM blocked_users bu
       LEFT JOIN users u ON bu.blocked_id = u.id
       WHERE bu.blocker_id = $1`,
      [userId]
    );
    return rows;
  }

  static async isBlocked(userId1, userId2) {
    const [rows] = await db.query(
      `SELECT * FROM blocked_users WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $3 AND blocked_id = $4)`,
      [userId1, userId2, userId2, userId1]
    );
    return rows.length > 0;
  }
}

module.exports = Friend;
