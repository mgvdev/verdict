import type { RuleJson } from "../serializer.js";
import { getValueFromPath } from "../utils.js";
import type { OperatorInterface, OperatorValue } from "./operator_interace.js";

/**
 * Creates a logical OR operator that evaluates multiple conditions.
 *
 * This function creates a rule that returns true when ANY of the
 * provided conditions evaluate to true. If all conditions are false,
 * the entire OR operation returns false.
 *
 * @param args - Variable number of operands (literals, context paths, or nested operators)
 * @returns An OR operator instance
 *
 * @example Basic OR operation
 * ```typescript
 * const rule = or(
 *   eq('user.role', 'admin'),
 *   eq('user.role', 'moderator')
 * );
 * const context = { user: { role: 'admin' } };
 * const result = engine.evaluate(rule, context); // true
 * ```
 *
 * @example Complex nested OR
 * ```typescript
 * const rule = or(
 *   and(
 *     eq('user.role', 'admin'),
 *     eq('user.active', true)
 *   ),
 *   and(
 *     eq('user.role', 'guest'),
 *     eq('user.verified', true)
 *   )
 * );
 * ```
 */
export function or(...args: Array<OperatorValue>): OperatorInterface {
  return new Or(...args);
}

/**
 * Logical OR operator that evaluates multiple conditions.
 *
 * The Or class implements logical disjunction, requiring only ONE operand
 * to evaluate to true for the overall result to be true. It uses
 * short-circuit evaluation, stopping at the first true condition.
 *
 * @example
 * ```typescript
 * const orOp = new Or(
 *   eq('user.role', 'admin'),
 *   eq('user.role', 'moderator')
 * );
 * const context = { user: { role: 'moderator' } };
 * const result = orOp.compute(context); // true
 * ```
 */
export class Or implements OperatorInterface {
  private args: Array<OperatorValue>;

  /**
   * Creates a new OR operator instance.
   *
   * @param args - Variable number of operands to evaluate with OR logic
   */
  constructor(...args: Array<OperatorValue>) {
    this.args = args;
  }

  /**
   * Evaluates the OR operation across all operands.
   *
   * This method uses short-circuit evaluation, returning true as soon as
   * any operand evaluates to true. Only if ALL operands are falsy will
   * the result be false. It handles context path resolution and nested operators.
   *
   * @param context - Optional context object for resolving path-based operands
   * @returns True if ANY operand evaluates to true, false if all are false
   *
   * @example
   * ```typescript
   * const orOp = new Or(
   *   eq('user.status', 'premium'),
   *   eq('user.status', 'gold'),
   *   eq('user.status', 'platinum')
   * );
   * const context = {
   *   user: { status: 'gold' }
   * };
   * const result = orOp.compute(context); // true
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
        ? (val as OperatorInterface).compute(context)
        : val;
    };

    return this.args.some((arg) => {
      return resolveValue(arg);
    });
  }

  /**
   * Converts the OR operator to its JSON representation.
   *
   * This method serializes the operator and all its operands to a JSON format,
   * recursively handling nested operators while preserving the logical structure.
   *
   * @returns A JSON object representing the OR operator and its operands
   *
   * @example
   * ```typescript
   * const orOp = new Or(
   *   eq('user.role', 'admin'),
   *   eq('user.role', 'moderator')
   * );
   * const json = orOp.toJSON();
   * // Result: {
   * //   operator: "or",
   * //   args: [
   * //     { operator: "eq", args: ["user.role", "admin"] },
   * //     { operator: "eq", args: ["user.role", "moderator"] }
   * //   ]
   * // }
   * ```
   */
  toJSON(): RuleJson {
    return {
      operator: "or",
      args: this.args.map((arg) => {
        return typeof arg === "object" && arg !== null && "toJSON" in arg
          ? arg.toJSON()
          : arg;
      }),
    };
  }
}
