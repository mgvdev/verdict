import type { RuleJson } from "../serializer.js";
import { getValueFromPath } from "../utils.js";
import type { OperatorInterace } from "./operator_interace.js";

/**
 * Creates a NONE operator that checks if no elements in an array match a condition.
 *
 * This function creates a rule that evaluates to true if NONE of the elements in the
 * specified array satisfy the provided condition. It's useful for ensuring that no
 * element in an array meets certain criteria (negative condition checking).
 *
 * @param arrayPath - Path to the array in the context (e.g., "user.roles")
 * @param condition - The condition to test against each array element
 * @returns A NONE operator instance
 *
 * @example Basic usage with object properties
 * ```typescript
 * const rule = none('user.roles', eq('name', 'banned'));
 * const context = {
 *   user: {
 *     roles: [
 *       { name: 'user', active: true },
 *       { name: 'admin', active: true }
 *     ]
 *   }
 * };
 * const result = engine.evaluate(rule, context); // true (no banned roles)
 * ```
 *
 * @example Ensuring no expired permissions
 * ```typescript
 * const rule = none('user.permissions', lt('expiresAt', Date.now()));
 * ```
 *
 * @example Checking for security violations
 * ```typescript
 * const rule = none('user.loginAttempts',
 *   and(
 *     eq('status', 'failed'),
 *     gt('timestamp', Date.now() - 300000) // Last 5 minutes
 *   )
 * );
 * ```
 */
export function none(
  arrayPath: string,
  condition: OperatorInterace
): OperatorInterace {
  return new None(arrayPath, condition);
}

/**
 * NONE operator that checks if no elements in an array match a condition.
 *
 * The None class implements array traversal with negative condition matching,
 * returning true only if NO elements in the target array satisfy the specified
 * condition. It uses short-circuit evaluation, returning false as soon as any
 * element matches the condition.
 *
 * @example
 * ```typescript
 * const noneOp = new None('user.violations', eq('severity', 'critical'));
 * const context = {
 *   user: {
 *     violations: [
 *       { severity: 'warning' },
 *       { severity: 'minor' },
 *       { severity: 'info' }
 *     ]
 *   }
 * };
 * const result = noneOp.compute(context); // true (no critical violations)
 * ```
 */
export class None implements OperatorInterace {
  /**
   * Creates a new NONE operator instance.
   *
   * @param arrayPath - Path to the array in the context
   * @param condition - The condition to test against each array element
   */
  constructor(
    private arrayPath: string,
    private condition: OperatorInterace
  ) {}

  /**
   * Evaluates the NONE operation on the specified array.
   *
   * This method resolves the array path, then tests each element against
   * the provided condition. Returns false as soon as any element matches
   * the condition (short-circuit evaluation).
   *
   * @param context - Context object containing the array to evaluate
   * @returns True if NO elements match the condition, false if any element matches
   *
   * @example
   * ```typescript
   * const noneOp = new None('orders', eq('status', 'cancelled'));
   * const context = {
   *   orders: [
   *     { status: 'completed' },
   *     { status: 'processing' },
   *     { status: 'shipped' }
   *   ]
   * };
   * const result = noneOp.compute(context); // true (no cancelled orders)
   * ```
   */
  compute(context?: object): boolean {
    if (!context) {
      return true; // No context means no array, so no elements match
    }

    const arrayValue = getValueFromPath(context, this.arrayPath);

    // If path doesn't resolve to an array, return true (no elements to match)
    if (!Array.isArray(arrayValue)) {
      return true;
    }

    // Empty arrays return true (no elements to match condition)
    if (arrayValue.length === 0) {
      return true;
    }

    // Test each element against the condition
    for (const element of arrayValue) {
      // Evaluate condition with element as root context
      try {
        if (this.condition.compute(element)) {
          return false; // Short-circuit: one element matched
        }
      } catch {}
    }

    return true; // No elements matched the condition
  }

  /**
   * Converts the NONE operator to its JSON representation.
   *
   * This method serializes the operator, array path, and condition to a JSON format
   * that can be stored, transmitted, or reconstructed later.
   *
   * @returns A JSON object representing the NONE operator
   *
   * @example
   * ```typescript
   * const noneOp = new None('user.flags', eq('type', 'security_risk'));
   * const json = noneOp.toJSON();
   * // Result: {
   * //   operator: "none",
   * //   args: [
   * //     "user.flags",
   * //     { operator: "eq", args: ["type", "security_risk"] }
   * //   ]
   * // }
   * ```
   */
  toJSON(): RuleJson {
    return {
      operator: "none",
      args: [this.arrayPath, this.condition.toJSON()],
    };
  }
}
