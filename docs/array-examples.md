# Array Operations and Wildcard Examples

This document provides comprehensive examples of Verdict's array operations and wildcard functionality.

## Table of Contents

- [Wildcard Path Queries](#wildcard-path-queries)
- [Array Operators](#array-operators)
- [Real-World Use Cases](#real-world-use-cases)
- [Performance Considerations](#performance-considerations)
- [Best Practices](#best-practices)

## Wildcard Path Queries

The wildcard (`*`) syntax allows you to query arrays and extract values from nested structures.

### Basic Wildcard Usage

```typescript
import { getValueFromPath } from '@mgvdev/verdict';

const data = {
  users: [
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 25 },
    { name: 'Charlie', age: 35 }
  ]
};

// Extract all names
const names = getValueFromPath(data, 'users.*.name');
// Result: ['Alice', 'Bob', 'Charlie']

// Extract all ages
const ages = getValueFromPath(data, 'users.*.age');
// Result: [30, 25, 35]
```

### Nested Wildcard Queries

```typescript
const complexData = {
  departments: [
    {
      name: 'Engineering',
      teams: [
        { name: 'Frontend', members: ['Alice', 'Bob'] },
        { name: 'Backend', members: ['Charlie', 'David'] }
      ]
    },
    {
      name: 'Design',
      teams: [
        { name: 'UX', members: ['Eve', 'Frank'] },
        { name: 'Visual', members: ['Grace'] }
      ]
    }
  ]
};

// Get all team names across all departments
const teamNames = getValueFromPath(complexData, 'departments.*.teams.*.name');
// Result: ['Frontend', 'Backend', 'UX', 'Visual']

// Get all members across all teams
const allMembers = getValueFromPath(complexData, 'departments.*.teams.*.members.*');
// Result: ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace']
```

### Array Index with Wildcards

```typescript
const salesData = {
  quarters: [
    { q1: { sales: [100, 200, 150] } },
    { q2: { sales: [180, 220, 190] } },
    { q3: { sales: [210, 250, 200] } }
  ]
};

// Get first sale of each quarter
const firstSales = getValueFromPath(salesData, 'quarters.*.*.sales.0');
// Result: [100, 180, 210]
```

## Array Operators

Array operators provide powerful ways to evaluate conditions across array elements.

### ANY Operator

The `any` operator returns `true` if at least one element matches the condition.

```typescript
import { Engine, any, eq, gt, and } from '@mgvdev/verdict';

const engine = new Engine();

// Basic usage
const hasAdmin = any('user.roles', eq('name', 'admin'));

// Complex conditions
const hasHighLevelRole = any('user.roles', 
  and(
    eq('active', true),
    gt('level', 8)
  )
);

const context = {
  user: {
    roles: [
      { name: 'user', active: true, level: 5 },
      { name: 'admin', active: true, level: 10 },
      { name: 'guest', active: false, level: 1 }
    ]
  }
};

console.log(engine.evaluate(hasAdmin, context));         // true
console.log(engine.evaluate(hasHighLevelRole, context)); // true
```

### ALL Operator

The `all` operator returns `true` only if all elements match the condition.

```typescript
import { Engine, all, eq, gt, ne } from '@mgvdev/verdict';

const engine = new Engine();

// Ensure all permissions are granted
const allPermissionsGranted = all('user.permissions', eq('granted', true));

// Ensure all scores are above threshold
const allScoresHigh = all('user.testScores', gt('score', 70));

// Ensure no roles are banned
const noRolesBanned = all('user.roles', ne('status', 'banned'));

const context = {
  user: {
    permissions: [
      { resource: 'posts', granted: true },
      { resource: 'users', granted: true },
      { resource: 'admin', granted: true }
    ],
    testScores: [
      { subject: 'Math', score: 85 },
      { subject: 'Science', score: 92 },
      { subject: 'English', score: 78 }
    ],
    roles: [
      { name: 'user', status: 'active' },
      { name: 'premium', status: 'active' }
    ]
  }
};

console.log(engine.evaluate(allPermissionsGranted, context)); // true
console.log(engine.evaluate(allScoresHigh, context));        // true
console.log(engine.evaluate(noRolesBanned, context));        // true
```

### NONE Operator

The `none` operator returns `true` if no elements match the condition.

```typescript
import { Engine, none, eq, lt, and } from '@mgvdev/verdict';

const engine = new Engine();

// Security checks
const noSuspiciousActivity = none('user.loginAttempts',
  and(
    eq('status', 'failed'),
    gt('timestamp', Date.now() - 300000) // Last 5 minutes
  )
);

const noExpiredSessions = none('user.sessions', lt('expiresAt', Date.now()));

const noCriticalViolations = none('user.violations', eq('severity', 'critical'));

const context = {
  user: {
    loginAttempts: [
      { status: 'success', timestamp: Date.now() - 60000 },
      { status: 'failed', timestamp: Date.now() - 3600000 } // 1 hour ago
    ],
    sessions: [
      { id: 'sess1', expiresAt: Date.now() + 86400000 },
      { id: 'sess2', expiresAt: Date.now() + 172800000 }
    ],
    violations: [
      { type: 'spam', severity: 'minor' },
      { type: 'inappropriate', severity: 'warning' }
    ]
  }
};

console.log(engine.evaluate(noSuspiciousActivity, context));  // true
console.log(engine.evaluate(noExpiredSessions, context));    // true
console.log(engine.evaluate(noCriticalViolations, context)); // true
```

## Real-World Use Cases

### E-commerce Order Validation

```typescript
import { Engine, all, any, none, eq, gt, gte, and, or } from '@mgvdev/verdict';

const engine = new Engine();

// Order validation rules
const validOrder = and(
  // All items must be in stock
  all('order.items', gt('stock', 0)),
  
  // At least one item must be eligible for fast shipping
  any('order.items', eq('fastShipping', true)),
  
  // No restricted items for international shipping
  or(
    eq('order.domestic', true),
    none('order.items', eq('restricted', true))
  ),
  
  // Total value requirements
  gte('order.total', 10)
);

const orderContext = {
  order: {
    domestic: false,
    total: 150,
    items: [
      { name: 'Laptop', stock: 5, fastShipping: true, restricted: false },
      { name: 'Mouse', stock: 20, fastShipping: true, restricted: false },
      { name: 'Keyboard', stock: 8, fastShipping: false, restricted: false }
    ]
  }
};

const isValidOrder = engine.evaluate(validOrder, orderContext);
console.log(isValidOrder); // true
```

### Content Moderation System

```typescript
import { Engine, any, all, none, eq, gt, In, and } from '@mgvdev/verdict';

const engine = new Engine();

const contentApprovalRules = and(
  // No banned words in any content section
  none('content.sections', 
    any('words', In('$element', ['spam', 'fake', 'scam']))
  ),
  
  // All images must be approved
  all('content.images', eq('status', 'approved')),
  
  // At least one moderator has reviewed if flagged
  or(
    eq('content.flagged', false),
    any('content.reviews', 
      and(
        eq('type', 'moderator'),
        eq('decision', 'approved')
      )
    )
  )
);

const contentContext = {
  content: {
    flagged: true,
    sections: [
      { words: ['great', 'product', 'quality'] },
      { words: ['excellent', 'service', 'fast'] }
    ],
    images: [
      { url: 'img1.jpg', status: 'approved' },
      { url: 'img2.jpg', status: 'approved' }
    ],
    reviews: [
      { type: 'moderator', decision: 'approved', reviewer: 'mod1' },
      { type: 'auto', decision: 'flagged', reason: 'keywords' }
    ]
  }
};

const shouldApprove = engine.evaluate(contentApprovalRules, contentContext);
console.log(shouldApprove); // true
```

### Multi-tenant Feature Access

```typescript
import { Engine, any, all, eq, gt, and, or } from '@mgvdev/verdict';

const engine = new Engine();

const featureAccess = and(
  // User must have at least one active subscription
  any('tenant.subscriptions',
    and(
      eq('status', 'active'),
      gt('expiresAt', Date.now())
    )
  ),
  
  // Feature must be enabled for at least one subscription
  any('tenant.subscriptions',
    any('features', eq('name', 'advanced_analytics'))
  ),
  
  // User must have appropriate role
  any('user.roles',
    or(
      eq('name', 'admin'),
      eq('name', 'analyst'),
      and(
        eq('name', 'user'),
        eq('permissions.analytics', true)
      )
    )
  )
);

const accessContext = {
  tenant: {
    subscriptions: [
      {
        plan: 'pro',
        status: 'active',
        expiresAt: Date.now() + 2592000000, // 30 days
        features: [
          { name: 'basic_reports' },
          { name: 'advanced_analytics' },
          { name: 'custom_dashboards' }
        ]
      }
    ]
  },
  user: {
    roles: [
      { 
        name: 'user', 
        permissions: { analytics: true, admin: false }
      }
    ]
  }
};

const hasAccess = engine.evaluate(featureAccess, accessContext);
console.log(hasAccess); // true
```

## Performance Considerations

### Efficient Wildcard Queries

```typescript
// ✅ Good: Specific path reduces iterations
const userNames = getValueFromPath(data, 'departments.engineering.members.*.name');

// ⚠️ Less efficient: Broad wildcard creates more iterations
const allNames = getValueFromPath(data, 'departments.*.teams.*.members.*.name');
```

### Array Operator Optimization

```typescript
// ✅ Good: ANY operator short-circuits on first match
const hasAdmin = any('users', eq('role', 'admin'));

// ✅ Good: Use specific conditions to reduce evaluations
const hasActiveAdmin = any('users', 
  and(
    eq('role', 'admin'),
    eq('active', true)
  )
);

// ⚠️ Consider caching for frequently evaluated rules
const frequentRule = any('items', gt('price', 100));
```

## Best Practices

### 1. Meaningful Path Names

```typescript
// ✅ Good: Clear, descriptive paths
const hasEditPermission = any('user.permissions', 
  and(
    eq('resource', 'posts'),
    eq('action', 'edit')
  )
);

// ❌ Avoid: Ambiguous paths
const check = any('data.items', eq('flag', true));
```

### 2. Logical Grouping

```typescript
// ✅ Good: Group related conditions
const securityCheck = and(
  none('user.violations', eq('severity', 'critical')),
  all('user.sessions', gt('expiresAt', Date.now())),
  any('user.roles', ne('status', 'suspended'))
);
```

### 3. Error Handling

```typescript
// ✅ Good: Consider edge cases
const safeArrayCheck = or(
  // Handle empty arrays gracefully
  eq('users.length', 0),
  all('users', eq('verified', true))
);
```

### 4. Documentation

```typescript
// ✅ Good: Document complex rules
/**
 * Checks if user can access premium features:
 * - Must have at least one active premium subscription
 * - All payment methods must be valid
 * - No recent security violations
 */
const premiumAccess = and(
  any('subscriptions', 
    and(eq('tier', 'premium'), eq('status', 'active'))
  ),
  all('paymentMethods', eq('valid', true)),
  none('securityEvents', 
    and(
      eq('severity', 'high'),
      gt('timestamp', Date.now() - 604800000) // 7 days
    )
  )
);
```

This comprehensive guide should help you leverage Verdict's array operations and wildcard functionality effectively in your applications.