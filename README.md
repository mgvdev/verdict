# Verdict 🏛️

A lightweight, structured JSON decision tree library for Node.js applications. Build complex rule engines with an intuitive, type-safe API that supports serialization and dynamic rule evaluation.

![Verdict](https://repository-images.githubusercontent.com/1011632249/b1b7af7e-86d9-48ad-82aa-9a76b24bb866)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)

## ✨ Features

- 🚀 **Lightweight & Fast** - Minimal dependencies, maximum performance
- 🔒 **Type Safe** - Full TypeScript support with intelligent IntelliSense
- 📦 **Serializable** - Convert rules to/from JSON for storage and transmission
- 🎯 **Intuitive API** - Easy-to-read, chainable rule definitions
- 🔧 **Extensible** - Support for custom operators and complex nested logic
- 📊 **Context-Aware** - Evaluate rules against dynamic data contexts
- 🌐 **Universal** - Works in Node.js and modern browsers

## 📦 Installation

```bash
# Using npm
npm install @mgvdev/verdict

# Using yarn
yarn add @mgvdev/verdict

# Using pnpm
pnpm add @mgvdev/verdict
```

## 🚀 Quick Start

```typescript
import { Engine, eq, and, gt } from '@mgvdev/verdict';

const engine = new Engine();

// Create a simple rule
const rule = and(
  eq('user.status', 'active'),
  gt('user.age', 18)
);

// Define your data context
const context = {
  user: {
    status: 'active',
    age: 25
  }
};

// Evaluate the rule
const result = engine.evaluate(rule, context);
console.log(result); // true
```

## 📖 Core Concepts

### Engine

The `Engine` is the main interface for evaluating rules. It takes a rule and a context object, then returns a boolean result.

```typescript
import { Engine } from '@mgvdev/verdict';

const engine = new Engine();
const result = engine.evaluate(rule, context);
```

### Rules & Operators

Rules are built using operators that can be combined to create complex logic:

#### Comparison Operators

```typescript
import { eq, ne, gt, gte, lt, lte } from '@mgvdev/verdict';

// Equality
eq('user.name', 'John')           // user.name === 'John'
ne('user.status', 'inactive')     // user.status !== 'inactive'

// Numeric comparisons
gt('user.age', 18)                // user.age > 18
gte('user.score', 80)             // user.score >= 80
lt('user.attempts', 3)            // user.attempts < 3
lte('user.balance', 1000)         // user.balance <= 1000

// Date and DateTime comparisons (native support)
gt('user.createdAt', '2023-01-01')              // Date strings (ISO format)
lt('event.endDate', '2024-12-31T23:59:59Z')     // DateTime with timezone
gte('user.lastLogin', new Date('2023-06-15'))   // Date objects
lte('session.expires', Date.now())              // Timestamps
```

#### Logical Operators

```typescript
import { and, or, not } from '@mgvdev/verdict';

// AND - all conditions must be true
and(
  eq('user.status', 'active'),
  gt('user.age', 18)
)

// OR - at least one condition must be true
or(
  eq('user.role', 'admin'),
  eq('user.role', 'moderator')
)

// NOT - negates the condition
not(eq('user.banned', true))
```

#### Membership Operators

```typescript
import { In, notIn } from '@mgvdev/verdict';

// IN - value exists in array
In('user.role', ['admin', 'moderator', 'editor'])

// NOT IN - value does not exist in array
notIn('user.status', ['banned', 'suspended'])
```

#### Array Operators

```typescript
import { any, all, none } from '@mgvdev/verdict';

// ANY - at least one element matches condition
any('user.roles', eq('name', 'admin'))

// ALL - all elements match condition
all('user.permissions', eq('granted', true))

// NONE - no elements match condition
none('user.violations', eq('severity', 'critical'))
```

**Flat array syntax:**

Self reference is supported for flat arrays by using the `self` symbol exported from the `verdict` package:

```typescript

import { self } from '@mgvdev/verdict';

// ANY - at least one element matches condition
any('user.roles.*', eq(self, 'admin'));
```

## 🎯 Usage Examples

### Basic User Authorization

```typescript
import { Engine, and, eq, gt, In } from '@mgvdev/verdict';

const engine = new Engine();

// Define authorization rule
const canAccessAdmin = and(
  eq('user.active', true),
  gt('user.age', 18),
  In('user.role', ['admin', 'moderator'])
);

// Check user access
const user = {
  active: true,
  age: 25,
  role: 'admin'
};

const hasAccess = engine.evaluate(canAccessAdmin, { user });
console.log(hasAccess); // true
```

### Complex Business Rules

```typescript
import { Engine, and, or, eq, gt, gte, In } from '@mgvdev/verdict';

const engine = new Engine();

// Complex discount eligibility rule
const discountEligible = or(
  // Premium members always eligible
  eq('user.tier', 'premium'),

  // OR high-value customers
  and(
    gte('user.totalSpent', 1000),
    gte('user.accountAge', 365)
  ),

  // OR users in specific regions with good standing
  and(
    In('user.region', ['US', 'CA', 'EU']),
    eq('user.standing', 'good'),
    gt('user.orderCount', 10)
  )
);

const customer = {
  tier: 'standard',
  totalSpent: 1200,
  accountAge: 400,
  region: 'US',
  standing: 'good',
  orderCount: 15
};

const eligible = engine.evaluate(discountEligible, { user: customer });
console.log(eligible); // true
```

### Feature Flags & A/B Testing

```typescript
import { Engine, and, eq, In, gt } from '@mgvdev/verdict';

const engine = new Engine();

// Feature flag rule
const showNewFeature = and(
  eq('feature.enabled', true),
  or(
    eq('user.beta', true),
    and(
      In('user.segment', ['power_user', 'early_adopter']),
      gt('user.loginCount', 50)
    )
  )
);

const context = {
  feature: { enabled: true },
  user: {
    beta: false,
    segment: 'power_user',
    loginCount: 75
  }
};

const hasAccess = engine.evaluate(showNewFeature, context);
console.log(hasAccess); // true
```

### Array-Based Rules

```typescript
import { Engine, any, all, none, eq, gt, and } from '@mgvdev/verdict';

const engine = new Engine();

// User authorization with role-based access
const canEditPosts = any('user.roles', eq('name', 'editor'));

// Ensure all user permissions are valid
const hasValidPermissions = all('user.permissions',
  and(
    eq('granted', true),
    gt('expiresAt', Date.now())
  )
);

// Security check - no banned roles
const isSafeUser = none('user.roles', eq('status', 'banned'));

const context = {
  user: {
    roles: [
      { name: 'user', status: 'active' },
      { name: 'editor', status: 'active' }
    ],
    permissions: [
      { granted: true, expiresAt: Date.now() + 86400000 },
      { granted: true, expiresAt: Date.now() + 172800000 }
    ]
  }
};

const canEdit = engine.evaluate(canEditPosts, context);        // true
const validPerms = engine.evaluate(hasValidPermissions, context); // true
const safeUser = engine.evaluate(isSafeUser, context);         // true
```

### Date and DateTime Comparisons

Verdict provides native support for comparing dates and datetimes in various formats:

```typescript
import { Engine, eq, gt, gte, lt, lte, and, or } from '@mgvdev/verdict';

const engine = new Engine();

// Support for various date formats
const dateRules = and(
  // ISO date strings
  gte('user.birthDate', '1990-01-01'),
  lt('user.birthDate', '2005-12-31'),
  
  // ISO datetime strings with timezone
  gt('event.startTime', '2023-06-15T10:00:00Z'),
  lte('event.endTime', '2023-06-15T18:00:00Z'),
  
  // Date objects
  gt('user.lastLogin', new Date('2023-01-01')),
  
  // Timestamps (milliseconds)
  lt('session.expiresAt', Date.now() + 3600000) // 1 hour from now
);

// Real-world example: Event scheduling
const eventContext = {
  event: {
    startTime: '2023-06-15T14:30:00Z',
    endTime: '2023-06-15T16:30:00Z',
    registrationDeadline: '2023-06-10T23:59:59Z'
  },
  user: {
    registeredAt: '2023-06-05T10:00:00Z',
    lastLogin: new Date('2023-06-14T08:00:00Z')
  },
  currentTime: Date.now()
};

// Check if user can access event
const canAccessEvent = and(
  // Event hasn't started yet or is currently running
  gte('event.endTime', 'currentTime'),
  
  // User registered before deadline
  lt('user.registeredAt', 'event.registrationDeadline'),
  
  // User was active recently
  gt('user.lastLogin', '2023-06-01T00:00:00Z')
);

const hasAccess = engine.evaluate(canAccessEvent, eventContext); // true

// Comparing dates from context
const dateComparison = and(
  gt('user.lastLogin', 'user.registeredAt'),    // Last login after registration
  lt('event.startTime', 'event.endTime')        // Valid event duration
);

const isValidTiming = engine.evaluate(dateComparison, eventContext); // true
```

#### Supported Date Formats

- **ISO Date Strings**: `'2023-01-15'`, `'2023-01-15T14:30:00Z'`
- **Date Objects**: `new Date('2023-01-15')`
- **Timestamps**: `1673740800000` (milliseconds since epoch)
- **Mixed Formats**: You can compare different formats together

```typescript
// Mixed format comparison example
const mixedDateRule = and(
  gt('2023-06-15', '2023-01-01'),                    // String vs String
  lt(new Date('2023-06-15'), '2023-12-31'),          // Date vs String  
  gte('user.timestamp', new Date('2023-01-01').getTime()) // String vs Timestamp
);
```

## 🔄 Serialization

Verdict supports full serialization, allowing you to store rules as JSON and reconstruct them later.

```typescript
import { RuleSerializer, and, eq, gt } from '@mgvdev/verdict';

const serializer = new RuleSerializer();

// Create a rule
const rule = and(
  eq('user.status', 'active'),
  gt('user.age', 18)
);

// Serialize to JSON
const jsonRule = serializer.serialize(rule);
console.log(JSON.stringify(jsonRule, null, 2));
```

Output:
```json
{
  "operator": "and",
  "args": [
    {
      "operator": "eq",
      "args": ["user.status", "active"]
    },
    {
      "operator": "gt",
      "args": ["user.age", 18]
    }
  ]
}
```

```typescript
// Deserialize from JSON
const reconstructedRule = serializer.deserialize(jsonRule);

// Use the reconstructed rule
const result = engine.evaluate(reconstructedRule, context);
```

## 🗃️ Database Storage Example

```typescript
// Store rules in database
const ruleDefinition = {
  name: 'Premium User Access',
  rule: serializer.serialize(premiumAccessRule),
  createdAt: new Date()
};

await database.rules.create(ruleDefinition);

// Later, retrieve and use the rule
const storedRule = await database.rules.findByName('Premium User Access');
const rule = serializer.deserialize(storedRule.rule);
const hasAccess = engine.evaluate(rule, userContext);
```

## 🔍 Context Path Resolution

Verdict supports deep object path resolution using dot notation:

```typescript
const context = {
  user: {
    profile: {
      personal: {
        name: 'John Doe',
        age: 30
      },
      preferences: {
        theme: 'dark',
        notifications: true
      }
    },
    account: {
      tier: 'premium',
      balance: 1500
    }
  },
  session: {
    loginCount: 42,
    lastActive: '2024-01-15'
  }
};

// Access nested values
const rule = and(
  eq('user.profile.personal.name', 'John Doe'),
  gt('user.profile.personal.age', 18),
  eq('user.account.tier', 'premium'),
  gt('session.loginCount', 40)
);
```

### Array Access

```typescript
const context = {
  user: {
    permissions: ['read', 'write', 'admin'],
    recentOrders: [
      { id: 1, amount: 100 },
      { id: 2, amount: 250 }
    ]
  }
};

// Access array elements by index
const rule = and(
  eq('user.permissions.0', 'read'),        // First permission
  gt('user.recentOrders.1.amount', 200)   // Second order amount
);
```

### Wildcard Array Queries

Verdict supports wildcard (`*`) syntax for querying arrays:

```typescript
const context = {
  user: {
    roles: [
      { name: 'admin', active: true },
      { name: 'user', active: true },
      { name: 'guest', active: false }
    ],
    orders: [
      { id: 1, items: [{ price: 100 }, { price: 50 }] },
      { id: 2, items: [{ price: 200 }, { price: 75 }] }
    ]
  }
};

// Extract all role names: ['admin', 'user', 'guest']
const roleNames = getValueFromPath(context, 'user.roles.*.name');

// Extract all item prices: [100, 50, 200, 75]
const allPrices = getValueFromPath(context, 'user.orders.*.items.*.price');

// Use wildcard with operators
const rule = In('admin', 'user.roles.*.name');  // Check if user has admin role

// Your specific use case: Check if user has a role with specific name
const hasSpecificRole = any('user.roles', eq('name', 'admin'));

// Or using wildcard syntax with existing operators
const adminNames = getValueFromPath(context, 'user.roles.*.name');
const hasAdminRole = adminNames.includes('admin');
```

## 📋 API Reference

### Engine

```typescript
class Engine {
  evaluate(rule: OperatorInterface, context?: object): boolean
}
```

### Operators

#### Comparison Operators
- `eq(left, right)` - Equality comparison (supports dates)
- `ne(left, right)` - Inequality comparison (supports dates)
- `gt(left, right)` - Greater than (supports dates)
- `gte(left, right)` - Greater than or equal (supports dates)
- `lt(left, right)` - Less than (supports dates)
- `lte(left, right)` - Less than or equal (supports dates)

**Date Support**: All comparison operators natively support:
- ISO date strings (`'2023-01-15'`, `'2023-01-15T14:30:00Z'`)
- JavaScript Date objects (`new Date('2023-01-15')`)
- Unix timestamps (`1673740800000`)
- Mixed format comparisons

#### Logical Operators
- `and(...conditions)` - Logical AND
- `or(...conditions)` - Logical OR
- `not(condition)` - Logical NOT

#### Membership Operators
- `In(value, array)` - Value exists in array
- `notIn(value, array)` - Value does not exist in array

#### Array Operators
- `any(arrayPath, condition)` - At least one element matches condition
- `all(arrayPath, condition)` - All elements match condition
- `none(arrayPath, condition)` - No elements match condition

### Serialization

```typescript
class RuleSerializer {
  serialize(rule: OperatorInterface): RuleJson
  deserialize(json: RuleJson): OperatorInterface
}
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## 🔧 Development

```bash
# Clone the repository
git clone https://github.com/mgvdev/verdict.git
cd verdict

# Install dependencies
pnpm install

# Build the project
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by business rule engines and decision trees
- Built with TypeScript for type safety and developer experience
- Designed for modern Node.js and browser environments

## 📞 Support

- 💬 Issues: [GitHub Issues](https://github.com/mgvdev/verdict/issues)
- 📖 Documentation: [Full Documentation](https://verdict.mgvdev.io)

---

Made with ❤️ by [Maxence Guyonvarho](https://github.com/mgvdev)
