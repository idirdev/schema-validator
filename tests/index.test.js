/**
 * @file test.js
 * @description Tests for schema-validator: type checks, string formats,
 *   nested objects, arrays, required fields, and error message paths.
 * @author idirdev
 */

'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validate, validateType, formatError } = require('../src/index.js');

describe('validateType', () => {
  it('identifies string correctly', () => {
    assert.equal(validateType('hello', 'string'), true);
    assert.equal(validateType(42, 'string'), false);
  });
  it('identifies integer vs number', () => {
    assert.equal(validateType(3, 'integer'), true);
    assert.equal(validateType(3.5, 'integer'), false);
    assert.equal(validateType(3.5, 'number'), true);
  });
  it('identifies boolean', () => {
    assert.equal(validateType(true, 'boolean'), true);
    assert.equal(validateType(1, 'boolean'), false);
  });
  it('identifies array and object', () => {
    assert.equal(validateType([], 'array'), true);
    assert.equal(validateType({}, 'object'), true);
    assert.equal(validateType([], 'object'), false);
  });
  it('identifies null', () => {
    assert.equal(validateType(null, 'null'), true);
    assert.equal(validateType(0, 'null'), false);
  });
});

describe('formatError', () => {
  it('returns correct shape', () => {
    const err = formatError('user.email', 'Invalid format', 'notanemail');
    assert.equal(err.path, 'user.email');
    assert.ok(err.message.length > 0);
    assert.equal(err.value, 'notanemail');
  });
  it('uses (root) for empty path', () => {
    const err = formatError('', 'bad', null);
    assert.equal(err.path, '(root)');
  });
});

describe('type validation', () => {
  it('passes for correct type', () => {
    assert.equal(validate('hello', { type: 'string' }).valid, true);
    assert.equal(validate(42, { type: 'number' }).valid, true);
    assert.equal(validate(true, { type: 'boolean' }).valid, true);
    assert.equal(validate(null, { type: 'null' }).valid, true);
    assert.equal(validate([], { type: 'array' }).valid, true);
    assert.equal(validate({}, { type: 'object' }).valid, true);
  });
  it('fails for wrong type and includes an error', () => {
    const { valid, errors } = validate(42, { type: 'string' });
    assert.equal(valid, false);
    assert.ok(errors.length > 0);
    assert.ok(errors[0].message.includes('string'));
  });
});

describe('string validators', () => {
  it('minLength / maxLength', () => {
    assert.equal(validate('hi', { type: 'string', minLength: 3 }).valid, false);
    assert.equal(validate('hello', { type: 'string', minLength: 3, maxLength: 10 }).valid, true);
    assert.equal(validate('toolongstring', { type: 'string', maxLength: 5 }).valid, false);
  });
  it('pattern', () => {
    assert.equal(validate('abc123', { type: 'string', pattern: '^[a-z]+\\d+$' }).valid, true);
    assert.equal(validate('ABC', { type: 'string', pattern: '^[a-z]+$' }).valid, false);
  });
});

describe('string formats', () => {
  it('email', () => {
    assert.equal(validate('user@example.com', { type: 'string', format: 'email' }).valid, true);
    assert.equal(validate('notanemail', { type: 'string', format: 'email' }).valid, false);
  });
  it('url', () => {
    assert.equal(validate('https://example.com', { type: 'string', format: 'url' }).valid, true);
    assert.equal(validate('ftp://bad', { type: 'string', format: 'url' }).valid, false);
  });
  it('uuid', () => {
    assert.equal(validate('550e8400-e29b-41d4-a716-446655440000', { type: 'string', format: 'uuid' }).valid, true);
    assert.equal(validate('not-a-uuid', { type: 'string', format: 'uuid' }).valid, false);
  });
  it('date', () => {
    assert.equal(validate('2024-01-15', { type: 'string', format: 'date' }).valid, true);
    assert.equal(validate('2024-13-01', { type: 'string', format: 'date' }).valid, false);
  });
  it('ipv4', () => {
    assert.equal(validate('192.168.1.1', { type: 'string', format: 'ipv4' }).valid, true);
    assert.equal(validate('999.999.999.999', { type: 'string', format: 'ipv4' }).valid, false);
  });
});

