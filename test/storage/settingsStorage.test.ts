import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { loadSettings, saveSettings } from "../../src/storage/settingsStorage.ts";
import { withTemporaryStorage } from "../helpers/temporaryStorage.ts";

describe("settingsStorage", () => {
  test("devuelve los ajustes por defecto cuando no existe el archivo", () =>
    withTemporaryStorage(async () => {
      expect(await loadSettings()).toEqual({
        defaultCity: null,
        savedCities: [],
        unit: "C",
      });
    }));

  test("guarda y recupera los ajustes", () =>
    withTemporaryStorage(async () => {
      await saveSettings({
        defaultCity: "Ottawa",
        savedCities: ["Ottawa", "Lima"],
        unit: "F",
      });

      expect(await loadSettings()).toEqual({
        defaultCity: "Ottawa",
        savedCities: ["Ottawa", "Lima"],
        unit: "F",
      });
    }));

  test("usa los valores por defecto si el archivo tiene JSON inválido", () =>
    withTemporaryStorage(async (directory) => {
      await Bun.write(join(directory, "cities.json"), "{ esto no es JSON");

      expect(await loadSettings()).toEqual({
        defaultCity: null,
        savedCities: [],
        unit: "C",
      });
    }));

  test("descarta valores con tipos inválidos", () =>
    withTemporaryStorage(async (directory) => {
      await Bun.write(
        join(directory, "cities.json"),
        JSON.stringify({ defaultCity: 42, savedCities: ["Lima", 7, null], unit: "X" }),
      );

      expect(await loadSettings()).toEqual({
        defaultCity: null,
        savedCities: ["Lima"],
        unit: "C",
      });
    }));

  test("usa una lista vacía si savedCities no es un array", () =>
    withTemporaryStorage(async (directory) => {
      await Bun.write(
        join(directory, "cities.json"),
        JSON.stringify({ savedCities: "Ottawa" }),
      );

      expect(await loadSettings()).toEqual({
        defaultCity: null,
        savedCities: [],
        unit: "C",
      });
    }));
});
