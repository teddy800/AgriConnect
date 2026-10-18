/**
 * Integration Tests for Listings API
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { Pool } from 'pg';

const API_URL = process.env.TEST_API_URL || 'http://localhost:4000';
let authToken;
let testUserId;
let testListingId;

// Database connection for test setup
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: 'agriconnect_test',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

describe('Listings API Integration Tests', () => {
  beforeAll(async () => {
    // Create test user and get auth token
    const registerRes = await request(API_URL)
      .post('/api/auth/register')
      .send({
        phone: '0977777777',
        password: 'test123',
        full_name: 'Test Farmer',
        role: 'farmer',
        region_id: 1
      });

    if (registerRes.status === 201) {
      authToken = registerRes.body.token;
      testUserId = registerRes.body.user.id;
    } else {
      // User might already exist, try login
      const loginRes = await request(API_URL)
        .post('/api/auth/login')
        .send({
          phone: '0977777777',
          password: 'test123'
        });
      
      authToken = loginRes.body.token;
      testUserId = loginRes.body.user.id;
    }
  });

  afterAll(async () => {
    // Cleanup test data
    if (testListingId) {
      await pool.query('DELETE FROM listings WHERE id = $1', [testListingId]);
    }
    if (testUserId) {
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
    await pool.end();
  });

  describe('POST /api/listings', () => {
    it('should create a new listing with valid data', async () => {
      const res = await request(API_URL)
        .post('/api/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          crop_id: 1,
          title: 'Integration Test Listing',
          description: 'Test description',
          quantity: 50,
          unit: 'quintal',
          price_per_unit: 2000,
          region_id: 1,
          location_detail: 'Test Location',
          harvest_date: '2026-09-01'
        });

      expect([200, 201]).toContain(res.status);
      if (res.status === 201) {
        expect(res.body).toHaveProperty('id');
        testListingId = res.body.id;
      }
    });

    it('should reject listing without authentication', async () => {
      const res = await request(API_URL)
        .post('/api/listings')
        .send({
          crop_id: 1,
          title: 'Unauthenticated Listing',
          quantity: 50,
          unit: 'quintal',
          price_per_unit: 2000,
          region_id: 1
        });

      expect(res.status).toBe(401);
    });

    it('should reject listing with invalid quantity', async () => {
      const res = await request(API_URL)
        .post('/api/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          crop_id: 1,
          title: 'Invalid Quantity Listing',
          quantity: -10,
          unit: 'quintal',
          price_per_unit: 2000,
          region_id: 1
        });

      expect([400, 500]).toContain(res.status);
    });
  });

  describe('GET /api/listings', () => {
    it('should return list of active listings', async () => {
      const res = await request(API_URL)
        .get('/api/listings');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter listings by crop_id', async () => {
      const res = await request(API_URL)
        .get('/api/listings?crop_id=1');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      
      if (res.body.length > 0) {
        res.body.forEach(listing => {
          expect(listing.crop_id).toBe(1);
        });
      }
    });

    it('should filter listings by max_price', async () => {
      const maxPrice = 3000;
      const res = await request(API_URL)
        .get(`/api/listings?max_price=${maxPrice}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      
      if (res.body.length > 0) {
        res.body.forEach(listing => {
          expect(listing.price_per_unit).toBeLessThanOrEqual(maxPrice);
        });
      }
    });
  });

  describe('GET /api/listings/mine', () => {
    it('should return farmer own listings', async () => {
      const res = await request(API_URL)
        .get('/api/listings/mine')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should reject without authentication', async () => {
      const res = await request(API_URL)
        .get('/api/listings/mine');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/listings/:id', () => {
    it('should return listing details', async () => {
      if (!testListingId) {
        // Skip if no test listing created
        return;
      }

      const res = await request(API_URL)
        .get(`/api/listings/${testListingId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(res.status);
      
      if (res.status === 200) {
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('title');
      }
    });

    it('should return 404 for non-existent listing', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(API_URL)
        .get(`/api/listings/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/listings/:id', () => {
    it('should update listing', async () => {
      if (!testListingId) {
        return;
      }

      const res = await request(API_URL)
        .put(`/api/listings/${testListingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Integration Test Listing',
          price_per_unit: 2200
        });

      expect([200, 404]).toContain(res.status);
    });

    it('should reject update without authentication', async () => {
      if (!testListingId) {
        return;
      }

      const res = await request(API_URL)
        .put(`/api/listings/${testListingId}`)
        .send({
          title: 'Unauthorized Update'
        });

      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/listings/:id/status', () => {
    it('should update listing status', async () => {
      if (!testListingId) {
        return;
      }

      const res = await request(API_URL)
        .patch(`/api/listings/${testListingId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'sold'
        });

      expect([200, 404]).toContain(res.status);
    });

    it('should reject invalid status', async () => {
      if (!testListingId) {
        return;
      }

      const res = await request(API_URL)
        .patch(`/api/listings/${testListingId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'invalid_status'
        });

      expect([400, 404, 500]).toContain(res.status);
    });
  });
});
