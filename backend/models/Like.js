const db = require('../config/database');

class Like {
  static async create(likeData) {
    const { user_id, post_id, comment_id, like_type = 'like' } = likeData;
    
    const [rows] = await db.query(
      `INSERT INTO likes (user_id, post_id, comment_id, like_type) VALUES ($1, $2, $3, $4) RETURNING id`,
      [user_id, post_id, comment_id, like_type]
    );
    
    // Update counts
    if (post_id) {
      await db.query(`UPDATE posts SET like_count = like_count + 1 WHERE id = $1`, [post_id]);
    }
    if (comment_id) {
      await db.query(`UPDATE comments SET like_count = like_count + 1 WHERE id = $1`, [comment_id]);
    }
    
    return rows[0].id;
  }

  static async delete(userId, postId = null, commentId = null) {
    await db.query(
      `DELETE FROM likes WHERE user_id = $1 AND (post_id = $2 OR comment_id = $3)`,
      [userId, postId, commentId]
    );
    
    // Update counts
    if (postId) {
      await db.query(`UPDATE posts SET like_count = like_count - 1 WHERE id = $1`, [postId]);
    }
    if (commentId) {
      await db.query(`UPDATE comments SET like_count = like_count - 1 WHERE id = $1`, [commentId]);
    }
  }

  static async getPostLikes(postId) {
    const [rows] = await db.query(
      `SELECT l.*, u.username, u.full_name, u.profile_picture
       FROM likes l
       LEFT JOIN users u ON l.user_id = u.id
       WHERE l.post_id = $1
       ORDER BY l.created_at DESC`,
      [postId]
    );
    return rows;
  }

  static async getCommentLikes(commentId) {
    const [rows] = await db.query(
      `SELECT l.*, u.username, u.full_name, u.profile_picture
       FROM likes l
       LEFT JOIN users u ON l.user_id = u.id
       WHERE l.comment_id = $1
       ORDER BY l.created_at DESC`,
      [commentId]
    );
    return rows;
  }

  static async checkLike(userId, postId = null, commentId = null) {
    const [rows] = await db.query(
      `SELECT * FROM likes WHERE user_id = $1 AND (post_id = $2 OR comment_id = $3)`,
      [userId, postId, commentId]
    );
    return rows[0];
  }
}

module.exports = Like;
