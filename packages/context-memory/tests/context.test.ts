import { expect, test } from "bun:test";
import { ContextManager } from "../src/index";

test("context manager stores and retrieves values", () => {
  const manager = new ContextManager();
  manager.set("key", "value");
  expect(manager.get("key")).toBe("value");
});

test("context manager returns undefined for non-existent keys", () => {
  const manager = new ContextManager();
  expect(manager.get("invalid")).toBeUndefined();
});