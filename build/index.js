// src/engine.ts
var Engine = class {
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
  evaluate(rule, context = {}) {
    return rule.compute(context);
  }
};

// src/utils.ts
function getValueFromPath(obj, path) {
  if (path.includes("*")) {
    return getValueFromPathWithWildcard(obj, path);
  }
  return path.split(".").reduce((acc, part) => {
    if (acc === null || acc === void 0) {
      return void 0;
    }
    if (typeof acc === "object" && acc !== null && part in acc) {
      return acc[part];
    }
    return void 0;
  }, obj);
}
function getValueFromPathWithWildcard(obj, path) {
  const parts = path.split(".");
  let current = obj;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (current === null || current === void 0) {
      return void 0;
    }
    if (part === "*") {
      if (!Array.isArray(current)) {
        return void 0;
      }
      const remainingPath = parts.slice(i + 1).join(".");
      if (remainingPath === "") {
        return current;
      }
      const results = current.map((item) => {
        if (remainingPath.includes("*")) {
          return getValueFromPathWithWildcard(item, remainingPath);
        } else {
          return getValueFromPath(item, remainingPath);
        }
      });
      return results.some(Array.isArray) ? results.flat() : results.filter((item) => item !== void 0);
    } else {
      if (typeof current === "object" && current !== null && part in current) {
        current = current[part];
      } else {
        return void 0;
      }
    }
  }
  return current;
}
function isDateLike(value) {
  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }
  if (typeof value === "string") {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
    if (isoDateRegex.test(value)) {
      const date = new Date(value);
      return !Number.isNaN(date.getTime());
    }
  }
  if (typeof value === "number") {
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && value > 0;
  }
  return false;
}
function normalizeDate(value) {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "string") {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
    if (isoDateRegex.test(value)) {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }
  }
  if (typeof value === "number" && value > 0) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }
  return value;
}
function compareValues(left, right, operator) {
  const normalizedLeft = normalizeDate(left);
  const normalizedRight = normalizeDate(right);
  if (normalizedLeft instanceof Date && normalizedRight instanceof Date) {
    const leftTime = normalizedLeft.getTime();
    const rightTime = normalizedRight.getTime();
    switch (operator) {
      case ">":
        return leftTime > rightTime;
      case "<":
        return leftTime < rightTime;
      case ">=":
        return leftTime >= rightTime;
      case "<=":
        return leftTime <= rightTime;
      case "===":
        return leftTime === rightTime;
      case "!==":
        return leftTime !== rightTime;
      default:
        return false;
    }
  }
  switch (operator) {
    case ">":
      if ((typeof left === "number" || typeof left === "string") && (typeof right === "number" || typeof right === "string")) {
        return left > right;
      }
      return false;
    case "<":
      if ((typeof left === "number" || typeof left === "string") && (typeof right === "number" || typeof right === "string")) {
        return left < right;
      }
      return false;
    case ">=":
      if ((typeof left === "number" || typeof left === "string") && (typeof right === "number" || typeof right === "string")) {
        return left >= right;
      }
      return false;
    case "<=":
      if ((typeof left === "number" || typeof left === "string") && (typeof right === "number" || typeof right === "string")) {
        return left <= right;
      }
      return false;
    case "===":
      return left === right;
    case "!==":
      return left !== right;
    default:
      return false;
  }
}

// src/operator/all.ts
function all(arrayPath, condition) {
  return new All(arrayPath, condition);
}
var All = class {
  /**
   * Creates a new ALL operator instance.
   *
   * @param arrayPath - Path to the array in the context
   * @param condition - The condition to test against each array element
   */
  constructor(arrayPath, condition) {
    this.arrayPath = arrayPath;
    this.condition = condition;
  }
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
  compute(context) {
    if (!context) {
      return false;
    }
    const arrayValue = getValueFromPath(context, this.arrayPath);
    if (!Array.isArray(arrayValue)) {
      return false;
    }
    if (arrayValue.length === 0) {
      return true;
    }
    for (const element of arrayValue) {
      try {
        if (!this.condition.compute(element)) {
          return false;
        }
      } catch {
        return false;
      }
    }
    return true;
  }
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
  toJSON() {
    return {
      operator: "all",
      args: [this.arrayPath, this.condition.toJSON()]
    };
  }
};

