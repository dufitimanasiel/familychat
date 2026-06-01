const db = require('../config/database');

class Group {
  static async create(groupData) {
    const { name, description, group_picture, created_by, is_private = false, max_members = 500 } = groupData;
    
    const [rows] = await db.query(
      `INSERT INTO groups (name, description, group_picture, created_by, is_private, max_members) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [name, description, group_picture, created_by, is_private, max_members]
    );

    const groupId = rows[0].id;
    
    // Add creator as admin
    await db.query(
      `INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'admin')`,
      [groupId, created_by]
    );
    
    return groupId;
  }

  static async findById(id) {
    const [rows] = await db.query(
      `SELECT g.*, u.username as creator_username, u.full_name as creator_name
       FROM groups g
       LEFT JOIN users u ON g.created_by = u.id
       WHERE g.id = $1`,
      [id]
    );
    return rows[0];
  }

  static async findAll(filters = {}) {
    let query = `SELECT g.*, u.username as creator_username, u.full_name as creator_name,
      (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
     FROM groups g
     LEFT JOIN users u ON g.created_by = u.id
     WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (filters.user_id) {
      query += ` AND g.id IN (SELECT group_id FROM group_members WHERE user_id = $${paramIndex})`;
      params.push(filters.user_id);
      paramIndex++;
    }

    if (filters.is_private !== undefined) {
      query += ` AND g.is_private = $${paramIndex}`;
      params.push(filters.is_private);
      paramIndex++;
    }

    query += ` ORDER BY g.created_at DESC`;

    const [rows] = await db.query(query, params);
    return rows;
  }

  static async addMember(groupId, userId, role = 'member') {
    const [rows] = await db.query(
      `INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3) RETURNING id`,
      [groupId, userId, role]
    );
    return rows[0].id;
  }

  static async removeMember(groupId, userId) {
    await db.query(
      `DELETE FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, userId]
    );
  }

  static async getMembers(groupId) {
    const [rows] = await db.query(
      `SELECT gm.*, u.username, u.full_name, u.profile_picture, u.online_status
       FROM group_members gm
       LEFT JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = $1
       ORDER BY gm.role DESC, gm.joined_at ASC`,
      [groupId]
    );
    return rows;
  }

  static async getUserGroups(userId) {
    const [rows] = await db.query(
      `SELECT g.*, gm.role, gm.is_muted,
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
       FROM groups g
       INNER JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.user_id = $1
       ORDER BY g.updated_at DESC`,
      [userId]
    );
    return rows;
  }

  static async update(id, updateData) {
    const updates = [];
    const params = [];
    let paramIndex = 1;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== 'id') {
        updates.push(`${key} = $${paramIndex}`);
        params.push(updateData[key]);
        paramIndex++;
      }
    });

    if (updates.length === 0) return false;

    params.push(id);
    const query = `UPDATE groups SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
    
    await db.query(query, params);
    return true;
  }

  static async delete(id) {
    await db.query(`DELETE FROM groups WHERE id = $1`, [id]);
  }
}

module.exports = Group;
