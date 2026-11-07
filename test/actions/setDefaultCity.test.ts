import { describe, expect, test } from "bun:test";
import { addCity } from "../../src/actions/addCity.ts";
import { setDefaultCity } from "../../src/actions/setDefaultCity.ts";
import { loadSettings } from "../../src/storage/settingsStorage.ts";
import { withTemporaryStorage } from "../helpers/temporaryStorage.ts";

describe("setDefaultCity", () => {
  test("marca como default una ciudad existente sin duplicarla", () =>
    withTemporaryStorage(async () => {
      await addCity("Lima");

      const settings = await setDefaultCity("Lima");

      expect(settings.defaultCity).toBe("Lima");
      expect(settings.savedCities).toEqual(["Lima"]);
    }));

  test("agrega la ciudad si no existe y la marca como default", () =>
    withTemporaryStorage(async () => {
      const settings = await setDefaultCity("Lima");

      expect(settings.defaultCity).toBe("Lima");
      expect(settings.savedCities).toEqual(["Lima"]);
      expect((await loadSettings()).defaultCity).toBe("Lima");
    }));
});
