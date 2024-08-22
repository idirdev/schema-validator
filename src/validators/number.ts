import { NumberSchema, ValidationError } from '../types';

export function validateNumber(schema: NumberSchema, value: unknown, path: string[]): { value: number | null; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (typeof value !== 'number' || Number.isNaN(value)) {
    errors.push({ path, message: `Expected number, received ${typeof value}`, code: 'invalid_type', expected: 'number', received: typeof value });
    return { value: null, errors };
  }

  if (schema.integer && !Number.isInteger(value)) {
    errors.push({ path, message: 'Expected integer', code: 'invalid_type' });
  }

  if (schema.positive && value <= 0) {
    errors.push({ path, message: 'Number must be positive', code: 'too_small' });
  }

  if (schema.negative && value >= 0) {
    errors.push({ path, message: 'Number must be negative', code: 'too_big' });
  }

  if (schema.min !== undefined && value < schema.min) {
    errors.push({ path, message: `Number must be >= ${schema.min}`, code: 'too_small' });
  }

  if (schema.max !== undefined && value > schema.max) {
    errors.push({ path, message: `Number must be <= ${schema.max}`, code: 'too_big' });
  }

  if (schema.multipleOf !== undefined && value % schema.multipleOf !== 0) {
    errors.push({ path, message: `Number must be a multiple of ${schema.multipleOf}`, code: 'custom' });
  }

  return { value: errors.length === 0 ? value : null, errors };
}
