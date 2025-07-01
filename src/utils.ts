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
export function getValueFromPath(obj: unknown, path: string): unknown {
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
