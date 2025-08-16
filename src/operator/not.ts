import type { RuleJson } from "../serializer.js";
import { getValueFromPath } from "../utils.js";
import type { OperatorInterface, OperatorValue } from "./operator_interace.js";

/**
 * Creates a logical NOT operator that negates a condition.
 *
 * This function creates a rule that returns the opposite boolean value
 * of the provided operand. If the operand evaluates to true, NOT returns
 * false, and vice versa.
 *
 * @param operand - The operand to negate (can be a literal, context path, or nested operator)
 * @returns A NOT operator instance
 *
 * @example Negating a literal
 * ```typescript
 * const rule = not(false);
 * const result = engine.evaluate(rule); // true
 * ```
 *
 * @example Negating a comparison
 * ```typescript
 * const rule = not(eq('user.status', 'inactive'));
 * const context = { user: { status: 'active' } };
 * const result = engine.evaluate(rule, context); // true
 * ```
 *
 * @example Complex negation
 * ```typescript
 * const rule = not(
 *   and(
 *     eq('user.role', 'guest'),
 *     eq('user.verified', false)
 *   )
 * );
 * ```
 */
export function not(operand: OperatorValue): OperatorInterface {
  return new Not(operand);
}

/**
 * Logical NOT operator that negates a boolean condition.
 *
 * The Not class implements logical negation, returning the opposite
 * boolean value of its operand. It's useful for creating rules that
 * check for the absence of a condition or the opposite of a condition.
 *
 * @example
 * ```typescript
 * const notOp = new Not(eq('user.banned', true));
 * const context = { user: { banned: false } };
 * const result = notOp.compute(context); // true
 * ```
 */
export class Not implements OperatorInterface {
  /**
   * Creates a new NOT operator instance.
   *
   * @param operand - The operand to negate
   */
  constructor(private operand: OperatorValue) {}

  /**
   * Evaluates the NOT operation on the operand.
   *
   * This method resolves the operand (handling context paths and nested operators)
   * and then returns the logical negation of the resolved value. It uses JavaScript's
   * truthiness evaluation, so values like 0, false, null, undefined, and empty
   * strings will be considered falsy.
   *
   * @param context - Optional context object for resolving path-based operands
   * @returns True if the operand evaluates to false, false if it evaluates to true
   *
   * @example
   * ```typescript
   * const notOp = new Not(eq('user.verified', false));
   * const context = { user: { verified: false } };
   * const result = notOp.compute(context); // true (NOT false = true)
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

    const result = resolveValue(this.operand);
    return !result;
  }

  /**
   * Converts the NOT operator to its JSON representation.
   *
   * This method serializes the operator and its operand to a JSON format
   * that can be stored, transmitted, or reconstructed later.
   *
   * @returns A JSON object representing the NOT operator
   *
   * @example
   * ```typescript
   * const notOp = new Not(eq('user.active', false));
   * const json = notOp.toJSON();
   * // Result: {
   * //   operator: "not",
   * //   args: [{ operator: "eq", args: ["user.active", false] }]
   * // }
   * ```
   */
  toJSON(): RuleJson {
    return {
      operator: "not",
      args: [
        typeof this.operand === "object" &&
        this.operand !== null &&
        "toJSON" in this.operand
          ? this.operand.toJSON()
          : this.operand,
      ],
    };
  }
}
