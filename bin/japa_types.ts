import "@japa/runner";

declare module "@japa/runner" {
  interface TestContext {
    // notify TypeScript about custom context properties
  }

  interface Test<_TestData> {
    // notify TypeScript about custom test properties
  }
}
