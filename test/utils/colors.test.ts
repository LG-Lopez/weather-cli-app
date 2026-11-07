import { describe, expect, test } from "bun:test";
import { cyan, error, ok, paint, temp } from "../../src/utils/colors.ts";

describe("colors", () => {
  test("define los códigos ANSI esperados", () => {
    expect(cyan).toBe("\x1b[36m");
    expect(temp).toBe("\x1b[1;33m");
    expect(ok).toBe("\x1b[1;32m");
    expect(error).toBe("\x1b[1;31m");
  });

  test("devuelve el texto sin cambios cuando no recibe códigos", () => {
    expect(paint("texto")).toBe("texto");
  });

  test("pinta con códigos ANSI cuando la salida es TTY", () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(process.stdout, "isTTY");
    const stdout = process.stdout as unknown as Record<string, unknown>;

    Object.defineProperty(process.stdout, "isTTY", { value: true, configurable: true });
    try {
      expect(paint("texto", cyan)).toBe(`\x1b[36mtexto\x1b[0m`);
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(process.stdout, "isTTY", originalDescriptor);
      } else {
        delete stdout.isTTY;
      }
    }
  });
});
