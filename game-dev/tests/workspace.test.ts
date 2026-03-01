import { expect, test } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

test("root package.json has workspaces configured", () => {
  // Subir um nível para encontrar o package.json da raiz
  const packageJsonPath = join(process.cwd(), "..", "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
  
  expect(packageJson.workspaces).toBeDefined();
  expect(packageJson.workspaces).toContain("game-dev");
  expect(packageJson.workspaces).toContain("ludoc-os");
  expect(packageJson.workspaces).toContain("packages/*");
});
