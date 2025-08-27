import { test } from "@japa/runner";
import { Engine } from "../../src/engine.js";
import { all } from "../../src/operator/all.js";
import { and } from "../../src/operator/and.js";
import { any } from "../../src/operator/any.js";
import { eq } from "../../src/operator/eq.js";
import { gt } from "../../src/operator/gt.js";
import { gte } from "../../src/operator/gte.js";
import { In } from "../../src/operator/in.js";
import { lt } from "../../src/operator/lt.js";
import { lte } from "../../src/operator/lte.js";
import { ne } from "../../src/operator/ne.js";
import { none } from "../../src/operator/none.js";
import { not } from "../../src/operator/not.js";
import { notIn } from "../../src/operator/notIn.js";
import { or } from "../../src/operator/or.js";
import { RuleSerializer } from "../../src/serializer.js";
import { getValueFromPath, self } from "../../src/utils.js";

test.group("Engine", (_group) => {
  const engine = new Engine();

  test("should evaluate a simple equality rule", ({ expect }) => {
    const rule = eq(1, 1);
    expect(engine.evaluate(rule)).toBe(true);
  });

  test("should evaluate a simple inequality rule", ({ expect }) => {
    const rule = eq(1, 2);
    expect(engine.evaluate(rule)).toBe(false);
  });

  test("should evaluate an AND rule", ({ expect }) => {
    const rule = and(eq(1, 1), eq(2, 2));
    expect(engine.evaluate(rule)).toBe(true);
  });

  test("should evaluate a failing AND rule", ({ expect }) => {
    const rule = and(eq(1, 1), eq(2, 3));
    expect(engine.evaluate(rule)).toBe(false);
  });

  test("should evaluate an OR rule", ({ expect }) => {
    const rule = or(eq(1, 1), eq(2, 3));
    expect(engine.evaluate(rule)).toBe(true);
  });

  test("should evaluate a failing OR rule", ({ expect }) => {
    const rule = or(eq(1, 2), eq(2, 3));
    expect(engine.evaluate(rule)).toBe(false);
  });

  test("should evaluate a NOT rule", ({ expect }) => {
    const rule = not(eq(1, 2));
    expect(engine.evaluate(rule)).toBe(true);
  });

  test("should evaluate a failing NOT rule", ({ expect }) => {
    const rule = not(eq(1, 1));
    expect(engine.evaluate(rule)).toBe(false);
  });

  test("should evaluate a NE rule", ({ expect }) => {
    const rule = ne(1, 2);
    expect(engine.evaluate(rule)).toBe(true);
  });

  test("should evaluate a failing NE rule", ({ expect }) => {
    const rule = ne(1, 1);
    expect(engine.evaluate(rule)).toBe(false);
  });

  test("should evaluate a GT rule", ({ expect }) => {
    const rule = gt(2, 1);
    expect(engine.evaluate(rule)).toBe(true);
  });

  test("should evaluate a failing GT rule", ({ expect }) => {
    const rule = gt(1, 2);
    expect(engine.evaluate(rule)).toBe(false);
  });

  test("should evaluate a GTE rule", ({ expect }) => {
    const rule = gte(2, 2);
    expect(engine.evaluate(rule)).toBe(true);
  });

  test("should evaluate a failing GTE rule", ({ expect }) => {
    const rule = gte(1, 2);
    expect(engine.evaluate(rule)).toBe(false);
  });

  test("should evaluate a LT rule", ({ expect }) => {
    const rule = lt(1, 2);
    expect(engine.evaluate(rule)).toBe(true);
  });

  test("should evaluate a failing LT rule", ({ expect }) => {
    const rule = lt(2, 1);
    expect(engine.evaluate(rule)).toBe(false);
  });

  test("should evaluate a LTE rule", ({ expect }) => {
    const rule = lte(1, 1);
    expect(engine.evaluate(rule)).toBe(true);
  });

  test("should evaluate a failing LTE rule", ({ expect }) => {
    const rule = lte(2, 1);
    expect(engine.evaluate(rule)).toBe(false);
  });

  test("should evaluate an IN rule", ({ expect }) => {
    const rule = In("apple", ["apple", "banana"]);
    expect(engine.evaluate(rule)).toBe(true);
  });

  test("should evaluate a failing IN rule", ({ expect }) => {
    const rule = In("orange", ["apple", "banana"]);
    expect(engine.evaluate(rule)).toBe(false);
  });

  test("should evaluate a NOT IN rule", ({ expect }) => {
    const rule = notIn("orange", ["apple", "banana"]);
    expect(engine.evaluate(rule)).toBe(true);
  });

  test("should evaluate a failing NOT IN rule", ({ expect }) => {
    const rule = notIn("apple", ["apple", "banana"]);
    expect(engine.evaluate(rule)).toBe(false);
  });

  test("should evaluate a rule with context", ({ expect }) => {
    const context = { user: { age: 25 } };
    const rule = eq("user.age", 25);
    expect(engine.evaluate(rule, context)).toBe(true);
  });

  test("should evaluate a rule with nested context", ({ expect }) => {
    const context = { user: { address: { city: "Paris" } } };
    const rule = eq("user.address.city", "Paris");
    expect(engine.evaluate(rule, context)).toBe(true);
  });

  test("should evaluate a complex rule with context", ({ expect }) => {
    const context = { user: { age: 30, isAdmin: true, country: "France" } };
    const rule = and(
      gt("user.age", 25),
      eq("user.isAdmin", true),
      or(eq("user.country", "France"), eq("user.country", "Germany"))
    );
    expect(engine.evaluate(rule, context)).toBe(true);
  });

  test("should serialize and deserialize a simple rule", ({ expect }) => {
    const serializer = new RuleSerializer();
    const originalRule = eq("user.age", 25);
    const jsonRule = serializer.serialize(originalRule);
    const deserializedRule = serializer.deserialize(jsonRule);

    const context = { user: { age: 25 } };
    expect(engine.evaluate(deserializedRule, context)).toBe(true);
  });

  test("should serialize and deserialize a complex rule", ({ expect }) => {
    const serializer = new RuleSerializer();
    const originalRule = and(
      gt("user.age", 25),
      eq("user.isAdmin", true),
      or(eq("user.country", "France"), eq("user.country", "Germany"))
    );
    const jsonRule = serializer.serialize(originalRule);
    const deserializedRule = serializer.deserialize(jsonRule);

    const context = { user: { age: 30, isAdmin: true, country: "France" } };
    expect(engine.evaluate(deserializedRule, context)).toBe(true);

    const failingContext = {
      user: { age: 20, isAdmin: true, country: "France" },
    };
    expect(engine.evaluate(deserializedRule, failingContext)).toBe(false);
  });
});

