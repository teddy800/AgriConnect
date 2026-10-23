/**
 * Quick Health Check Script
 * Tests database connection and counts records
 */

import pool from './src/db.js';

async function healthCheck() {
  try {
    console.log('🔍 AgriConnect Health Check\n');
    console.log('================================\n');

    // Test database connection
    console.log('📊 Database Status:');
    const result = await pool.query('SELECT NOW() as time');
    console.log('✅ Connected successfully');
    console.log(`   Server Time: ${result.rows[0].time}\n`);

    // Count users
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const activeUsersResult = await pool.query('SELECT COUNT(*) as count FROM users WHERE is_active = true');
    console.log(`👥 Users: ${usersResult.rows[0].count} (${activeUsersResult.rows[0].count} active)`);

    // Count by role
    const rolesResult = await pool.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      WHERE is_active = true 
      GROUP BY role 
      ORDER BY count DESC
    `);
    rolesResult.rows.forEach(row => {
      console.log(`   - ${row.role}: ${row.count}`);
    });

    // Count listings
    const listingsResult = await pool.query('SELECT COUNT(*) as count FROM listings');
    const activeListingsResult = await pool.query("SELECT COUNT(*) as count FROM listings WHERE status = 'active'");
    console.log(`\n📦 Listings: ${listingsResult.rows[0].count} (${activeListingsResult.rows[0].count} active)`);

    // Count inquiries
    const inquiriesResult = await pool.query('SELECT COUNT(*) as count FROM inquiries');
    const pendingInquiriesResult = await pool.query("SELECT COUNT(*) as count FROM inquiries WHERE status = 'pending'");
    console.log(`💬 Inquiries: ${inquiriesResult.rows[0].count} (${pendingInquiriesResult.rows[0].count} pending)`);

    // Count regions
    const regionsResult = await pool.query('SELECT COUNT(*) as count FROM regions');
    console.log(`🌍 Regions: ${regionsResult.rows[0].count}`);

    // Count crops
    const cropsResult = await pool.query('SELECT COUNT(*) as count FROM crops');
    console.log(`🌾 Crops: ${cropsResult.rows[0].count}`);

    // Count market prices
    const pricesResult = await pool.query('SELECT COUNT(*) as count FROM market_prices');
    console.log(`💰 Market Prices: ${pricesResult.rows[0].count}`);

    console.log('\n================================');
    console.log('✅ All checks passed!\n');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Health check failed:', error.message);
    process.exit(1);
  }
}

healthCheck();
