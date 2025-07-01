import type { OperatorInterace } from "./operator/operator_interace.js";

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
export class Engine {
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
  evaluate(rule: OperatorInterace, context: object = {}): boolean {
    return rule.compute(context);
  }
}
