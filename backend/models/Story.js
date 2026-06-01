const db = require('../config/database');

class Story {
  static async create(storyData) {
    const { user_id, media_url, media_type, caption } = storyData;
    
    const [rows] = await db.query(
      `INSERT INTO stories (user_id, media_url, media_type, caption) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [user_id, media_url, media_type || 'image', caption]
    );
    
    return rows[0].id;
  }

  static async findById(id) {
    const [rows] = await db.query(
      `SELECT s.*, u.username, u.full_name, u.profile_picture 
       FROM stories s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.id = $1`,
      [id]
    );
    return rows[0];
  }

  static async findAll(filters = {}) {
    let query = `SELECT s.*, u.username, u.full_name, u.profile_picture 
     FROM stories s
     LEFT JOIN users u ON s.user_id = u.id
     WHERE s.created_at >= NOW() - INTERVAL '24 hours'
     ORDER BY s.created_at DESC`;
    const params = [];

    if (filters.user_id) {
      query = `SELECT s.*, u.username, u.full_name, u.profile_picture 
       FROM stories s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.user_id = $1 AND s.created_at >= NOW() - INTERVAL '24 hours'
       ORDER BY s.created_at DESC`;
      params.push(filters.user_id);
    }

    const [rows] = await db.query(query, params);
    return rows;
  }

  static async delete(id) {
    await db.query(`DELETE FROM stories WHERE id = $1`, [id]);
  }

  static async deleteByUserId(userId) {
    await db.query(`DELETE FROM stories WHERE user_id = $1`, [userId]);
  }
}

module.exports = Story;
