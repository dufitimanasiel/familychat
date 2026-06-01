const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://wjkiakufhnxvzvfrfupq.supabase.co',
  'sb_publishable_CtW7hHj-Vo7rWjANmqGxhQ_2sxO0GT7'
);

// Create connection pool for Supabase PostgreSQL (for existing code compatibility)
const pool = new Pool({
  connectionString: 'postgresql://postgres.wjkiakufhnxvzvfrfupq:facechatfamily@!@aws-1-eu-central-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false },
  max: 10,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 5000
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

// Test connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Database connected successfully');
    client.release();
  } catch (err) {
    console.error('Database connection failed:', err);
    setTimeout(testConnection, 5000);
  }
};
testConnection();

// Create a query function for compatibility with existing code
const query = async (text, params = []) => {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await pool.query(text, params);
      return [result.rows, result.fields];
    } catch (error) {
      lastError = error;
      console.warn(`Query attempt ${attempt} failed:`, error.message);
      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  throw lastError;
};

module.exports = { query, pool, supabase };