describe('number validators', () => {
  it('minimum / maximum', () => {
    assert.equal(validate(5, { type: 'number', minimum: 1, maximum: 10 }).valid, true);
    assert.equal(validate(0, { type: 'number', minimum: 1 }).valid, false);
    assert.equal(validate(11, { type: 'number', maximum: 10 }).valid, false);
  });
  it('multipleOf', () => {
    assert.equal(validate(9, { type: 'integer', multipleOf: 3 }).valid, true);
    assert.equal(validate(7, { type: 'integer', multipleOf: 3 }).valid, false);
  });
});

describe('array validators', () => {
  it('minItems / maxItems', () => {
    assert.equal(validate([1, 2], { type: 'array', minItems: 1, maxItems: 3 }).valid, true);
    assert.equal(validate([], { type: 'array', minItems: 1 }).valid, false);
    assert.equal(validate([1, 2, 3, 4], { type: 'array', maxItems: 3 }).valid, false);
  });
  it('uniqueItems', () => {
    assert.equal(validate([1, 2, 3], { type: 'array', uniqueItems: true }).valid, true);
    assert.equal(validate([1, 2, 1], { type: 'array', uniqueItems: true }).valid, false);
  });
  it('items schema', () => {
    assert.equal(validate([1, 2, 3], { type: 'array', items: { type: 'number' } }).valid, true);
    const { valid, errors } = validate([1, 'x', 3], { type: 'array', items: { type: 'number' } });
    assert.equal(valid, false);
    assert.ok(errors[0].path.includes('[1]'));
  });
});

describe('object validators', () => {
  it('required fields', () => {
    const schema = { type: 'object', required: ['name', 'age'] };
    assert.equal(validate({ name: 'Alice', age: 30 }, schema).valid, true);
    const { valid, errors } = validate({ name: 'Alice' }, schema);
    assert.equal(valid, false);
    assert.ok(errors.some(e => e.message.includes('age')));
  });
  it('properties validation', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1 },
        age: { type: 'integer', minimum: 0 },
      },
    };
    assert.equal(validate({ name: 'Bob', age: 25 }, schema).valid, true);
    assert.equal(validate({ name: '', age: 25 }, schema).valid, false);
    assert.equal(validate({ name: 'Bob', age: -1 }, schema).valid, false);
  });
  it('nested objects', () => {
    const schema = {
      type: 'object',
      properties: {
        address: {
          type: 'object',
          required: ['city'],
          properties: {
            city: { type: 'string' },
            zip: { type: 'string', pattern: '^\\d{5}$' },
          },
        },
      },
    };
    assert.equal(validate({ address: { city: 'Paris', zip: '75001' } }, schema).valid, true);
    const { valid, errors } = validate({ address: { zip: '75001' } }, schema);
    assert.equal(valid, false);
    assert.ok(errors.some(e => e.path.includes('city')));
  });
  it('additionalProperties false rejects extra keys', () => {
    const schema = {
      type: 'object',
      properties: { name: { type: 'string' } },
      additionalProperties: false,
    };
    assert.equal(validate({ name: 'Alice' }, schema).valid, true);
    assert.equal(validate({ name: 'Alice', extra: 1 }, schema).valid, false);
  });
});

describe('error paths', () => {
  it('reports dot-notation path for nested failures', () => {
    const schema = {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
          },
        },
      },
    };
    const { errors } = validate({ user: { email: 'bad' } }, schema);
    assert.ok(errors.length > 0);
    assert.ok(errors[0].path.includes('user'));
    assert.ok(errors[0].path.includes('email'));
  });
});
