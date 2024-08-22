import {
  AnySchema,
  ValidationResult,
  ValidationError,
  StringSchema,
  NumberSchema,
  ObjectSchema,
  ArraySchema,
  UnionSchema,
  LiteralSchema,
  EnumSchema,
} from './types';
import { validateString } from './validators/string';
import { validateNumber } from './validators/number';
import { validateObject } from './validators/object';
import { validateArray } from './validators/array';
import { applyCommon, applyTransforms, applyRefinements } from './validators/common';

export function validateAny(schema: AnySchema, data: unknown, path: string[] = []): { value: unknown; errors: ValidationError[] } {
  // Handle common checks (null, undefined, defaults)
  const common = applyCommon(schema, data, path);
  if (common.skip) return { value: common.value, errors: common.errors };

  const value = common.value;
  let errors: ValidationError[] = [];
  let result: unknown = value;

  switch (schema.type) {
    case 'string': {
      const r = validateString(schema as StringSchema, value, path);
      errors = r.errors;
      result = r.value ?? value;
      if (errors.length === 0) result = applyTransforms(schema as StringSchema, result as string);
      break;
    }
    case 'number': {
      const r = validateNumber(schema as NumberSchema, value, path);
      errors = r.errors;
      result = r.value ?? value;
      if (errors.length === 0) result = applyTransforms(schema as NumberSchema, result as number);
      break;
    }
    case 'boolean': {
      if (typeof value !== 'boolean') {
        errors.push({ path, message: `Expected boolean, received ${typeof value}`, code: 'invalid_type', expected: 'boolean', received: typeof value });
      }
      result = value;
      break;
    }
    case 'object': {
      const r = validateObject(schema as ObjectSchema, value, path);
      errors = r.errors;
      result = r.value ?? value;
      break;
    }
    case 'array': {
      const r = validateArray(schema as ArraySchema, value, path);
      errors = r.errors;
      result = r.value ?? value;
      break;
    }
    case 'union': {
      const unionSchema = schema as UnionSchema;
      let matched = false;
      for (const sub of unionSchema.schemas) {
        const r = validateAny(sub, value, path);
        if (r.errors.length === 0) {
          result = r.value;
          matched = true;
          break;
        }
      }
      if (!matched) {
        errors.push({ path, message: 'Value does not match any schema in union', code: 'invalid_union' });
      }
      break;
    }
    case 'literal': {
      const litSchema = schema as LiteralSchema;
      if (value !== litSchema.value) {
        errors.push({ path, message: `Expected literal ${JSON.stringify(litSchema.value)}, received ${JSON.stringify(value)}`, code: 'invalid_type' });
      }
      result = value;
      break;
    }
    case 'enum': {
      const enumSchema = schema as EnumSchema;
      if (typeof value !== 'string' || !enumSchema.values.includes(value)) {
        errors.push({ path, message: `Value must be one of: ${enumSchema.values.join(', ')}`, code: 'invalid_enum' });
      }
      result = value;
      break;
    }
    case 'any': {
      result = value;
      break;
    }
    default: {
      errors.push({ path, message: `Unknown schema type: ${schema.type}`, code: 'invalid_type' });
    }
  }

  // Apply refinements after type validation
  if (errors.length === 0 && schema.refinements) {
    errors.push(...applyRefinements(schema, result, path));
  }

  return { value: errors.length === 0 ? result : undefined, errors };
}

export function validate<T = unknown>(schema: AnySchema, data: unknown): ValidationResult<T> {
  const { value, errors } = validateAny(schema, data, []);
  return {
    success: errors.length === 0,
    data: errors.length === 0 ? (value as T) : undefined,
    errors,
  };
}

export function validateOrThrow<T = unknown>(schema: AnySchema, data: unknown): T {
  const result = validate<T>(schema, data);
  if (!result.success) {
    const messages = result.errors.map((e) => {
      const pathStr = e.path.length > 0 ? `at "${e.path.join('.')}"` : 'at root';
      return `${pathStr}: ${e.message}`;
    });
    throw new Error(`Validation failed:\n${messages.join('\n')}`);
  }
  return result.data as T;
}
