const db = require('../config/database');

class Comment {
  static async create(commentData) {
    const { post_id, user_id, content, parent_id } = commentData;
    
    const [rows] = await db.query(
      `INSERT INTO comments (post_id, user_id, content, parent_id) VALUES ($1, $2, $3, $4) RETURNING id`,
      [post_id, user_id, content, parent_id]
    );
    
    // Update post comment count
    await db.query(`UPDATE posts SET comment_count = comment_count + 1 WHERE id = $1`, [post_id]);
    
    return rows[0].id;
  }

  static async findById(id) {
    const [rows] = await db.query(
      `SELECT c.*, u.username, u.full_name, u.profile_picture
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.id = $1`,
      [id]
    );
    return rows[0];
  }

  static async getPostComments(postId, limit = 50) {
    const [rows] = await db.query(
      `SELECT c.*, u.username, u.full_name, u.profile_picture,
        (SELECT COUNT(*) FROM likes WHERE comment_id = c.id) as like_count
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1 AND c.parent_id IS NULL
       ORDER BY c.created_at DESC
       LIMIT $2`,
      [postId, limit]
    );
    return rows;
  }

  static async getReplies(commentId, limit = 20) {
    const [rows] = await db.query(
      `SELECT c.*, u.username, u.full_name, u.profile_picture
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.parent_id = $1
       ORDER BY c.created_at ASC
       LIMIT $2`,
      [commentId, limit]
    );
    return rows;
  }

  static async update(id, content) {
    await db.query(
      `UPDATE comments SET content = $1 WHERE id = $2`,
      [content, id]
    );
  }

  static async delete(id) {
    const [comment] = await db.query(`SELECT post_id FROM comments WHERE id = $1`, [id]);
    
    await db.query(`DELETE FROM comments WHERE id = $1 OR parent_id = $2`, [id, id]);
    
    if (comment.length > 0) {
      await db.query(`UPDATE posts SET comment_count = comment_count - 1 WHERE id = $1`, [comment[0].post_id]);
    }
  }
}

module.exports = Comment;