test.group("getValueFromPath", (_group) => {
  const obj = {
    a: 1,
    b: {
      c: 2,
      d: {
        e: 3,
      },
    },
    f: [4, 5, 6],
  };

  test("should get a top-level value", ({ expect }) => {
    expect(getValueFromPath(obj, "a")).toEqual(1);
  });

  test("should get a nested value", ({ expect }) => {
    expect(getValueFromPath(obj, "b.c")).toEqual(2);
  });

  test("should get a deeply nested value", ({ expect }) => {
    expect(getValueFromPath(obj, "b.d.e")).toEqual(3);
  });

  test("should return undefined for non-existent path", ({ expect }) => {
    expect(getValueFromPath(obj, "b.d.x")).toBeUndefined();
  });

  test("should return undefined for partially non-existent path", ({
    expect,
  }) => {
    expect(getValueFromPath(obj, "b.x.y")).toBeUndefined();
  });

  test("should handle array index (basic)", ({ expect }) => {
    expect(getValueFromPath(obj, "f.0")).toEqual(4);
  });

  test("should handle array index (nested)", ({ expect }) => {
    const nestedArrayObj = { data: { items: [{ id: 1 }, { id: 2 }] } };
    expect(getValueFromPath(nestedArrayObj, "data.items.1.id")).toEqual(2);
  });

  test("should return undefined for out of bounds array index", ({
    expect,
  }) => {
    expect(getValueFromPath(obj, "f.10")).toBeUndefined();
  });

  test("should return undefined for null intermediate path", ({ expect }) => {
    const nullObj = { a: null, b: { c: 1 } };
    expect(getValueFromPath(nullObj, "a.b")).toBeUndefined();
  });

  test("should return undefined for undefined intermediate path", ({
    expect,
  }) => {
    const undefinedObj = { a: undefined, b: { c: 1 } };
    expect(getValueFromPath(undefinedObj, "a.b")).toBeUndefined();
  });
});

