import { ArraySchema, ValidationError } from '../types';
import { validateAny } from '../validate';

export function validateArray(
  schema: ArraySchema,
  value: unknown,
  path: string[]
): { value: unknown[] | null; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!Array.isArray(value)) {
    errors.push({
      path,
      message: `Expected array, received ${typeof value}`,
      code: 'invalid_type',
      expected: 'array',
      received: typeof value,
    });
    return { value: null, errors };
  }

  if (schema.nonempty && value.length === 0) {
    errors.push({ path, message: 'Array must not be empty', code: 'too_small' });
  }

  if (schema.minItems !== undefined && value.length < schema.minItems) {
    errors.push({ path, message: `Array must have at least ${schema.minItems} items`, code: 'too_small' });
  }

  if (schema.maxItems !== undefined && value.length > schema.maxItems) {
    errors.push({ path, message: `Array must have at most ${schema.maxItems} items`, code: 'too_big' });
  }

  if (schema.unique) {
    const seen = new Set();
    for (let i = 0; i < value.length; i++) {
      const serialized = JSON.stringify(value[i]);
      if (seen.has(serialized)) {
        errors.push({ path: [...path, String(i)], message: `Duplicate value at index ${i}`, code: 'custom' });
      }
      seen.add(serialized);
    }
  }

  const result: unknown[] = [];
  for (let i = 0; i < value.length; i++) {
    const itemResult = validateAny(schema.items, value[i], [...path, String(i)]);
    errors.push(...itemResult.errors);
    result.push(itemResult.value ?? value[i]);
  }

  return { value: errors.length === 0 ? result : null, errors };
}
