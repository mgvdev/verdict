import type { RuleJson } from "../serializer.js";
import { getValueFromPath } from "../utils.js";
import type { OperatorInterace, OperatorValue } from "./operator_interace.js";

/**
 * Creates an IN operator that checks if a value exists in a list.
 *
 * This function creates a rule that checks if the given value is
 * present in the provided array. It supports checking literals,
 * context paths, and values from nested operators.
 *
 * @param value - The value to search for (can be a literal, context path, or nested operator)
 * @param list - The array to search within
 * @returns An IN operator instance
 *
 * @example Checking literal value
 * ```typescript
 * const rule = In('admin', ['admin', 'moderator', 'user']);
 * const result = engine.evaluate(rule); // true
 * ```
 *
 * @example Checking context value
 * ```typescript
 * const rule = In('user.role', ['admin', 'moderator']);
 * const context = { user: { role: 'admin' } };
 * const result = engine.evaluate(rule, context); // true
 * ```
 *
 * @example Checking with numbers
 * ```typescript
 * const rule = In('user.score', [85, 90, 95, 100]);
 * const context = { user: { score: 90 } };
 * const result = engine.evaluate(rule, context); // true
 * ```
 */
export function In(
  value: OperatorValue,
  list: Array<unknown>
): OperatorInterace {
  return new InOperator(value, list);
}

/**
 * IN operator that checks if a value exists within an array.
 *
 * The InOperator class implements membership testing, checking whether
 * a resolved value is present in the provided array. It supports
 * various types of values and uses strict equality for comparisons.
 *
 * @example
 * ```typescript
 * const inOp = new InOperator('user.department', ['engineering', 'design', 'product']);
 * const context = { user: { department: 'engineering' } };
 * const result = inOp.compute(context); // true
 * ```
 */
export class InOperator implements OperatorInterace {
  /**
   * Creates a new IN operator instance.
   *
   * @param value - The value to search for in the list
   * @param list - The array to search within
   */
  constructor(
    private value: OperatorValue,
    private list: Array<unknown>
  ) {}

  /**
   * Evaluates whether the value exists in the provided list.
   *
   * This method resolves the value (handling context paths and nested operators)
   * and then checks if it exists in the array using strict equality comparison.
   *
   * @param context - Optional context object for resolving path-based values
   * @returns True if the value is found in the list, false otherwise
   *
   * @example
   * ```typescript
   * const inOp = new InOperator('user.status', ['active', 'pending', 'verified']);
   * const context = { user: { status: 'active' } };
   * const result = inOp.compute(context); // true
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

    const resolvedValue = resolveValue(this.value);

    if (!Array.isArray(this.list)) {
      return false; // Or throw an error, depending on desired behavior
    }

    return this.list.includes(resolvedValue);
  }

  /**
   * Converts the IN operator to its JSON representation.
   *
   * This method serializes the operator, its value, and the list to a JSON format
   * that can be stored, transmitted, or reconstructed later.
   *
   * @returns A JSON object representing the IN operator
   *
   * @example
   * ```typescript
   * const inOp = new InOperator('user.role', ['admin', 'moderator']);
   * const json = inOp.toJSON();
   * // Result: { operator: "in", args: ["user.role", ["admin", "moderator"]] }
   * ```
   */
  toJSON(): RuleJson {
    return {
      operator: "in",
      args: [
        typeof this.value === "object" &&
        this.value !== null &&
        "toJSON" in this.value
          ? this.value.toJSON()
          : this.value,
        this.list,
      ],
    };
  }
}
