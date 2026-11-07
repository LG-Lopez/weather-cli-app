import { describe, expect, test } from "bun:test";
import { loadCities, saveCities } from "../../src/storage/citiesStorage.ts";
import { loadSettings, saveSettings } from "../../src/storage/settingsStorage.ts";
import { withTemporaryStorage } from "../helpers/temporaryStorage.ts";

describe("citiesStorage", () => {
  test("devuelve una lista vacía si no hay ciudades guardadas", () =>
    withTemporaryStorage(async () => {
      expect(await loadCities()).toEqual([]);
    }));

  test("guarda las ciudades indicadas", () =>
    withTemporaryStorage(async () => {
      await saveCities(["Lima", "Bogotá"]);

      expect(await loadCities()).toEqual(["Lima", "Bogotá"]);
    }));

  test("no pierde el resto de ajustes al guardar ciudades", () =>
    withTemporaryStorage(async () => {
      await saveSettings({ defaultCity: "Ottawa", savedCities: [], unit: "F" });

      await saveCities(["Lima", "Bogotá"]);

      expect(await loadSettings()).toEqual({
        defaultCity: "Ottawa",
        savedCities: ["Lima", "Bogotá"],
        unit: "F",
      });
    }));
});
