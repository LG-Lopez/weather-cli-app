import { describe, expect, test } from "bun:test";
import { addCity } from "../../src/actions/addCity.ts";
import { listCities } from "../../src/actions/listCities.ts";
import { removeCity } from "../../src/actions/removeCity.ts";
import { setDefaultCity } from "../../src/actions/setDefaultCity.ts";
import { withTemporaryStorage } from "../helpers/temporaryStorage.ts";

describe("removeCity", () => {
  test("elimina la ciudad sin alterar la default si no era la eliminada", () =>
    withTemporaryStorage(async () => {
      await addCity("Ottawa");
      await addCity("Lima");
      await setDefaultCity("Lima");

      const settings = await removeCity("Ottawa");

      expect(settings.savedCities).toEqual(["Lima"]);
      expect(settings.defaultCity).toBe("Lima");
    }));

  test("reasigna la default a la primera restante si se elimina la default", () =>
    withTemporaryStorage(async () => {
      await addCity("Ottawa");
      await addCity("Lima");
      await setDefaultCity("Ottawa");

      const settings = await removeCity("Ottawa");

      expect(settings.savedCities).toEqual(["Lima"]);
      expect(settings.defaultCity).toBe("Lima");
      expect(await listCities()).toEqual(["Lima"]);
    }));

  test("deja la default en null si no quedan ciudades", () =>
    withTemporaryStorage(async () => {
      await addCity("Ottawa");
      await setDefaultCity("Ottawa");

      const settings = await removeCity("Ottawa");

      expect(settings.savedCities).toEqual([]);
      expect(settings.defaultCity).toBeNull();
    }));
});
