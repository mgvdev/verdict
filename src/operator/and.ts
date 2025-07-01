import type { RuleJson } from "../serializer.js";
import { getValueFromPath } from "../utils.js";
import type { OperatorInterace, OperatorValue } from "./operator_interace.js";

/**
 * Creates a logical AND operator that evaluates multiple conditions.
 *
 * This function creates a rule that returns true only when ALL of the
 * provided conditions evaluate to true. If any condition is false,
 * the entire AND operation returns false.
 *
 * @param args - Variable number of operands (literals, context paths, or nested operators)
 * @returns An AND operator instance
 *
 * @example Basic AND operation
 * ```typescript
 * const rule = and(
 *   eq('user.age', 25),
 *   eq('user.status', 'active')
 * );
 * const context = { user: { age: 25, status: 'active' } };
 * const result = engine.evaluate(rule, context); // true
 * ```
 *
 * @example Complex nested AND
 * ```typescript
 * const rule = and(
 *   gt('user.age', 18),
 *   or(
 *     eq('user.role', 'admin'),
 *     eq('user.role', 'moderator')
 *   ),
 *   eq('user.active', true)
 * );
 * ```
 */
export function and(...args: Array<OperatorValue>): OperatorInterace {
  return new And(...args);
}

/**
 * Logical AND operator that evaluates multiple conditions.
 *
 * The And class implements logical conjunction, requiring ALL operands
 * to evaluate to true for the overall result to be true. It uses
 * short-circuit evaluation, stopping at the first false condition.
 *
 * @example
 * ```typescript
 * const andOp = new And(
 *   eq('user.age', 25),
 *   eq('user.active', true)
 * );
 * const context = { user: { age: 25, active: true } };
 * const result = andOp.compute(context); // true
 * ```
 */
export class And implements OperatorInterace {
  private args: Array<OperatorValue>;

  /**
   * Creates a new AND operator instance.
   *
   * @param args - Variable number of operands to evaluate with AND logic
   */
  constructor(...args: Array<OperatorValue>) {
    this.args = args;
  }

  /**
   * Evaluates the AND operation across all operands.
   *
   * This method uses short-circuit evaluation, returning false as soon as
   * any operand evaluates to false. All operands must be truthy for the
   * result to be true. It handles context path resolution and nested operators.
   *
   * @param context - Optional context object for resolving path-based operands
   * @returns True if ALL operands evaluate to true, false otherwise
   *
   * @example
   * ```typescript
   * const andOp = new And(
   *   eq('user.age', 25),
   *   gt('user.score', 80),
   *   eq('user.verified', true)
   * );
   * const context = {
   *   user: { age: 25, score: 85, verified: true }
   * };
   * const result = andOp.compute(context); // true
   * ```
   */
  compute(context?: object): boolean {
    const resolveValue = (val: unknown) => {
      if (typeof val === "string" && context) {
        const resolved = getValueFromPath(context, val);
        if (resolved !== undefined) {
          return resolved;
        }
      }
      return typeof val === "object" && val !== null && "compute" in val
        ? (val as OperatorInterace).compute(context)
        : val;
    };

    return this.args.every((arg) => {
      return resolveValue(arg);
    });
  }

  /**
   * Converts the AND operator to its JSON representation.
   *
   * This method serializes the operator and all its operands to a JSON format,
   * recursively handling nested operators while preserving the logical structure.
   *
   * @returns A JSON object representing the AND operator and its operands
   *
   * @example
   * ```typescript
   * const andOp = new And(
   *   eq('user.age', 25),
   *   eq('user.status', 'active')
   * );
   * const json = andOp.toJSON();
   * // Result: {
   * //   operator: "and",
   * //   args: [
   * //     { operator: "eq", args: ["user.age", 25] },
   * //     { operator: "eq", args: ["user.status", "active"] }
   * //   ]
   * // }
   * ```
   */
  toJSON(): RuleJson {
    return {
      operator: "and",
      args: this.args.map((arg) => {
        return typeof arg === "object" && arg !== null && "toJSON" in arg
          ? arg.toJSON()
          : arg;
      }),
    };
  }
}
