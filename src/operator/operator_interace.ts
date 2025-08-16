import type { RuleJson } from "../serializer.js";

/**
 * Type representing all possible value types that operators can accept.
 * This includes primitive values, objects, and other operators.
 */
export type OperatorValue =
  | OperatorInterface
  | string
  | number
  | boolean
  | object;

/**
 * Interface that defines the contract for all rule operators.
 *
 * Every operator in the Verdict rule engine must implement this interface
 * to ensure consistent behavior across all rule types. This interface
 * provides the foundation for rule evaluation and serialization.
 *
 * @example
 * ```typescript
 * class CustomOperator implements OperatorInterace {
 *   compute(context?: object): boolean {
 *     // Custom logic here
 *     return true;
 *   }
 *
 *   toJSON(): RuleJson {
 *     return {
 *       operator: "custom",
 *       args: []
 *     };
 *   }
 * }
 * ```
 */
export interface OperatorInterface {
  /**
   * Evaluates the operator's logic against the provided context.
   *
   * This method contains the core logic of the operator and determines
   * whether the rule condition is satisfied based on the given context.
   *
   * @param context - Optional context object containing data to evaluate against
   * @param args - Additional arguments that may be needed for evaluation
   * @returns True if the condition is met, false otherwise
   */
  compute: (context?: object, ...args: Array<OperatorValue>) => boolean;

  /**
   * Converts the operator to its JSON representation.
   *
   * This method enables serialization of the operator for storage,
   * transmission, or persistence purposes. The returned JSON structure
   * should contain all necessary information to reconstruct the operator.
   *
   * @returns A JSON object representing the operator and its configuration
   */
  toJSON: () => RuleJson;
}
