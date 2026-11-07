import { describe, expect, test } from "bun:test";
import { getForecast } from "../../src/actions/getForecast.ts";
import { getWeather } from "../../src/actions/getWeather.ts";
import { searchCities } from "../../src/api/geocoding.ts";
import { CityNotFoundError } from "../../src/errors/CityNotFoundError.ts";

const runIntegration = Bun.env.RUN_INTEGRATION === "1";
const NETWORK_TIMEOUT = 30_000;
const MISSING_CITY = "zzzz-ciudad-inexistente-zzzz";

describe.skipIf(!runIntegration)("OpenMeteo (integración real)", () => {
  test(
    "searchCities encuentra Ottawa con coordenadas",
    async () => {
      const results = await searchCities("Ottawa", 1);
      const [ottawa] = results;

      expect(ottawa?.name).toBe("Ottawa");
      expect(typeof ottawa?.latitude).toBe("number");
      expect(typeof ottawa?.longitude).toBe("number");
    },
    NETWORK_TIMEOUT,
  );

  test(
    "searchCities maneja tildes",
    async () => {
      const results = await searchCities("Bogotá", 1);

      expect(results[0]?.name).toBe("Bogotá");
    },
    NETWORK_TIMEOUT,
  );

  test(
    "searchCities devuelve una lista vacía para una ciudad inexistente",
    async () => {
      expect(await searchCities(MISSING_CITY, 1)).toEqual([]);
    },
    NETWORK_TIMEOUT,
  );

  test(
    "getWeather devuelve el clima actual de Ottawa",
    async () => {
      const weather = await getWeather("Ottawa");

      expect(weather.city).toBe("Ottawa");
      expect(typeof weather.temperatureC).toBe("number");
      expect(weather.time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
    },
    NETWORK_TIMEOUT,
  );

  test(
    "getForecast devuelve 7 días para Ottawa",
    async () => {
      const forecast = await getForecast("Ottawa", 7);

      expect(forecast.city).toBe("Ottawa");
      expect(forecast.days).toHaveLength(7);
    },
    NETWORK_TIMEOUT,
  );

  test(
    "getWeather lanza CityNotFoundError para una ciudad inexistente",
    async () => {
      await expect(getWeather(MISSING_CITY)).rejects.toBeInstanceOf(CityNotFoundError);
    },
    NETWORK_TIMEOUT,
  );

  test(
    "getForecast lanza CityNotFoundError para una ciudad inexistente",
    async () => {
      await expect(getForecast(MISSING_CITY)).rejects.toBeInstanceOf(CityNotFoundError);
    },
    NETWORK_TIMEOUT,
  );
});
