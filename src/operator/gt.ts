import type { RuleJson } from "../serializer.js";
import { compareValues, getValueFromPath, self } from "../utils.js";
import type { OperatorInterface, OperatorValue } from "./operator_interace.js";

/**
 * Creates a greater than comparison operator.
 *
 * This function creates a rule that checks if the left operand is
 * greater than the right operand. Both operands are evaluated and
 * compared using the > operator.
 *
 * @param left - The left operand (can be a literal value, context path, or nested operator)
 * @param right - The right operand (can be a literal value, context path, or nested operator)
 * @returns A greater than operator instance
 *
 * @example Comparing literals
 * ```typescript
 * const rule = gt(10, 5);
 * const result = engine.evaluate(rule); // true
 * ```
 *
 * @example Comparing context values
 * ```typescript
 * const rule = gt('user.age', 18);
 * const context = { user: { age: 25 } };
 * const result = engine.evaluate(rule, context); // true
 * ```
 *
 * @example Comparing two context paths
 * ```typescript
 * const rule = gt('user.score', 'user.minScore');
 * const context = { user: { score: 85, minScore: 60 } };
 * const result = engine.evaluate(rule, context); // true
 * ```
 */
export function gt(
  left: OperatorValue,
  right: OperatorValue
): OperatorInterface {
  return new Gt(left, right);
}

/**
 * Greater than operator that compares two numeric values.
 *
 * The Gt class implements the greater than comparison logic, supporting
 * various types of operands including numbers, context paths, and
 * nested operators. It performs numeric comparison using the > operator.
 *
 * @example
 * ```typescript
 * const gtOp = new Gt('user.age', 21);
 * const context = { user: { age: 25 } };
 * const result = gtOp.compute(context); // true
 * ```
 */
export class Gt implements OperatorInterface {
  /**
   * Creates a new greater than operator instance.
   *
   * @param left - The left operand for comparison
   * @param right - The right operand for comparison
   */
  constructor(
    private left: OperatorValue,
    private right: OperatorValue
  ) {}

  /**
   * Evaluates the greater than comparison between the two operands.
   *
   * This method resolves both operands (handling context paths and nested operators)
   * and then performs a greater than comparison between the resolved values.
   *
   * @param context - Optional context object for resolving path-based operands
   * @returns True if the left operand is greater than the right operand, false otherwise
   *
   * @example
   * ```typescript
   * const gtOp = new Gt('user.score', 80);
   * const context = { user: { score: 95 } };
   * const result = gtOp.compute(context); // true
   * ```
   */
  compute(context?: object): boolean {
    const resolveValue = (val: unknown) => {
      if (val === self) {
        return context;
      }
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

    const leftResult = resolveValue(this.left);
    const rightResult = resolveValue(this.right);

    return compareValues(leftResult, rightResult, ">");
  }

  /**
   * Converts the greater than operator to its JSON representation.
   *
   * This method serializes the operator and its operands to a JSON format
   * that can be stored, transmitted, or reconstructed later.
   *
   * @returns A JSON object representing the greater than operator
   *
   * @example
   * ```typescript
   * const gtOp = new Gt('user.age', 18);
   * const json = gtOp.toJSON();
   * // Result: { operator: "gt", args: ["user.age", 18] }
   * ```
   */
  toJSON(): RuleJson {
    return {
      operator: "gt",
      args: [
        typeof this.left === "object" &&
        this.left !== null &&
        "toJSON" in this.left
          ? this.left.toJSON()
          : this.left,
        typeof this.right === "object" &&
        this.right !== null &&
        "toJSON" in this.right
          ? this.right.toJSON()
          : this.right,
      ],
    };
  }
}
