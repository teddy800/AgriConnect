/**
 * Knex Migration Configuration
 * Supports development, test, and production environments
 */

import 'dotenv/config';

const baseConfig = {
  client: 'postgresql',
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations',
    extension: 'js',
    loadExtensions: ['.js']
  },
  seeds: {
    directory: './seeds'
  }
};

const config = {
  development: {
    ...baseConfig,
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'agriconnect',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    },
    pool: {
      min: 2,
      max: 10
    }
  },

  test: {
    ...baseConfig,
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: 'agriconnect_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    },
    pool: {
      min: 1,
      max: 5
    }
  },

  production: {
    ...baseConfig,
    connection: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    },
    pool: {
      min: 2,
      max: 20
    }
  }
};

export default config;
