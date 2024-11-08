import { describe, it, expect } from 'vitest';
import { s } from '../src/schema';
import { validate, validateOrThrow } from '../src/validate';

describe('s.string()', () => {
  it('validates a string value', () => {
    const schema = s.string().build();
    const result = validate(schema, 'hello');
    expect(result.success).toBe(true);
    expect(result.data).toBe('hello');
  });

  it('rejects non-string values', () => {
    const schema = s.string().build();
    const result = validate(schema, 42);
    expect(result.success).toBe(false);
    expect(result.errors[0].code).toBe('invalid_type');
  });

  it('validates min length', () => {
    const schema = s.string().min(5).build();
    expect(validate(schema, 'hi').success).toBe(false);
    expect(validate(schema, 'hello').success).toBe(true);
  });

  it('validates max length', () => {
    const schema = s.string().max(3).build();
    expect(validate(schema, 'hi').success).toBe(true);
    expect(validate(schema, 'hello').success).toBe(false);
  });

  it('validates exact length', () => {
    const schema = s.string().length(4).build();
    expect(validate(schema, 'test').success).toBe(true);
    expect(validate(schema, 'hi').success).toBe(false);
    expect(validate(schema, 'toolong').success).toBe(false);
  });

  it('validates email format', () => {
    const schema = s.string().email().build();
    expect(validate(schema, 'user@example.com').success).toBe(true);
    expect(validate(schema, 'not-an-email').success).toBe(false);
  });

  it('validates url format', () => {
    const schema = s.string().url().build();
    expect(validate(schema, 'https://example.com').success).toBe(true);
    expect(validate(schema, 'not-a-url').success).toBe(false);
  });

  it('validates regex pattern', () => {
    const schema = s.string().pattern(/^\d{3}-\d{4}$/).build();
    expect(validate(schema, '123-4567').success).toBe(true);
    expect(validate(schema, 'abc').success).toBe(false);
  });

  it('applies trim transform', () => {
    const schema = s.string().trim().build();
    const result = validate(schema, '  hello  ');
    expect(result.success).toBe(true);
    expect(result.data).toBe('hello');
  });

  it('applies lowercase transform', () => {
    const schema = s.string().lowercase().build();
    const result = validate(schema, 'HELLO');
    expect(result.success).toBe(true);
    expect(result.data).toBe('hello');
  });

  it('validates oneOf', () => {
    const schema = s.string().oneOf(['a', 'b', 'c']).build();
    expect(validate(schema, 'a').success).toBe(true);
    expect(validate(schema, 'z').success).toBe(false);
  });
});

describe('s.number()', () => {
  it('validates a number value', () => {
    const schema = s.number().build();
    expect(validate(schema, 42).success).toBe(true);
  });

  it('rejects non-number values', () => {
    const schema = s.number().build();
    expect(validate(schema, 'hello').success).toBe(false);
  });

  it('validates min', () => {
    const schema = s.number().min(10).build();
    expect(validate(schema, 5).success).toBe(false);
    expect(validate(schema, 15).success).toBe(true);
  });

  it('validates max', () => {
    const schema = s.number().max(100).build();
    expect(validate(schema, 50).success).toBe(true);
    expect(validate(schema, 200).success).toBe(false);
  });

  it('validates integer', () => {
    const schema = s.number().int().build();
    expect(validate(schema, 5).success).toBe(true);
    expect(validate(schema, 5.5).success).toBe(false);
  });

  it('validates positive', () => {
    const schema = s.number().positive().build();
    expect(validate(schema, 5).success).toBe(true);
    expect(validate(schema, -1).success).toBe(false);
  });
});

describe('s.boolean()', () => {
  it('validates boolean values', () => {
    const schema = s.boolean();
    expect(validate(schema, true).success).toBe(true);
    expect(validate(schema, false).success).toBe(true);
  });

  it('rejects non-boolean values', () => {
    const schema = s.boolean();
    expect(validate(schema, 'true').success).toBe(false);
    expect(validate(schema, 1).success).toBe(false);
  });
});

describe('s.object()', () => {
  it('validates a simple object', () => {
    const schema = s.object({
      name: s.string().build(),
      age: s.number().build(),
    }).build();
    const result = validate(schema, { name: 'Alice', age: 30 });
    expect(result.success).toBe(true);
  });

  it('reports errors for missing required fields', () => {
    const schema = s.object({
      name: s.string().build(),
    }).build();
    const result = validate(schema, {});
    expect(result.success).toBe(false);
  });

  it('allows optional fields', () => {
    const schema = s.object({
      name: s.string().build(),
      bio: s.string().optional().build(),
    }).build();
    const result = validate(schema, { name: 'Alice' });
    expect(result.success).toBe(true);
  });
});

describe('s.array()', () => {
  it('validates an array of strings', () => {
    const schema = s.array(s.string().build()).build();
    const result = validate(schema, ['a', 'b', 'c']);
    expect(result.success).toBe(true);
  });

  it('rejects non-array values', () => {
    const schema = s.array(s.string().build()).build();
    expect(validate(schema, 'not array').success).toBe(false);
  });

  it('validates min items', () => {
    const schema = s.array(s.number().build()).min(2).build();
    expect(validate(schema, [1]).success).toBe(false);
    expect(validate(schema, [1, 2]).success).toBe(true);
  });
});

describe('s.literal()', () => {
  it('validates literal values', () => {
    const schema = s.literal('hello');
    expect(validate(schema, 'hello').success).toBe(true);
    expect(validate(schema, 'world').success).toBe(false);
  });

  it('validates numeric literals', () => {
    const schema = s.literal(42);
    expect(validate(schema, 42).success).toBe(true);
    expect(validate(schema, 43).success).toBe(false);
  });
});

describe('s.enum()', () => {
  it('validates enum values', () => {
    const schema = s.enum(['red', 'green', 'blue']);
    expect(validate(schema, 'red').success).toBe(true);
    expect(validate(schema, 'yellow').success).toBe(false);
  });
});

describe('s.union()', () => {
  it('matches any schema in the union', () => {
    const schema = s.union([s.string().build(), s.number().build()]);
    expect(validate(schema, 'hello').success).toBe(true);
    expect(validate(schema, 42).success).toBe(true);
    expect(validate(schema, true).success).toBe(false);
  });
});

describe('validateOrThrow', () => {
  it('returns data on success', () => {
    const schema = s.string().build();
    expect(validateOrThrow(schema, 'hello')).toBe('hello');
  });

  it('throws on validation failure', () => {
    const schema = s.string().build();
    expect(() => validateOrThrow(schema, 42)).toThrow('Validation failed');
  });
});
