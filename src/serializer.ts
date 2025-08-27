import { All } from "./operator/all.js";
import { And } from "./operator/and.js";
import { Any } from "./operator/any.js";
import { Eq } from "./operator/eq.js";
import { Gt } from "./operator/gt.js";
import { Gte } from "./operator/gte.js";
import { InOperator } from "./operator/in.js";
import { Lt } from "./operator/lt.js";
import { Lte } from "./operator/lte.js";
import { Ne } from "./operator/ne.js";
import { None } from "./operator/none.js";
import { Not } from "./operator/not.js";
import { NotInOperator } from "./operator/notIn.js";
import type { OperatorInterface } from "./operator/operator_interace.js";
import { Or } from "./operator/or.js";
import { self, serializedSelfSymbol } from "./utils.js";

/**
 * Represents the JSON structure of a serialized rule.
 *
 * This type defines the format used when converting rules to/from JSON,
 * enabling persistence and transmission of rule definitions.
 *
 * @example
 * ```typescript
 * const ruleJson: RuleJson = {
 *   operator: "and",
 *   args: [
 *     { operator: "eq", args: ["user.age", 25] },
 *     { operator: "eq", args: ["user.status", "active"] }
 *   ]
 * };
 * ```
 */
export type RuleJson = {
  /** The name of the operator (e.g., "eq", "and", "or", "gt", etc.) */
  operator: string;
  /** Array of arguments for the operator, can include nested rules */
  args: Array<unknown>;
};

/**
 * Maps operator names to their corresponding class constructors.
 *
 * This internal mapping is used by the deserializer to instantiate
 * the correct operator class based on the operator name in the JSON.
 */
const operatorMap: {
  [key: string]: new (...args: any[]) => OperatorInterface;
} = {
  and: And,
  eq: Eq,
  or: Or,
  not: Not,
  ne: Ne,
  gt: Gt,
  gte: Gte,
  lt: Lt,
  lte: Lte,
  in: InOperator,
  notIn: NotInOperator,
  any: Any,
  all: All,
  none: None,
};

/**
 * Handles serialization and deserialization of rules to/from JSON format.
 *
 * The RuleSerializer enables persistence and transmission of rule definitions
 * by converting between rule objects (OperatorInterface instances) and their
 * JSON representations. This is useful for storing rules in databases,
 * configuration files, or sending them over network APIs.
 *
 * @example Basic usage
 * ```typescript
 * import { RuleSerializer } from './serializer.js';
 * import { eq, and } from './operators.js';
 *
 * const serializer = new RuleSerializer();
 *
 * // Create a rule
 * const rule = and(
 *   eq('user.age', 25),
 *   eq('user.status', 'active')
 * );
 *
 * // Serialize to JSON
 * const jsonRule = serializer.serialize(rule);
 * console.log(JSON.stringify(jsonRule, null, 2));
 *
 * // Deserialize back to rule object
 * const deserializedRule = serializer.deserialize(jsonRule);
 * ```
 */
export class RuleSerializer {
  /**
   * Converts a rule object into its JSON representation.
   *
   * This method takes any rule that implements the OperatorInterface
   * and converts it to a JSON object that can be stored, transmitted,
   * or processed by other systems.
   *
   * @param rule - The rule to serialize (must implement OperatorInterface)
   * @returns A JSON object representing the rule structure
   *
   * @example
   * ```typescript
   * const serializer = new RuleSerializer();
   * const rule = eq('user.name', 'John');
   * const json = serializer.serialize(rule);
   * // Result: { operator: "eq", args: ["user.name", "John"] }
   * ```
   */
  serialize(rule: OperatorInterface): RuleJson {
    return rule.toJSON();
  }

  /**
   * Converts a JSON representation back into a rule object.
   *
   * This method takes a JSON object (with the RuleJson structure)
   * and reconstructs the corresponding rule object. It handles
   * nested rules recursively, allowing for complex rule structures.
   *
   * @param jsonRule - The JSON representation of the rule
   * @returns A rule object that implements OperatorInterface
   * @throws Error if the operator type is unknown or unsupported
   *
   * @example
   * ```typescript
   * const serializer = new RuleSerializer();
   * const jsonRule = {
   *   operator: "and",
   *   args: [
   *     { operator: "eq", args: ["user.age", 25] },
   *     { operator: "gt", args: ["user.score", 80] }
   *   ]
   * };
   *
   * const rule = serializer.deserialize(jsonRule);
   * // Returns an And operator containing Eq and Gt operators
   * ```
   */
  deserialize(jsonRule: RuleJson): OperatorInterface {
    const OperatorClass = operatorMap[jsonRule.operator];
    if (!OperatorClass) {
      throw new Error(`Unknown operator: ${jsonRule.operator}`);
    }

    const resolvedArgs = jsonRule.args.map((arg) => {
      if (arg === serializedSelfSymbol) {
        return self;
      }
      if (typeof arg === "object" && arg !== null && "operator" in arg) {
        // If the argument is another rule, deserialize it recursively
        return this.deserialize(arg as RuleJson);
      } else {
        return arg;
      }
    });

    // Create an instance of the operator class with the resolved arguments
    return new OperatorClass(...resolvedArgs);
  }
}
