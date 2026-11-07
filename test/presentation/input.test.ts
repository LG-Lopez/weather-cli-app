import { afterEach, describe, expect, mock, test } from "bun:test";
import { ask, parseMenuOption, parseSelection } from "../../src/presentation/input.ts";

const originalPrompt = globalThis.prompt;

afterEach(() => {
  globalThis.prompt = originalPrompt;
});

const VALID_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

describe("parseMenuOption", () => {
  test("acepta las opciones válidas del 1 al 9", () => {
    for (const value of VALID_OPTIONS) {
      expect(parseMenuOption(String(value))).toBe(value);
    }
  });

  test("rechaza valores fuera de rango, decimales o no numéricos", () => {
    for (const raw of ["0", "10", "-1", "1.5", "abc", ""]) {
      expect(parseMenuOption(raw)).toBeUndefined();
    }
  });
});

describe("parseSelection", () => {
  test("acepta índices dentro del rango", () => {
    expect(parseSelection("1", 3)).toBe(1);
    expect(parseSelection("3", 3)).toBe(3);
  });

  test("rechaza índices fuera de rango, decimales o no numéricos", () => {
    for (const raw of ["0", "4", "-1", "2.5", "abc", ""]) {
      expect(parseSelection(raw, 3)).toBeUndefined();
    }
  });
});

describe("ask", () => {
  test("devuelve la respuesta recortada", async () => {
    globalThis.prompt = (() => "  Ottawa  ") as unknown as typeof prompt;

    expect(await ask("Ciudad: ")).toBe("Ottawa");
  });

  test("devuelve una cadena vacía si el prompt se cancela", async () => {
    globalThis.prompt = (() => null) as unknown as typeof prompt;

    expect(await ask("Ciudad: ")).toBe("");
  });

  test("envía la pregunta al prompt", async () => {
    const promptMock = mock(() => "respuesta");
    globalThis.prompt = promptMock as unknown as typeof prompt;

    await ask("¿Ciudad?");

    expect(promptMock).toHaveBeenCalledWith("¿Ciudad?");
  });
});
