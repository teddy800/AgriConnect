import pg from 'pg';

const { Pool } = pg;

// Connection pool with optimized settings
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'agriconnect',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,                      // Maximum pool size
  idleTimeoutMillis: 30000,     // Close idle clients after 30s
  connectionTimeoutMillis: 2000, // Fail fast on connection issues
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Connection error handling
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(-1);
});

// Health check on startup
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅ Database connected successfully');
});

/**
 * Execute a SQL query with parameterized values
 * @param {string} text - SQL query with $1, $2... placeholders
 * @param {Array} params - Array of values to bind
 * @returns {Promise<Array>} Array of result rows
 */
export async function q(text, params = []) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries (>100ms) for optimization
    if (duration > 100) {
      console.warn(`⚠️  Slow query (${duration}ms):`, text.substring(0, 80) + '...');
    }
    
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error.message);
    console.error('Query:', text);
    console.error('Params:', params);
    throw error;
  }
}

/**
 * Execute a query and return a single row
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object|null>} Single row or null
 */
export async function qOne(text, params = []) {
  const rows = await q(text, params);
  return rows[0] || null;
}

/**
 * Execute a transaction with multiple queries
 * @param {Function} callback - Async function receiving client
 * @returns {Promise<any>} Result from callback
 */
export async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Closing database connections...');
  await pool.end();
  console.log('👋 Database connections closed');
  process.exit(0);
});

export default pool;
