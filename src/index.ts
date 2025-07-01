/**
 * @fileoverview Verdict - A lightweight, structured JSON decision tree library
 *
 * Verdict provides a powerful and flexible rule engine for Node.js applications,
 * allowing you to define, evaluate, and serialize complex decision logic using
 * a simple, intuitive API.
 *
 * @example Quick Start
 * ```typescript
 * import { Engine, eq, and, gt } from '@mgvdev/verdict';
 *
 * const engine = new Engine();
 *
 * // Create a rule
 * const rule = and(
 *   eq('user.status', 'active'),
 *   gt('user.age', 18)
 * );
 *
 * // Evaluate against context
 * const context = {
 *   user: { status: 'active', age: 25 }
 * };
 *
 * const result = engine.evaluate(rule, context); // true
 * ```
 *
 * @example Complex Rules
 * ```typescript
 * import { Engine, and, or, eq, gt, In } from '@mgvdev/verdict';
 *
 * const rule = and(
 *   or(
 *     eq('user.role', 'admin'),
 *     eq('user.role', 'moderator')
 *   ),
 *   gt('user.experience', 2),
 *   In('user.department', ['engineering', 'product'])
 * );
 * ```
 *
 * @example Serialization
 * ```typescript
 * import { RuleSerializer } from '@mgvdev/verdict';
 *
 * const serializer = new RuleSerializer();
 * const jsonRule = serializer.serialize(rule);
 * const reconstructedRule = serializer.deserialize(jsonRule);
 * ```
 *
 * @version 0.0.0
 * @author Maxence Guyonvarho <contact@mgvdev.io>
 * @license MIT
 */

// Core engine and utilities
export * from "./engine.js";
export * from "./operator/all.js";
// Logical operators
export * from "./operator/and.js";
// Array operators
export * from "./operator/any.js";
// Comparison operators
export * from "./operator/eq.js";
export * from "./operator/gt.js";
export * from "./operator/gte.js";
// Membership operators
export * from "./operator/in.js";
export * from "./operator/lt.js";
export * from "./operator/lte.js";
export * from "./operator/ne.js";
export * from "./operator/none.js";
export * from "./operator/not.js";
export * from "./operator/notIn.js";
export * from "./operator/or.js";
export * from "./serializer.js";
export * from "./utils.js";
