/**
 * @file index.js
 * @description Validates JavaScript objects against JSON-Schema-like schemas.
 * @module schema-validator
 * @author idirdev
 */

'use strict';

/**
 * Regular expression patterns for string format validation.
 * @type {Object.<string, RegExp>}
 */
const FORMATS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/[^\s/$.?#].[^\s]*$/i,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  date: /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/,
  ipv4: /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
  ipv6: /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$|^[0-9a-fA-F]{1,4}::(?:[0-9a-fA-F]{1,4}:){0,5}[0-9a-fA-F]{1,4}$/,
};

/**
 * Formats a validation error object.
 * @param {string} path - Dot-notation path to the invalid field.
 * @param {string} message - Human-readable error message.
 * @param {*} value - The actual value that failed validation.
 * @returns {{ path: string, message: string, value: * }}
 */
function formatError(path, message, value) {
  return { path: path || '(root)', message, value };
}

/**
 * Validates a value's type against a JSON schema type string.
 * Supports: string, number, integer, boolean, array, object, null.
 * @param {*} value - Value to check.
 * @param {string} type - Expected type.
 * @returns {boolean} True if the value matches the type.
 */
function validateType(value, type) {
  switch (type) {
    case 'string': return typeof value === 'string';
    case 'number': return typeof value === 'number' && !Number.isNaN(value);
    case 'integer': return Number.isInteger(value);
    case 'boolean': return typeof value === 'boolean';
    case 'array': return Array.isArray(value);
    case 'object': return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'null': return value === null;
    default: return true;
  }
}

/**
 * Recursively validates a value against a schema and accumulates errors.
 * @param {*} data - The value to validate.
 * @param {Object} schema - The schema to validate against.
 * @param {string} path - Current dot-notation path (for error messages).
 * @param {Array} errors - Mutable array to push errors into.
 */
function _validate(data, schema, path, errors) {
  if (schema === true) return;
  if (schema === false) {
    errors.push(formatError(path, 'No additional properties allowed', data));
    return;
  }

  // ── type ────────────────────────────────────────────────────────────────────
  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const typeOk = types.some(t => validateType(data, t));
    if (!typeOk) {
      errors.push(formatError(path, `Expected type "${schema.type}", got "${Array.isArray(data) ? 'array' : data === null ? 'null' : typeof data}"`, data));
      return; // further checks are meaningless if type is wrong
    }
  }

  // ── enum ────────────────────────────────────────────────────────────────────
  if (schema.enum !== undefined) {
    if (!schema.enum.includes(data)) {
      errors.push(formatError(path, `Value must be one of [${schema.enum.join(', ')}]`, data));
    }
  }

  // ── const ───────────────────────────────────────────────────────────────────
  if (schema.const !== undefined && data !== schema.const) {
    errors.push(formatError(path, `Value must be ${JSON.stringify(schema.const)}`, data));
  }

  // ── string validators ───────────────────────────────────────────────────────
  if (typeof data === 'string') {
    if (schema.minLength !== undefined && data.length < schema.minLength) {
      errors.push(formatError(path, `String must be at least ${schema.minLength} characters long`, data));
    }
    if (schema.maxLength !== undefined && data.length > schema.maxLength) {
      errors.push(formatError(path, `String must be at most ${schema.maxLength} characters long`, data));
    }
    if (schema.pattern !== undefined) {
      const re = schema.pattern instanceof RegExp ? schema.pattern : new RegExp(schema.pattern);
      if (!re.test(data)) {
        errors.push(formatError(path, `String does not match pattern ${schema.pattern}`, data));
      }
    }
    if (schema.format !== undefined) {
      const re = FORMATS[schema.format];
      if (re && !re.test(data)) {
        errors.push(formatError(path, `String does not match format "${schema.format}"`, data));
      }
    }
  }

  // ── number validators ───────────────────────────────────────────────────────
  if (typeof data === 'number' && !Number.isNaN(data)) {
    if (schema.minimum !== undefined && data < schema.minimum) {
      errors.push(formatError(path, `Value ${data} is less than minimum ${schema.minimum}`, data));
    }
    if (schema.maximum !== undefined && data > schema.maximum) {
      errors.push(formatError(path, `Value ${data} exceeds maximum ${schema.maximum}`, data));
    }
    if (schema.multipleOf !== undefined && data % schema.multipleOf !== 0) {
      errors.push(formatError(path, `Value ${data} is not a multiple of ${schema.multipleOf}`, data));
    }
  }

  // ── array validators ────────────────────────────────────────────────────────
  if (Array.isArray(data)) {
    if (schema.minItems !== undefined && data.length < schema.minItems) {
      errors.push(formatError(path, `Array must have at least ${schema.minItems} items`, data));
    }
    if (schema.maxItems !== undefined && data.length > schema.maxItems) {
      errors.push(formatError(path, `Array must have at most ${schema.maxItems} items`, data));
    }
    if (schema.uniqueItems) {
      const seen = new Set();
      let hasDupe = false;
      for (const item of data) {
        const key = JSON.stringify(item);
        if (seen.has(key)) { hasDupe = true; break; }
        seen.add(key);
      }
      if (hasDupe) {
        errors.push(formatError(path, 'Array items must be unique', data));
      }
    }
    if (schema.items !== undefined) {
      data.forEach((item, idx) => {
        _validate(item, schema.items, path ? `${path}[${idx}]` : `[${idx}]`, errors);
      });
    }
  }

  // ── object validators ───────────────────────────────────────────────────────
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    if (schema.required !== undefined) {
      for (const key of schema.required) {
        if (!Object.prototype.hasOwnProperty.call(data, key)) {
          errors.push(formatError(path ? `${path}.${key}` : key, `Required property "${key}" is missing`, undefined));
        }
      }
    }
    if (schema.properties !== undefined) {
      for (const [key, subSchema] of Object.entries(schema.properties)) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          _validate(data[key], subSchema, path ? `${path}.${key}` : key, errors);
        }
      }
    }
    if (schema.additionalProperties !== undefined && schema.properties !== undefined) {
      const knownKeys = new Set(Object.keys(schema.properties));
      for (const key of Object.keys(data)) {
        if (!knownKeys.has(key)) {
          _validate(data[key], schema.additionalProperties, path ? `${path}.${key}` : key, errors);
        }
      }
    }
  }
}

/**
 * Validates data against a schema.
 * @param {*} data - The value to validate.
 * @param {Object} schema - The validation schema.
 * @returns {{ valid: boolean, errors: Array<{path: string, message: string, value: *}> }}
 *   Result object with a boolean validity flag and an array of error descriptors.
 *
 * @example
 * const { valid, errors } = validate({ name: 'Alice', age: 30 }, {
 *   type: 'object',
 *   required: ['name', 'age'],
 *   properties: {
 *     name: { type: 'string', minLength: 1 },
 *     age:  { type: 'integer', minimum: 0 },
 *   },
 * });
 */
function validate(data, schema) {
  const errors = [];
  _validate(data, schema, '', errors);
  return { valid: errors.length === 0, errors };
}

module.exports = { validate, validateType, formatError, FORMATS };
