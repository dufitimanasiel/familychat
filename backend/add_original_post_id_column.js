const db = require('./config/database');

async function addOriginalPostIdColumn() {
  try {
    // Check if column already exists
    const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'facechat' 
      AND TABLE_NAME = 'posts' 
      AND COLUMN_NAME = 'original_post_id'
    `);

    if (columns.length === 0) {
      // Add the column if it doesn't exist
      await db.query(`
        ALTER TABLE posts 
        ADD COLUMN original_post_id INT NULL,
        ADD INDEX idx_original_post_id (original_post_id),
        ADD FOREIGN KEY (original_post_id) REFERENCES posts(id) ON DELETE SET NULL
      `);
      console.log('original_post_id column added successfully!');
    } else {
      console.log('original_post_id column already exists!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error adding original_post_id column:', error);
    process.exit(1);
  }
}

addOriginalPostIdColumn();
