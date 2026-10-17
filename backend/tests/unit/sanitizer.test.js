/**
 * Input Sanitization Unit Tests
 * Tests for XSS protection and data sanitization
 */

import { describe, test, expect } from '@jest/globals';
import {
  sanitizeString,
  sanitizeObject,
  sanitizePhone,
  sanitizeInt,
  sanitizeFloat,
  detectSQLInjection
} from '../../src/middleware/sanitizer.js';

describe('Input Sanitization', () => {
  describe('String Sanitization', () => {
    test('should remove XSS attempts', () => {
      const malicious = '<script>alert("XSS")</script>Hello';
      const sanitized = sanitizeString(malicious);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });

    test('should trim whitespace', () => {
      const input = '  Hello World  ';
      const sanitized = sanitizeString(input);
      
      expect(sanitized).toBe('Hello World');
    });

    test('should normalize multiple spaces', () => {
      const input = 'Hello    World';
      const sanitized = sanitizeString(input);
      
      expect(sanitized).toBe('Hello World');
    });

    test('should handle empty strings', () => {
      expect(sanitizeString('')).toBe('');
      expect(sanitizeString('   ')).toBe('');
    });
  });

  describe('Object Sanitization', () => {
    test('should sanitize object properties', () => {
      const obj = {
        name: '<script>alert("xss")</script>John',
        description: '  Test description  ',
        age: 25
      };
      
      const sanitized = sanitizeObject(obj);
      
      expect(sanitized.name).not.toContain('<script>');
      expect(sanitized.description).toBe('Test description');
      expect(sanitized.age).toBe(25);
    });

    test('should sanitize nested objects', () => {
      const obj = {
        user: {
          name: '<b>Test</b>',
          email: '  test@example.com  '
        }
      };
      
      const sanitized = sanitizeObject(obj);
      
      expect(sanitized.user.name).not.toContain('<b>');
      expect(sanitized.user.email).toBe('test@example.com');
    });

    test('should sanitize arrays', () => {
      const obj = {
        tags: ['<script>bad</script>', '  good  ', 'normal']
      };
      
      const sanitized = sanitizeObject(obj);
      
      expect(sanitized.tags[0]).not.toContain('<script>');
      expect(sanitized.tags[1]).toBe('good');
      expect(sanitized.tags[2]).toBe('normal');
    });

    test('should exclude specified keys', () => {
      const obj = {
        password: 'secret123',
        name: '<b>Test</b>'
      };
      
      const sanitized = sanitizeObject(obj, ['password']);
      
      expect(sanitized.password).toBe('secret123');
      expect(sanitized.name).not.toContain('<b>');
    });
  });

  describe('Phone Number Sanitization', () => {
    test('should accept valid Ethiopian phone', () => {
      expect(sanitizePhone('0966666666')).toBe('0966666666');
      expect(sanitizePhone('0722222222')).toBe('0722222222');
    });

    test('should remove non-digit characters', () => {
      expect(sanitizePhone('096-666-6666')).toBe('0966666666');
      expect(sanitizePhone('(096) 666-6666')).toBe('0966666666');
    });

    test('should reject invalid phone numbers', () => {
      expect(() => sanitizePhone('1234567890')).toThrow();
      expect(() => sanitizePhone('096666')).toThrow();
      expect(() => sanitizePhone('08666666666')).toThrow();
    });
  });

  describe('Number Sanitization', () => {
    test('should parse valid integers', () => {
      expect(sanitizeInt('42')).toBe(42);
      expect(sanitizeInt(100)).toBe(100);
    });

    test('should enforce min/max bounds', () => {
      expect(() => sanitizeInt('5', 10, 20)).toThrow();
      expect(() => sanitizeInt('25', 10, 20)).toThrow();
      expect(sanitizeInt('15', 10, 20)).toBe(15);
    });

    test('should parse floats correctly', () => {
      expect(sanitizeFloat('3.14159', 0, 10, 2)).toBe(3.14);
      expect(sanitizeFloat('42.5')).toBe(42.5);
    });

    test('should reject invalid numbers', () => {
      expect(() => sanitizeInt('abc')).toThrow();
      expect(() => sanitizeFloat('not-a-number')).toThrow();
    });
  });

  describe('SQL Injection Detection', () => {
    test('should detect SQL keywords', () => {
      expect(detectSQLInjection("SELECT * FROM users")).toBe(true);
      expect(detectSQLInjection("DROP TABLE listings")).toBe(true);
      expect(detectSQLInjection("'; DELETE FROM users--")).toBe(true);
    });

    test('should detect OR/AND attacks', () => {
      expect(detectSQLInjection("' OR '1'='1")).toBe(true);
      expect(detectSQLInjection("admin' AND '1'='1")).toBe(true);
    });

    test('should allow safe input', () => {
      expect(detectSQLInjection("John Doe")).toBe(false);
      expect(detectSQLInjection("Fresh Teff 2026")).toBe(false);
      expect(detectSQLInjection("Price: 2800 ETB")).toBe(false);
    });
  });
});
