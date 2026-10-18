/**
 * Initial Schema Migration
 * Creates all core tables for AgriConnect
 */

export async function up(knex) {
  // Enable UUID extension
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // Regions table
  await knex.schema.createTable('regions', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable().unique();
    table.string('zone', 100);
    table.integer('population');
    table.decimal('area_km2', 10, 2);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index('name');
  });

  // Crops table
  await knex.schema.createTable('crops', (table) => {
    table.increments('id').primary();
    table.string('name_en', 100).notNullable();
    table.string('name_am', 100);
    table.string('name_om', 100);
    table.string('category', 50);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index('name_en');
    table.index('category');
  });

  // Markets table
  await knex.schema.createTable('markets', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable();
    table.integer('region_id').unsigned().references('id').inTable('regions').onDelete('SET NULL');
    table.string('location', 200);
    table.string('market_type', 50);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index('region_id');
    table.index('name');
  });

  // Users table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('phone', 10).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('full_name', 100).notNullable();
    table.enum('role', ['farmer', 'buyer', 'admin', 'agronomist']).notNullable();
    table.integer('region_id').unsigned().references('id').inTable('regions').onDelete('SET NULL');
    table.enum('preferred_lang', ['en', 'am', 'om']).defaultTo('en');
    table.boolean('is_verified').defaultTo(false);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('last_login');
    
    table.index('phone');
    table.index('role');
    table.index('region_id');
    table.index(['is_active'], 'idx_users_active', { predicate: knex.whereRaw('is_active = TRUE') });
  });

  // Add phone format check constraint
  await knex.raw(`
    ALTER TABLE users ADD CONSTRAINT chk_phone_format 
    CHECK (phone ~ '^(09|07)[0-9]{8}$')
  `);

  // Listings table
  await knex.schema.createTable('listings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('farmer_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('crop_id').unsigned().notNullable().references('id').inTable('crops').onDelete('RESTRICT');
    table.integer('region_id').unsigned().notNullable().references('id').inTable('regions').onDelete('RESTRICT');
    table.string('title', 200).notNullable();
    table.text('description');
    table.decimal('quantity', 10, 2).notNullable();
    table.enum('unit', ['kg', 'quintal', 'ton', 'piece']).notNullable();
    table.decimal('price_per_unit', 10, 2).notNullable();
    table.string('location_detail', 200);
    table.date('harvest_date');
    table.specificType('image_urls', 'text[]');
    table.enum('status', ['active', 'sold', 'expired', 'removed']).defaultTo('active');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index('farmer_id');
    table.index('crop_id');
    table.index('region_id');
    table.index('status');
    table.index('created_at');
  });

  // Add check constraints for listings
  await knex.raw('ALTER TABLE listings ADD CONSTRAINT chk_quantity_positive CHECK (quantity > 0)');
  await knex.raw('ALTER TABLE listings ADD CONSTRAINT chk_price_positive CHECK (price_per_unit > 0)');

  // Inquiries table
  await knex.schema.createTable('inquiries', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('listing_id').notNullable().references('id').inTable('listings').onDelete('CASCADE');
    table.uuid('buyer_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.decimal('quantity_wanted', 10, 2).notNullable();
    table.decimal('offered_price', 10, 2);
    table.text('message');
    table.enum('status', ['pending', 'accepted', 'rejected', 'completed']).defaultTo('pending');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index('listing_id');
    table.index('buyer_id');
    table.index('status');
  });

  // Market prices table
  await knex.schema.createTable('market_prices', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.integer('crop_id').unsigned().notNullable().references('id').inTable('crops').onDelete('CASCADE');
    table.integer('market_id').unsigned().notNullable().references('id').inTable('markets').onDelete('CASCADE');
    table.decimal('price', 10, 2).notNullable();
    table.string('unit', 20).notNullable();
    table.date('recorded_on').notNullable().defaultTo(knex.fn.now());
    table.uuid('recorded_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index('crop_id');
    table.index('market_id');
    table.index('recorded_on');
    table.unique(['crop_id', 'market_id', 'recorded_on']);
  });

  // Notifications table
  await knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('type', 50).notNullable();
    table.string('title', 200).notNullable();
    table.text('message');
    table.jsonb('data');
    table.boolean('is_read').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index('user_id');
    table.index(['user_id', 'is_read']);
    table.index('created_at');
  });

  // Create trigger for auto-updating updated_at
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await knex.raw(`
    CREATE TRIGGER listings_updated_at 
    BEFORE UPDATE ON listings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  `);

  await knex.raw(`
    CREATE TRIGGER inquiries_updated_at 
    BEFORE UPDATE ON inquiries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  `);
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('market_prices');
  await knex.schema.dropTableIfExists('inquiries');
  await knex.schema.dropTableIfExists('listings');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('markets');
  await knex.schema.dropTableIfExists('crops');
  await knex.schema.dropTableIfExists('regions');
  
  await knex.raw('DROP FUNCTION IF EXISTS update_updated_at CASCADE');
  await knex.raw('DROP EXTENSION IF EXISTS "uuid-ossp"');
}
