import { describe, expect, test } from "bun:test";
import { addCity } from "../../src/actions/addCity.ts";
import { loadSettings } from "../../src/storage/settingsStorage.ts";
import { withTemporaryStorage } from "../helpers/temporaryStorage.ts";

describe("addCity", () => {
  test("agrega una ciudad nueva a los ajustes", () =>
    withTemporaryStorage(async () => {
      const settings = await addCity("Ottawa");

      expect(settings.savedCities).toEqual(["Ottawa"]);
      expect((await loadSettings()).savedCities).toEqual(["Ottawa"]);
    }));

  test("no duplica una ciudad que ya estaba guardada", () =>
    withTemporaryStorage(async () => {
      await addCity("Ottawa");

      const settings = await addCity("Ottawa");

      expect(settings.savedCities).toEqual(["Ottawa"]);
    }));
});
