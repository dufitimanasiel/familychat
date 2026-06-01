const db = require('../config/database');

class Post {
  static async create(postData) {
    const { user_id, content, post_type = 'text', media_urls, privacy = 'public', location, feeling, original_post_id } = postData;
    
    const [rows] = await db.query(
      `INSERT INTO posts (user_id, content, post_type, media_urls, privacy, location, feeling, original_post_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [user_id, content, post_type, JSON.stringify(media_urls || []), privacy, location, feeling, original_post_id]
    );
    
    return rows[0].id;
  }

  static async findById(id) {
    const [rows] = await db.query(
      `SELECT p.*, u.username, u.full_name, u.profile_picture 
       FROM posts p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [id]
    );
    if (rows.length > 0) {
      rows[0].media_urls = typeof rows[0].media_urls === 'string' ? JSON.parse(rows[0].media_urls || '[]') : (rows[0].media_urls || []);
    }
    return rows[0];
  }

  static async findAll(filters = {}, userId = null) {
    let query = `SELECT p.*, u.username, u.full_name, u.profile_picture,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = $1) as user_liked
     FROM posts p
     LEFT JOIN users u ON p.user_id = u.id
     WHERE 1=1`;
    const params = [userId || 0];
    let paramIndex = 2;

    if (filters.user_id) {
      query += ` AND p.user_id = $${paramIndex}`;
      params.push(filters.user_id);
      paramIndex++;
    }

    if (filters.privacy) {
      query += ` AND p.privacy = $${paramIndex}`;
      params.push(filters.privacy);
      paramIndex++;
    } else if (userId) {
      query += ` AND (p.privacy = 'public' OR p.user_id = $${paramIndex} OR p.user_id IN (
        SELECT user2_id FROM friends WHERE user1_id = $${paramIndex + 1} AND status = 'accepted'
        UNION
        SELECT user1_id FROM friends WHERE user2_id = $${paramIndex + 2} AND status = 'accepted'
      ))`;
      params.push(userId, userId, userId);
      paramIndex += 3;
    }

    query += ` ORDER BY p.created_at DESC`;

    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }

    if (filters.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(filters.offset);
      paramIndex++;
    }

    const [rows] = await db.query(query, params);
    rows.forEach(row => {
      row.media_urls = typeof row.media_urls === 'string' ? JSON.parse(row.media_urls || '[]') : (row.media_urls || []);
    });
    return rows;
  }

  static async update(id, updateData) {
    const updates = [];
    const params = [];
    let paramIndex = 1;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== 'id') {
        if (key === 'media_urls') {
          updates.push(`${key} = $${paramIndex}`);
          params.push(JSON.stringify(updateData[key]));
        } else {
          updates.push(`${key} = $${paramIndex}`);
          params.push(updateData[key]);
        }
        paramIndex++;
      }
    });

    if (updates.length === 0) return false;

    params.push(id);
    const query = `UPDATE posts SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
    
    await db.query(query, params);
    return true;
  }

  static async delete(id) {
    await db.query(`DELETE FROM posts WHERE id = $1`, [id]);
    return true;
  }

  static async incrementLikeCount(id) {
    await db.query(`UPDATE posts SET like_count = like_count + 1 WHERE id = $1`, [id]);
  }

  static async decrementLikeCount(id) {
    await db.query(`UPDATE posts SET like_count = like_count - 1 WHERE id = $1`, [id]);
  }

  static async incrementCommentCount(id) {
    await db.query(`UPDATE posts SET comment_count = comment_count + 1 WHERE id = $1`, [id]);
  }

  static async decrementCommentCount(id) {
    await db.query(`UPDATE posts SET comment_count = comment_count - 1 WHERE id = $1`, [id]);
  }
}

module.exports = Post;
