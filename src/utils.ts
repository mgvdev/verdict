/**
 * The 'self' symbol is used to access the current object itself when a flat array is provided.
 * This garantes that the 'self' symbol is not used as a property name in the object.
 *
 * @example
 *
 * ```typescript
 * const data = {
 *   user: {
 *        roles: ['admin', 'user']
 *    }
 *  }
 *
 *
 * In('data.user.roles.*, eq(self, 'admin'));
 *
 * ```
 *
 */
export const self = Symbol("self");

/**
 * String used when serializing the 'self' symbol.
 * @example
 * ```typescript
 * const data = {
 *   user: {
 *        roles: ['admin', 'user']
 *    }
 *  }
 *  const rule = In('data.user.roles.*, eq(self, 'admin'));
 *  const serializedRule = rule.toJSON();
 *  console.log(serializedRule);
 *  // Output:
 *  // {
 *  //   operator: 'in',
 *  //   args: [
 *  //     'data.user.roles.*',
 *  //     {
 *  //       operator: 'eq',
 *  //       args: [
 *  //         '#$self$#',
 *  //         'admin'
 *  //       ]
 *  //     }
 *  //   ]
 *  // }
 * ````
 */
export const serializedSelfSymbol = "#$self$#";

/**
 * Retrieves a value from a nested object using a dot-notation path.
 *
 * This utility function allows you to access deeply nested properties
 * in an object using a string path like "user.profile.name". It safely
 * handles cases where intermediate properties are null or undefined.
 *
 * The 'self' symbol is used to access the current object itself when a flat array is provided.
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
export function getValueFromPath(obj: unknown, path: string): unknown {
  console.log(obj, path);
  // Check if path contains wildcard
  if (path.includes("*")) {
    return getValueFromPathWithWildcard(obj, path);
  }

  return path.split(".").reduce((acc, part) => {
    if (acc === null || acc === undefined) {
      return undefined;
    }
    if (typeof acc === "object" && acc !== null && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

/**
 * Handles path resolution with wildcard (*) support for array traversal.
 *
 * When a wildcard (*) is encountered in the path, it treats the current value
 * as an array and applies the remaining path to each element, returning an
 * array of results.
 *
 * @param obj - The object to traverse
 * @param path - The dot-notation path with potential wildcards
 * @returns The resolved value(s) - can be a single value or array of values
 *
 * @example
 * ```typescript
 * const data = {
 *   users: [
 *     { name: "Alice", roles: ["admin", "user"] },
 *     { name: "Bob", roles: ["user"] }
 *   ]
 * };
 *
 * getValueFromPath(data, "users.*.name");     // ["Alice", "Bob"]
 * getValueFromPath(data, "users.*.roles.0");  // ["admin", "user"]
 * ```
 */
function getValueFromPathWithWildcard(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let current = obj;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (current === null || current === undefined) {
      return undefined;
    }

    if (part === "*") {
      // Wildcard encountered - current must be an array
      if (!Array.isArray(current)) {
        return undefined;
      }

      // Get remaining path after the wildcard
      const remainingPath = parts.slice(i + 1).join(".");

      if (remainingPath === "") {
        // No more path after wildcard, return the array itself
        return current;
      }

      // Apply remaining path to each array element
      const results = current.map((item) => {
        if (remainingPath.includes("*")) {
          // Nested wildcard - recursive call
          return getValueFromPathWithWildcard(item, remainingPath);
        } else {
          // Simple path - use regular resolution
          return getValueFromPath(item, remainingPath);
        }
      });

      // Flatten nested arrays from recursive wildcard calls
      return results.some(Array.isArray)
        ? results.flat()
        : results.filter((item) => item !== undefined);
    } else {
      // Regular path part
      if (typeof current === "object" && current !== null && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
  }

  return current;
}

/**
 * Checks if a value is a valid date string, timestamp, or Date object.
 *
 * @param value - The value to check
 * @returns True if the value represents a date
 */
export function isDateLike(value: unknown): boolean {
  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }

  if (typeof value === "string") {
    // Check for ISO date format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
    if (isoDateRegex.test(value)) {
      const date = new Date(value);
      return !Number.isNaN(date.getTime());
    }
  }

  if (typeof value === "number") {
    // Check if it's a valid timestamp (reasonable range)
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && value > 0;
  }

  return false;
}

/**
 * Converts a date-like value to a Date object for comparison.
 *
 * @param value - The value to convert (string, number, or Date)
 * @returns A Date object or the original value if not date-like
 */
export function normalizeDate(value: unknown): Date | unknown {
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

/**
 * Compares two values, handling date comparisons when appropriate.
 *
 * @param left - Left operand
 * @param right - Right operand
 * @param operator - The comparison operator ('>', '<', '>=', '<=', '===', '!==')
 * @returns The result of the comparison
 */
export function compareValues(
  left: unknown,
  right: unknown,
  operator: string
): boolean {
  const normalizedLeft = normalizeDate(left);
  const normalizedRight = normalizeDate(right);

  // If both values are dates, compare them as dates
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

  // Fallback to regular comparison for non-dates
  switch (operator) {
    case ">":
      if (
        (typeof left === "number" || typeof left === "string") &&
        (typeof right === "number" || typeof right === "string")
      ) {
        return left > right;
      }
      return false;
    case "<":
      if (
        (typeof left === "number" || typeof left === "string") &&
        (typeof right === "number" || typeof right === "string")
      ) {
        return left < right;
      }
      return false;
    case ">=":
      if (
        (typeof left === "number" || typeof left === "string") &&
        (typeof right === "number" || typeof right === "string")
      ) {
        return left >= right;
      }
      return false;
    case "<=":
      if (
        (typeof left === "number" || typeof left === "string") &&
        (typeof right === "number" || typeof right === "string")
      ) {
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
