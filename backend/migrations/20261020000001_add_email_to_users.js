/**
 * Add email column to users table
 * Allow users to login with email or phone
 */

export function up(knex) {
  return knex.schema.table('users', function(table) {
    table.string('email', 255).unique().nullable();
  });
}

export function down(knex) {
  return knex.schema.table('users', function(table) {
    table.dropColumn('email');
  });
}
