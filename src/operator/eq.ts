import type { RuleJson } from "../serializer.js";
import { compareValues, getValueFromPath, self } from "../utils.js";
import type { OperatorInterface, OperatorValue } from "./operator_interace.js";

/**
 * Creates an equality comparison operator.
 *
 * This function creates a rule that checks if two values are equal.
 * It supports comparing literals, context paths, and nested operators.
 *
 * @param left - The left operand (can be a literal value, context path, or nested operator)
 * @param right - The right operand (can be a literal value, context path, or nested operator)
 * @returns An equality operator instance
 *
 * @example Comparing literals
 * ```typescript
 * const rule = eq(5, 5);
 * const result = engine.evaluate(rule); // true
 * ```
 *
 * @example Comparing context values
 * ```typescript
 * const rule = eq('user.age', 25);
 * const context = { user: { age: 25 } };
 * const result = engine.evaluate(rule, context); // true
 * ```
 *
 * @example Comparing two context paths
 * ```typescript
 * const rule = eq('user.age', 'user.minAge');
 * const context = { user: { age: 25, minAge: 25 } };
 * const result = engine.evaluate(rule, context); // true
 * ```
 */
export function eq(
  left: OperatorValue,
  right: OperatorValue
): OperatorInterface {
  return new Eq(left, right);
}

/**
 * Equality operator that compares two values for strict equality.
 *
 * The Eq class implements the equality comparison logic, supporting
 * various types of operands including literals, context paths, and
 * nested operators. It uses strict equality (===) for comparisons.
 *
 * @example
 * ```typescript
 * const eqOp = new Eq('user.status', 'active');
 * const context = { user: { status: 'active' } };
 * const result = eqOp.compute(context); // true
 * ```
 */
export class Eq implements OperatorInterface {
  /**
   * Creates a new equality operator instance.
   *
   * @param left - The left operand for comparison
   * @param right - The right operand for comparison
   */
  constructor(
    private left: OperatorValue,
    private right: OperatorValue
  ) {}

  /**
   * Evaluates the equality comparison between the two operands.
   *
   * This method resolves both operands (handling context paths and nested operators)
   * and then performs a strict equality comparison between the resolved values.
   *
   * @param context - Optional context object for resolving path-based operands
   * @returns True if the operands are strictly equal, false otherwise
   *
   * @example
   * ```typescript
   * const eqOp = new Eq('user.age', 25);
   * const context = { user: { age: 25 } };
   * const result = eqOp.compute(context); // true
   * ```
   */
  compute(context?: object): boolean {
    const resolveValue = (val: unknown) => {
      /**
       * Return the self value for a flat array of values in the context
       */
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

    return compareValues(leftResult, rightResult, "===");
  }

  /**
   * Converts the equality operator to its JSON representation.
   *
   * This method serializes the operator and its operands to a JSON format
   * that can be stored, transmitted, or reconstructed later.
   *
   * @returns A JSON object representing the equality operator
   *
   * @example
   * ```typescript
   * const eqOp = new Eq('user.age', 25);
   * const json = eqOp.toJSON();
   * // Result: { operator: "eq", args: ["user.age", 25] }
   * ```
   */
  toJSON(): RuleJson {
    return {
      operator: "eq",
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
