import { describe, expect, test } from "bun:test";
import { setUnit } from "../../src/actions/setUnit.ts";
import { loadSettings } from "../../src/storage/settingsStorage.ts";
import { withTemporaryStorage } from "../helpers/temporaryStorage.ts";

describe("setUnit", () => {
  test("persiste la unidad Fahrenheit", () =>
    withTemporaryStorage(async () => {
      const settings = await setUnit("F");

      expect(settings.unit).toBe("F");
      expect((await loadSettings()).unit).toBe("F");
    }));

  test("persiste la unidad Celsius", () =>
    withTemporaryStorage(async () => {
      await setUnit("F");

      const settings = await setUnit("C");

      expect(settings.unit).toBe("C");
      expect((await loadSettings()).unit).toBe("C");
    }));
});
