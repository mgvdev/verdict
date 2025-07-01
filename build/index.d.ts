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
type RuleJson = {
    /** The name of the operator (e.g., "eq", "and", "or", "gt", etc.) */
    operator: string;
    /** Array of arguments for the operator, can include nested rules */
    args: Array<unknown>;
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
declare class RuleSerializer {
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
    serialize(rule: OperatorInterace): RuleJson;
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
    deserialize(jsonRule: RuleJson): OperatorInterace;
}

/**
 * Type representing all possible value types that operators can accept.
 * This includes primitive values, objects, and other operators.
 */
type OperatorValue = OperatorInterace | string | number | boolean | object;
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
interface OperatorInterace {
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

/**
 * The core engine for evaluating decision rules.
 *
 * The Engine class provides the main interface for executing rules
 * against a given context. It acts as an orchestrator that delegates
 * the actual computation to the individual rule operators.
 *
 * @example
 * ```typescript
 * import { Engine } from './engine.js';
 * import { eq } from './operator/eq.js';
 *
 * const engine = new Engine();
 * const rule = eq('user.age', 25);
 * const context = { user: { age: 25 } };
 *
 * const result = engine.evaluate(rule, context);
 * console.log(result); // true
 * ```
 */
declare class Engine {
    /**
     * Evaluates a rule against the provided context.
     *
     * This method takes a rule (which implements the OperatorInterface)
     * and executes it against the given context object. The context
     * provides the data that the rule will be evaluated against.
     *
     * @param rule - The rule to evaluate, must implement OperatorInterface
     * @param context - The data context to evaluate the rule against (defaults to empty object)
     * @returns True if the rule passes, false otherwise
     *
     * @example
     * ```typescript
     * const engine = new Engine();
     * const rule = and(
     *   eq('user.age', 25),
     *   eq('user.status', 'active')
     * );
     * const context = {
     *   user: { age: 25, status: 'active' }
     * };
     *
     * const result = engine.evaluate(rule, context);
     * console.log(result); // true
     * ```
     */
    evaluate(rule: OperatorInterace, context?: object): boolean;
}

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
declare function all(arrayPath: string, condition: OperatorInterace): OperatorInterace;
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
declare class All implements OperatorInterace {
    private arrayPath;
    private condition;
    /**
     * Creates a new ALL operator instance.
     *
     * @param arrayPath - Path to the array in the context
     * @param condition - The condition to test against each array element
     */
    constructor(arrayPath: string, condition: OperatorInterace);
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
    compute(context?: object): boolean;
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
    toJSON(): RuleJson;
}

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
declare function and(...args: Array<OperatorValue>): OperatorInterace;
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
declare class And implements OperatorInterace {
    private args;
    /**
     * Creates a new AND operator instance.
     *
     * @param args - Variable number of operands to evaluate with AND logic
     */
    constructor(...args: Array<OperatorValue>);
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
    compute(context?: object): boolean;
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
    toJSON(): RuleJson;
}

/**
 * Creates an ANY operator that checks if at least one element in an array matches a condition.
 *
 * This function creates a rule that evaluates to true if ANY element in the specified
 * array satisfies the provided condition. It's useful for checking array membership
 * with complex conditions.
 *
 * @param arrayPath - Path to the array in the context (e.g., "user.roles")
 * @param condition - The condition to test against each array element
 * @returns An ANY operator instance
 *
 * @example Basic usage with object properties
 * ```typescript
 * const rule = any('user.roles', eq('name', 'admin'));
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
 * const rule = any('user.permissions',
 *   and(
 *     eq('resource', 'posts'),
 *     eq('action', 'write')
 *   )
 * );
 * ```
 *
 * @example With wildcard path
 * ```typescript
 * const rule = any('user.roles.*.permissions', eq('admin'));
 * ```
 */
declare function any(arrayPath: string, condition: OperatorInterace): OperatorInterace;
/**
 * ANY operator that checks if at least one element in an array matches a condition.
 *
 * The Any class implements array traversal with condition matching, returning true
 * if ANY element in the target array satisfies the specified condition. It provides
 * a powerful way to query arrays with complex logic.
 *
 * @example
 * ```typescript
 * const anyOp = new Any('user.orders', gt('amount', 100));
 * const context = {
 *   user: {
 *     orders: [
 *       { amount: 50 },
 *       { amount: 150 },
 *       { amount: 75 }
 *     ]
 *   }
 * };
 * const result = anyOp.compute(context); // true (150 > 100)
 * ```
 */
declare class Any implements OperatorInterace {
    private arrayPath;
    private condition;
    /**
     * Creates a new ANY operator instance.
     *
     * @param arrayPath - Path to the array in the context
     * @param condition - The condition to test against each array element
     */
    constructor(arrayPath: string, condition: OperatorInterace);
    /**
     * Evaluates the ANY operation on the specified array.
     *
     * This method resolves the array path, then tests each element against
     * the provided condition. Returns true as soon as any element matches
     * (short-circuit evaluation).
     *
     * @param context - Context object containing the array to evaluate
     * @returns True if ANY element matches the condition, false otherwise
     *
     * @example
     * ```typescript
     * const anyOp = new Any('products', eq('category', 'electronics'));
     * const context = {
     *   products: [
     *     { category: 'books' },
     *     { category: 'electronics' },
     *     { category: 'clothing' }
     *   ]
     * };
     * const result = anyOp.compute(context); // true
     * ```
     */
    compute(context?: object): boolean;
    /**
     * Converts the ANY operator to its JSON representation.
     *
     * This method serializes the operator, array path, and condition to a JSON format
     * that can be stored, transmitted, or reconstructed later.
     *
     * @returns A JSON object representing the ANY operator
     *
     * @example
     * ```typescript
     * const anyOp = new Any('user.roles', eq('name', 'admin'));
     * const json = anyOp.toJSON();
     * // Result: {
     * //   operator: "any",
     * //   args: [
     * //     "user.roles",
     * //     { operator: "eq", args: ["name", "admin"] }
     * //   ]
     * // }
     * ```
     */
    toJSON(): RuleJson;
}

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
declare function eq(left: OperatorValue, right: OperatorValue): OperatorInterace;
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
declare class Eq implements OperatorInterace {
    private left;
    private right;
    /**
     * Creates a new equality operator instance.
     *
     * @param left - The left operand for comparison
     * @param right - The right operand for comparison
     */
    constructor(left: OperatorValue, right: OperatorValue);
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
    compute(context?: object): boolean;
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
    toJSON(): RuleJson;
}

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
declare function gt(left: OperatorValue, right: OperatorValue): OperatorInterace;
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
declare class Gt implements OperatorInterace {
    private left;
    private right;
    /**
     * Creates a new greater than operator instance.
     *
     * @param left - The left operand for comparison
     * @param right - The right operand for comparison
     */
    constructor(left: OperatorValue, right: OperatorValue);
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
    compute(context?: object): boolean;
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
    toJSON(): RuleJson;
}

declare function gte(left: OperatorValue, right: OperatorValue): OperatorInterace;
declare class Gte implements OperatorInterace {
    private left;
    private right;
    constructor(left: OperatorValue, right: OperatorValue);
    compute(context?: object): boolean;
    toJSON(): RuleJson;
}

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
declare function In(value: OperatorValue, list: Array<unknown>): OperatorInterace;
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
declare class InOperator implements OperatorInterace {
    private value;
    private list;
    /**
     * Creates a new IN operator instance.
     *
     * @param value - The value to search for in the list
     * @param list - The array to search within
     */
    constructor(value: OperatorValue, list: Array<unknown>);
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
    compute(context?: object): boolean;
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
    toJSON(): RuleJson;
}

declare function lt(left: OperatorValue, right: OperatorValue): OperatorInterace;
declare class Lt implements OperatorInterace {
    private left;
    private right;
    constructor(left: OperatorValue, right: OperatorValue);
    compute(context?: object): boolean;
    toJSON(): RuleJson;
}

declare function lte(left: OperatorValue, right: OperatorValue): OperatorInterace;
declare class Lte implements OperatorInterace {
    private left;
    private right;
    constructor(left: OperatorValue, right: OperatorValue);
    compute(context?: object): boolean;
    toJSON(): RuleJson;
}

declare function ne(left: OperatorValue, right: OperatorValue): OperatorInterace;
declare class Ne implements OperatorInterace {
    private left;
    private right;
    constructor(left: OperatorValue, right: OperatorValue);
    compute(context?: object): boolean;
    toJSON(): RuleJson;
}

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
declare function none(arrayPath: string, condition: OperatorInterace): OperatorInterace;
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
declare class None implements OperatorInterace {
    private arrayPath;
    private condition;
    /**
     * Creates a new NONE operator instance.
     *
     * @param arrayPath - Path to the array in the context
     * @param condition - The condition to test against each array element
     */
    constructor(arrayPath: string, condition: OperatorInterace);
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
    compute(context?: object): boolean;
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
    toJSON(): RuleJson;
}

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
declare function not(operand: OperatorValue): OperatorInterace;
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
declare class Not implements OperatorInterace {
    private operand;
    /**
     * Creates a new NOT operator instance.
     *
     * @param operand - The operand to negate
     */
    constructor(operand: OperatorValue);
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
    compute(context?: object): boolean;
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
    toJSON(): RuleJson;
}

declare function notIn(value: OperatorValue, list: Array<unknown>): OperatorInterace;
declare class NotInOperator implements OperatorInterace {
    private value;
    private list;
    constructor(value: OperatorValue, list: Array<unknown>);
    compute(context?: object): boolean;
    toJSON(): RuleJson;
}

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
declare function or(...args: Array<OperatorValue>): OperatorInterace;
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
declare class Or implements OperatorInterace {
    private args;
    /**
     * Creates a new OR operator instance.
     *
     * @param args - Variable number of operands to evaluate with OR logic
     */
    constructor(...args: Array<OperatorValue>);
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
    compute(context?: object): boolean;
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
    toJSON(): RuleJson;
}

/**
 * Retrieves a value from a nested object using a dot-notation path.
 *
 * This utility function allows you to access deeply nested properties
 * in an object using a string path like "user.profile.name". It safely
 * handles cases where intermediate properties are null or undefined.
 *
 * @param obj - The object to traverse
 * @param path - The dot-notation path to the desired property (e.g., "user.profile.name")
 * @returns The value at the specified path, or undefined if the path doesn't exist
 *
 * @example
 * ```typescript
 * const data = {
 *   user: {
 *     profile: {
 *       name: "John Doe",
 *       age: 30
 *     },
 *     settings: {
 *       theme: "dark"
 *     }
 *   }
 * };
 *
 * getValueFromPath(data, "user.profile.name"); // "John Doe"
 * getValueFromPath(data, "user.profile.age");  // 30
 * getValueFromPath(data, "user.nonexistent");  // undefined
 * getValueFromPath(data, "user.profile.address.street"); // undefined
 * ```
 *
 * @example Array access
 * ```typescript
 * const data = {
 *   users: [
 *     { name: "Alice", id: 1 },
 *     { name: "Bob", id: 2 }
 *   ]
 * };
 *
 * getValueFromPath(data, "users.0.name"); // "Alice"
 * getValueFromPath(data, "users.1.id");   // 2
 * getValueFromPath(data, "users.5.name"); // undefined
 * ```
 */
declare function getValueFromPath(obj: unknown, path: string): unknown;
/**
 * Checks if a value is a valid date string, timestamp, or Date object.
 *
 * @param value - The value to check
 * @returns True if the value represents a date
 */
declare function isDateLike(value: unknown): boolean;
/**
 * Converts a date-like value to a Date object for comparison.
 *
 * @param value - The value to convert (string, number, or Date)
 * @returns A Date object or the original value if not date-like
 */
declare function normalizeDate(value: unknown): Date | unknown;
/**
 * Compares two values, handling date comparisons when appropriate.
 *
 * @param left - Left operand
 * @param right - Right operand
 * @param operator - The comparison operator ('>', '<', '>=', '<=', '===', '!==')
 * @returns The result of the comparison
 */
declare function compareValues(left: unknown, right: unknown, operator: string): boolean;

export { All, And, Any, Engine, Eq, Gt, Gte, In, InOperator, Lt, Lte, Ne, None, Not, NotInOperator, Or, type RuleJson, RuleSerializer, all, and, any, compareValues, eq, getValueFromPath, gt, gte, isDateLike, lt, lte, ne, none, normalizeDate, not, notIn, or };
