import type { RuleJson } from "../serializer.js";
import { getValueFromPath } from "../utils.js";
import type { OperatorInterface } from "./operator_interace.js";

/**
 * Creates an ALL operator that checks if all elements in an array match a condition.
 *
 * This function creates a rule that evaluates to true if ALL elements in the specified
 * array satisfy the provided condition. It's useful for ensuring that every element
 * in an array meets certain criteria.
 *
 * @param arrayPath - Path to the array in the context (e.g., "user.roles")
 * @param condition - The condition to test against each array element
 * @returns An ALL operator instance
 *
 * @example Basic usage with object properties
 * ```typescript
 * const rule = all('user.roles', eq('active', true));
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
 * const rule = all('user.permissions',
 *   and(
 *     ne('status', 'revoked'),
 *     gt('expiresAt', Date.now())
 *   )
 * );
 * ```
 *
 * @example Ensuring all orders are completed
 * ```typescript
 * const rule = all('user.orders', eq('status', 'completed'));
 * ```
 */
export function all(
  arrayPath: string,
  condition: OperatorInterface
): OperatorInterface {
  return new All(arrayPath, condition);
}

/**
 * ALL operator that checks if all elements in an array match a condition.
 *
 * The All class implements array traversal with condition matching, returning true
 * only if ALL elements in the target array satisfy the specified condition. It uses
 * short-circuit evaluation, returning false as soon as any element fails the condition.
 *
 * @example
 * ```typescript
 * const allOp = new All('user.scores', gt('value', 80));
 * const context = {
 *   user: {
 *     scores: [
 *       { value: 85 },
 *       { value: 92 },
 *       { value: 88 }
 *     ]
 *   }
 * };
 * const result = allOp.compute(context); // true (all scores > 80)
 * ```
 */
export class All implements OperatorInterface {
  /**
   * Creates a new ALL operator instance.
   *
   * @param arrayPath - Path to the array in the context
   * @param condition - The condition to test against each array element
   */
  constructor(
    private arrayPath: string,
    private condition: OperatorInterface
  ) {}

  /**
   * Evaluates the ALL operation on the specified array.
   *
   * This method resolves the array path, then tests each element against
   * the provided condition. Returns false as soon as any element fails
   * the condition (short-circuit evaluation).
   *
   * @param context - Context object containing the array to evaluate
   * @returns True if ALL elements match the condition, false otherwise
   *
   * @example
   * ```typescript
   * const allOp = new All('products', gte('price', 10));
   * const context = {
   *   products: [
   *     { price: 15 },
   *     { price: 20 },
   *     { price: 12 }
   *   ]
   * };
   * const result = allOp.compute(context); // true (all prices >= 10)
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

    // Empty arrays return true (all elements of empty set satisfy any condition)
    if (arrayValue.length === 0) {
      return true;
    }

    // Test each element against the condition
    for (const element of arrayValue) {
      // Evaluate condition with element as root context
      try {
        if (!this.condition.compute(element)) {
          return false; // Short-circuit: one element failed
        }
      } catch {
        // If condition evaluation fails for this element, consider it as false
        return false;
      }
    }

    return true; // All elements passed the condition
  }

  /**
   * Converts the ALL operator to its JSON representation.
   *
   * This method serializes the operator, array path, and condition to a JSON format
   * that can be stored, transmitted, or reconstructed later.
   *
   * @returns A JSON object representing the ALL operator
   *
   * @example
   * ```typescript
   * const allOp = new All('user.permissions', eq('granted', true));
   * const json = allOp.toJSON();
   * // Result: {
   * //   operator: "all",
   * //   args: [
   * //     "user.permissions",
   * //     { operator: "eq", args: ["granted", true] }
   * //   ]
   * // }
   * ```
   */
  toJSON(): RuleJson {
    return {
      operator: "all",
      args: [this.arrayPath, this.condition.toJSON()],
    };
  }
}
