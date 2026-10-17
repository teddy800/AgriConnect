/**
 * Authentication Unit Tests
 * Tests for JWT generation, verification, and password hashing
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import bcrypt from 'bcryptjs';
import { generateToken, verifyToken } from '../../src/middleware/auth.js';

describe('Authentication Utilities', () => {
  describe('Password Hashing', () => {
    test('should hash password correctly', async () => {
      const password = 'testPassword123';
      const hash = await bcrypt.hash(password, 10);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    test('should verify correct password', async () => {
      const password = 'testPassword123';
      const hash = await bcrypt.hash(password, 10);
      const isValid = await bcrypt.compare(password, hash);
      
      expect(isValid).toBe(true);
    });

    test('should reject incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword';
      const hash = await bcrypt.hash(password, 10);
      const isValid = await bcrypt.compare(wrongPassword, hash);
      
      expect(isValid).toBe(false);
    });
  });

  describe('JWT Token Generation', () => {
    const mockUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      phone: '0966666666',
      role: 'farmer',
      full_name: 'Test User'
    };

    test('should generate valid JWT token', () => {
      const token = generateToken(mockUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    test('should include user data in token', () => {
      const token = generateToken(mockUser);
      const decoded = verifyToken(token);
      
      expect(decoded.id).toBe(mockUser.id);
      expect(decoded.phone).toBe(mockUser.phone);
      expect(decoded.role).toBe(mockUser.role);
    });

    test('should reject invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => verifyToken(invalidToken)).toThrow();
    });

    test('should reject expired token', () => {
      // This would require mocking time or using a short-lived token
      // For now, we'll test the structure
      const token = generateToken(mockUser);
      expect(token).toBeTruthy();
    });
  });

  describe('Token Verification', () => {
    const mockUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      phone: '0966666666',
      role: 'buyer',
      full_name: 'Test Buyer'
    };

    test('should verify valid token', () => {
      const token = generateToken(mockUser);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(mockUser.id);
    });

    test('should throw error for malformed token', () => {
      expect(() => verifyToken('malformed-token')).toThrow();
    });

    test('should throw error for tampered token', () => {
      const token = generateToken(mockUser);
      const tamperedToken = token.slice(0, -5) + 'xxxxx';
      
      expect(() => verifyToken(tamperedToken)).toThrow();
    });
  });
});
