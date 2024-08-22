export type SchemaType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'union' | 'literal' | 'enum' | 'any';

export interface ValidationError {
  path: string[];
  message: string;
  expected?: string;
  received?: string;
  code: ErrorCode;
}

export type ErrorCode =
  | 'invalid_type'
  | 'too_small'
  | 'too_big'
  | 'invalid_string'
  | 'invalid_enum'
  | 'unrecognized_keys'
  | 'missing_keys'
  | 'custom'
  | 'invalid_union';

export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors: ValidationError[];
}

export interface BaseSchema<T = unknown> {
  type: SchemaType;
  optional?: boolean;
  nullable?: boolean;
  defaultValue?: T;
  transforms?: Array<(value: T) => T>;
  refinements?: Array<{ check: (value: T) => boolean; message: string }>;
  description?: string;
}

export interface StringSchema extends BaseSchema<string> {
  type: 'string';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  format?: 'email' | 'url' | 'uuid';
  enumValues?: string[];
  trim?: boolean;
  lowercase?: boolean;
}

export interface NumberSchema extends BaseSchema<number> {
  type: 'number';
  min?: number;
  max?: number;
  integer?: boolean;
  positive?: boolean;
  negative?: boolean;
  multipleOf?: number;
}

export interface BooleanSchema extends BaseSchema<boolean> {
  type: 'boolean';
}

export interface ObjectSchema<T extends Record<string, AnySchema> = Record<string, AnySchema>> extends BaseSchema<Record<string, unknown>> {
  type: 'object';
  shape: T;
  additionalProperties?: boolean;
  strict?: boolean;
}

export interface ArraySchema<T extends AnySchema = AnySchema> extends BaseSchema<unknown[]> {
  type: 'array';
  items: T;
  minItems?: number;
  maxItems?: number;
  unique?: boolean;
  nonempty?: boolean;
}

export interface UnionSchema extends BaseSchema<unknown> {
  type: 'union';
  schemas: AnySchema[];
}

export interface LiteralSchema<T extends string | number | boolean = string | number | boolean> extends BaseSchema<T> {
  type: 'literal';
  value: T;
}

export interface EnumSchema extends BaseSchema<string> {
  type: 'enum';
  values: string[];
}

export type AnySchema =
  | StringSchema
  | NumberSchema
  | BooleanSchema
  | ObjectSchema
  | ArraySchema
  | UnionSchema
  | LiteralSchema
  | EnumSchema
  | BaseSchema;
