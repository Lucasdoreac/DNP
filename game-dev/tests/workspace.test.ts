import { expect, test } from "bun:test";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

test("root package.json has workspaces configured", () => {
  // Tentar encontrar o package.json na raiz do projeto de forma resiliente
  let currentDir = process.cwd();
  let packageJsonPath = join(currentDir, "package.json");
  
  // Se não estiver no diretório raiz, subir um nível (máximo de 2 níveis para segurança)
  if (!existsSync(packageJsonPath)) {
      packageJsonPath = join(currentDir, "..", "package.json");
  }
  if (!existsSync(packageJsonPath)) {
      packageJsonPath = join(currentDir, "..", "..", "package.json");
  }

  expect(existsSync(packageJsonPath)).toBe(true);
  
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
  
  expect(packageJson.workspaces).toBeDefined();
  expect(packageJson.workspaces).toContain("game-dev");
  expect(packageJson.workspaces).toContain("ludoc-os");
  expect(packageJson.workspaces).toContain("packages/*");
});
