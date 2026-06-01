const db = require('./config/database');

async function createStoriesTable() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS stories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        media_url VARCHAR(500) NOT NULL,
        media_type ENUM('image', 'video') DEFAULT 'image',
        caption TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
      )
    `;

    await db.query(createTableQuery);
    console.log('Stories table created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating stories table:', error);
    process.exit(1);
  }
}

createStoriesTable();
