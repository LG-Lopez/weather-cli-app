import { describe, expect, test } from "bun:test";
import { listCities } from "../../src/actions/listCities.ts";
import { saveCities } from "../../src/storage/citiesStorage.ts";
import { withTemporaryStorage } from "../helpers/temporaryStorage.ts";

describe("listCities", () => {
  test("devuelve una lista vacía cuando no hay ciudades guardadas", () =>
    withTemporaryStorage(async () => {
      expect(await listCities()).toEqual([]);
    }));

  test("devuelve las ciudades guardadas", () =>
    withTemporaryStorage(async () => {
      await saveCities(["Ottawa", "Lima"]);

      expect(await listCities()).toEqual(["Ottawa", "Lima"]);
    }));
});
