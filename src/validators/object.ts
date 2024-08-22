import { ObjectSchema, AnySchema, ValidationError } from '../types';
import { validateAny } from '../validate';

export function validateObject(
  schema: ObjectSchema,
  value: unknown,
  path: string[]
): { value: Record<string, unknown> | null; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    errors.push({
      path,
      message: `Expected object, received ${value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value}`,
      code: 'invalid_type',
      expected: 'object',
      received: typeof value,
    });
    return { value: null, errors };
  }

  const input = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  const shapeKeys = Object.keys(schema.shape);
  const inputKeys = Object.keys(input);

  // Check for required keys
  for (const key of shapeKeys) {
    const fieldSchema = schema.shape[key];
    const fieldValue = input[key];

    if (fieldValue === undefined) {
      if (fieldSchema.optional) {
        if (fieldSchema.defaultValue !== undefined) {
          result[key] = fieldSchema.defaultValue;
        }
        continue;
      }
      errors.push({
        path: [...path, key],
        message: `Required field "${key}" is missing`,
        code: 'missing_keys',
      });
      continue;
    }

    const fieldResult = validateAny(fieldSchema, fieldValue, [...path, key]);
    errors.push(...fieldResult.errors);
    if (fieldResult.value !== undefined && fieldResult.value !== null) {
      result[key] = fieldResult.value;
    } else if (fieldResult.errors.length === 0) {
      result[key] = fieldValue;
    }
  }

  // Check for additional properties
  if (schema.strict || schema.additionalProperties === false) {
    for (const key of inputKeys) {
      if (!shapeKeys.includes(key)) {
        errors.push({
          path: [...path, key],
          message: `Unrecognized key "${key}"`,
          code: 'unrecognized_keys',
        });
      }
    }
  } else {
    // Pass through additional properties
    for (const key of inputKeys) {
      if (!shapeKeys.includes(key)) {
        result[key] = input[key];
      }
    }
  }

  return { value: errors.length === 0 ? result : null, errors };
}

export function pickSchema(schema: ObjectSchema, keys: string[]): ObjectSchema {
  const newShape: Record<string, AnySchema> = {};
  for (const key of keys) {
    if (schema.shape[key]) {
      newShape[key] = schema.shape[key];
    }
  }
  return { ...schema, shape: newShape };
}

export function omitSchema(schema: ObjectSchema, keys: string[]): ObjectSchema {
  const newShape: Record<string, AnySchema> = {};
  for (const [key, value] of Object.entries(schema.shape)) {
    if (!keys.includes(key)) {
      newShape[key] = value;
    }
  }
  return { ...schema, shape: newShape };
}

export function extendSchema(base: ObjectSchema, extension: Record<string, AnySchema>): ObjectSchema {
  return { ...base, shape: { ...base.shape, ...extension } };
}

export function mergeSchemas(a: ObjectSchema, b: ObjectSchema): ObjectSchema {
  return { ...a, shape: { ...a.shape, ...b.shape }, strict: a.strict || b.strict };
}
