/**
 * Authentication Integration Tests
 * Tests for login and registration endpoints
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/server.js'; // We'll need to export app from server.js

describe('Authentication API Integration', () => {
  const testUser = {
    phone: '0977777777',
    password: 'TestPass123',
    full_name: 'Test User',
    role: 'farmer',
    region_id: 1,
    preferred_lang: 'en'
  };

  describe('POST /api/auth/register', () => {
    test('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.phone).toBe(testUser.phone);
      expect(response.body.user.role).toBe(testUser.role);
    });

    test('should reject duplicate phone number', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already registered');
    });

    test('should reject invalid phone format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, phone: '1234567890' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, phone: '0988888888', password: '123' })
        .expect(400);

      expect(response.body.error).toContain('at least 6 characters');
    });

    test('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ phone: '0999999999' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phone: testUser.phone,
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.phone).toBe(testUser.phone);
    });

    test('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phone: testUser.phone,
          password: 'WrongPassword'
        })
        .expect(401);

      expect(response.body.error).toContain('Invalid');
    });

    test('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '0900000000',
          password: 'SomePassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    test('should reject missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ phone: '0966666666' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Token Verification', () => {
    let token;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phone: testUser.phone,
          password: testUser.password
        });
      
      token = response.body.token;
    });

    test('should accept valid token', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });

    test('should reject invalid token', async () => {
      await request(app)
        .get('/api/dashboard')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    test('should reject missing token', async () => {
      await request(app)
        .get('/api/dashboard')
        .expect(401);
    });
  });
});
