import {
  StringSchema,
  NumberSchema,
  BooleanSchema,
  ObjectSchema,
  ArraySchema,
  UnionSchema,
  LiteralSchema,
  EnumSchema,
  AnySchema,
  BaseSchema,
} from './types';

class StringSchemaBuilder {
  private schema: StringSchema = { type: 'string' };

  min(n: number): this { this.schema.minLength = n; return this; }
  max(n: number): this { this.schema.maxLength = n; return this; }
  length(n: number): this { this.schema.minLength = n; this.schema.maxLength = n; return this; }
  pattern(re: RegExp): this { this.schema.pattern = re; return this; }
  email(): this { this.schema.format = 'email'; return this; }
  url(): this { this.schema.format = 'url'; return this; }
  uuid(): this { this.schema.format = 'uuid'; return this; }
  trim(): this { this.schema.trim = true; return this; }
  lowercase(): this { this.schema.lowercase = true; return this; }
  oneOf(values: string[]): this { this.schema.enumValues = values; return this; }
  optional(): this { this.schema.optional = true; return this; }
  nullable(): this { this.schema.nullable = true; return this; }
  default(value: string): this { this.schema.defaultValue = value; this.schema.optional = true; return this; }
  describe(desc: string): this { this.schema.description = desc; return this; }
  transform(fn: (v: string) => string): this {
    this.schema.transforms = [...(this.schema.transforms ?? []), fn]; return this;
  }
  refine(check: (v: string) => boolean, message: string): this {
    this.schema.refinements = [...(this.schema.refinements ?? []), { check, message }]; return this;
  }
  build(): StringSchema { return { ...this.schema }; }
}

class NumberSchemaBuilder {
  private schema: NumberSchema = { type: 'number' };

  min(n: number): this { this.schema.min = n; return this; }
  max(n: number): this { this.schema.max = n; return this; }
  int(): this { this.schema.integer = true; return this; }
  positive(): this { this.schema.positive = true; return this; }
  negative(): this { this.schema.negative = true; return this; }
  multipleOf(n: number): this { this.schema.multipleOf = n; return this; }
  optional(): this { this.schema.optional = true; return this; }
  nullable(): this { this.schema.nullable = true; return this; }
  default(value: number): this { this.schema.defaultValue = value; this.schema.optional = true; return this; }
  transform(fn: (v: number) => number): this {
    this.schema.transforms = [...(this.schema.transforms ?? []), fn]; return this;
  }
  refine(check: (v: number) => boolean, message: string): this {
    this.schema.refinements = [...(this.schema.refinements ?? []), { check, message }]; return this;
  }
  build(): NumberSchema { return { ...this.schema }; }
}

class ObjectSchemaBuilder<T extends Record<string, AnySchema>> {
  private schema: ObjectSchema<T>;
  constructor(shape: T) { this.schema = { type: 'object', shape } as ObjectSchema<T>; }

  strict(): this { this.schema.strict = true; this.schema.additionalProperties = false; return this; }
  passthrough(): this { this.schema.additionalProperties = true; return this; }
  optional(): this { this.schema.optional = true; return this; }
  nullable(): this { this.schema.nullable = true; return this; }
  build(): ObjectSchema<T> { return { ...this.schema }; }
}

class ArraySchemaBuilder<T extends AnySchema> {
  private schema: ArraySchema<T>;
  constructor(items: T) { this.schema = { type: 'array', items } as ArraySchema<T>; }

  min(n: number): this { this.schema.minItems = n; return this; }
  max(n: number): this { this.schema.maxItems = n; return this; }
  nonempty(): this { this.schema.nonempty = true; return this; }
  unique(): this { this.schema.unique = true; return this; }
  optional(): this { this.schema.optional = true; return this; }
  nullable(): this { this.schema.nullable = true; return this; }
  build(): ArraySchema<T> { return { ...this.schema }; }
}

export const s = {
  string(): StringSchemaBuilder { return new StringSchemaBuilder(); },
  number(): NumberSchemaBuilder { return new NumberSchemaBuilder(); },
  boolean(): BooleanSchema { return { type: 'boolean' }; },

  object<T extends Record<string, AnySchema>>(shape: T): ObjectSchemaBuilder<T> {
    return new ObjectSchemaBuilder(shape);
  },

  array<T extends AnySchema>(items: T): ArraySchemaBuilder<T> {
    return new ArraySchemaBuilder(items);
  },

  union(schemas: AnySchema[]): UnionSchema {
    return { type: 'union', schemas };
  },

  literal<T extends string | number | boolean>(value: T): LiteralSchema<T> {
    return { type: 'literal', value };
  },

  enum(values: string[]): EnumSchema {
    return { type: 'enum', values };
  },

  any(): BaseSchema {
    return { type: 'any' };
  },
};
