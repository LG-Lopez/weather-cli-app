import { describe, expect, test } from "bun:test";
import {
  BANNER_LINE,
  CANDIDATE_LIMIT,
  DEFAULT_UNIT,
  FORECAST_URL,
  GEOCODING_URL,
  MAX_CITY_OPTIONS,
  MENU_PROMPT,
} from "../../src/utils/constants.ts";

describe("constants", () => {
  test("define las URLs de OpenMeteo", () => {
    expect(GEOCODING_URL).toBe("https://geocoding-api.open-meteo.com/v1/search");
    expect(FORECAST_URL).toBe("https://api.open-meteo.com/v1/forecast");
  });

  test("define la unidad por defecto en Celsius", () => {
    expect(DEFAULT_UNIT).toBe("C");
  });

  test("define límites coherentes para las ciudades", () => {
    expect(MAX_CITY_OPTIONS).toBeGreaterThan(0);
    expect(CANDIDATE_LIMIT).toBeGreaterThanOrEqual(MAX_CITY_OPTIONS);
  });

  test("define los textos del menú", () => {
    expect(BANNER_LINE.length).toBeGreaterThan(0);
    expect(MENU_PROMPT).toContain("Selecciona");
  });
});
