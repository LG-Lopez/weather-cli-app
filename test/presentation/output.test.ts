import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  clearScreen,
  printError,
  printMessage,
  printSuccess,
} from "../../src/presentation/output.ts";
import { stripAnsi } from "../helpers/stripAnsi.ts";

const originalLog = console.log;
const originalClear = console.clear;

let logs: string[] = [];
let clears = 0;

beforeEach(() => {
  logs = [];
  clears = 0;
  console.log = (...args: unknown[]) => {
    logs.push(stripAnsi(args.map((arg) => String(arg)).join(" ")));
  };
  console.clear = () => {
    clears++;
  };
});

afterEach(() => {
  console.log = originalLog;
  console.clear = originalClear;
});

describe("output", () => {
  test("printMessage escribe el mensaje", () => {
    printMessage("hola");

    expect(logs).toEqual(["hola"]);
  });

  test("printError escribe el mensaje de error", () => {
    printError("fallo");

    expect(logs).toEqual(["fallo"]);
  });

  test("printSuccess escribe el mensaje de éxito", () => {
    printSuccess("éxito");

    expect(logs).toEqual(["éxito"]);
  });

  test("clearScreen limpia la terminal", () => {
    clearScreen();

    expect(clears).toBe(1);
  });
});
