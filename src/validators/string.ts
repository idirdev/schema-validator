import { StringSchema, ValidationError } from '../types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateString(schema: StringSchema, value: unknown, path: string[]): { value: string | null; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (typeof value !== 'string') {
    errors.push({ path, message: `Expected string, received ${typeof value}`, code: 'invalid_type', expected: 'string', received: typeof value });
    return { value: null, errors };
  }

  let str = value;

  // Apply pre-validation transforms
  if (schema.trim) str = str.trim();
  if (schema.lowercase) str = str.toLowerCase();

  if (schema.minLength !== undefined && str.length < schema.minLength) {
    errors.push({ path, message: `String must be at least ${schema.minLength} characters`, code: 'too_small' });
  }

  if (schema.maxLength !== undefined && str.length > schema.maxLength) {
    errors.push({ path, message: `String must be at most ${schema.maxLength} characters`, code: 'too_big' });
  }

  if (schema.pattern && !schema.pattern.test(str)) {
    errors.push({ path, message: `String does not match pattern ${schema.pattern}`, code: 'invalid_string' });
  }

  if (schema.format === 'email' && !EMAIL_REGEX.test(str)) {
    errors.push({ path, message: 'Invalid email format', code: 'invalid_string' });
  }

  if (schema.format === 'url' && !URL_REGEX.test(str)) {
    errors.push({ path, message: 'Invalid URL format', code: 'invalid_string' });
  }

  if (schema.format === 'uuid' && !UUID_REGEX.test(str)) {
    errors.push({ path, message: 'Invalid UUID format', code: 'invalid_string' });
  }

  if (schema.enumValues && !schema.enumValues.includes(str)) {
    errors.push({ path, message: `Value must be one of: ${schema.enumValues.join(', ')}`, code: 'invalid_enum' });
  }

  return { value: errors.length === 0 ? str : null, errors };
}
