import type { RuleJson } from "../serializer.js";
import { getValueFromPath } from "../utils.js";
import type { OperatorInterface } from "./operator_interace.js";

/**
 * Creates an ANY operator that checks if at least one element in an array matches a condition.
 *
 * This function creates a rule that evaluates to true if ANY element in the specified
 * array satisfies the provided condition. It's useful for checking array membership
 * with complex conditions.
 *
 * @param arrayPath - Path to the array in the context (e.g., "user.roles")
 * @param condition - The condition to test against each array element
 * @returns An ANY operator instance
 *
 * @example Basic usage with object properties
 * ```typescript
 * const rule = any('user.roles', eq('name', 'admin'));
 * const context = {
 *   user: {
 *     roles: [
 *       { name: 'user', active: true },
 *       { name: 'admin', active: true }
 *     ]
 *   }
 * };
 * const result = engine.evaluate(rule, context); // true
 * ```
 *
 * @example With complex nested conditions
 * ```typescript
 * const rule = any('user.permissions',
 *   and(
 *     eq('resource', 'posts'),
 *     eq('action', 'write')
 *   )
 * );
 * ```
 *
 * @example With wildcard path
 * ```typescript
 * const rule = any('user.roles.*.permissions', eq('admin'));
 * ```
 */
export function any(
  arrayPath: string,
  condition: OperatorInterface
): OperatorInterface {
  return new Any(arrayPath, condition);
}

/**
 * ANY operator that checks if at least one element in an array matches a condition.
 *
 * The Any class implements array traversal with condition matching, returning true
 * if ANY element in the target array satisfies the specified condition. It provides
 * a powerful way to query arrays with complex logic.
 *
 * @example
 * ```typescript
 * const anyOp = new Any('user.orders', gt('amount', 100));
 * const context = {
 *   user: {
 *     orders: [
 *       { amount: 50 },
 *       { amount: 150 },
 *       { amount: 75 }
 *     ]
 *   }
 * };
 * const result = anyOp.compute(context); // true (150 > 100)
 * ```
 */
export class Any implements OperatorInterface {
  /**
   * Creates a new ANY operator instance.
   *
   * @param arrayPath - Path to the array in the context
   * @param condition - The condition to test against each array element
   */
  constructor(
    private arrayPath: string,
    private condition: OperatorInterface
  ) {}

  /**
   * Evaluates the ANY operation on the specified array.
   *
   * This method resolves the array path, then tests each element against
   * the provided condition. Returns true as soon as any element matches
   * (short-circuit evaluation).
   *
   * @param context - Context object containing the array to evaluate
   * @returns True if ANY element matches the condition, false otherwise
   *
   * @example
   * ```typescript
   * const anyOp = new Any('products', eq('category', 'electronics'));
   * const context = {
   *   products: [
   *     { category: 'books' },
   *     { category: 'electronics' },
   *     { category: 'clothing' }
   *   ]
   * };
   * const result = anyOp.compute(context); // true
   * ```
   */
  compute(context?: object): boolean {
    if (!context) {
      return false;
    }

    const arrayValue = getValueFromPath(context, this.arrayPath);

    // If path doesn't resolve to an array, return false
    if (!Array.isArray(arrayValue)) {
      return false;
    }

    // Test each element against the condition
    for (const element of arrayValue) {
      // Evaluate condition with element as root context
      try {
        if (this.condition.compute(element)) {
          return true;
        }
      } catch {}
    }

    return false;
  }

  /**
   * Converts the ANY operator to its JSON representation.
   *
   * This method serializes the operator, array path, and condition to a JSON format
   * that can be stored, transmitted, or reconstructed later.
   *
   * @returns A JSON object representing the ANY operator
   *
   * @example
   * ```typescript
   * const anyOp = new Any('user.roles', eq('name', 'admin'));
   * const json = anyOp.toJSON();
   * // Result: {
   * //   operator: "any",
   * //   args: [
   * //     "user.roles",
   * //     { operator: "eq", args: ["name", "admin"] }
   * //   ]
   * // }
   * ```
   */
  toJSON(): RuleJson {
    return {
      operator: "any",
      args: [this.arrayPath, this.condition.toJSON()],
    };
  }
}