test.group("Array Operations with Wildcards", (_group) => {
  const complexObj = {
    users: [
      {
        name: "Alice",
        age: 30,
        roles: [
          { name: "admin", active: true },
          { name: "user", active: true },
        ],
      },
      {
        name: "Bob",
        age: 25,
        roles: [
          { name: "user", active: true },
          { name: "guest", active: false },
        ],
      },
      {
        name: "Charlie",
        age: 35,
        roles: [{ name: "moderator", active: true }],
      },
    ],
    products: [
      { name: "Laptop", price: 1000, tags: ["electronics", "computer"] },
      { name: "Book", price: 20, tags: ["education", "reading"] },
      { name: "Phone", price: 800, tags: ["electronics", "mobile"] },
    ],
  };

  test("should handle wildcard path for simple properties", ({ expect }) => {
    expect(getValueFromPath(complexObj, "users.*.name")).toEqual([
      "Alice",
      "Bob",
      "Charlie",
    ]);
  });

  test("should handle wildcard path for numeric properties", ({ expect }) => {
    expect(getValueFromPath(complexObj, "users.*.age")).toEqual([30, 25, 35]);
  });

  test("should handle nested wildcard paths", ({ expect }) => {
    expect(getValueFromPath(complexObj, "users.*.roles.*.name")).toEqual([
      "admin",
      "user",
      "user",
      "guest",
      "moderator",
    ]);
  });

  test("should handle wildcard with array index access", ({ expect }) => {
    expect(getValueFromPath(complexObj, "users.*.roles.0.name")).toEqual([
      "admin",
      "user",
      "moderator",
    ]);
  });

  test("should return undefined for wildcard on non-array", ({ expect }) => {
    expect(getValueFromPath(complexObj, "users.0.*.name")).toBeUndefined();
  });

  test("should handle wildcard at the end of path", ({ expect }) => {
    const result = getValueFromPath(complexObj, "users.*");
    expect(result).toEqual(complexObj.users);
  });
});