// src/operator/and.ts
function and(...args) {
  return new And(...args);
}
var And = class {
  args;
  /**
   * Creates a new AND operator instance.
   *
   * @param args - Variable number of operands to evaluate with AND logic
   */
  constructor(...args) {
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
  compute(context) {
    const resolveValue = (val) => {
      if (typeof val === "string" && context) {
        const resolved = getValueFromPath(context, val);
        if (resolved !== void 0) {
          return resolved;
        }
      }
      return typeof val === "object" && val !== null && "compute" in val ? val.compute(context) : val;
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
  toJSON() {
    return {
      operator: "and",
      args: this.args.map((arg) => {
        return typeof arg === "object" && arg !== null && "toJSON" in arg ? arg.toJSON() : arg;
      })
    };
  }
};

// src/operator/any.ts
function any(arrayPath, condition) {
  return new Any(arrayPath, condition);
}
var Any = class {
  /**
   * Creates a new ANY operator instance.
   *
   * @param arrayPath - Path to the array in the context
   * @param condition - The condition to test against each array element
   */
  constructor(arrayPath, condition) {
    this.arrayPath = arrayPath;
    this.condition = condition;
  }
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
  compute(context) {
    if (!context) {
      return false;
    }
    const arrayValue = getValueFromPath(context, this.arrayPath);
    if (!Array.isArray(arrayValue)) {
      return false;
    }
    for (const element of arrayValue) {
      try {
        if (this.condition.compute(element)) {
          return true;
        }
      } catch {
      }
    }
    return false;
  }
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
  toJSON() {
    return {
      operator: "any",
      args: [this.arrayPath, this.condition.toJSON()]
    };
  }
};

// src/operator/eq.ts
function eq(left, right) {
  return new Eq(left, right);
}
var Eq = class {
  /**
   * Creates a new equality operator instance.
   *
   * @param left - The left operand for comparison
   * @param right - The right operand for comparison
   */
  constructor(left, right) {
    this.left = left;
    this.right = right;
  }
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
  compute(context) {
    const resolveValue = (val) => {
      if (typeof val === "string" && context) {
        const resolved = getValueFromPath(context, val);
        if (resolved !== void 0) {
          return resolved;
        }
      }
      return typeof val === "object" && val !== null && "compute" in val ? val.compute(context) : val;
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
  toJSON() {
    return {
      operator: "eq",
      args: [
        typeof this.left === "object" && this.left !== null && "toJSON" in this.left ? this.left.toJSON() : this.left,
        typeof this.right === "object" && this.right !== null && "toJSON" in this.right ? this.right.toJSON() : this.right
      ]
    };
  }
};

// src/operator/gt.ts
function gt(left, right) {
  return new Gt(left, right);
}
var Gt = class {
  /**
   * Creates a new greater than operator instance.
   *
   * @param left - The left operand for comparison
   * @param right - The right operand for comparison
   */
  constructor(left, right) {
    this.left = left;
    this.right = right;
  }
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
  compute(context) {
    const resolveValue = (val) => {
      if (typeof val === "string" && context) {
        const resolved = getValueFromPath(context, val);
        if (resolved !== void 0) {
          return resolved;
        }
      }
      return typeof val === "object" && val !== null && "compute" in val ? val.compute(context) : val;
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
  toJSON() {
    return {
      operator: "gt",
      args: [
        typeof this.left === "object" && this.left !== null && "toJSON" in this.left ? this.left.toJSON() : this.left,
        typeof this.right === "object" && this.right !== null && "toJSON" in this.right ? this.right.toJSON() : this.right
      ]
    };
  }
};

// src/operator/gte.ts
function gte(left, right) {
  return new Gte(left, right);
}
var Gte = class {
  constructor(left, right) {
    this.left = left;
    this.right = right;
  }
  compute(context) {
    const resolveValue = (val) => {
      if (typeof val === "string" && context) {
        const resolved = getValueFromPath(context, val);
        if (resolved !== void 0) {
          return resolved;
        }
      }
      return typeof val === "object" && val !== null && "compute" in val ? val.compute(context) : val;
    };
    const leftResult = resolveValue(this.left);
    const rightResult = resolveValue(this.right);
    return compareValues(leftResult, rightResult, ">=");
  }
  toJSON() {
    return {
      operator: "gte",
      args: [
        typeof this.left === "object" && this.left !== null && "toJSON" in this.left ? this.left.toJSON() : this.left,
        typeof this.right === "object" && this.right !== null && "toJSON" in this.right ? this.right.toJSON() : this.right
      ]
    };
  }
};

// src/operator/in.ts
function In(value, list) {
  return new InOperator(value, list);
}
var InOperator = class {
  /**
   * Creates a new IN operator instance.
   *
   * @param value - The value to search for in the list
   * @param list - The array to search within
   */
  constructor(value, list) {
    this.value = value;
    this.list = list;
  }
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
  compute(context) {
    const resolveValue = (val) => {
      if (typeof val === "string" && context) {
        const resolved = getValueFromPath(context, val);
        if (resolved !== void 0) {
          return resolved;
        }
      }
      return typeof val === "object" && val !== null && "compute" in val ? val.compute(context) : val;
    };
    const resolvedValue = resolveValue(this.value);
    if (!Array.isArray(this.list)) {
      return false;
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
  toJSON() {
    return {
      operator: "in",
      args: [
        typeof this.value === "object" && this.value !== null && "toJSON" in this.value ? this.value.toJSON() : this.value,
        this.list
      ]
    };
  }
};

// src/operator/lt.ts
function lt(left, right) {
  return new Lt(left, right);
}
var Lt = class {
  constructor(left, right) {
    this.left = left;
    this.right = right;
  }
  compute(context) {
    const resolveValue = (val) => {
      if (typeof val === "string" && context) {
        const resolved = getValueFromPath(context, val);
        if (resolved !== void 0) {
          return resolved;
        }
      }
      return typeof val === "object" && val !== null && "compute" in val ? val.compute(context) : val;
    };
    const leftResult = resolveValue(this.left);
    const rightResult = resolveValue(this.right);
    return compareValues(leftResult, rightResult, "<");
  }
  toJSON() {
    return {
      operator: "lt",
      args: [
        typeof this.left === "object" && this.left !== null && "toJSON" in this.left ? this.left.toJSON() : this.left,
        typeof this.right === "object" && this.right !== null && "toJSON" in this.right ? this.right.toJSON() : this.right
      ]
    };
  }
};

// src/operator/lte.ts
function lte(left, right) {
  return new Lte(left, right);
}
var Lte = class {
  constructor(left, right) {
    this.left = left;
    this.right = right;
  }
  compute(context) {
    const resolveValue = (val) => {
      if (typeof val === "string" && context) {
        const resolved = getValueFromPath(context, val);
        if (resolved !== void 0) {
          return resolved;
        }
      }
      return typeof val === "object" && val !== null && "compute" in val ? val.compute(context) : val;
    };
    const leftResult = resolveValue(this.left);
    const rightResult = resolveValue(this.right);
    return compareValues(leftResult, rightResult, "<=");
  }
  toJSON() {
    return {
      operator: "lte",
      args: [
        typeof this.left === "object" && this.left !== null && "toJSON" in this.left ? this.left.toJSON() : this.left,
        typeof this.right === "object" && this.right !== null && "toJSON" in this.right ? this.right.toJSON() : this.right
      ]
    };
  }
};

// src/operator/ne.ts
function ne(left, right) {
  return new Ne(left, right);
}
var Ne = class {
  constructor(left, right) {
    this.left = left;
    this.right = right;
  }
  compute(context) {
    const resolveValue = (val) => {
      if (typeof val === "string" && context) {
        const resolved = getValueFromPath(context, val);
        if (resolved !== void 0) {
          return resolved;
        }
      }
      return typeof val === "object" && val !== null && "compute" in val ? val.compute(context) : val;
    };
    const leftResult = resolveValue(this.left);
    const rightResult = resolveValue(this.right);
    return compareValues(leftResult, rightResult, "!==");
  }
  toJSON() {
    return {
      operator: "ne",
      args: [
        typeof this.left === "object" && this.left !== null && "toJSON" in this.left ? this.left.toJSON() : this.left,
        typeof this.right === "object" && this.right !== null && "toJSON" in this.right ? this.right.toJSON() : this.right
      ]
    };
  }
};

// src/operator/none.ts
function none(arrayPath, condition) {
  return new None(arrayPath, condition);
}
var None = class {
  /**
   * Creates a new NONE operator instance.
   *
   * @param arrayPath - Path to the array in the context
   * @param condition - The condition to test against each array element
   */
  constructor(arrayPath, condition) {
    this.arrayPath = arrayPath;
    this.condition = condition;
  }
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
  compute(context) {
    if (!context) {
      return true;
    }
    const arrayValue = getValueFromPath(context, this.arrayPath);
    if (!Array.isArray(arrayValue)) {
      return true;
    }
    if (arrayValue.length === 0) {
      return true;
    }
    for (const element of arrayValue) {
      try {
        if (this.condition.compute(element)) {
          return false;
        }
      } catch {
      }
    }
    return true;
  }
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
  toJSON() {
    return {
      operator: "none",
      args: [this.arrayPath, this.condition.toJSON()]
    };
  }
};

// src/operator/not.ts
function not(operand) {
  return new Not(operand);
}
var Not = class {
  /**
   * Creates a new NOT operator instance.
   *
   * @param operand - The operand to negate
   */
  constructor(operand) {
    this.operand = operand;
  }
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
  compute(context) {
    const resolveValue = (val) => {
      if (typeof val === "string" && context) {
        const resolved = getValueFromPath(context, val);
        if (resolved !== void 0) {
          return resolved;
        }
      }
      return typeof val === "object" && val !== null && "compute" in val ? val.compute(context) : val;
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
  toJSON() {
    return {
      operator: "not",
      args: [
        typeof this.operand === "object" && this.operand !== null && "toJSON" in this.operand ? this.operand.toJSON() : this.operand
      ]
    };
  }
};

// src/operator/notIn.ts
function notIn(value, list) {
  return new NotInOperator(value, list);
}
var NotInOperator = class {
  constructor(value, list) {
    this.value = value;
    this.list = list;
  }
  compute(context) {
    const resolveValue = (val) => {
      if (typeof val === "string" && context) {
        const resolved = getValueFromPath(context, val);
        if (resolved !== void 0) {
          return resolved;
        }
      }
      return typeof val === "object" && val !== null && "compute" in val ? val.compute(context) : val;
    };
    const resolvedValue = resolveValue(this.value);
    if (!Array.isArray(this.list)) {
      return true;
    }
    return !this.list.includes(resolvedValue);
  }
  toJSON() {
    return {
      operator: "notIn",
      args: [
        typeof this.value === "object" && this.value !== null && "toJSON" in this.value ? this.value.toJSON() : this.value,
        this.list
      ]
    };
  }
};

// src/operator/or.ts
function or(...args) {
  return new Or(...args);
}
var Or = class {
  args;
  /**
   * Creates a new OR operator instance.
   *
   * @param args - Variable number of operands to evaluate with OR logic
   */
  constructor(...args) {
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
  compute(context) {
    const resolveValue = (val) => {
      if (typeof val === "string" && context) {
        const resolved = getValueFromPath(context, val);
        if (resolved !== void 0) {
          return resolved;
        }
      }
      return typeof val === "object" && val !== null && "compute" in val ? val.compute(context) : val;
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
  toJSON() {
    return {
      operator: "or",
      args: this.args.map((arg) => {
        return typeof arg === "object" && arg !== null && "toJSON" in arg ? arg.toJSON() : arg;
      })
    };
  }
};

// src/serializer.ts
var operatorMap = {
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
  none: None
};
var RuleSerializer = class {
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
  serialize(rule) {
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
  deserialize(jsonRule) {
    const OperatorClass = operatorMap[jsonRule.operator];
    if (!OperatorClass) {
      throw new Error(`Unknown operator: ${jsonRule.operator}`);
    }
    const resolvedArgs = jsonRule.args.map((arg) => {
      if (typeof arg === "object" && arg !== null && "operator" in arg) {
        return this.deserialize(arg);
      } else {
        return arg;
      }
    });
    return new OperatorClass(...resolvedArgs);
  }
};
export {
  All,
  And,
  Any,
  Engine,
  Eq,
  Gt,
  Gte,
  In,
  InOperator,
  Lt,
  Lte,
  Ne,
  None,
  Not,
  NotInOperator,
  Or,
  RuleSerializer,
  all,
  and,
  any,
  compareValues,
  eq,
  getValueFromPath,
  gt,
  gte,
  isDateLike,
  lt,
  lte,
  ne,
  none,
  normalizeDate,
  not,
  notIn,
  or
};
/**
 * @fileoverview Verdict - A lightweight, structured JSON decision tree library
 *
 * Verdict provides a powerful and flexible rule engine for Node.js applications,
 * allowing you to define, evaluate, and serialize complex decision logic using
 * a simple, intuitive API.
 *
 * @example Quick Start
 * ```typescript
 * import { Engine, eq, and, gt } from '@mgvdev/verdict';
 *
 * const engine = new Engine();
 *
 * // Create a rule
 * const rule = and(
 *   eq('user.status', 'active'),
 *   gt('user.age', 18)
 * );
 *
 * // Evaluate against context
 * const context = {
 *   user: { status: 'active', age: 25 }
 * };
 *
 * const result = engine.evaluate(rule, context); // true
 * ```
 *
 * @example Complex Rules
 * ```typescript
 * import { Engine, and, or, eq, gt, In } from '@mgvdev/verdict';
 *
 * const rule = and(
 *   or(
 *     eq('user.role', 'admin'),
 *     eq('user.role', 'moderator')
 *   ),
 *   gt('user.experience', 2),
 *   In('user.department', ['engineering', 'product'])
 * );
 * ```
 *
 * @example Serialization
 * ```typescript
 * import { RuleSerializer } from '@mgvdev/verdict';
 *
 * const serializer = new RuleSerializer();
 * const jsonRule = serializer.serialize(rule);
 * const reconstructedRule = serializer.deserialize(jsonRule);
 * ```
 *
 * @version 0.0.0
 * @author Maxence Guyonvarho <contact@mgvdev.io>
 * @license MIT
 */
//# sourceMappingURL=index.js.map