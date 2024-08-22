# schema-validator

[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-brightgreen.svg)]()

A lightweight, type-safe JSON schema validation library with a chainable API. Zero runtime dependencies.

## Features

- Chainable schema builder API (`s.string().min(3).email()`)
- Comprehensive type validators: string, number, boolean, object, array, union, literal, enum
- Collects all errors (not just the first one)
- Full path tracking for nested validation errors
- Transforms and refinements
- Nullable and optional support with defaults
- Object utilities: pick, omit, extend, merge

## Quick Start

```typescript
import { s, validate } from 'schema-validator';

const userSchema = s.object({
  name: s.string().min(2).max(50).build(),
  email: s.string().email().build(),
  age: s.number().int().positive().build(),
  role: s.enum(['admin', 'user', 'moderator']),
  tags: s.array(s.string().build()).nonempty().unique().build(),
}).strict().build();

const result = validate(userSchema, {
  name: 'Alice',
  email: 'alice@example.com',
  age: 30,
  role: 'admin',
  tags: ['typescript', 'node'],
});

if (result.success) {
  console.log('Valid:', result.data);
} else {
  console.log('Errors:', result.errors);
}
```

## API Reference

### String Schema

```typescript
s.string()
  .min(3)              // Minimum length
  .max(100)            // Maximum length
  .length(10)          // Exact length
  .pattern(/^[a-z]+$/) // Regex pattern
  .email()             // Email format
  .url()               // URL format
  .uuid()              // UUID format
  .trim()              // Trim whitespace
  .lowercase()         // Convert to lowercase
  .oneOf(['a', 'b'])   // Enum values
  .optional()          // Allow undefined
  .nullable()          // Allow null
  .default('hello')    // Default value
  .transform(v => v.toUpperCase())
  .refine(v => v.startsWith('A'), 'Must start with A')
  .build()
```

### Number Schema

```typescript
s.number()
  .min(0)              // Minimum value
  .max(100)            // Maximum value
  .int()               // Must be integer
  .positive()          // Must be > 0
  .negative()          // Must be < 0
  .multipleOf(5)       // Must be multiple of N
  .optional()
  .nullable()
  .default(0)
  .build()
```

### Object Schema

```typescript
s.object({
  name: s.string().build(),
  age: s.number().build(),
})
  .strict()            // Reject unknown keys
  .passthrough()       // Allow unknown keys
  .optional()
  .nullable()
  .build()
```

### Array Schema

```typescript
s.array(s.string().build())
  .min(1)              // Minimum items
  .max(10)             // Maximum items
  .nonempty()          // At least one item
  .unique()            // No duplicates
  .optional()
  .nullable()
  .build()
```

### Union, Literal, Enum

```typescript
s.union([s.string().build(), s.number().build()])
s.literal('active')
s.enum(['active', 'inactive', 'pending'])
```

## Error Format

```typescript
interface ValidationError {
  path: string[];     // e.g., ['user', 'address', 'zip']
  message: string;    // Human-readable message
  code: string;       // Machine-readable code
  expected?: string;  // Expected type
  received?: string;  // Received type
}
```

All errors are collected during validation, giving a complete picture:

```typescript
const result = validate(schema, badData);
// result.errors = [
//   { path: ['name'], message: 'String must be at least 2 characters', code: 'too_small' },
//   { path: ['age'], message: 'Number must be positive', code: 'too_small' },
// ]
```

## Comparison with Zod / Yup

| Feature              | schema-validator | Zod    | Yup    |
|----------------------|-----------------|--------|--------|
| Zero dependencies    | Yes             | Yes    | No     |
| Bundle size          | ~3 KB           | ~13 KB | ~40 KB |
| Chainable API        | Yes             | Yes    | Yes    |
| Collect all errors   | Yes             | Yes    | No     |
| Path tracking        | Yes             | Yes    | Yes    |
| Transforms           | Yes             | Yes    | Yes    |
| TypeScript inference  | Partial         | Full   | Partial|
| Object pick/omit     | Yes             | Yes    | No     |

## License

MIT