test.group("Array Operators", (_group) => {
  const engine = new Engine();
  const context = {
    user: {
      roles: [
        { name: "admin", active: true, level: 10 },
        { name: "user", active: true, level: 5 },
        { name: "guest", active: false, level: 1 },
      ],
      permissions: [
        { resource: "posts", action: "read", granted: true },
        { resource: "posts", action: "write", granted: true },
        { resource: "users", action: "read", granted: false },
      ],
      scores: [85, 92, 78, 90],
      list: ["apple", "banana", "orange"],
      flags: [],
    },
  };

  test("should serialize and deserialize self symbol", ({ expect }) => {
    const rule = any("user.list.*", eq(self, "apple"));
    const serializer = new RuleSerializer();

    const serializedRule = serializer.serialize(rule);

    const deserializedRule = serializer.deserialize(serializedRule);
    console.log(deserializedRule);

    expect(engine.evaluate(deserializedRule, context)).toBe(true);
  }).tags(["array"]);

  test("should evaluate ANY operator - positive case", ({ expect }) => {
    const rule = any("user.roles", eq("name", "admin"));
    expect(engine.evaluate(rule, context)).toBe(true);
  });

  test("should evaluate any operator on flat list - positive case", ({
    expect,
  }) => {
    const rule = any("user.list.*", eq(self, "apple"));
    expect(engine.evaluate(rule, context)).toBe(true);
  });

  test("should evaluate ANY operator - negative case", ({ expect }) => {
    const rule = any("user.roles", eq("name", "superuser"));
    expect(engine.evaluate(rule, context)).toBe(false);
  });

  test("should evaluate ANY operator with complex condition", ({ expect }) => {
    const rule = any("user.roles", and(eq("active", true), gt("level", 8)));
    expect(engine.evaluate(rule, context)).toBe(true);
  });

  test("should evaluate ALL operator - positive case", ({ expect }) => {
    const rule = all("user.roles", gt("level", 0));
    expect(engine.evaluate(rule, context)).toBe(true);
  });

  test("should evaluate ALL operator - negative case", ({ expect }) => {
    const rule = all("user.roles", eq("active", true));
    expect(engine.evaluate(rule, context)).toBe(false);
  });

  test("should evaluate ALL operator with complex condition", ({ expect }) => {
    const rule = all(
      "user.permissions",
      In("resource", ["posts", "users", "comments"])
    );
    expect(engine.evaluate(rule, context)).toBe(true);
  });

  test("should evaluate NONE operator - positive case", ({ expect }) => {
    const rule = none("user.roles", eq("name", "banned"));
    expect(engine.evaluate(rule, context)).toBe(true);
  });

  test("should evaluate NONE operator - negative case", ({ expect }) => {
    const rule = none("user.roles", eq("name", "admin"));
    expect(engine.evaluate(rule, context)).toBe(false);
  });

  test("should evaluate NONE operator with complex condition", ({ expect }) => {
    const rule = none("user.roles", and(eq("active", false), gt("level", 5)));
    expect(engine.evaluate(rule, context)).toBe(true);
  });

  test("should handle empty arrays", ({ expect }) => {
    const rule1 = any("user.flags", eq("type", "warning"));
    const rule2 = all("user.flags", eq("active", true));
    const rule3 = none("user.flags", eq("type", "error"));

    expect(engine.evaluate(rule1, context)).toBe(false); // ANY on empty = false
    expect(engine.evaluate(rule2, context)).toBe(true); // ALL on empty = true
    expect(engine.evaluate(rule3, context)).toBe(true); // NONE on empty = true
  });

  test("should handle non-existent array paths", ({ expect }) => {
    const rule1 = any("user.nonexistent", eq("value", 1));
    const rule2 = all("user.nonexistent", eq("value", 1));
    const rule3 = none("user.nonexistent", eq("value", 1));

    expect(engine.evaluate(rule1, context)).toBe(false);
    expect(engine.evaluate(rule2, context)).toBe(false);
    expect(engine.evaluate(rule3, context)).toBe(true);
  });

  test("should serialize and deserialize ANY operator", ({ expect }) => {
    const serializer = new RuleSerializer();
    const originalRule = any("user.roles", eq("name", "admin"));
    const jsonRule = serializer.serialize(originalRule);
    const deserializedRule = serializer.deserialize(jsonRule);

    expect(engine.evaluate(deserializedRule, context)).toBe(true);
  });

  test("should serialize and deserialize ALL operator", ({ expect }) => {
    const serializer = new RuleSerializer();
    const originalRule = all("user.roles", gt("level", 0));
    const jsonRule = serializer.serialize(originalRule);
    const deserializedRule = serializer.deserialize(jsonRule);

    expect(engine.evaluate(deserializedRule, context)).toBe(true);
  });

  test("should serialize and deserialize NONE operator", ({ expect }) => {
    const serializer = new RuleSerializer();
    const originalRule = none("user.roles", eq("name", "banned"));
    const jsonRule = serializer.serialize(originalRule);
    const deserializedRule = serializer.deserialize(jsonRule);

    expect(engine.evaluate(deserializedRule, context)).toBe(true);
  });

  test("should work with wildcard paths in combination", ({ expect }) => {
    const wildcardContext = {
      departments: [
        {
          name: "Engineering",
          employees: [
            { name: "Alice", salary: 100000 },
            { name: "Bob", salary: 95000 },
          ],
        },
        {
          name: "Sales",
          employees: [
            { name: "Charlie", salary: 80000 },
            { name: "David", salary: 75000 },
          ],
        },
      ],
    };

    // Test if any employee has salary > 90000
    const highSalaries = getValueFromPath(
      wildcardContext,
      "departments.*.employees.*.salary"
    ) as number[];
    expect(highSalaries).toEqual([100000, 95000, 80000, 75000]);

    // This would require a more complex implementation, but demonstrates the concept
    const hasHighEarner = highSalaries.some((salary: number) => salary > 90000);
    expect(hasHighEarner).toBe(true);
  });
});

