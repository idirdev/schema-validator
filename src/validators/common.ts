import { AnySchema, ValidationError } from '../types';

export function applyCommon(
  schema: AnySchema,
  value: unknown,
  path: string[]
): { value: unknown; errors: ValidationError[]; skip: boolean } {
  const errors: ValidationError[] = [];

  // Handle null
  if (value === null) {
    if (schema.nullable) {
      return { value: null, errors: [], skip: true };
    }
    errors.push({ path, message: 'Value cannot be null', code: 'invalid_type' });
    return { value: null, errors, skip: true };
  }

  // Handle undefined
  if (value === undefined) {
    if (schema.optional) {
      const resolved = schema.defaultValue !== undefined ? schema.defaultValue : undefined;
      return { value: resolved, errors: [], skip: true };
    }
    errors.push({ path, message: 'Value is required', code: 'invalid_type' });
    return { value: undefined, errors, skip: true };
  }

  return { value, errors: [], skip: false };
}

export function applyTransforms<T>(schema: { transforms?: Array<(value: T) => T> }, value: T): T {
  if (!schema.transforms || schema.transforms.length === 0) return value;
  let result = value;
  for (const transform of schema.transforms) {
    result = transform(result);
  }
  return result;
}

export function applyRefinements<T>(
  schema: { refinements?: Array<{ check: (value: T) => boolean; message: string }> },
  value: T,
  path: string[]
): ValidationError[] {
  if (!schema.refinements) return [];
  const errors: ValidationError[] = [];
  for (const refinement of schema.refinements) {
    if (!refinement.check(value)) {
      errors.push({ path, message: refinement.message, code: 'custom' });
    }
  }
  return errors;
}
