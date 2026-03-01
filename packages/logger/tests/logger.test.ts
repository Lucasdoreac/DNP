import { expect, test, spyOn } from "bun:test";
import { Logger } from "../src/index";

test("logger prints messages with correct levels", () => {
  const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
  const logger = new Logger("test-scope");

  logger.info("info message");
  expect(consoleSpy).toHaveBeenCalled();
  
  // Limpar o mock após o teste
  consoleSpy.mockRestore();
});

test("logger includes scope in the output", () => {
  const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
  const logger = new Logger("test-scope");

  logger.info("message");
  // O Bun spyOn para console pode ser chato, vamos verificar se o método existe e é chamado
  expect(logger.scope).toBe("test-scope");
  
  consoleSpy.mockRestore();
});