test.group("Date Comparisons", (_group) => {
  const engine = new Engine();

  test("should compare ISO date strings with eq", ({ expect }) => {
    const rule = eq("2023-01-15", "2023-01-15");
    expect(engine.evaluate(rule)).toBe(true);
  });

  test("should compare different ISO date strings with eq", ({ expect }) => {
    const rule = eq("2023-01-15", "2023-01-16");
    expect(engine.evaluate(rule)).toBe(false);
  });

  test("should compare ISO date strings with ne", ({ expect }) => {
    const rule = ne("2023-01-15", "2023-01-16");
    expect(engine.evaluate(rule)).toBe(true);
  });

  test("should compare ISO date strings with gt", ({ expect }) => {
    const rule = gt("2023-01-16", "2023-01-15");
    expect(engine.evaluate(rule)).toBe(true);
  });

  test("should compare ISO date strings with gt (false case)", ({ expect }) => {
    const rule = gt("2023-01-15", "2023-01-16");
    expect(engine.evaluate(rule)).toBe(false);
  });

  test("should compare ISO date strings with gte", ({ expect }) => {
    const rule = gte("2023-01-16", "2023-01-15");
    expect(engine.evaluate(rule)).toBe(true);
  });

  test("should compare equal ISO date strings with gte", ({ expect }) => {
    const rule = gte("2023-01-15", "2023-01-15");
    expect(engine.evaluate(rule)).toBe(true);
  });

  test("should compare ISO date strings with lt", ({ expect }) => {
    const rule = lt("2023-01-15", "2023-01-16");
    expect(engine.evaluate(rule)).toBe(true);
  });

  test("should compare ISO date strings with lt (false case)", ({ expect }) => {
    const rule = lt("2023-01-16", "2023-01-15");
    expect(engine.evaluate(rule)).toBe(false);
  });

  test("should compare ISO date strings with lte", ({ expect }) => {
    const rule = lte("2023-01-15", "2023-01-16");
    expect(engine.evaluate(rule)).toBe(true);
  });

  test("should compare equal ISO date strings with lte", ({ expect }) => {
    const rule = lte("2023-01-15", "2023-01-15");
    expect(engine.evaluate(rule)).toBe(true);
  });

  test("should compare ISO datetime strings", ({ expect }) => {
    const rule = gt("2023-01-15T14:30:00Z", "2023-01-15T12:30:00Z");
    expect(engine.evaluate(rule)).toBe(true);
  });

  test("should compare dates from context", ({ expect }) => {
    const context = {
      user: {
        createdAt: "2023-01-15T10:00:00Z",
        lastLogin: "2023-01-15T14:30:00Z",
      },
    };
    const rule = gt("user.lastLogin", "user.createdAt");
    expect(engine.evaluate(rule, context)).toBe(true);
  });

  test("should compare context date with literal", ({ expect }) => {
    const context = {
      user: {
        birthDate: "1990-05-15",
      },
    };
    const rule = lt("user.birthDate", "2000-01-01");
    expect(engine.evaluate(rule, context)).toBe(true);
  });

  test("should compare Date objects", ({ expect }) => {
    const date1 = new Date("2023-01-15");
    const date2 = new Date("2023-01-16");
    const rule = lt(date1, date2);
    expect(engine.evaluate(rule)).toBe(true);
  });

  test("should compare timestamps", ({ expect }) => {
    const timestamp1 = new Date("2023-01-15").getTime();
    const timestamp2 = new Date("2023-01-16").getTime();
    const rule = lt(timestamp1, timestamp2);
    expect(engine.evaluate(rule)).toBe(true);
  });

  test("should handle mixed date formats", ({ expect }) => {
    const context = {
      event: {
        startDate: "2023-01-15",
        endTimestamp: new Date("2023-01-20").getTime(),
      },
    };
    const rule = lt("event.startDate", "event.endTimestamp");
    expect(engine.evaluate(rule, context)).toBe(true);
  });

  test("should serialize and deserialize date comparisons", ({ expect }) => {
    const serializer = new RuleSerializer();
    const originalRule = and(
      gte("user.createdAt", "2023-01-01"),
      lt("user.createdAt", "2024-01-01")
    );
    const jsonRule = serializer.serialize(originalRule);
    const deserializedRule = serializer.deserialize(jsonRule);

    const context = { user: { createdAt: "2023-06-15" } };
    expect(engine.evaluate(deserializedRule, context)).toBe(true);
  });

  test("should handle invalid date strings gracefully", ({ expect }) => {
    const rule = eq("invalid-date", "2023-01-15");
    expect(engine.evaluate(rule)).toBe(false);
  });

  test("should not treat regular strings as dates", ({ expect }) => {
    const rule = gt("apple", "banana");
    expect(engine.evaluate(rule)).toBe(false);
  });
});
