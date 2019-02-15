# schema-validator

> **[EN]** Lightweight JSON schema validator with type checking, required fields, nested properties, arrays, ranges, patterns, and enum constraints — no dependencies.
> **[FR]** Validateur de schéma JSON léger avec vérification de type, champs requis, propriétés imbriquées, tableaux, plages, patterns et contraintes enum — aucune dépendance.

---

## Features / Fonctionnalités

**[EN]**
- Validates type (`string`, `number`, `boolean`, `object`, `array`, `null`)
- Required field enforcement with descriptive error paths
- Recursive nested `properties` validation for deep objects
- `items` schema validation for array elements
- Numeric range constraints: `minimum` and `maximum`
- String length constraints: `minLength` and `maxLength`
- `pattern` matching via regular expressions
- `enum` constraint to restrict values to an explicit set
- Returns structured error objects with `path` and `message`
- Reusable validator instances via `createValidator`

**[FR]**
- Validation de type (`string`, `number`, `boolean`, `object`, `array`, `null`)
- Contrôle des champs requis avec chemins d'erreur descriptifs
- Validation récursive des `properties` imbriquées pour les objets profonds
- Validation de schéma `items` pour les éléments de tableau
- Contraintes de plage numérique : `minimum` et `maximum`
- Contraintes de longueur de chaîne : `minLength` et `maxLength`
- Correspondance `pattern` via expressions régulières
- Contrainte `enum` pour restreindre les valeurs à un ensemble explicite
- Retourne des objets d'erreur structurés avec `path` et `message`
- Instances de validateur réutilisables via `createValidator`

---

## Installation

```bash
npm install @idirdev/schema-validator
```

---

## API (Programmatic) / API (Programmation)

```js
const { validate, isValid, createValidator } = require('@idirdev/schema-validator');

// Define a schema
// Définir un schéma
const userSchema = {
  type: 'object',
  required: ['id', 'email', 'age'],
  properties: {
    id:    { type: 'number', minimum: 1 },
    email: { type: 'string', pattern: '^[^@]+@[^@]+\\.[^@]+$' },
    age:   { type: 'number', minimum: 18, maximum: 120 },
    role:  { type: 'string', enum: ['admin', 'user', 'moderator'] },
    name:  { type: 'string', minLength: 2, maxLength: 100 }
  }
};

// Validate and get all errors
// Valider et obtenir toutes les erreurs
const errors = validate({ id: 0, email: 'bad', age: 15 }, userSchema);
// => [
//   { path: '$.id',    message: 'Value 0 < minimum 1' },
//   { path: '$.email', message: 'Does not match pattern: ^[^@]+@[^@]+\.[^@]+$' },
//   { path: '$.age',   message: 'Value 15 < minimum 18' },
//   { path: '$.email', message: 'Required field missing: email' }  // if absent
// ]

// Quick boolean check
// Vérification booléenne rapide
isValid({ id: 1, email: 'user@example.com', age: 25, role: 'admin' }, userSchema);
// => true

// Reusable validator instance
// Instance de validateur réutilisable
const validator = createValidator(userSchema);
validator.isValid({ id: 1, email: 'a@b.com', age: 30 }); // => true
validator.validate({ id: -1, email: 'a@b.com', age: 30 });
// => [{ path: '$.id', message: 'Value -1 < minimum 1' }]

// Nested object validation
// Validation d'objet imbriqué
const orderSchema = {
  type: 'object',
  required: ['items'],
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        required: ['sku', 'qty'],
        properties: {
          sku: { type: 'string', minLength: 1 },
          qty: { type: 'number', minimum: 1 }
        }
      }
    }
  }
};
const errs = validate({ items: [{ sku: 'A1', qty: 0 }] }, orderSchema);
// => [{ path: '$.items[0].qty', message: 'Value 0 < minimum 1' }]
```

---

## License

MIT © idirdev
